'use client'

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { queryKeys } from '@/lib/query/keys'
import type { Character, Location, Project } from '@/types/project'
import {
  clearTaskTargetOverlay,
  upsertTaskTargetOverlay,
} from '@/lib/query/task-target-overlay'
import {
  requestAiCreateProjectLocation,
  requestAnalyzeProjectGlobalAssets,
  requestAnalyzeProjectShotVariants,
  requestBatchConfirmProjectCharacterProfiles,
  requestConfirmProjectCharacterProfile,
  requestConfirmProjectCharacterSelection,
  requestConfirmProjectLocationSelection,
  requestCopyProjectAssetFromGlobal,
  requestCreateProjectPanel,
  requestCreateProjectPanelVariant,
  requestCreateProjectLocation,
  requestCreateProjectStoryboardGroup,
  requestDeleteProjectPanel,
  requestDeleteProjectStoryboardGroup,
  requestDeleteProjectAppearance,
  requestDeleteProjectCharacter,
  requestDeleteProjectLocation,
  requestDownloadProjectImages,
  requestGenerateProjectCharacterImage,
  requestGenerateProjectLocationImage,
  requestInsertProjectPanel,
  requestModifyProjectStoryboardImage,
  requestMoveProjectStoryboardGroup,
  requestModifyProjectCharacterImage,
  requestModifyProjectLocationImage,
  requestRegenerateProjectCharacterGroup,
  requestRegenerateProjectLocationGroup,
  requestRegenerateProjectPanelImage,
  requestRegenerateProjectStoryboardText,
  requestRegenerateSingleProjectCharacterImage,
  requestRegenerateSingleProjectLocationImage,
  requestSelectProjectCharacterImage,
  requestSelectProjectLocationImage,
  requestSelectProjectPanelCandidate,
  requestUndoProjectCharacterImage,
  requestUndoProjectLocationImage,
  requestClearProjectStoryboardError,
  requestUpdateProjectAppearanceDescription,
  requestUpdateProjectPanel,
  requestUpdateProjectCharacterVoiceSettings,
  requestUpdateProjectLocationDescription,
  requestUploadProjectCharacterImage,
  requestUploadProjectCharacterVoice,
  requestUploadProjectLocationImage,
  requestSaveProjectDesignedVoice,
} from '@renderer/clients/novel-promotion-runtime-client'
import type { ProjectAssetsData } from '@renderer/hooks/useRendererProjectQueries'

type SelectProjectCharacterImageContext = {
  previousAssets: ProjectAssetsData | undefined
  previousProject: Project | undefined
  targetKey: string
  requestId: number
}

type SelectProjectLocationImageContext = {
  previousAssets: ProjectAssetsData | undefined
  previousProject: Project | undefined
  targetKey: string
  requestId: number
}

type DeleteProjectCharacterContext = {
  previousAssets: ProjectAssetsData | undefined
  previousProject: Project | undefined
}

type DeleteProjectLocationContext = {
  previousAssets: ProjectAssetsData | undefined
  previousProject: Project | undefined
}

function invalidateProjectAssets(queryClient: QueryClient, projectId: string) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.projectAssets.all(projectId) })
}

function invalidateProjectAssetsAndProjectData(queryClient: QueryClient, projectId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.projectAssets.all(projectId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) }),
  ])
}

function applyCharacterSelectionToCharacters(
  characters: Character[],
  characterId: string,
  appearanceId: string,
  selectedIndex: number | null,
): Character[] {
  return characters.map((character) => {
    if (character.id !== characterId) return character
    return {
      ...character,
      appearances: (character.appearances || []).map((appearance) => {
        if (appearance.id !== appearanceId) return appearance
        const selectedUrl =
          selectedIndex !== null && selectedIndex >= 0
            ? (appearance.imageUrls[selectedIndex] ?? null)
            : null
        return {
          ...appearance,
          selectedIndex,
          imageUrl: selectedUrl ?? appearance.imageUrl ?? null,
        }
      }),
    }
  })
}

function applyCharacterSelectionToAssets(
  previous: ProjectAssetsData | undefined,
  characterId: string,
  appearanceId: string,
  selectedIndex: number | null,
): ProjectAssetsData | undefined {
  if (!previous) return previous
  return {
    ...previous,
    characters: applyCharacterSelectionToCharacters(
      previous.characters || [],
      characterId,
      appearanceId,
      selectedIndex,
    ),
  }
}

function applyCharacterSelectionToProject(
  previous: Project | undefined,
  characterId: string,
  appearanceId: string,
  selectedIndex: number | null,
): Project | undefined {
  if (!previous?.novelPromotionData) return previous
  const currentCharacters = previous.novelPromotionData.characters || []
  return {
    ...previous,
    novelPromotionData: {
      ...previous.novelPromotionData,
      characters: applyCharacterSelectionToCharacters(
        currentCharacters,
        characterId,
        appearanceId,
        selectedIndex,
      ),
    },
  }
}

function removeCharacterFromAssets(
  previous: ProjectAssetsData | undefined,
  characterId: string,
): ProjectAssetsData | undefined {
  if (!previous) return previous
  return {
    ...previous,
    characters: (previous.characters || []).filter((character) => character.id !== characterId),
  }
}

function removeCharacterFromProject(
  previous: Project | undefined,
  characterId: string,
): Project | undefined {
  if (!previous?.novelPromotionData) return previous
  const currentCharacters = previous.novelPromotionData.characters || []
  return {
    ...previous,
    novelPromotionData: {
      ...previous.novelPromotionData,
      characters: currentCharacters.filter((character) => character.id !== characterId),
    },
  }
}

function applyLocationSelectionToLocations(
  locations: Location[],
  locationId: string,
  selectedIndex: number | null,
): Location[] {
  return locations.map((location) => {
    if (location.id !== locationId) return location
    const selectedImageId =
      selectedIndex === null
        ? null
        : (location.images || []).find((image) => image.imageIndex === selectedIndex)?.id ?? null
    return {
      ...location,
      selectedImageId,
      images: (location.images || []).map((image) => ({
        ...image,
        isSelected: selectedIndex !== null && image.imageIndex === selectedIndex,
      })),
    }
  })
}

function applyLocationSelectionToAssets(
  previous: ProjectAssetsData | undefined,
  locationId: string,
  selectedIndex: number | null,
): ProjectAssetsData | undefined {
  if (!previous) return previous
  return {
    ...previous,
    locations: applyLocationSelectionToLocations(previous.locations || [], locationId, selectedIndex),
  }
}

function applyLocationSelectionToProject(
  previous: Project | undefined,
  locationId: string,
  selectedIndex: number | null,
): Project | undefined {
  if (!previous?.novelPromotionData) return previous
  const currentLocations = previous.novelPromotionData.locations || []
  return {
    ...previous,
    novelPromotionData: {
      ...previous.novelPromotionData,
      locations: applyLocationSelectionToLocations(currentLocations, locationId, selectedIndex),
    },
  }
}

function removeLocationFromAssets(
  previous: ProjectAssetsData | undefined,
  locationId: string,
): ProjectAssetsData | undefined {
  if (!previous) return previous
  return {
    ...previous,
    locations: (previous.locations || []).filter((location) => location.id !== locationId),
  }
}

function removeLocationFromProject(
  previous: Project | undefined,
  locationId: string,
): Project | undefined {
  if (!previous?.novelPromotionData) return previous
  const currentLocations = previous.novelPromotionData.locations || []
  return {
    ...previous,
    novelPromotionData: {
      ...previous.novelPromotionData,
      locations: currentLocations.filter((location) => location.id !== locationId),
    },
  }
}

export function useAnalyzeProjectGlobalAssets(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => requestAnalyzeProjectGlobalAssets(projectId),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useAnalyzeProjectShotVariants(projectId: string) {
  return useMutation({
    mutationFn: (payload: { panelId: string }) =>
      requestAnalyzeProjectShotVariants(projectId, payload),
  })
}

export function useBatchConfirmProjectCharacterProfiles(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => requestBatchConfirmProjectCharacterProfiles(projectId),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useCopyProjectAssetFromGlobal(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      type: 'character' | 'location' | 'voice'
      targetId: string
      globalAssetId: string
    }) => requestCopyProjectAssetFromGlobal(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useAiCreateProjectLocation(projectId: string) {
  return useMutation({
    mutationFn: (payload: { userInstruction: string }) =>
      requestAiCreateProjectLocation(projectId, payload),
  })
}

export function useCreateProjectLocation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      name: string
      description: string
      artStyle?: string
      count?: number
    }) => requestCreateProjectLocation(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useDeleteProjectCharacter(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (characterId: string) => requestDeleteProjectCharacter(projectId, characterId),
    onMutate: async (characterId): Promise<DeleteProjectCharacterContext> => {
      const assetsQueryKey = queryKeys.projectAssets.all(projectId)
      const projectQueryKey = queryKeys.projectData(projectId)

      await queryClient.cancelQueries({ queryKey: assetsQueryKey })
      await queryClient.cancelQueries({ queryKey: projectQueryKey })

      const previousAssets = queryClient.getQueryData<ProjectAssetsData>(assetsQueryKey)
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey)

      queryClient.setQueryData<ProjectAssetsData | undefined>(assetsQueryKey, (previous) =>
        removeCharacterFromAssets(previous, characterId),
      )
      queryClient.setQueryData<Project | undefined>(projectQueryKey, (previous) =>
        removeCharacterFromProject(previous, characterId),
      )

      return {
        previousAssets,
        previousProject,
      }
    },
    onError: (_error, _characterId, context) => {
      if (!context) return
      queryClient.setQueryData(queryKeys.projectAssets.all(projectId), context.previousAssets)
      queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
    },
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useDeleteProjectAppearance(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { characterId: string; appearanceId: string }) =>
      requestDeleteProjectAppearance(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useCreateProjectStoryboardGroup(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { episodeId: string; insertIndex: number }) =>
      requestCreateProjectStoryboardGroup(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useCreateProjectPanel(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => requestCreateProjectPanel(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useCreateProjectPanelVariant(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      storyboardId: string
      insertAfterPanelId: string
      sourcePanelId: string
      variant: {
        title: string
        description: string
        shot_type: string
        camera_move: string
        video_prompt: string
      }
      includeCharacterAssets: boolean
      includeLocationAsset: boolean
    }) => requestCreateProjectPanelVariant(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useDeleteProjectPanel(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { panelId: string }) => requestDeleteProjectPanel(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useDeleteProjectStoryboardGroup(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { storyboardId: string }) =>
      requestDeleteProjectStoryboardGroup(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useMoveProjectStoryboardGroup(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      episodeId: string
      clipId: string
      direction: 'up' | 'down'
    }) => requestMoveProjectStoryboardGroup(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useDownloadProjectImages(projectId: string) {
  return useMutation({
    mutationFn: (payload: { episodeId: string }) => requestDownloadProjectImages(projectId, payload),
  })
}

export function useInsertProjectPanel(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      storyboardId: string
      insertAfterPanelId: string
      userInput: string
    }) => requestInsertProjectPanel(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useModifyProjectStoryboardImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      storyboardId: string
      panelIndex: number
      modifyPrompt: string
      extraImageUrls: string[]
      selectedAssets: Array<{
        id: string
        name: string
        type: 'character' | 'location'
        imageUrl: string | null
        appearanceId?: number
        appearanceName?: string
      }>
    }) => requestModifyProjectStoryboardImage(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useClearProjectStoryboardError(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { storyboardId: string }) =>
      requestClearProjectStoryboardError(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useRegenerateCharacterGroup(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      appearanceId: string
      count?: number
    }) => requestRegenerateProjectCharacterGroup(projectId, payload),
    onMutate: ({ appearanceId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'CharacterAppearance',
        targetId: appearanceId,
        intent: 'regenerate',
      })
    },
    onError: (_error, { appearanceId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'CharacterAppearance',
        targetId: appearanceId,
      })
    },
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useRegenerateLocationGroup(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { locationId: string; count?: number }) =>
      requestRegenerateProjectLocationGroup(projectId, payload),
    onMutate: ({ locationId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'LocationImage',
        targetId: locationId,
        intent: 'regenerate',
      })
    },
    onError: (_error, { locationId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'LocationImage',
        targetId: locationId,
      })
    },
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useRegenerateProjectPanelImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { panelId: string; count?: number }) =>
      requestRegenerateProjectPanelImage(projectId, payload),
    onMutate: ({ panelId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'NovelPromotionPanel',
        targetId: panelId,
        intent: 'regenerate',
      })
    },
    onError: (_error, { panelId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'NovelPromotionPanel',
        targetId: panelId,
      })
    },
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useRegenerateProjectStoryboardText(projectId: string) {
  return useMutation({
    mutationFn: (payload: { storyboardId: string }) =>
      requestRegenerateProjectStoryboardText(projectId, payload),
  })
}

export function useRegenerateSingleCharacterImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      appearanceId: string
      imageIndex: number
    }) => requestRegenerateSingleProjectCharacterImage(projectId, payload),
    onMutate: ({ appearanceId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'CharacterAppearance',
        targetId: appearanceId,
        intent: 'regenerate',
      })
    },
    onError: (_error, { appearanceId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'CharacterAppearance',
        targetId: appearanceId,
      })
    },
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useRegenerateSingleLocationImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { locationId: string; imageIndex: number }) =>
      requestRegenerateSingleProjectLocationImage(projectId, payload),
    onMutate: ({ locationId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'LocationImage',
        targetId: locationId,
        intent: 'regenerate',
      })
    },
    onError: (_error, { locationId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'LocationImage',
        targetId: locationId,
      })
    },
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useConfirmProjectCharacterSelection(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { characterId: string; appearanceId: string }) =>
      requestConfirmProjectCharacterSelection(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useConfirmProjectCharacterProfile(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      profileData?: unknown
      generateImage?: boolean
    }) => requestConfirmProjectCharacterProfile(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useConfirmProjectLocationSelection(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { locationId: string }) =>
      requestConfirmProjectLocationSelection(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useDeleteProjectLocation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (locationId: string) => requestDeleteProjectLocation(projectId, locationId),
    onMutate: async (locationId): Promise<DeleteProjectLocationContext> => {
      const assetsQueryKey = queryKeys.projectAssets.all(projectId)
      const projectQueryKey = queryKeys.projectData(projectId)

      await queryClient.cancelQueries({ queryKey: assetsQueryKey })
      await queryClient.cancelQueries({ queryKey: projectQueryKey })

      const previousAssets = queryClient.getQueryData<ProjectAssetsData>(assetsQueryKey)
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey)

      queryClient.setQueryData<ProjectAssetsData | undefined>(assetsQueryKey, (previous) =>
        removeLocationFromAssets(previous, locationId),
      )
      queryClient.setQueryData<Project | undefined>(projectQueryKey, (previous) =>
        removeLocationFromProject(previous, locationId),
      )

      return {
        previousAssets,
        previousProject,
      }
    },
    onError: (_error, _locationId, context) => {
      if (!context) return
      queryClient.setQueryData(queryKeys.projectAssets.all(projectId), context.previousAssets)
      queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
    },
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useUpdateProjectAppearanceDescription(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      appearanceId: string
      description: string
      descriptionIndex?: number
    }) => requestUpdateProjectAppearanceDescription(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useUpdateProjectLocationDescription(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      locationId: string
      description: string
      imageIndex?: number
    }) => requestUpdateProjectLocationDescription(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useGenerateProjectCharacterImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { characterId: string; appearanceId: string; count?: number }) =>
      requestGenerateProjectCharacterImage(projectId, payload),
    onMutate: ({ appearanceId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'CharacterAppearance',
        targetId: appearanceId,
        intent: 'generate',
      })
    },
    onError: (_error, { appearanceId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'CharacterAppearance',
        targetId: appearanceId,
      })
    },
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useGenerateProjectLocationImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      locationId: string
      imageIndex?: number
      artStyle?: string
      count?: number
    }) => requestGenerateProjectLocationImage(projectId, payload),
    onMutate: ({ locationId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'LocationImage',
        targetId: locationId,
        intent: 'generate',
      })
    },
    onError: (_error, { locationId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'LocationImage',
        targetId: locationId,
      })
    },
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useUploadProjectCharacterImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      file: File
      characterId: string
      appearanceId: string
      imageIndex?: number
      labelText?: string
    }) => requestUploadProjectCharacterImage(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useUploadProjectLocationImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      file: File
      locationId: string
      imageIndex?: number
      labelText?: string
    }) => requestUploadProjectLocationImage(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useUpdateProjectPanel(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => requestUpdateProjectPanel(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useUploadProjectCharacterVoice(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { file: File; characterId: string }) =>
      requestUploadProjectCharacterVoice(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useUpdateProjectCharacterVoiceSettings(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      voiceType: 'qwen-designed' | 'uploaded' | 'custom' | null
      voiceId?: string
      customVoiceUrl?: string
    }) => requestUpdateProjectCharacterVoiceSettings(projectId, payload),
    onSettled: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useSaveProjectDesignedVoice(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      voiceId: string
      audioBase64: string
    }) => requestSaveProjectDesignedVoice(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useModifyProjectCharacterImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      appearanceId: string
      imageIndex: number
      modifyPrompt: string
      extraImageUrls?: string[]
    }) => requestModifyProjectCharacterImage(projectId, payload),
    onMutate: ({ appearanceId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'CharacterAppearance',
        targetId: appearanceId,
        intent: 'modify',
      })
    },
    onError: (_error, { appearanceId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'CharacterAppearance',
        targetId: appearanceId,
      })
    },
    onSettled: () => invalidateProjectAssetsAndProjectData(queryClient, projectId),
  })
}

export function useModifyProjectLocationImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      locationId: string
      imageIndex: number
      modifyPrompt: string
      extraImageUrls?: string[]
    }) => requestModifyProjectLocationImage(projectId, payload),
    onMutate: ({ locationId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'LocationImage',
        targetId: locationId,
        intent: 'modify',
      })
    },
    onError: (_error, { locationId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'LocationImage',
        targetId: locationId,
      })
    },
    onSettled: () => invalidateProjectAssetsAndProjectData(queryClient, projectId),
  })
}

export function useSelectProjectCharacterImage(projectId: string) {
  const queryClient = useQueryClient()
  const latestRequestIdByTargetRef = useRef<Record<string, number>>({})

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      appearanceId: string
      imageIndex: number | null
      confirm?: boolean
    }) =>
      requestSelectProjectCharacterImage(projectId, {
        characterId: payload.characterId,
        appearanceId: payload.appearanceId,
        selectedIndex: payload.imageIndex,
      }),
    onMutate: async (variables): Promise<SelectProjectCharacterImageContext> => {
      const targetKey = `${variables.characterId}:${variables.appearanceId}`
      const requestId = (latestRequestIdByTargetRef.current[targetKey] ?? 0) + 1
      latestRequestIdByTargetRef.current[targetKey] = requestId

      const assetsQueryKey = queryKeys.projectAssets.all(projectId)
      const projectQueryKey = queryKeys.projectData(projectId)

      await queryClient.cancelQueries({ queryKey: assetsQueryKey })
      await queryClient.cancelQueries({ queryKey: projectQueryKey })

      const previousAssets = queryClient.getQueryData<ProjectAssetsData>(assetsQueryKey)
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey)

      queryClient.setQueryData<ProjectAssetsData | undefined>(assetsQueryKey, (previous) =>
        applyCharacterSelectionToAssets(
          previous,
          variables.characterId,
          variables.appearanceId,
          variables.imageIndex,
        ),
      )
      queryClient.setQueryData<Project | undefined>(projectQueryKey, (previous) =>
        applyCharacterSelectionToProject(
          previous,
          variables.characterId,
          variables.appearanceId,
          variables.imageIndex,
        ),
      )

      return {
        previousAssets,
        previousProject,
        targetKey,
        requestId,
      }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      const latestRequestId = latestRequestIdByTargetRef.current[context.targetKey]
      if (latestRequestId !== context.requestId) return
      queryClient.setQueryData(queryKeys.projectAssets.all(projectId), context.previousAssets)
      queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
    },
    onSettled: (_data, _error, variables) => {
      if (variables.confirm) {
        void invalidateProjectAssets(queryClient, projectId)
      }
    },
  })
}

export function useSelectProjectLocationImage(projectId: string) {
  const queryClient = useQueryClient()
  const latestRequestIdByTargetRef = useRef<Record<string, number>>({})

  return useMutation({
    mutationFn: (payload: {
      locationId: string
      imageIndex: number | null
      confirm?: boolean
    }) =>
      requestSelectProjectLocationImage(projectId, {
        locationId: payload.locationId,
        selectedIndex: payload.imageIndex,
      }),
    onMutate: async (variables): Promise<SelectProjectLocationImageContext> => {
      const targetKey = variables.locationId
      const requestId = (latestRequestIdByTargetRef.current[targetKey] ?? 0) + 1
      latestRequestIdByTargetRef.current[targetKey] = requestId

      const assetsQueryKey = queryKeys.projectAssets.all(projectId)
      const projectQueryKey = queryKeys.projectData(projectId)

      await queryClient.cancelQueries({ queryKey: assetsQueryKey })
      await queryClient.cancelQueries({ queryKey: projectQueryKey })

      const previousAssets = queryClient.getQueryData<ProjectAssetsData>(assetsQueryKey)
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey)

      queryClient.setQueryData<ProjectAssetsData | undefined>(assetsQueryKey, (previous) =>
        applyLocationSelectionToAssets(previous, variables.locationId, variables.imageIndex),
      )
      queryClient.setQueryData<Project | undefined>(projectQueryKey, (previous) =>
        applyLocationSelectionToProject(previous, variables.locationId, variables.imageIndex),
      )

      return {
        previousAssets,
        previousProject,
        targetKey,
        requestId,
      }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      const latestRequestId = latestRequestIdByTargetRef.current[context.targetKey]
      if (latestRequestId !== context.requestId) return
      queryClient.setQueryData(queryKeys.projectAssets.all(projectId), context.previousAssets)
      queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
    },
    onSettled: (_data, _error, variables) => {
      if (variables.confirm) {
        void invalidateProjectAssets(queryClient, projectId)
      }
    },
  })
}

export function useUndoProjectCharacterImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { characterId: string; appearanceId: string }) =>
      requestUndoProjectCharacterImage(projectId, payload),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useUndoProjectLocationImage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (locationId: string) => requestUndoProjectLocationImage(projectId, locationId),
    onSuccess: () => invalidateProjectAssets(queryClient, projectId),
  })
}

export function useRefreshEpisodeData(projectId: string | null, episodeId: string | null) {
  const queryClient = useQueryClient()

  return () => {
    if (projectId && episodeId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.episodeData(projectId, episodeId),
      })
    }
  }
}

export function useRefreshStoryboards(episodeId: string | null) {
  const queryClient = useQueryClient()

  return () => {
    if (episodeId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.storyboards.all(episodeId) })
    }
  }
}

export function useSelectProjectPanelCandidate(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      panelId: string
      action: 'select' | 'cancel'
      selectedImageUrl?: string
    }) => requestSelectProjectPanelCandidate(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectAssets.all(projectId) })
    },
  })
}
