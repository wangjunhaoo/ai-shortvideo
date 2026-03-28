'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clearTaskTargetOverlay, upsertTaskTargetOverlay } from '@/lib/query/task-target-overlay'
import { resolveTaskErrorMessage } from '@/lib/task/error-message'
import { queryKeys } from '@/lib/query/keys'
import { requestAssetHubModifyImage } from '@renderer/clients/asset-hub-client'

const GLOBAL_ASSET_PROJECT_ID = 'global-asset-hub'

function invalidateGlobalCharacters(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
}

function invalidateGlobalLocations(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.locations() })
}

async function readModifyImageResponse(response: Response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(resolveTaskErrorMessage(data, 'Failed to modify image'))
  }
  return data
}

export function useRendererModifyCharacterImage() {
  const queryClient = useQueryClient()
  const invalidateCharacters = () => invalidateGlobalCharacters(queryClient)

  return useMutation({
    mutationFn: async ({
      characterId,
      appearanceIndex,
      imageIndex,
      modifyPrompt,
      extraImageUrls,
    }: {
      characterId: string
      appearanceIndex: number
      imageIndex: number
      modifyPrompt: string
      extraImageUrls?: string[]
    }) => {
      const response = await requestAssetHubModifyImage({
        type: 'character',
        id: characterId,
        appearanceIndex,
        imageIndex,
        modifyPrompt,
        extraImageUrls,
      })
      return readModifyImageResponse(response)
    },
    onMutate: ({ characterId, appearanceIndex, imageIndex }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalCharacterAppearance',
        targetId: `${characterId}:${appearanceIndex}:${imageIndex}`,
        intent: 'modify',
      })
    },
    onError: (_error, { characterId, appearanceIndex, imageIndex }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalCharacterAppearance',
        targetId: `${characterId}:${appearanceIndex}:${imageIndex}`,
      })
    },
    onSettled: invalidateCharacters,
  })
}

export function useRendererModifyLocationImage() {
  const queryClient = useQueryClient()
  const invalidateLocations = () => invalidateGlobalLocations(queryClient)

  return useMutation({
    mutationFn: async ({
      locationId,
      imageIndex,
      modifyPrompt,
      extraImageUrls,
    }: {
      locationId: string
      imageIndex: number
      modifyPrompt: string
      extraImageUrls?: string[]
    }) => {
      const response = await requestAssetHubModifyImage({
        type: 'location',
        id: locationId,
        imageIndex,
        modifyPrompt,
        extraImageUrls,
      })
      return readModifyImageResponse(response)
    },
    onMutate: ({ locationId, imageIndex }) => {
      upsertTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalLocationImage',
        targetId: `${locationId}:${imageIndex}`,
        intent: 'modify',
      })
    },
    onError: (_error, { locationId, imageIndex }) => {
      clearTaskTargetOverlay(queryClient, {
        projectId: GLOBAL_ASSET_PROJECT_ID,
        targetType: 'GlobalLocationImage',
        targetId: `${locationId}:${imageIndex}`,
      })
    },
    onSettled: invalidateLocations,
  })
}
