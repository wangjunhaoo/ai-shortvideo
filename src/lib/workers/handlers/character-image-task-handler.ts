import {
  createTaskExecutionContext,
  type WorkerTaskJob,
} from '@engine/runtime-context'
import { addCharacterPromptSuffix, getArtStylePrompt, isArtStyleValue, PRIMARY_APPEARANCE_INDEX, type ArtStyleValue } from '@/lib/constants'
import { encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { reportTaskProgress } from '../shared'
import {
  assertTaskActive,
  getProjectModels,
  toSignedUrlIfCos,
} from '../utils'
import { normalizeReferenceImagesForGeneration } from '@/lib/media/outbound-image'
import {
  AnyObj,
  generateLabeledImageToCos,
  parseImageUrls,
  parseJsonStringArray,
  pickFirstString,
} from './image-task-handler-shared'

function resolvePayloadArtStyle(payload: AnyObj): ArtStyleValue | undefined {
  if (!Object.prototype.hasOwnProperty.call(payload, 'artStyle')) return undefined
  const parsedArtStyle = typeof payload.artStyle === 'string' ? payload.artStyle.trim() : ''
  if (!isArtStyleValue(parsedArtStyle)) {
    throw new Error('Invalid artStyle in IMAGE_CHARACTER payload')
  }
  return parsedArtStyle
}

export async function handleCharacterImageTask(job: WorkerTaskJob) {
  const context = createTaskExecutionContext(job)
  const projectRepository = context.repositories.project
  const payload = (job.data.payload || {}) as AnyObj
  const projectId = job.data.projectId
  const userId = job.data.userId
  const models = await getProjectModels(projectId, userId)
  const modelId = models.characterModel
  if (!modelId) throw new Error('Character model not configured')

  const appearanceId = pickFirstString(job.data.targetId, payload.appearanceId)
  let appearance: {
    id: string
    characterId: string
    appearanceIndex: number
    descriptions: string | null
    description: string | null
    imageUrls: string | null
    selectedIndex: number | null
    imageUrl: string | null
    changeReason: string | null
  } | null = null
  let characterName = '角色'

  if (appearanceId) {
    const appearanceWithCharacter = await projectRepository.getCharacterAppearanceWithCharacter(appearanceId)
    if (appearanceWithCharacter) {
      appearance = appearanceWithCharacter
      characterName = appearanceWithCharacter.character?.name || characterName
    }
  }

  const characterId = typeof payload.id === 'string' ? payload.id : null
  if (!appearance && characterId) {
    const character = await projectRepository.getCharacterWithAppearances(characterId)
    appearance = character?.appearances?.[0] || null
    if (character && appearance) {
      characterName = character.name
    }
  }

  if (!appearance) throw new Error('Character appearance not found')

  const payloadArtStyle = resolvePayloadArtStyle(payload)
  const artStyle = getArtStylePrompt(payloadArtStyle ?? models.artStyle, job.data.locale)
  const descriptions = parseJsonStringArray(appearance.descriptions)
  const baseDescriptions = descriptions.length > 0 ? descriptions : [appearance.description || '']

  // 子形象（不是主形象）生成时，引用主形象图片保持一致性
  const primaryReferenceInputs: string[] = []
  if (appearance.appearanceIndex > PRIMARY_APPEARANCE_INDEX) {
    const primaryAppearance = await projectRepository.getPrimaryCharacterAppearance(appearance.characterId)
    if (primaryAppearance) {
      const primaryMainUrl = primaryAppearance.imageUrl
        ? toSignedUrlIfCos(primaryAppearance.imageUrl, 3600)
        : null
      if (primaryMainUrl) {
        primaryReferenceInputs.push(primaryMainUrl)
      }
    }
  }
  const primaryReferenceImages = await normalizeReferenceImagesForGeneration(primaryReferenceInputs)

  const singleIndex = payload.imageIndex ?? payload.descriptionIndex
  const count = normalizeImageGenerationCount('character', payload.count)
  const indexes = singleIndex !== undefined
    ? [Number(singleIndex)]
    : Array.from({ length: count }, (_value, index) => index)

  const imageUrls = parseImageUrls(appearance.imageUrls, 'characterAppearance.imageUrls')
  const nextImageUrls = [...imageUrls]
  const label = `${characterName} - ${appearance.changeReason || '形象'}`

  for (let i = 0; i < indexes.length; i++) {
    const index = indexes[i]
    const raw = baseDescriptions[index] || baseDescriptions[0]
    const prompt = artStyle ? `${addCharacterPromptSuffix(raw)}，${artStyle}` : addCharacterPromptSuffix(raw)

    await reportTaskProgress(job, 15 + Math.floor((i / Math.max(indexes.length, 1)) * 55), {
      stage: 'generate_character_image',
      index,
    })

    const cosKey = await generateLabeledImageToCos({
      job,
      userId,
      modelId,
      prompt,
      label,
      targetId: `${appearance.id}-${index}`,
      keyPrefix: 'character',
      options: {
        referenceImages: primaryReferenceImages.length > 0 ? primaryReferenceImages : undefined,
        aspectRatio: '3:2',
      },
    })

    while (nextImageUrls.length <= index) {
      nextImageUrls.push('')
    }
    nextImageUrls[index] = cosKey
  }

  const selectedIndex = appearance.selectedIndex
  const fallbackMain = nextImageUrls.find((url) => typeof url === 'string' && url) || appearance.imageUrl
  const mainImage = selectedIndex !== null && selectedIndex !== undefined && nextImageUrls[selectedIndex]
    ? nextImageUrls[selectedIndex]
    : fallbackMain

  await assertTaskActive(job, 'persist_character_image')
  await projectRepository.updateCharacterAppearance({
    appearanceId: appearance.id,
    imageUrls: encodeImageUrls(nextImageUrls),
    imageUrl: mainImage || null,
  })

  return {
    appearanceId: appearance.id,
    imageCount: nextImageUrls.filter(Boolean).length,
    imageUrl: mainImage || null,
  }
}



