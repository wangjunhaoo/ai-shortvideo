'use client'

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { queryKeys } from '@/lib/query/keys'
import {
  deleteAssetHubCharacterAppearance,
  deleteAssetHubCharacter,
  deleteAssetHubLocation,
  deleteAssetHubVoice,
  requestAiDesignAssetHubLocation,
  requestAiModifyAssetHubCharacterDescription,
  requestAiModifyAssetHubLocationDescription,
  requestAssetHubGenerateImage,
  requestCreateAssetHubLocation,
  requestDesignAssetHubVoice,
  requestSelectAssetHubCharacterImage,
  requestSelectAssetHubLocationImage,
  requestUndoAssetHubCharacterImage,
  requestUndoAssetHubLocationImage,
  requestSaveDesignedAssetHubVoice,
  requestUpdateAssetHubAssetLabel,
  requestUpdateAssetHubCharacterAppearanceDescription,
  requestUpdateAssetHubCharacterName,
  requestUpdateAssetHubLocationName,
  requestUpdateAssetHubLocationSummary,
  requestUploadAssetHubCharacterVoice,
  requestUploadAssetHubVoice,
  requestUploadAssetHubCharacterImage,
  requestUploadAssetHubLocationImage,
} from '@renderer/clients/asset-hub-client'
import {
  useRendererModifyCharacterImage,
  useRendererModifyLocationImage,
} from '@renderer/modules/asset-hub/hooks/useAssetHubMutations'
import type {
  GlobalCharacter,
  GlobalLocation,
} from '@renderer/modules/asset-hub/hooks/useAssetHubQueries'
import {
  clearTaskTargetOverlay,
  upsertTaskTargetOverlay,
} from '@/lib/query/task-target-overlay'

const GLOBAL_ASSET_PROJECT_ID = 'global-asset-hub'

type CharacterQuerySnapshot = {
  queryKey: readonly unknown[]
  data: GlobalCharacter[] | undefined
}

type LocationQuerySnapshot = {
  queryKey: readonly unknown[]
  data: GlobalLocation[] | undefined
}

type SelectCharacterImageContext = {
  previousQueries: CharacterQuerySnapshot[]
  targetKey: string
  requestId: number
}

type SelectLocationImageContext = {
  previousQueries: LocationQuerySnapshot[]
  targetKey: string
  requestId: number
}

type DeleteCharacterContext = {
  previousQueries: CharacterQuerySnapshot[]
}

type DeleteLocationContext = {
  previousQueries: LocationQuerySnapshot[]
}

function invalidateGlobalCharacters(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
}

function invalidateGlobalLocations(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.locations() })
}

function invalidateGlobalVoices(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.voices() })
}

function applyCharacterSelection(
  characters: GlobalCharacter[] | undefined,
  characterId: string,
  appearanceIndex: number,
  imageIndex: number | null,
): GlobalCharacter[] | undefined {
  if (!characters) return characters
  return characters.map((character) => {
    if (character.id !== characterId) return character
    return {
      ...character,
      appearances: (character.appearances || []).map((appearance) => {
        if (appearance.appearanceIndex !== appearanceIndex) return appearance
        const selectedUrl =
          imageIndex !== null && imageIndex >= 0
            ? (appearance.imageUrls[imageIndex] ?? null)
            : null
        return {
          ...appearance,
          selectedIndex: imageIndex,
          imageUrl: selectedUrl ?? appearance.imageUrl ?? null,
        }
      }),
    }
  })
}

function applyLocationSelection(
  locations: GlobalLocation[] | undefined,
  locationId: string,
  imageIndex: number | null,
): GlobalLocation[] | undefined {
  if (!locations) return locations
  return locations.map((location) => {
    if (location.id !== locationId) return location
    return {
      ...location,
      images: (location.images || []).map((image) => ({
        ...image,
        isSelected: imageIndex !== null && image.imageIndex === imageIndex,
      })),
    }
  })
}

function captureCharacterQuerySnapshots(queryClient: QueryClient): CharacterQuerySnapshot[] {
  return queryClient
    .getQueriesData<GlobalCharacter[]>({
      queryKey: queryKeys.globalAssets.characters(),
      exact: false,
    })
    .map(([queryKey, data]) => ({ queryKey, data }))
}

function captureLocationQuerySnapshots(queryClient: QueryClient): LocationQuerySnapshot[] {
  return queryClient
    .getQueriesData<GlobalLocation[]>({
      queryKey: queryKeys.globalAssets.locations(),
      exact: false,
    })
    .map(([queryKey, data]) => ({ queryKey, data }))
}

function restoreCharacterQuerySnapshots(queryClient: QueryClient, snapshots: CharacterQuerySnapshot[]) {
  snapshots.forEach((snapshot) => {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data)
  })
}

function restoreLocationQuerySnapshots(queryClient: QueryClient, snapshots: LocationQuerySnapshot[]) {
  snapshots.forEach((snapshot) => {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data)
  })
}

export function useRefreshGlobalAssets() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.all() })
  }
}

export function useGenerateCharacterImage() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({
      characterId,
      appearanceIndex,
      artStyle,
      count,
    }: {
      characterId: string
      appearanceIndex: number
      artStyle?: string
      count?: number
    }) => {
      const response = await requestAssetHubGenerateImage({
        type: 'character',
        id: characterId,
        appearanceIndex,
        artStyle,
        count,
      })
      if (!response.ok) {
        throw new Error('Failed to generate image')
      }
      return response.json()
    },
    onMutate: ({ characterId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalCharacter',
        targetId: characterId,
        intent: 'generate',
      })
    },
    onError: (_error, { characterId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalCharacter',
        targetId: characterId,
      })
    },
    onSettled: invalidateCharacters,
  })
}

export function useGenerateLocationImage() {
  const queryClient = useQueryClient()
  const invalidateLocations = () => invalidateGlobalLocations(queryClient)

  return useMutation({
    mutationFn: async ({
      locationId,
      artStyle,
      count,
    }: {
      locationId: string
      artStyle?: string
      count?: number
    }) => {
      const response = await requestAssetHubGenerateImage({
        type: 'location',
        id: locationId,
        artStyle,
        count,
      })
      if (!response.ok) {
        throw new Error('Failed to generate image')
      }
      return response.json()
    },
    onMutate: ({ locationId }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalLocation',
        targetId: locationId,
        intent: 'generate',
      })
    },
    onError: (_error, { locationId }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalLocation',
        targetId: locationId,
      })
    },
    onSettled: invalidateLocations,
  })
}

export function useSelectCharacterImage() {
  const queryClient = useQueryClient()
  const latestRequestIdByTargetRef = useRef<Record<string, number>>({})
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      appearanceIndex: number
      imageIndex: number | null
      confirm?: boolean
    }) => requestSelectAssetHubCharacterImage(payload),
    onMutate: async (variables): Promise<SelectCharacterImageContext> => {
      const targetKey = `${variables.characterId}:${variables.appearanceIndex}`
      const requestId = (latestRequestIdByTargetRef.current[targetKey] ?? 0) + 1
      latestRequestIdByTargetRef.current[targetKey] = requestId

      await queryClient.cancelQueries({
        queryKey: queryKeys.globalAssets.characters(),
        exact: false,
      })
      const previousQueries = captureCharacterQuerySnapshots(queryClient)

      queryClient.setQueriesData<GlobalCharacter[] | undefined>(
        {
          queryKey: queryKeys.globalAssets.characters(),
          exact: false,
        },
        (previous) =>
          applyCharacterSelection(
            previous,
            variables.characterId,
            variables.appearanceIndex,
            variables.imageIndex,
          ),
      )

      return {
        previousQueries,
        targetKey,
        requestId,
      }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      const latestRequestId = latestRequestIdByTargetRef.current[context.targetKey]
      if (latestRequestId !== context.requestId) return
      restoreCharacterQuerySnapshots(queryClient, context.previousQueries)
    },
    onSettled: (_data, _error, variables) => {
      if (variables.confirm) {
        void invalidateCharacters()
      }
    },
  })
}

export function useSelectLocationImage() {
  const queryClient = useQueryClient()
  const latestRequestIdByTargetRef = useRef<Record<string, number>>({})
  const invalidateLocations = () => invalidateGlobalLocations(queryClient)

  return useMutation({
    mutationFn: (payload: {
      locationId: string
      imageIndex: number | null
      confirm?: boolean
    }) => requestSelectAssetHubLocationImage(payload),
    onMutate: async (variables): Promise<SelectLocationImageContext> => {
      const targetKey = variables.locationId
      const requestId = (latestRequestIdByTargetRef.current[targetKey] ?? 0) + 1
      latestRequestIdByTargetRef.current[targetKey] = requestId

      await queryClient.cancelQueries({
        queryKey: queryKeys.globalAssets.locations(),
        exact: false,
      })
      const previousQueries = captureLocationQuerySnapshots(queryClient)

      queryClient.setQueriesData<GlobalLocation[] | undefined>(
        {
          queryKey: queryKeys.globalAssets.locations(),
          exact: false,
        },
        (previous) => applyLocationSelection(previous, variables.locationId, variables.imageIndex),
      )

      return {
        previousQueries,
        targetKey,
        requestId,
      }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      const latestRequestId = latestRequestIdByTargetRef.current[context.targetKey]
      if (latestRequestId !== context.requestId) return
      restoreLocationQuerySnapshots(queryClient, context.previousQueries)
    },
    onSettled: (_data, _error, variables) => {
      if (variables.confirm) {
        void invalidateLocations()
      }
    },
  })
}

export function useUndoCharacterImage() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: (payload: { characterId: string; appearanceIndex: number }) =>
      requestUndoAssetHubCharacterImage(payload),
    onSuccess: invalidateCharacters,
  })
}

export function useUndoLocationImage() {
  const queryClient = useQueryClient()
  const invalidateLocations = () => invalidateGlobalLocations(queryClient)

  return useMutation({
    mutationFn: (locationId: string) => requestUndoAssetHubLocationImage(locationId),
    onSuccess: invalidateLocations,
  })
}

export function useUploadCharacterImage() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: (payload: {
      file: File
      characterId: string
      appearanceIndex: number
      labelText: string
      imageIndex?: number
    }) => requestUploadAssetHubCharacterImage(payload),
    onSuccess: invalidateCharacters,
  })
}

export function useUploadLocationImage() {
  const queryClient = useQueryClient()
  const invalidateLocations = () => invalidateGlobalLocations(queryClient)

  return useMutation({
    mutationFn: (payload: {
      file: File
      locationId: string
      labelText: string
      imageIndex?: number
    }) => requestUploadAssetHubLocationImage(payload),
    onSuccess: invalidateLocations,
  })
}

export function useDeleteCharacterAppearance() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: (payload: { characterId: string; appearanceIndex: number }) =>
      deleteAssetHubCharacterAppearance(payload),
    onSuccess: invalidateCharacters,
  })
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: (characterId: string) => deleteAssetHubCharacter(characterId),
    onMutate: async (characterId): Promise<DeleteCharacterContext> => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.globalAssets.characters(),
        exact: false,
      })
      const previousQueries = captureCharacterQuerySnapshots(queryClient)

      queryClient.setQueriesData<GlobalCharacter[] | undefined>(
        {
          queryKey: queryKeys.globalAssets.characters(),
          exact: false,
        },
        (previous) => previous?.filter((character) => character.id !== characterId),
      )

      return { previousQueries }
    },
    onError: (_error, _characterId, context) => {
      if (!context) return
      restoreCharacterQuerySnapshots(queryClient, context.previousQueries)
    },
    onSettled: invalidateCharacters,
  })
}

export function useDeleteVoice() {
  const queryClient = useQueryClient()
  const invalidateVoices = () => invalidateGlobalVoices(queryClient)

  return useMutation({
    mutationFn: (voiceId: string) => deleteAssetHubVoice(voiceId),
    onSuccess: invalidateVoices,
  })
}

export function useAiDesignLocation() {
  return useMutation({
    mutationFn: async (userInstruction: string) =>
      requestAiDesignAssetHubLocation({ userInstruction }),
  })
}

export function useAiModifyCharacterDescription() {
  return useMutation({
    mutationFn: (payload: {
      characterId: string
      appearanceIndex: number
      currentDescription: string
      modifyInstruction: string
    }) => requestAiModifyAssetHubCharacterDescription(payload),
  })
}

export function useAiModifyLocationDescription() {
  return useMutation({
    mutationFn: (payload: {
      locationId: string
      imageIndex: number
      currentDescription: string
      modifyInstruction: string
    }) => requestAiModifyAssetHubLocationDescription(payload),
  })
}

export function useCreateAssetHubLocation() {
  const queryClient = useQueryClient()
  const invalidateLocations = () => invalidateGlobalLocations(queryClient)

  return useMutation({
    mutationFn: (payload: {
      name: string
      summary: string
      folderId: string | null
      artStyle: string
      count?: number
    }) => requestCreateAssetHubLocation(payload),
    onSuccess: invalidateLocations,
  })
}

export function useDesignAssetHubVoice() {
  return useMutation({
    mutationFn: (payload: {
      voicePrompt: string
      previewText: string
      preferredName: string
      language: 'zh'
    }) => requestDesignAssetHubVoice(payload),
  })
}

export function useSaveDesignedAssetHubVoice() {
  const queryClient = useQueryClient()
  const invalidateVoices = () => invalidateGlobalVoices(queryClient)

  return useMutation({
    mutationFn: (payload: {
      voiceId: string
      voiceBase64: string
      voiceName: string
      folderId: string | null
      voicePrompt: string
    }) => requestSaveDesignedAssetHubVoice(payload),
    onSuccess: invalidateVoices,
  })
}

export function useUpdateCharacterAppearanceDescription() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: (payload: {
      characterId: string
      appearanceIndex: number
      description: string
    }) => requestUpdateAssetHubCharacterAppearanceDescription(payload),
    onSuccess: invalidateCharacters,
  })
}

export function useUpdateCharacterName() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({ characterId, name }: { characterId: string; name: string }) => {
      const result = await requestUpdateAssetHubCharacterName(characterId, name)
      try {
        await requestUpdateAssetHubAssetLabel({
          type: 'character',
          id: characterId,
          newName: name,
        })
      } catch (error) {
        console.error('更新图片标签失败:', error)
      }
      return result
    },
    onSuccess: invalidateCharacters,
  })
}

export function useUpdateLocationName() {
  const queryClient = useQueryClient()
  const invalidateLocations = () => invalidateGlobalLocations(queryClient)

  return useMutation({
    mutationFn: async ({ locationId, name }: { locationId: string; name: string }) => {
      const result = await requestUpdateAssetHubLocationName(locationId, name)
      try {
        await requestUpdateAssetHubAssetLabel({
          type: 'location',
          id: locationId,
          newName: name,
        })
      } catch (error) {
        console.error('更新图片标签失败:', error)
      }
      return result
    },
    onSuccess: invalidateLocations,
  })
}

export function useUpdateLocationSummary() {
  const queryClient = useQueryClient()
  const invalidateLocations = () => invalidateGlobalLocations(queryClient)

  return useMutation({
    mutationFn: (payload: { locationId: string; summary: string }) =>
      requestUpdateAssetHubLocationSummary(payload),
    onSuccess: invalidateLocations,
  })
}

export function useUploadCharacterVoice() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: (payload: { file: File; characterId: string }) =>
      requestUploadAssetHubCharacterVoice(payload),
    onSuccess: invalidateCharacters,
  })
}

export function useUploadAssetHubVoice() {
  const queryClient = useQueryClient()
  const invalidateVoices = () => invalidateGlobalVoices(queryClient)

  return useMutation({
    mutationFn: (payload: {
      uploadFile: File
      voiceName: string
      folderId: string | null
    }) => requestUploadAssetHubVoice(payload),
    onSuccess: invalidateVoices,
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()
  const invalidateLocations = () => invalidateGlobalLocations(queryClient)

  return useMutation({
    mutationFn: (locationId: string) => deleteAssetHubLocation(locationId),
    onMutate: async (locationId): Promise<DeleteLocationContext> => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.globalAssets.locations(),
        exact: false,
      })
      const previousQueries = captureLocationQuerySnapshots(queryClient)

      queryClient.setQueriesData<GlobalLocation[] | undefined>(
        {
          queryKey: queryKeys.globalAssets.locations(),
          exact: false,
        },
        (previous) => previous?.filter((location) => location.id !== locationId),
      )

      return { previousQueries }
    },
    onError: (_error, _locationId, context) => {
      if (!context) return
      restoreLocationQuerySnapshots(queryClient, context.previousQueries)
    },
    onSettled: invalidateLocations,
  })
}

export const useModifyCharacterImage = useRendererModifyCharacterImage
export const useModifyLocationImage = useRendererModifyLocationImage
