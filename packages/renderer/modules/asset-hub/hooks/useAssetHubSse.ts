'use client'

import { useRendererSse } from '@renderer/hooks/useRendererSse'

const GLOBAL_ASSET_PROJECT_ID = 'global-asset-hub'

export function useAssetHubSse(enabled = true) {
  useRendererSse({
    projectId: GLOBAL_ASSET_PROJECT_ID,
    enabled,
  })
}
