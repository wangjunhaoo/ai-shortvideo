import { Prisma } from '@prisma/client'
import { prisma } from '@engine/prisma'
import { ApiError } from '@/lib/api-errors'
import { buildDefaultTaskBillingInfo } from '@/lib/billing'
import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { resolveMediaRef, resolveMediaRefFromLegacyValue, resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { generateUniqueKey, getSignedUrl, uploadObject } from '@/lib/storage'
import { hasPanelLipSyncOutput, hasVoiceLineAudioOutput } from '@/lib/task/has-output'
import { resolveBatchTaskSubmitConcurrency } from '@/lib/task/submit-concurrency'
import { submitTask } from '@/lib/task/submitter'
import { TASK_TYPE } from '@/lib/task/types'
import { withTaskUiPayload } from '@/lib/task/ui-payload'
import { mapWithConcurrency } from '@/lib/async/map-with-concurrency'
import { estimateVoiceLineMaxSeconds } from '@/lib/voice/generate-voice-line'
import { getProviderKey, resolveModelSelectionOrSingle } from '@/lib/api-config'
import type { Locale } from '@/i18n/routing'
import { composeModelKey, parseModelKeyStrict } from '@core/model-config-contract'
import {
  hasVoiceBindingForProvider,
  parseSpeakerVoiceMap,
  type CharacterVoiceFields,
  type SpeakerVoiceEntry,
  type SpeakerVoiceMap,
} from '@/lib/voice/provider-voice-binding'

const DEFAULT_LIPSYNC_MODEL_KEY = composeModelKey('fal', 'fal-ai/kling-video/lipsync/audio-to-video')

function readTrimmedString(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const value = input.trim()
  return value.length > 0 ? value : null
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

type VoiceLineRow = {
  id: string
  speaker: string
  content: string
}

type CharacterRow = CharacterVoiceFields & {
  name: string
}

type VoiceBindingValidationResult =
  | { ok: true }
  | { ok: false; message: string }

function matchCharacterBySpeaker(speaker: string, characters: CharacterRow[]) {
  const normalizedSpeaker = speaker.trim().toLowerCase()
  return characters.find((character) => character.name.trim().toLowerCase() === normalizedSpeaker) || null
}

function validateSpeakerVoiceForProvider(
  speaker: string,
  characters: CharacterRow[],
  speakerVoices: SpeakerVoiceMap,
  providerKey: string,
): VoiceBindingValidationResult {
  const character = matchCharacterBySpeaker(speaker, characters)
  const speakerVoice = speakerVoices[speaker]

  if (hasVoiceBindingForProvider({
    providerKey,
    character,
    speakerVoice,
  })) {
    return { ok: true }
  }

  if (providerKey === 'bailian') {
    const hasUploadedReference =
      !!character?.customVoiceUrl ||
      (speakerVoice?.provider === 'fal' && !!speakerVoice.audioUrl)
    if (hasUploadedReference) {
      return {
        ok: false,
        message: '无音色ID，QwenTTS 必须使用 AI 设计音色',
      }
    }
    return {
      ok: false,
      message: '请先为该发言人绑定百炼音色',
    }
  }

  return {
    ok: false,
    message: '请先为该发言人设置参考音频',
  }
}

function hasSpeakerVoiceForProvider(
  speaker: string,
  characters: CharacterRow[],
  speakerVoices: SpeakerVoiceMap,
  providerKey: string,
): boolean {
  const character = matchCharacterBySpeaker(speaker, characters)
  const speakerVoice = speakerVoices[speaker]
  return hasVoiceBindingForProvider({
    providerKey,
    character,
    speakerVoice,
  })
}

function signUrlIfNeeded(url: string): string {
  if (url.startsWith('http')) return url
  return getSignedUrl(url, 7200)
}

async function resolveMatchedPanelData(
  matchedPanelId: string | null | undefined,
  expectedEpisodeId?: string,
) {
  if (matchedPanelId === undefined) {
    return null
  }

  if (matchedPanelId === null) {
    return {
      matchedPanelId: null,
      matchedStoryboardId: null,
      matchedPanelIndex: null,
    }
  }

  const panel = await prisma.novelPromotionPanel.findUnique({
    where: { id: matchedPanelId },
    select: {
      id: true,
      storyboardId: true,
      panelIndex: true,
      storyboard: {
        select: {
          episodeId: true,
        },
      },
    },
  })

  if (!panel) {
    throw new ApiError('NOT_FOUND')
  }
  if (expectedEpisodeId && panel.storyboard.episodeId !== expectedEpisodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  return {
    matchedPanelId: panel.id,
    matchedStoryboardId: panel.storyboardId,
    matchedPanelIndex: panel.panelIndex,
  }
}

async function withVoiceLineMedia<T extends Record<string, unknown>>(line: T) {
  const audioMedia = await resolveMediaRef(line.audioMediaId, line.audioUrl)
  const matchedPanel = line.matchedPanel as
    | {
      storyboardId?: string | null
      panelIndex?: number | null
    }
    | null
    | undefined

  return {
    ...line,
    media: audioMedia,
    audioMedia,
    audioUrl: audioMedia?.url || line.audioUrl || null,
    updatedAt:
      line.updatedAt instanceof Date
        ? line.updatedAt.toISOString()
        : typeof line.updatedAt === 'string'
          ? line.updatedAt
          : null,
    matchedStoryboardId: matchedPanel?.storyboardId ?? line.matchedStoryboardId,
    matchedPanelIndex: matchedPanel?.panelIndex ?? line.matchedPanelIndex,
  }
}

export async function getNovelPromotionVoiceLines(input: {
  projectId: string
  episodeId?: string | null
  speakersOnly?: boolean
}) {
  if (input.speakersOnly) {
    const novelProject = await prisma.novelPromotionProject.findUnique({
      where: { projectId: input.projectId },
      select: { id: true },
    })
    if (!novelProject) {
      throw new ApiError('NOT_FOUND')
    }

    const speakerRows = await prisma.novelPromotionVoiceLine.findMany({
      where: {
        episode: {
          novelPromotionProjectId: novelProject.id,
        },
      },
      select: { speaker: true },
      distinct: ['speaker'],
      orderBy: { speaker: 'asc' },
    })

    return {
      speakers: speakerRows.map((item) => item.speaker).filter(Boolean),
    }
  }

  if (!input.episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const voiceLines = await prisma.novelPromotionVoiceLine.findMany({
    where: { episodeId: input.episodeId },
    orderBy: { lineIndex: 'asc' },
    include: {
      matchedPanel: {
        select: {
          id: true,
          storyboardId: true,
          panelIndex: true,
        },
      },
    },
  })

  const voiceLinesWithUrls = await Promise.all(voiceLines.map(withVoiceLineMedia))

  const speakerStats: Record<string, number> = {}
  for (const line of voiceLines) {
    speakerStats[line.speaker] = (speakerStats[line.speaker] || 0) + 1
  }

  return {
    voiceLines: voiceLinesWithUrls,
    count: voiceLines.length,
    speakerStats,
  }
}

export async function createNovelPromotionVoiceLine(input: {
  projectId: string
  episodeId: string
  content: string
  speaker: string
  matchedPanelId?: string | null
}) {
  if (!input.episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (!input.content.trim()) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (!input.speaker.trim()) {
    throw new ApiError('INVALID_PARAMS')
  }

  const novelPromotionProject = await prisma.novelPromotionProject.findUnique({
    where: { projectId: input.projectId },
    select: { id: true },
  })
  if (!novelPromotionProject) {
    throw new ApiError('NOT_FOUND')
  }

  const episode = await prisma.novelPromotionEpisode.findFirst({
    where: {
      id: input.episodeId,
      novelPromotionProjectId: novelPromotionProject.id,
    },
    select: { id: true },
  })
  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  const maxLine = await prisma.novelPromotionVoiceLine.findFirst({
    where: { episodeId: input.episodeId },
    orderBy: { lineIndex: 'desc' },
    select: { lineIndex: true },
  })
  const nextLineIndex = (maxLine?.lineIndex || 0) + 1

  const matchedPanelData = await resolveMatchedPanelData(
    input.matchedPanelId === undefined ? undefined : input.matchedPanelId,
    input.episodeId,
  )

  const created = await prisma.novelPromotionVoiceLine.create({
    data: {
      episodeId: input.episodeId,
      lineIndex: nextLineIndex,
      content: input.content.trim(),
      speaker: input.speaker.trim(),
      ...(matchedPanelData || {}),
    },
    include: {
      matchedPanel: {
        select: {
          id: true,
          storyboardId: true,
          panelIndex: true,
        },
      },
    },
  })

  return {
    success: true,
    voiceLine: await withVoiceLineMedia(created),
  }
}

export async function updateNovelPromotionVoiceLine(input: {
  body: Record<string, unknown>
}) {
  const {
    lineId,
    speaker,
    episodeId,
    voicePresetId,
    emotionPrompt,
    emotionStrength,
    content,
    audioUrl,
    matchedPanelId,
  } = input.body

  if (lineId) {
    const updateData: Prisma.NovelPromotionVoiceLineUncheckedUpdateInput = {}
    if (voicePresetId !== undefined) updateData.voicePresetId = voicePresetId as string | null | undefined
    if (emotionPrompt !== undefined) updateData.emotionPrompt = typeof emotionPrompt === 'string' ? emotionPrompt : null
    if (emotionStrength !== undefined) updateData.emotionStrength = emotionStrength as number | null | undefined
    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        throw new ApiError('INVALID_PARAMS')
      }
      updateData.content = content.trim()
    }
    if (speaker !== undefined) {
      if (typeof speaker !== 'string' || !speaker.trim()) {
        throw new ApiError('INVALID_PARAMS')
      }
      updateData.speaker = speaker.trim()
    }
    if (audioUrl !== undefined) {
      updateData.audioUrl = audioUrl as string | null
      const media = await resolveMediaRefFromLegacyValue(audioUrl)
      updateData.audioMediaId = media?.id || null
    }
    if (matchedPanelId !== undefined) {
      const currentLine = await prisma.novelPromotionVoiceLine.findUnique({
        where: { id: String(lineId) },
        select: { episodeId: true },
      })
      if (!currentLine) {
        throw new ApiError('NOT_FOUND')
      }

      const matchedPanelData = await resolveMatchedPanelData(matchedPanelId as string | null, currentLine.episodeId)
      if (matchedPanelData) {
        updateData.matchedPanelId = matchedPanelData.matchedPanelId
        updateData.matchedStoryboardId = matchedPanelData.matchedStoryboardId
        updateData.matchedPanelIndex = matchedPanelData.matchedPanelIndex
      }
    }

    const updated = await prisma.novelPromotionVoiceLine.update({
      where: { id: String(lineId) },
      data: updateData,
      include: {
        matchedPanel: {
          select: {
            id: true,
            storyboardId: true,
            panelIndex: true,
          },
        },
      },
    })

    return {
      success: true,
      voiceLine: await withVoiceLineMedia(updated),
    }
  }

  if (typeof speaker === 'string' && speaker && typeof episodeId === 'string' && episodeId) {
    const result = await prisma.novelPromotionVoiceLine.updateMany({
      where: {
        episodeId,
        speaker,
      },
      data: { voicePresetId: voicePresetId as string | null | undefined },
    })

    return {
      success: true,
      updatedCount: result.count,
      speaker,
      voicePresetId,
    }
  }

  throw new ApiError('INVALID_PARAMS')
}

export async function deleteNovelPromotionVoiceLine(lineId: string) {
  if (!lineId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const lineToDelete = await prisma.novelPromotionVoiceLine.findUnique({
    where: { id: lineId },
  })
  if (!lineToDelete) {
    throw new ApiError('NOT_FOUND')
  }

  await prisma.novelPromotionVoiceLine.delete({
    where: { id: lineId },
  })

  const remainingLines = await prisma.novelPromotionVoiceLine.findMany({
    where: { episodeId: lineToDelete.episodeId },
    orderBy: { lineIndex: 'asc' },
  })

  for (let index = 0; index < remainingLines.length; index += 1) {
    if (remainingLines[index].lineIndex !== index + 1) {
      await prisma.novelPromotionVoiceLine.update({
        where: { id: remainingLines[index].id },
        data: { lineIndex: index + 1 },
      })
    }
  }

  return {
    success: true,
    deletedId: lineId,
    remainingCount: remainingLines.length,
  }
}

export async function getNovelPromotionSpeakerVoices(episodeId: string) {
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const episode = await prisma.novelPromotionEpisode.findUnique({
    where: { id: episodeId },
  })

  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  const storedSpeakerVoices = parseSpeakerVoiceMap(episode.speakerVoices)
  const speakerVoices: SpeakerVoiceMap = {}

  for (const [speaker, voice] of Object.entries(storedSpeakerVoices)) {
    if (voice.provider === 'fal') {
      speakerVoices[speaker] = {
        provider: 'fal',
        voiceType: voice.voiceType,
        audioUrl: signUrlIfNeeded(voice.audioUrl),
      }
      continue
    }

    const previewAudioUrl = voice.previewAudioUrl ? signUrlIfNeeded(voice.previewAudioUrl) : undefined
    speakerVoices[speaker] = {
      provider: 'bailian',
      voiceType: voice.voiceType,
      voiceId: voice.voiceId,
      ...(previewAudioUrl ? { previewAudioUrl } : {}),
    }
  }

  return { speakerVoices }
}

export async function updateNovelPromotionSpeakerVoice(input: {
  projectId: string
  body: unknown
}) {
  const body = (input.body && typeof input.body === 'object') ? input.body as Record<string, unknown> : {}
  const episodeId = readTrimmedString(body.episodeId) ?? ''
  const speaker = readTrimmedString(body.speaker) ?? ''
  const voiceType = readTrimmedString(body.voiceType) ?? 'uploaded'
  const providerRaw = readTrimmedString(body.provider)?.toLowerCase() ?? null
  if (!providerRaw || (providerRaw !== 'fal' && providerRaw !== 'bailian')) {
    throw new ApiError('INVALID_PARAMS')
  }
  const provider = providerRaw
  const audioUrl = readTrimmedString(body.audioUrl)
  const previewAudioUrl = readTrimmedString(body.previewAudioUrl)
  const voiceId = readTrimmedString(body.voiceId)

  if (!episodeId || !speaker) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (provider === 'fal' && !audioUrl) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (provider === 'bailian' && !voiceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const projectData = await prisma.novelPromotionProject.findUnique({
    where: { projectId: input.projectId },
    select: { id: true },
  })
  if (!projectData) {
    throw new ApiError('NOT_FOUND')
  }

  const episode = await prisma.novelPromotionEpisode.findFirst({
    where: { id: episodeId, novelPromotionProjectId: projectData.id },
    select: { id: true, speakerVoices: true },
  })
  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  const speakerVoices = parseSpeakerVoiceMap(episode.speakerVoices)

  let nextVoiceEntry: SpeakerVoiceEntry
  if (provider === 'fal') {
    const sourceAudioUrl = audioUrl!
    const resolvedStorageKey = await resolveStorageKeyFromMediaValue(sourceAudioUrl)
    const audioUrlToStore = resolvedStorageKey || sourceAudioUrl
    nextVoiceEntry = {
      provider: 'fal',
      voiceType,
      audioUrl: audioUrlToStore,
    }
  } else {
    const previewCandidate = previewAudioUrl || audioUrl
    const resolvedPreviewKey = previewCandidate
      ? await resolveStorageKeyFromMediaValue(previewCandidate)
      : null
    const previewAudioUrlToStore = previewCandidate
      ? (resolvedPreviewKey || previewCandidate)
      : undefined

    nextVoiceEntry = {
      provider: 'bailian',
      voiceType,
      voiceId: voiceId!,
      ...(previewAudioUrlToStore ? { previewAudioUrl: previewAudioUrlToStore } : {}),
    }
  }

  speakerVoices[speaker] = nextVoiceEntry

  await prisma.novelPromotionEpisode.update({
    where: { id: episodeId },
    data: { speakerVoices: JSON.stringify(speakerVoices) },
  })

  return { success: true }
}

export async function updateNovelPromotionCharacterVoiceSettings(input: {
  characterId: string
  voiceType: string | null
  voiceId?: string | null
  customVoiceUrl?: string | null
}) {
  if (!input.characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const character = await prisma.novelPromotionCharacter.update({
    where: { id: input.characterId },
    data: {
      voiceType: input.voiceType || null,
      voiceId: input.voiceId || null,
      customVoiceUrl: input.customVoiceUrl || null,
    },
  })

  return { success: true, character }
}

export async function saveDesignedNovelPromotionCharacterVoice(input: {
  projectId: string
  characterId: string
  voiceId: string
  audioBase64: string
}) {
  if (!input.characterId || !input.voiceId || !input.audioBase64) {
    throw new ApiError('INVALID_PARAMS')
  }

  const audioBuffer = Buffer.from(input.audioBase64, 'base64')
  const key = generateUniqueKey(`voice/custom/${input.projectId}/${input.characterId}`, 'wav')
  const cosUrl = await uploadObject(audioBuffer, key)

  const character = await prisma.novelPromotionCharacter.update({
    where: { id: input.characterId },
    data: {
      voiceType: 'qwen-designed',
      voiceId: input.voiceId,
      customVoiceUrl: cosUrl,
    },
  })

  _ulogInfo(`Character ${input.characterId} AI-designed voice saved: ${cosUrl}, voiceId: ${input.voiceId}`)

  const signedAudioUrl = getSignedUrl(cosUrl, 7200)

  return {
    success: true,
    audioUrl: signedAudioUrl,
    character: {
      ...character,
      customVoiceUrl: signedAudioUrl,
    },
  }
}

export async function uploadNovelPromotionCharacterVoiceFile(input: {
  projectId: string
  characterId: string
  fileName: string
  fileType: string
  buffer: Buffer
}) {
  if (!input.characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a']
  if (!allowedTypes.includes(input.fileType) && !input.fileName.match(/\.(mp3|wav|ogg|m4a)$/i)) {
    throw new ApiError('INVALID_PARAMS')
  }

  const ext = input.fileName.split('.').pop()?.toLowerCase() || 'mp3'
  const key = generateUniqueKey(`voice/custom/${input.projectId}/${input.characterId}`, ext)
  const audioUrl = await uploadObject(input.buffer, key)

  const character = await prisma.novelPromotionCharacter.update({
    where: { id: input.characterId },
    data: {
      voiceType: 'uploaded',
      voiceId: null,
      customVoiceUrl: audioUrl,
    },
  })

  _ulogInfo(`Character ${input.characterId} voice uploaded: ${audioUrl}`)

  const signedAudioUrl = getSignedUrl(audioUrl, 7200)

  return {
    success: true,
    audioUrl: signedAudioUrl,
    character: {
      ...character,
      customVoiceUrl: signedAudioUrl,
    },
  }
}

export async function submitNovelPromotionLipSyncTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const storyboardId = body.storyboardId
  const panelIndex = body.panelIndex
  const voiceLineId = body.voiceLineId
  const requestedLipSyncModel = typeof body.lipSyncModel === 'string' ? body.lipSyncModel.trim() : ''

  if (!storyboardId || panelIndex === undefined || !voiceLineId) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (requestedLipSyncModel && !parseModelKeyStrict(requestedLipSyncModel)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_KEY_INVALID',
      field: 'lipSyncModel',
    })
  }

  const pref = await prisma.userPreference.findUnique({
    where: { userId: input.userId },
    select: { lipSyncModel: true },
  })
  const preferredLipSyncModel = typeof pref?.lipSyncModel === 'string' ? pref.lipSyncModel.trim() : ''
  const resolvedLipSyncModel = requestedLipSyncModel || preferredLipSyncModel || DEFAULT_LIPSYNC_MODEL_KEY
  if (!parseModelKeyStrict(resolvedLipSyncModel)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_KEY_INVALID',
      field: 'lipSyncModel',
    })
  }

  const panel = await prisma.novelPromotionPanel.findFirst({
    where: { storyboardId: String(storyboardId), panelIndex: Number(panelIndex) },
    select: { id: true },
  })

  if (!panel) {
    throw new ApiError('NOT_FOUND')
  }

  const payload = {
    ...body,
    lipSyncModel: resolvedLipSyncModel,
  }

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: TASK_TYPE.LIP_SYNC,
    targetType: 'NovelPromotionPanel',
    targetId: panel.id,
    payload: withTaskUiPayload(payload, {
      hasOutputAtStart: await hasPanelLipSyncOutput(panel.id),
    }),
    dedupeKey: `lip_sync:${panel.id}:${voiceLineId}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.LIP_SYNC, payload),
  })
}

export async function submitNovelPromotionVoiceGenerateTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const episodeId = typeof body.episodeId === 'string' ? body.episodeId : ''
  const lineId = typeof body.lineId === 'string' ? body.lineId : ''
  const requestedAudioModel = typeof body.audioModel === 'string' ? body.audioModel.trim() : ''
  const all = body.all === true

  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (!all && !lineId) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (requestedAudioModel && !parseModelKeyStrict(requestedAudioModel)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_KEY_INVALID',
      field: 'audioModel',
    })
  }

  const pref = await prisma.userPreference.findUnique({
    where: { userId: input.userId },
    select: { audioModel: true },
  })
  const preferredAudioModel = typeof pref?.audioModel === 'string' ? pref.audioModel.trim() : ''
  if (preferredAudioModel && !parseModelKeyStrict(preferredAudioModel)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_KEY_INVALID',
      field: 'audioModel',
    })
  }

  const projectData = await prisma.novelPromotionProject.findUnique({
    where: { projectId: input.projectId },
    select: {
      id: true,
      audioModel: true,
      characters: {
        select: {
          name: true,
          customVoiceUrl: true,
          voiceId: true,
        },
      },
    },
  })
  if (!projectData) {
    throw new ApiError('NOT_FOUND')
  }

  const projectAudioModel = typeof projectData.audioModel === 'string' ? projectData.audioModel.trim() : ''
  if (projectAudioModel && !parseModelKeyStrict(projectAudioModel)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_KEY_INVALID',
      field: 'audioModel',
    })
  }

  const selectedResolvedAudioModel = await resolveModelSelectionOrSingle(
    input.userId,
    requestedAudioModel || projectAudioModel || preferredAudioModel || null,
    'audio',
  )
  const selectedProviderKey = getProviderKey(selectedResolvedAudioModel.provider).toLowerCase()

  const episode = await prisma.novelPromotionEpisode.findFirst({
    where: {
      id: episodeId,
      novelPromotionProjectId: projectData.id,
    },
    select: {
      id: true,
      speakerVoices: true,
    },
  })
  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  const speakerVoices = parseSpeakerVoiceMap(episode.speakerVoices)
  const characters = projectData.characters || []

  let voiceLines: VoiceLineRow[] = []
  if (all) {
    const allLines = await prisma.novelPromotionVoiceLine.findMany({
      where: {
        episodeId,
        audioUrl: null,
      },
      orderBy: { lineIndex: 'asc' },
      select: {
        id: true,
        speaker: true,
        content: true,
      },
    })
    voiceLines = allLines.filter((line) =>
      hasSpeakerVoiceForProvider(line.speaker, characters, speakerVoices, selectedProviderKey),
    )
  } else {
    const line = await prisma.novelPromotionVoiceLine.findFirst({
      where: {
        id: lineId,
        episodeId,
      },
      select: {
        id: true,
        speaker: true,
        content: true,
      },
    })
    if (!line) {
      throw new ApiError('NOT_FOUND')
    }
    const validation = validateSpeakerVoiceForProvider(
      line.speaker,
      characters,
      speakerVoices,
      selectedProviderKey,
    )
    if (!validation.ok) {
      throw new ApiError('INVALID_PARAMS', {
        message: validation.message,
      })
    }
    voiceLines = [line]
  }

  if (voiceLines.length === 0) {
    if (all) {
      const firstLineWithoutBinding = await prisma.novelPromotionVoiceLine.findFirst({
        where: {
          episodeId,
          audioUrl: null,
        },
        orderBy: { lineIndex: 'asc' },
        select: {
          speaker: true,
        },
      })
      const validation = firstLineWithoutBinding
        ? validateSpeakerVoiceForProvider(
            firstLineWithoutBinding.speaker,
            characters,
            speakerVoices,
            selectedProviderKey,
          )
        : { ok: false as const, message: '没有需要生成的台词' }

      return {
        success: true,
        async: true,
        results: [],
        taskIds: [],
        total: 0,
        ...(validation.ok ? {} : { error: validation.message }),
      }
    }
    throw new ApiError('INVALID_PARAMS', {
      message: '没有需要生成的台词',
    })
  }

  const results = await mapWithConcurrency(
    voiceLines,
    resolveBatchTaskSubmitConcurrency(),
    async (line) => {
      const payload = {
        episodeId,
        lineId: line.id,
        maxSeconds: estimateVoiceLineMaxSeconds(line.content),
        audioModel: selectedResolvedAudioModel.modelKey,
      }
      const result = await submitTask({
        userId: input.userId,
        locale: input.locale,
        requestId: input.requestId,
        projectId: input.projectId,
        episodeId,
        type: TASK_TYPE.VOICE_LINE,
        targetType: 'NovelPromotionVoiceLine',
        targetId: line.id,
        payload: withTaskUiPayload(payload, {
          hasOutputAtStart: await hasVoiceLineAudioOutput(line.id),
        }),
        dedupeKey: `voice_line:${line.id}`,
        billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.VOICE_LINE, payload),
      })

      return {
        lineId: line.id,
        taskId: result.taskId,
      }
    },
  )

  if (all) {
    return {
      success: true,
      async: true,
      results,
      taskIds: results.map((item) => item.taskId),
      total: results.length,
    }
  }

  return {
    success: true,
    async: true,
    taskId: results[0].taskId,
  }
}
