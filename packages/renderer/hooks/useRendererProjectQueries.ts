'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import { resolveTaskErrorMessage } from '@/lib/task/error-message'
import type { Project, MediaRef, Character, Location } from '@/types/project'
import type { ModelCapabilities } from '@core/model-config-contract'
import type { VideoPricingTier } from '@core/model-pricing/video-tier'
import {
  getNovelPromotionEpisode,
  getProjectAssets as fetchProjectAssets,
  getProjectCharacters as fetchProjectCharacters,
  getProjectData as fetchProjectData,
  getProjectLocations as fetchProjectLocations,
  getUserModels as fetchUserModels,
} from '@renderer/clients/project-client'
import {
  useRendererTaskTargetStateMap,
} from '@renderer/hooks/useRendererTaskTargetStateMap'
import { logInfo as _ulogInfo } from '@/lib/logging/core'

export type { Character, Location }

interface ProjectDataResponse {
  project: Project
}

interface VoiceLine {
  id: string
  text: string
  speakerId: string
  audioUrl?: string | null
  media?: MediaRef | null
  lineTaskRunning?: boolean
}

interface StoryboardData {
  panels: unknown[]
}

export interface Episode {
  id: string
  episodeNumber: number
  name: string
  description?: string | null
  novelText?: string | null
  audioUrl?: string | null
  media?: MediaRef | null
  srtContent?: string | null
  createdAt: string
  voiceLines?: VoiceLine[]
  storyboardData?: StoryboardData
}

export interface ProjectAssetsData {
  characters: Character[]
  locations: Location[]
}

export interface UserModelOption {
  value: string
  label: string
  provider?: string
  providerName?: string
  capabilities?: ModelCapabilities
  videoPricingTiers?: VideoPricingTier[]
}

export interface UserModelsPayload {
  llm: UserModelOption[]
  image: UserModelOption[]
  video: UserModelOption[]
  audio: UserModelOption[]
  lipsync: UserModelOption[]
}

const CHARACTER_TASK_TYPES = ['image_character', 'modify_asset_image', 'regenerate_group']
const CHARACTER_PROFILE_TASK_TYPES = ['character_profile_confirm', 'character_profile_batch_confirm']
const LOCATION_TASK_TYPES = ['image_location', 'modify_asset_image', 'regenerate_group']

function isRunningPhase(phase: string | null | undefined) {
  return phase === 'queued' || phase === 'processing'
}

async function parseErrorResponse(response: Response, fallback: string) {
  const error = await response.json().catch(() => null)
  throw new Error(resolveTaskErrorMessage(error && typeof error === 'object' ? error as Record<string, unknown> : {}, fallback))
}

export function useProjectData(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.projectData(projectId || ''),
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required')
      const response = await fetchProjectData(projectId)
      if (!response.ok) {
        await parseErrorResponse(response, 'Failed to load project')
      }
      const data: ProjectDataResponse = await response.json()
      return data.project
    },
    enabled: !!projectId,
    staleTime: 5000,
  })
}

export function useEpisodeData(projectId: string | null, episodeId: string | null) {
  return useQuery({
    queryKey: queryKeys.episodeData(projectId || '', episodeId || ''),
    queryFn: async () => {
      if (!projectId || !episodeId) throw new Error('Project ID and Episode ID are required')
      const response = await getNovelPromotionEpisode(projectId, episodeId)
      if (!response.ok) {
        await parseErrorResponse(response, 'Failed to load episode')
      }
      const data = await response.json()
      return data.episode as Episode
    },
    enabled: !!projectId && !!episodeId,
    staleTime: 5000,
  })
}

export function useProjectAssets(projectId: string | null) {
  const assetsQuery = useQuery({
    queryKey: queryKeys.projectAssets.all(projectId || ''),
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required')
      const response = await fetchProjectAssets(projectId)
      if (!response.ok) {
        throw new Error('Failed to fetch project assets')
      }
      return await response.json() as ProjectAssetsData
    },
    enabled: !!projectId,
    staleTime: 5000,
  })

  const taskTargets = useMemo(() => {
    const assets = assetsQuery.data
    if (!assets) return []

    const targets: Array<{ targetType: string; targetId: string; types: string[] }> = []

    for (const character of assets.characters || []) {
      targets.push({
        targetType: 'CharacterAppearance',
        targetId: character.id,
        types: CHARACTER_TASK_TYPES,
      })
      targets.push({
        targetType: 'NovelPromotionCharacter',
        targetId: character.id,
        types: CHARACTER_PROFILE_TASK_TYPES,
      })
      for (const appearance of character.appearances || []) {
        targets.push({
          targetType: 'CharacterAppearance',
          targetId: appearance.id,
          types: CHARACTER_TASK_TYPES,
        })
      }
    }

    for (const location of assets.locations || []) {
      targets.push({
        targetType: 'LocationImage',
        targetId: location.id,
        types: LOCATION_TASK_TYPES,
      })
      for (const image of location.images || []) {
        targets.push({
          targetType: 'LocationImage',
          targetId: image.id,
          types: LOCATION_TASK_TYPES,
        })
      }
    }

    return targets
  }, [assetsQuery.data])

  const taskStatesQuery = useRendererTaskTargetStateMap(projectId, taskTargets, {
    enabled: !!projectId && taskTargets.length > 0,
  })

  const data = useMemo(() => {
    const assets = assetsQuery.data
    if (!assets) return assets

    const byKey = taskStatesQuery.byKey
    const getState = (targetType: string, targetId: string) =>
      byKey.get(`${targetType}:${targetId}`) || null

    return {
      ...assets,
      characters: (assets.characters || []).map((character) => {
        const characterState = getState('CharacterAppearance', character.id)
        const profileState = getState('NovelPromotionCharacter', character.id)
        return {
          ...character,
          profileConfirmTaskRunning: isRunningPhase(profileState?.phase),
          appearances: (character.appearances || []).map((appearance) => {
            const appearanceState = getState('CharacterAppearance', appearance.id)
            const lastError = appearanceState?.lastError || characterState?.lastError || null
            return {
              ...appearance,
              imageTaskRunning:
                isRunningPhase(appearanceState?.phase) ||
                isRunningPhase(characterState?.phase),
              lastError,
            }
          }),
        }
      }),
      locations: (assets.locations || []).map((location) => {
        const locationState = getState('LocationImage', location.id)
        return {
          ...location,
          images: (location.images || []).map((image) => {
            const imageState = getState('LocationImage', image.id)
            const lastError = imageState?.lastError || locationState?.lastError || null
            return {
              ...image,
              imageTaskRunning:
                isRunningPhase(imageState?.phase) ||
                isRunningPhase(locationState?.phase),
              lastError,
            }
          }),
        }
      }),
    } as ProjectAssetsData
  }, [assetsQuery.data, taskStatesQuery.byKey])

  return {
    ...assetsQuery,
    data,
    isFetching: assetsQuery.isFetching || taskStatesQuery.isFetching,
  }
}

export function useProjectCharacters(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.projectAssets.characters(projectId || ''),
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required')
      const response = await fetchProjectCharacters(projectId)
      if (!response.ok) {
        throw new Error('Failed to fetch characters')
      }
      const data = await response.json()
      return data.characters as Character[]
    },
    enabled: !!projectId,
  })
}

export function useProjectLocations(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.projectAssets.locations(projectId || ''),
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required')
      const response = await fetchProjectLocations(projectId)
      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }
      const data = await response.json()
      return data.locations as Location[]
    },
    enabled: !!projectId,
  })
}

export function useRefreshProjectAssets(projectId: string | null) {
  const queryClient = useQueryClient()

  return () => {
    if (projectId) {
      _ulogInfo('[刷新资产] 同时刷新 projectAssets / projectData / tasks 缓存')
      queryClient.invalidateQueries({ queryKey: queryKeys.projectAssets.all(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId), exact: false })
    }
  }
}

export function useUserModels() {
  return useQuery({
    queryKey: queryKeys.userModels.all(),
    queryFn: async () => {
      const response = await fetchUserModels()
      if (!response.ok) {
        throw new Error('Failed to fetch user models')
      }
      const data = await response.json()
      return {
        llm: Array.isArray(data?.llm) ? data.llm : [],
        image: Array.isArray(data?.image) ? data.image : [],
        video: Array.isArray(data?.video) ? data.video : [],
        audio: Array.isArray(data?.audio) ? data.audio : [],
        lipsync: Array.isArray(data?.lipsync) ? data.lipsync : [],
      } as UserModelsPayload
    },
  })
}
