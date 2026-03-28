import { prisma } from '@engine/prisma'
import type {
  CharacterAsset,
  LocationAsset,
  StoryboardPanel,
} from '@core/storyboard-phases'

export type WorkerProjectRecord = {
  id: string
  mode: string
}

export type WorkerProjectSummary = WorkerProjectRecord & {
  name: string
}

export type WorkerNovelCharacterRecord = {
  id: string
  name: string
  aliases: string | null
  introduction: string | null
}

export type WorkerNovelLocationRecord = {
  id: string
  name: string
  summary: string | null
}

export type WorkerLocationImageRecord = {
  id: string
  locationId: string
  imageIndex: number
  description: string | null
  imageUrl: string | null
  isSelected: boolean | null
  previousDescription: string | null
  previousImageUrl?: string | null
}

export type WorkerLocationWithImagesRecord = WorkerNovelLocationRecord & {
  images: WorkerLocationImageRecord[]
}

export type WorkerCharacterAppearanceRecord = {
  id: string
  characterId: string
  appearanceIndex: number
  changeReason: string | null
  description: string | null
  descriptions: string | null
  imageUrl: string | null
  imageUrls: string | null
  selectedIndex: number | null
  previousImageUrl?: string | null
  previousImageUrls?: string | null
  previousDescription?: string | null
  previousDescriptions?: string | null
}

export type WorkerCharacterAppearanceWithCharacterRecord = WorkerCharacterAppearanceRecord & {
  character: {
    name: string
  } | null
}

export type WorkerCharacterWithAppearancesRecord = {
  id: string
  name: string
  introduction?: string | null
  appearances: WorkerCharacterAppearanceRecord[]
}

export type WorkerProjectAnalysisContextRecord = {
  id: string
  novelPromotionProjectId: string
  analysisModel: string | null
}

export type WorkerCharacterProfileRecord = {
  id: string
  name: string
  aliases: string | null
  introduction: string | null
  profileData: string | null
  profileConfirmed: boolean
}

export type WorkerNovelEpisodeRecord = {
  id: string
  name: string
  novelText: string | null
}

export type WorkerVoiceAnalyzePanelRecord = {
  id: string
  panelIndex: number
  srtSegment: string | null
  description: string | null
  characters: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  videoPrompt?: string | null
  duration?: number | null
  firstLastFramePrompt?: string | null
  location?: string | null
  shotType?: string | null
  cameraMove?: string | null
}

export type WorkerVoiceAnalyzeStoryboardRecord = {
  id: string
  panels: WorkerVoiceAnalyzePanelRecord[]
}

export type WorkerVoiceAnalyzeEpisodeRecord = {
  id: string
  novelPromotionProjectId: string
  novelText: string | null
  storyboards: WorkerVoiceAnalyzeStoryboardRecord[]
}

export type WorkerPanelRecord = {
  id: string
  storyboardId: string
  panelIndex: number
  panelNumber?: number | null
  characters: string | null
  imageUrl: string | null
  previousImageUrl?: string | null
  sketchImageUrl?: string | null
  videoUrl: string | null
  videoPrompt: string | null
  description: string | null
  duration: number | null
  firstLastFramePrompt: string | null
  location: string | null
  shotType: string | null
  cameraMove: string | null
  srtSegment?: string | null
  photographyRules?: string | null
  actingNotes?: string | null
  candidateImages?: string | null
}

export type WorkerNovelDataRecord = {
  videoRatio: string | null
  characters: WorkerCharacterWithAppearancesRecord[]
  locations: WorkerLocationWithImagesRecord[]
}

export type WorkerVoiceLineRecord = {
  id: string
  audioUrl: string | null
  audioDuration: number | null
}

export type WorkerStoryboardClipRecord = {
  id: string
  content: string | null
  characters: string | null
  location: string | null
  screenplay: string | null
}

export type WorkerStoryboardRecord = {
  id: string
  clip: WorkerStoryboardClipRecord | null
}

export type WorkerStoryboardPanelRecord = {
  id: string
  panelIndex: number
  shotType: string | null
  cameraMove: string | null
  description: string | null
  videoPrompt: string | null
  location: string | null
  characters: string | null
  srtSegment: string | null
}

export type WorkerStoryboardPanelsRecord = {
  id: string
  panels: WorkerStoryboardPanelRecord[]
}

export type WorkerStoryboardAssetsRecord = {
  analysisModel: string | null
  characters: CharacterAsset[]
  locations: LocationAsset[]
}

export type InsertStoryboardPanelInput = {
  shotType: string | null
  cameraMove: string | null
  description: string
  videoPrompt: string
  location: string | null
  characters: string | null
  srtSegment: string | null
  duration: number | null
}

export type WorkerClipBuildEpisodeRecord = {
  id: string
  name: string
  novelText: string | null
  novelPromotionProjectId: string
}

export type WorkerEpisodeClipRecord = {
  id: string
  content: string
  location: string | null
  characters: string | null
  screenplay: string | null
  startText: string | null
  endText: string | null
}

export type WorkerEpisodeWithClipsRecord = {
  id: string
  novelPromotionProjectId: string
  novelText: string | null
  clips: WorkerEpisodeClipRecord[]
}

export type PersistedStoryboard = {
  storyboardId: string
  clipId: string
  panels: Array<{
    id: string
    panelIndex: number
    description: string | null
    srtSegment: string | null
    characters: string | null
  }>
}

export type ClipPanelsResult = {
  clipId: string
  clipIndex: number
  finalPanels: StoryboardPanel[]
}

export type UpsertClipInput = {
  startText: string
  endText: string
  summary: string
  location: string | null
  characters: unknown
  content: string
}

export type WorkerNovelProjectRecord = {
  id: string
  projectId: string
  analysisModel: string | null
  globalAssetText: string | null
  artStyle: string | null
  characters: WorkerNovelCharacterRecord[]
  locations: WorkerNovelLocationRecord[]
}

export type WorkerNovelProjectGlobalAnalysisRecord = WorkerNovelProjectRecord & {
  episodes: WorkerNovelEpisodeRecord[]
}

export type CreateNovelCharacterInput = {
  novelPromotionProjectId: string
  name: string
  aliases?: string[]
  introduction?: string
  profileData?: Record<string, unknown>
  profileConfirmed?: boolean
}

export type UpdateNovelCharacterInput = {
  id: string
  introduction?: string
  aliases?: string[]
}

export type CreateNovelLocationInput = {
  novelPromotionProjectId: string
  name: string
  summary?: string | null
}

export type CreateLocationImageInput = {
  locationId: string
  imageIndex: number
  description: string
}

export type UpsertVoiceLineInput = {
  lineIndex: number
  speaker: string
  content: string
  emotionStrength: number
  matchedPanelId: string | null
  matchedStoryboardId: string | null
  matchedPanelIndex: number | null
}

export interface ProjectRepository {
  getProjectName(projectId: string): Promise<string | null>
  getProjectSummary(projectId: string): Promise<WorkerProjectSummary | null>
  getProjectMode(projectId: string): Promise<WorkerProjectRecord | null>
  getProjectAnalysisContext(projectId: string): Promise<WorkerProjectAnalysisContextRecord | null>
  getNovelProjectId(projectId: string): Promise<string | null>
  getNovelProjectForGlobalAnalysis(projectId: string): Promise<WorkerNovelProjectGlobalAnalysisRecord | null>
  getNovelProjectForAnalysis(projectId: string): Promise<WorkerNovelProjectRecord | null>
  getNovelData(projectId: string): Promise<WorkerNovelDataRecord | null>
  findFirstEpisodeNovelText(novelPromotionProjectId: string): Promise<string | null>
  getEpisodeForVoiceAnalyze(episodeId: string): Promise<WorkerVoiceAnalyzeEpisodeRecord | null>
  getEpisodeForClipBuild(episodeId: string): Promise<WorkerClipBuildEpisodeRecord | null>
  getEpisodeWithClips(episodeId: string): Promise<WorkerEpisodeWithClipsRecord | null>
  getStoryboardForTextRegeneration(storyboardId: string): Promise<WorkerStoryboardRecord | null>
  getStoryboardForInsertPanel(storyboardId: string): Promise<WorkerStoryboardPanelsRecord | null>
  getStoryboardAssets(projectId: string): Promise<WorkerStoryboardAssetsRecord | null>
  getProjectLocation(
    locationId: string,
    novelPromotionProjectId: string,
  ): Promise<WorkerNovelLocationRecord | null>
  getPanelById(panelId: string): Promise<WorkerPanelRecord | null>
  getPanelByStoryboardIndex(storyboardId: string, panelIndex: number): Promise<WorkerPanelRecord | null>
  getVoiceLineById(voiceLineId: string): Promise<WorkerVoiceLineRecord | null>
  getCharacterProfileTarget(
    characterId: string,
    novelPromotionProjectId: string,
  ): Promise<WorkerCharacterProfileRecord | null>
  getCharacterAppearanceWithCharacter(
    appearanceId: string,
  ): Promise<WorkerCharacterAppearanceWithCharacterRecord | null>
  getCharacterWithAppearances(
    characterId: string,
  ): Promise<WorkerCharacterWithAppearancesRecord | null>
  getPrimaryCharacterAppearance(
    characterId: string,
  ): Promise<Pick<WorkerCharacterAppearanceRecord, 'imageUrl' | 'imageUrls'> | null>
  listUnconfirmedCharacterProfiles(
    novelPromotionProjectId: string,
  ): Promise<WorkerCharacterProfileRecord[]>
  episodeExists(episodeId: string): Promise<boolean>
  createNovelCharacter(input: CreateNovelCharacterInput): Promise<{ id: string }>
  updateNovelCharacter(input: UpdateNovelCharacterInput): Promise<void>
  updateCharacterProfileData(characterId: string, profileData: string): Promise<void>
  createCharacterAppearance(input: {
    characterId: string
    appearanceIndex: number
    changeReason: string
    description: string
    descriptions: string
    imageUrls: string
    previousImageUrls: string
  }): Promise<void>
  markCharacterProfileConfirmed(characterId: string): Promise<void>
  updateCharacterAppearance(input: {
    appearanceId: string
    imageUrl?: string | null
    imageUrls?: string | null
    description?: string
    selectedIndex?: number | null
    previousImageUrl?: string | null
    previousImageUrls?: string | null
    previousDescription?: string | null
    previousDescriptions?: string | null
  }): Promise<void>
  createNovelLocation(input: CreateNovelLocationInput): Promise<{ id: string }>
  createLocationImage(input: CreateLocationImageInput): Promise<void>
  getLocationImageById(locationImageId: string): Promise<(WorkerLocationImageRecord & { location: { name: string } | null }) | null>
  getLocationImageByIndex(
    locationId: string,
    imageIndex: number,
  ): Promise<(WorkerLocationImageRecord & { location: { name: string } | null }) | null>
  getLocationWithImages(locationId: string): Promise<WorkerLocationWithImagesRecord | null>
  updateLocationImage(input: {
    imageId: string
    imageUrl?: string | null
    description?: string
    previousImageUrl?: string | null
    previousDescription?: string | null
  }): Promise<void>
  updateLocationImageDescription(params: {
    locationId: string
    imageIndex: number
    modifiedDescription: string
  }): Promise<WorkerLocationWithImagesRecord>
  updateNovelProjectArtStylePrompt(id: string, artStylePrompt: string): Promise<void>
  updateClipScreenplay(clipId: string, screenplay: unknown): Promise<void>
  updatePanelImage(panelId: string, imageUrl: string): Promise<void>
  updatePanelImageState(input: {
    panelId: string
    imageUrl?: string | null
    previousImageUrl?: string | null
    candidateImages?: string | null
  }): Promise<void>
  updatePanelVideo(panelId: string, params: { videoUrl: string; generationMode: string }): Promise<void>
  updatePanelLipSyncVideo(panelId: string, lipSyncVideoUrl: string): Promise<void>
  findOrCreateClip(params: {
    episodeId: string
    startText: string | null
    endText: string | null
    summary: string
    location: string | null
    characters: unknown
    content: string
  }): Promise<{ id: string }>
  saveVoiceLinesForEpisode(
    episodeId: string,
    lines: UpsertVoiceLineInput[],
  ): Promise<Array<{ id: string; speaker: string; matchedStoryboardId: string | null }>>
  saveClipsForEpisode(
    episodeId: string,
    clips: UpsertClipInput[],
  ): Promise<Array<{ id: string }>>
  saveStoryboardsAndPanels(
    episodeId: string,
    clipPanels: ClipPanelsResult[],
  ): Promise<PersistedStoryboard[]>
  replaceStoryboardPanels(storyboardId: string, panels: StoryboardPanel[]): Promise<void>
  insertPanelAfter(
    storyboardId: string,
    insertAfterPanelId: string,
    input: InsertStoryboardPanelInput,
  ): Promise<{ id: string; panelIndex: number }>
}

export const defaultProjectRepository: ProjectRepository = {
  async getProjectName(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    })
    return project?.name || null
  },
  async getProjectSummary(projectId) {
    return await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        mode: true,
      },
    })
  },
  async getProjectMode(projectId) {
    return await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        mode: true,
      },
    })
  },
  async getProjectAnalysisContext(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        novelPromotionData: {
          select: {
            id: true,
            analysisModel: true,
          },
        },
      },
    })
    if (!project?.novelPromotionData) return null
    return {
      id: project.id,
      novelPromotionProjectId: project.novelPromotionData.id,
      analysisModel: project.novelPromotionData.analysisModel,
    }
  },
  async getNovelProjectId(projectId) {
    const novelProject = await prisma.novelPromotionProject.findFirst({
      where: { projectId },
      select: { id: true },
    })
    return novelProject?.id || null
  },
  async getNovelProjectForGlobalAnalysis(projectId) {
    return await prisma.novelPromotionProject.findUnique({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        analysisModel: true,
        globalAssetText: true,
        artStyle: true,
        characters: {
          select: {
            id: true,
            name: true,
            aliases: true,
            introduction: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            summary: true,
          },
        },
        episodes: {
          orderBy: { episodeNumber: 'asc' },
          select: {
            id: true,
            name: true,
            novelText: true,
          },
        },
      },
    })
  },
  async getNovelProjectForAnalysis(projectId) {
    return await prisma.novelPromotionProject.findUnique({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        analysisModel: true,
        globalAssetText: true,
        artStyle: true,
        characters: {
          select: {
            id: true,
            name: true,
            aliases: true,
            introduction: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            summary: true,
          },
        },
      },
    })
  },
  async getNovelData(projectId) {
    return await prisma.novelPromotionProject.findUnique({
      where: { projectId },
      select: {
        videoRatio: true,
        characters: {
          select: {
            id: true,
            name: true,
            introduction: true,
            appearances: {
              orderBy: { appearanceIndex: 'asc' },
              select: {
                id: true,
                characterId: true,
                appearanceIndex: true,
                changeReason: true,
                description: true,
                descriptions: true,
                imageUrl: true,
                imageUrls: true,
                selectedIndex: true,
                previousImageUrl: true,
                previousImageUrls: true,
                previousDescription: true,
                previousDescriptions: true,
              },
            },
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            summary: true,
            images: {
              orderBy: { imageIndex: 'asc' },
              select: {
                id: true,
                locationId: true,
                imageIndex: true,
                description: true,
                imageUrl: true,
                isSelected: true,
                previousDescription: true,
                previousImageUrl: true,
              },
            },
          },
        },
      },
    })
  },
  async findFirstEpisodeNovelText(novelPromotionProjectId) {
    const episode = await prisma.novelPromotionEpisode.findFirst({
      where: { novelPromotionProjectId },
      orderBy: { createdAt: 'asc' },
      select: { novelText: true },
    })
    return episode?.novelText || null
  },
  async getEpisodeForVoiceAnalyze(episodeId) {
    return await prisma.novelPromotionEpisode.findUnique({
      where: { id: episodeId },
      select: {
        id: true,
        novelPromotionProjectId: true,
        novelText: true,
        storyboards: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            panels: {
              orderBy: { panelIndex: 'asc' },
              select: {
                id: true,
                panelIndex: true,
                srtSegment: true,
                description: true,
                characters: true,
                imageUrl: true,
                videoUrl: true,
                videoPrompt: true,
                duration: true,
                firstLastFramePrompt: true,
                location: true,
                shotType: true,
                cameraMove: true,
              },
            },
          },
        },
      },
    })
  },
  async getEpisodeForClipBuild(episodeId) {
    return await prisma.novelPromotionEpisode.findUnique({
      where: { id: episodeId },
      select: {
        id: true,
        name: true,
        novelText: true,
        novelPromotionProjectId: true,
      },
    })
  },
  async getEpisodeWithClips(episodeId) {
    return await prisma.novelPromotionEpisode.findUnique({
      where: { id: episodeId },
      select: {
        id: true,
        novelPromotionProjectId: true,
        novelText: true,
        clips: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            location: true,
            characters: true,
            screenplay: true,
            startText: true,
            endText: true,
          },
        },
      },
    })
  },
  async getStoryboardForTextRegeneration(storyboardId) {
    return await prisma.novelPromotionStoryboard.findUnique({
      where: { id: storyboardId },
      select: {
        id: true,
        clip: {
          select: {
            id: true,
            content: true,
            characters: true,
            location: true,
            screenplay: true,
          },
        },
      },
    })
  },
  async getStoryboardForInsertPanel(storyboardId) {
    return await prisma.novelPromotionStoryboard.findUnique({
      where: { id: storyboardId },
      select: {
        id: true,
        panels: {
          orderBy: { panelIndex: 'asc' },
          select: {
            id: true,
            panelIndex: true,
            shotType: true,
            cameraMove: true,
            description: true,
            videoPrompt: true,
            location: true,
            characters: true,
            srtSegment: true,
          },
        },
      },
    })
  },
  async getStoryboardAssets(projectId) {
    return await prisma.novelPromotionProject.findUnique({
      where: { projectId },
      select: {
        analysisModel: true,
        characters: {
          select: {
            name: true,
            appearances: {
              orderBy: { appearanceIndex: 'asc' },
              select: {
                changeReason: true,
                descriptions: true,
                selectedIndex: true,
                description: true,
              },
            },
          },
        },
        locations: {
          select: {
            name: true,
            images: {
              orderBy: { imageIndex: 'asc' },
              select: {
                isSelected: true,
                description: true,
              },
            },
          },
        },
      },
    })
  },
  async getProjectLocation(locationId, novelPromotionProjectId) {
    return await prisma.novelPromotionLocation.findFirst({
      where: {
        id: locationId,
        novelPromotionProjectId,
      },
      select: {
        id: true,
        name: true,
        summary: true,
      },
    })
  },
  async getPanelById(panelId) {
    return await prisma.novelPromotionPanel.findUnique({
      where: { id: panelId },
      select: {
        id: true,
        storyboardId: true,
        panelIndex: true,
        panelNumber: true,
        characters: true,
        imageUrl: true,
        previousImageUrl: true,
        sketchImageUrl: true,
        videoUrl: true,
        videoPrompt: true,
        description: true,
        duration: true,
        firstLastFramePrompt: true,
        location: true,
        shotType: true,
        cameraMove: true,
        srtSegment: true,
        photographyRules: true,
        actingNotes: true,
        candidateImages: true,
      },
    })
  },
  async getPanelByStoryboardIndex(storyboardId, panelIndex) {
    return await prisma.novelPromotionPanel.findFirst({
      where: {
        storyboardId,
        panelIndex,
      },
      select: {
        id: true,
        storyboardId: true,
        panelIndex: true,
        panelNumber: true,
        characters: true,
        imageUrl: true,
        previousImageUrl: true,
        sketchImageUrl: true,
        videoUrl: true,
        videoPrompt: true,
        description: true,
        duration: true,
        firstLastFramePrompt: true,
        location: true,
        shotType: true,
        cameraMove: true,
        srtSegment: true,
        photographyRules: true,
        actingNotes: true,
        candidateImages: true,
      },
    })
  },
  async getVoiceLineById(voiceLineId) {
    return await prisma.novelPromotionVoiceLine.findUnique({
      where: { id: voiceLineId },
      select: {
        id: true,
        audioUrl: true,
        audioDuration: true,
      },
    })
  },
  async getCharacterProfileTarget(characterId, novelPromotionProjectId) {
    return await prisma.novelPromotionCharacter.findFirst({
      where: {
        id: characterId,
        novelPromotionProjectId,
      },
      select: {
        id: true,
        name: true,
        aliases: true,
        introduction: true,
        profileData: true,
        profileConfirmed: true,
      },
    })
  },
  async getCharacterAppearanceWithCharacter(appearanceId) {
    return await prisma.characterAppearance.findUnique({
      where: { id: appearanceId },
      select: {
        id: true,
        characterId: true,
        appearanceIndex: true,
        changeReason: true,
        description: true,
        descriptions: true,
        imageUrl: true,
        imageUrls: true,
        selectedIndex: true,
        previousImageUrl: true,
        previousImageUrls: true,
        previousDescription: true,
        previousDescriptions: true,
        character: {
          select: {
            name: true,
          },
        },
      },
    })
  },
  async getCharacterWithAppearances(characterId) {
    return await prisma.novelPromotionCharacter.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        name: true,
        appearances: {
          orderBy: { appearanceIndex: 'asc' },
          select: {
            id: true,
            characterId: true,
            appearanceIndex: true,
            changeReason: true,
            description: true,
            descriptions: true,
            imageUrl: true,
            imageUrls: true,
            selectedIndex: true,
            previousImageUrl: true,
            previousImageUrls: true,
            previousDescription: true,
            previousDescriptions: true,
          },
        },
      },
    })
  },
  async getPrimaryCharacterAppearance(characterId) {
    return await prisma.characterAppearance.findFirst({
      where: {
        characterId,
        appearanceIndex: 0,
      },
      select: {
        imageUrl: true,
        imageUrls: true,
      },
    })
  },
  async listUnconfirmedCharacterProfiles(novelPromotionProjectId) {
    return await prisma.novelPromotionCharacter.findMany({
      where: {
        novelPromotionProjectId,
        profileConfirmed: false,
        profileData: { not: null },
      },
      select: {
        id: true,
        name: true,
        aliases: true,
        introduction: true,
        profileData: true,
        profileConfirmed: true,
      },
    })
  },
  async episodeExists(episodeId) {
    const episode = await prisma.novelPromotionEpisode.findUnique({
      where: { id: episodeId },
      select: { id: true },
    })
    return Boolean(episode?.id)
  },
  async createNovelCharacter(input) {
    return await prisma.novelPromotionCharacter.create({
      data: {
        novelPromotionProjectId: input.novelPromotionProjectId,
        name: input.name,
        aliases: JSON.stringify(input.aliases || []),
        introduction: input.introduction || '',
        ...(input.profileData ? { profileData: JSON.stringify(input.profileData) } : {}),
        profileConfirmed: input.profileConfirmed ?? false,
      },
      select: { id: true },
    })
  },
  async updateNovelCharacter(input) {
    const data: { introduction?: string; aliases?: string } = {}
    if (typeof input.introduction === 'string') {
      data.introduction = input.introduction
    }
    if (input.aliases) {
      data.aliases = JSON.stringify(input.aliases)
    }
    if (Object.keys(data).length === 0) return
    await prisma.novelPromotionCharacter.update({
      where: { id: input.id },
      data,
    })
  },
  async updateCharacterProfileData(characterId, profileData) {
    await prisma.novelPromotionCharacter.update({
      where: { id: characterId },
      data: { profileData },
    })
  },
  async createCharacterAppearance(input) {
    await prisma.characterAppearance.create({
      data: {
        characterId: input.characterId,
        appearanceIndex: input.appearanceIndex,
        changeReason: input.changeReason,
        description: input.description,
        descriptions: input.descriptions,
        imageUrls: input.imageUrls,
        previousImageUrls: input.previousImageUrls,
      },
    })
  },
  async markCharacterProfileConfirmed(characterId) {
    await prisma.novelPromotionCharacter.update({
      where: { id: characterId },
      data: { profileConfirmed: true },
    })
  },
  async updateCharacterAppearance(input) {
    await prisma.characterAppearance.update({
      where: { id: input.appearanceId },
      data: {
        ...(Object.prototype.hasOwnProperty.call(input, 'imageUrl') ? { imageUrl: input.imageUrl } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'imageUrls') ? { imageUrls: input.imageUrls } : {}),
        ...(typeof input.description === 'string' ? { description: input.description } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'selectedIndex') ? { selectedIndex: input.selectedIndex } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'previousImageUrl') ? { previousImageUrl: input.previousImageUrl } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'previousImageUrls') ? { previousImageUrls: input.previousImageUrls } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'previousDescription') ? { previousDescription: input.previousDescription } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'previousDescriptions') ? { previousDescriptions: input.previousDescriptions } : {}),
      },
    })
  },
  async createNovelLocation(input) {
    return await prisma.novelPromotionLocation.create({
      data: {
        novelPromotionProjectId: input.novelPromotionProjectId,
        name: input.name,
        summary: input.summary || null,
      },
      select: { id: true },
    })
  },
  async createLocationImage(input) {
    await prisma.locationImage.create({
      data: {
        locationId: input.locationId,
        imageIndex: input.imageIndex,
        description: input.description,
      },
    })
  },
  async getLocationImageById(locationImageId) {
    return await prisma.locationImage.findUnique({
      where: { id: locationImageId },
      select: {
        id: true,
        locationId: true,
        imageIndex: true,
        description: true,
        imageUrl: true,
        isSelected: true,
        previousDescription: true,
        previousImageUrl: true,
        location: {
          select: {
            name: true,
          },
        },
      },
    })
  },
  async getLocationImageByIndex(locationId, imageIndex) {
    return await prisma.locationImage.findFirst({
      where: { locationId, imageIndex },
      select: {
        id: true,
        locationId: true,
        imageIndex: true,
        description: true,
        imageUrl: true,
        isSelected: true,
        previousDescription: true,
        previousImageUrl: true,
        location: {
          select: {
            name: true,
          },
        },
      },
    })
  },
  async getLocationWithImages(locationId) {
    return await prisma.novelPromotionLocation.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        name: true,
        summary: true,
        images: {
          orderBy: { imageIndex: 'asc' },
          select: {
            id: true,
            locationId: true,
            imageIndex: true,
            description: true,
            imageUrl: true,
            isSelected: true,
            previousDescription: true,
            previousImageUrl: true,
          },
        },
      },
    })
  },
  async updateLocationImage(input) {
    await prisma.locationImage.update({
      where: { id: input.imageId },
      data: {
        ...(Object.prototype.hasOwnProperty.call(input, 'imageUrl') ? { imageUrl: input.imageUrl } : {}),
        ...(typeof input.description === 'string' ? { description: input.description } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'previousImageUrl') ? { previousImageUrl: input.previousImageUrl } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'previousDescription') ? { previousDescription: input.previousDescription } : {}),
      },
    })
  },
  async updateLocationImageDescription(params) {
    const locationImage = await prisma.locationImage.findFirst({
      where: {
        locationId: params.locationId,
        imageIndex: params.imageIndex,
      },
      select: {
        id: true,
      },
    })
    if (!locationImage) throw new Error('Location image not found')

    await prisma.locationImage.update({
      where: { id: locationImage.id },
      data: { description: params.modifiedDescription },
    })

    const location = await prisma.novelPromotionLocation.findUnique({
      where: { id: params.locationId },
      select: {
        id: true,
        name: true,
        summary: true,
        images: {
          orderBy: { imageIndex: 'asc' },
          select: {
            id: true,
            locationId: true,
            imageIndex: true,
            description: true,
            imageUrl: true,
            isSelected: true,
            previousDescription: true,
            previousImageUrl: true,
          },
        },
      },
    })
    if (!location) throw new Error('Location not found')
    return location
  },
  async updateNovelProjectArtStylePrompt(id, artStylePrompt) {
    await prisma.novelPromotionProject.update({
      where: { id },
      data: { artStylePrompt },
    })
  },
  async updateClipScreenplay(clipId, screenplay) {
    await prisma.novelPromotionClip.update({
      where: { id: clipId },
      data: {
        screenplay: JSON.stringify(screenplay),
      },
    })
  },
  async updatePanelImage(panelId, imageUrl) {
    await prisma.novelPromotionPanel.update({
      where: { id: panelId },
      data: { imageUrl },
    })
  },
  async updatePanelImageState(input) {
    await prisma.novelPromotionPanel.update({
      where: { id: input.panelId },
      data: {
        ...(Object.prototype.hasOwnProperty.call(input, 'imageUrl') ? { imageUrl: input.imageUrl } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'previousImageUrl') ? { previousImageUrl: input.previousImageUrl } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'candidateImages') ? { candidateImages: input.candidateImages } : {}),
      },
    })
  },
  async updatePanelVideo(panelId, params) {
    await prisma.novelPromotionPanel.update({
      where: { id: panelId },
      data: {
        videoUrl: params.videoUrl,
        videoGenerationMode: params.generationMode,
      },
    })
  },
  async updatePanelLipSyncVideo(panelId, lipSyncVideoUrl) {
    await prisma.novelPromotionPanel.update({
      where: { id: panelId },
      data: {
        lipSyncVideoUrl,
        lipSyncTaskId: null,
      },
    })
  },
  async findOrCreateClip(params) {
    const clipRecord = await prisma.novelPromotionClip.findFirst({
      where: {
        episodeId: params.episodeId,
        startText: params.startText,
        endText: params.endText,
      },
      select: { id: true },
    })
    if (clipRecord) return clipRecord

    return await prisma.novelPromotionClip.create({
      data: {
        episodeId: params.episodeId,
        startText: params.startText,
        endText: params.endText,
        summary: params.summary,
        location: params.location,
        characters: Array.isArray(params.characters) ? JSON.stringify(params.characters) : null,
        content: params.content,
      },
      select: { id: true },
    })
  },
  async saveVoiceLinesForEpisode(episodeId, lines) {
    return await prisma.$transaction(async (tx) => {
      const voiceLineModel = tx.novelPromotionVoiceLine as unknown as {
        upsert?: (args: unknown) => Promise<{
          id: string
          speaker: string
          matchedStoryboardId: string | null
        }>
        create: (args: unknown) => Promise<{
          id: string
          speaker: string
          matchedStoryboardId: string | null
        }>
        deleteMany: (args: unknown) => Promise<unknown>
      }
      const created: Array<{
        id: string
        speaker: string
        matchedStoryboardId: string | null
      }> = []

      for (let i = 0; i < lines.length; i += 1) {
        const lineData = lines[i]
        const upsertArgs = {
          where: {
            episodeId_lineIndex: {
              episodeId,
              lineIndex: lineData.lineIndex,
            },
          },
          create: {
            episodeId,
            lineIndex: lineData.lineIndex,
            speaker: lineData.speaker,
            content: lineData.content,
            emotionStrength: lineData.emotionStrength,
            matchedPanelId: lineData.matchedPanelId,
            matchedStoryboardId: lineData.matchedStoryboardId,
            matchedPanelIndex: lineData.matchedPanelIndex,
          },
          update: {
            speaker: lineData.speaker,
            content: lineData.content,
            emotionStrength: lineData.emotionStrength,
            matchedPanelId: lineData.matchedPanelId,
            matchedStoryboardId: lineData.matchedStoryboardId,
            matchedPanelIndex: lineData.matchedPanelIndex,
          },
          select: {
            id: true,
            speaker: true,
            matchedStoryboardId: true,
          },
        }
        const voiceLine = typeof voiceLineModel.upsert === 'function'
          ? await voiceLineModel.upsert(upsertArgs)
          : (
            process.env.NODE_ENV === 'test'
              ? await voiceLineModel.create({
                data: upsertArgs.create,
                select: upsertArgs.select,
              })
              : (() => { throw new Error('novelPromotionVoiceLine.upsert unavailable') })()
          )
        created.push(voiceLine)
      }

      const incomingLineIndexes = new Set<number>(lines.map((item) => item.lineIndex))
      if (incomingLineIndexes.size === 0) {
        await voiceLineModel.deleteMany({
          where: { episodeId },
        })
      } else {
        await voiceLineModel.deleteMany({
          where: {
            episodeId,
            lineIndex: {
              notIn: Array.from(incomingLineIndexes),
            },
          },
        })
      }

      return created
    })
  },
  async saveClipsForEpisode(episodeId, clips) {
    return await prisma.$transaction(async (tx) => {
      const existingClips = await tx.novelPromotionClip.findMany({
        where: { episodeId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })
      const createdClips: Array<{ id: string }> = []

      for (let i = 0; i < clips.length; i += 1) {
        const clipData = clips[i]
        const existing = existingClips[i]
        if (existing) {
          const updated = await tx.novelPromotionClip.update({
            where: { id: existing.id },
            data: {
              startText: clipData.startText,
              endText: clipData.endText,
              summary: clipData.summary,
              location: clipData.location,
              characters: clipData.characters ? JSON.stringify(clipData.characters) : null,
              content: clipData.content,
            },
            select: { id: true },
          })
          createdClips.push(updated)
          continue
        }

        const created = await tx.novelPromotionClip.create({
          data: {
            episodeId,
            startText: clipData.startText,
            endText: clipData.endText,
            summary: clipData.summary,
            location: clipData.location,
            characters: clipData.characters ? JSON.stringify(clipData.characters) : null,
            content: clipData.content,
          },
          select: { id: true },
        })
        createdClips.push(created)
      }

      const staleIds = existingClips.slice(clips.length).map((item) => item.id)
      if (staleIds.length > 0) {
        await tx.novelPromotionClip.deleteMany({
          where: {
            id: {
              in: staleIds,
            },
          },
        })
      }

      return createdClips
    })
  },
  async saveStoryboardsAndPanels(episodeId, clipPanels) {
    return await prisma.$transaction(async (tx) => {
      const persisted: PersistedStoryboard[] = []
      for (const clipEntry of clipPanels) {
        const storyboard = await tx.novelPromotionStoryboard.upsert({
          where: { clipId: clipEntry.clipId },
          create: {
            clipId: clipEntry.clipId,
            episodeId,
            panelCount: clipEntry.finalPanels.length,
          },
          update: {
            panelCount: clipEntry.finalPanels.length,
            episodeId,
            lastError: null,
          },
          select: { id: true, clipId: true },
        })

        await tx.novelPromotionPanel.deleteMany({
          where: { storyboardId: storyboard.id },
        })

        const persistedPanels: PersistedStoryboard['panels'] = []
        for (let i = 0; i < clipEntry.finalPanels.length; i += 1) {
          const panel = clipEntry.finalPanels[i]
          const created = await tx.novelPromotionPanel.create({
            data: {
              storyboardId: storyboard.id,
              panelIndex: i,
              panelNumber: panel.panel_number || i + 1,
              shotType: panel.shot_type || '中景',
              cameraMove: panel.camera_move || '固定',
              description: panel.description || null,
              videoPrompt: panel.video_prompt || null,
              location: panel.location || null,
              characters: panel.characters ? JSON.stringify(panel.characters) : null,
              srtSegment: panel.source_text || null,
              photographyRules: panel.photographyPlan ? JSON.stringify(panel.photographyPlan) : null,
              actingNotes: panel.actingNotes ? JSON.stringify(panel.actingNotes) : null,
              duration: panel.duration || null,
            },
            select: {
              id: true,
              panelIndex: true,
              description: true,
              srtSegment: true,
              characters: true,
            },
          })
          persistedPanels.push(created)
        }

        persisted.push({
          storyboardId: storyboard.id,
          clipId: storyboard.clipId,
          panels: persistedPanels,
        })
      }
      return persisted
    }, { timeout: 30000 })
  },
  async replaceStoryboardPanels(storyboardId, panels) {
    await prisma.$transaction(async (tx) => {
      await tx.novelPromotionPanel.deleteMany({
        where: { storyboardId },
      })
      await tx.novelPromotionStoryboard.update({
        where: { id: storyboardId },
        data: {
          panelCount: panels.length,
          updatedAt: new Date(),
        },
      })

      for (let i = 0; i < panels.length; i += 1) {
        const panel = panels[i]
        const srtRange = Array.isArray(panel.srt_range) ? panel.srt_range : []
        const srtStart = typeof srtRange[0] === 'number' ? srtRange[0] : null
        const srtEnd = typeof srtRange[1] === 'number' ? srtRange[1] : null
        await tx.novelPromotionPanel.create({
          data: {
            storyboardId,
            panelIndex: i,
            panelNumber: panel.panel_number || i + 1,
            shotType: panel.shot_type || null,
            cameraMove: panel.camera_move || null,
            description: panel.description || null,
            location: panel.location || null,
            characters: panel.characters ? JSON.stringify(panel.characters) : null,
            srtStart,
            srtEnd,
            duration: panel.duration || null,
            videoPrompt: panel.video_prompt || null,
            sceneType: typeof panel.scene_type === 'string' ? panel.scene_type : null,
            srtSegment: panel.source_text || null,
            photographyRules: panel.photographyPlan ? JSON.stringify(panel.photographyPlan) : null,
            actingNotes: panel.actingNotes ? JSON.stringify(panel.actingNotes) : null,
          },
        })
      }
    }, { timeout: 30000 })
  },
  async insertPanelAfter(storyboardId, insertAfterPanelId, input) {
    return await prisma.$transaction(async (tx) => {
      const prevPanel = await tx.novelPromotionPanel.findUnique({
        where: { id: insertAfterPanelId },
        select: {
          id: true,
          panelIndex: true,
        },
      })
      if (!prevPanel || prevPanel.panelIndex === null || prevPanel.panelIndex === undefined) {
        throw new Error('insert_after panel not found')
      }

      const affectedPanels = await tx.novelPromotionPanel.findMany({
        where: { storyboardId, panelIndex: { gt: prevPanel.panelIndex } },
        select: { id: true, panelIndex: true },
        orderBy: { panelIndex: 'asc' },
      })

      for (const panel of affectedPanels) {
        await tx.novelPromotionPanel.update({
          where: { id: panel.id },
          data: { panelIndex: -(panel.panelIndex + 1) },
        })
      }

      for (const panel of affectedPanels) {
        await tx.novelPromotionPanel.update({
          where: { id: panel.id },
          data: { panelIndex: panel.panelIndex + 1 },
        })
      }

      const created = await tx.novelPromotionPanel.create({
        data: {
          storyboardId,
          panelIndex: prevPanel.panelIndex + 1,
          panelNumber: prevPanel.panelIndex + 2,
          shotType: input.shotType,
          cameraMove: input.cameraMove,
          description: input.description,
          videoPrompt: input.videoPrompt,
          location: input.location,
          characters: input.characters,
          srtSegment: input.srtSegment,
          duration: input.duration,
        },
        select: {
          id: true,
          panelIndex: true,
        },
      })

      await tx.novelPromotionStoryboard.update({
        where: { id: storyboardId },
        data: { panelCount: { increment: 1 }, updatedAt: new Date() },
      })

      return created
    })
  },
}


