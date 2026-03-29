import {
  type CapabilitySelections,
  type CapabilityValue,
  composeModelKey,
  parseModelKeyStrict,
} from '@core/model-config-contract'

function getProviderKey(provider: string | null | undefined): string {
  if (!provider) return ''
  const colonIndex = provider.indexOf(':')
  return colonIndex === -1 ? provider : provider.slice(0, colonIndex)
}

function isGoogleLikeProvider(provider: string | null | undefined): boolean {
  const providerKey = getProviderKey(provider).toLowerCase()
  return providerKey === 'google' || providerKey === 'gemini-compatible'
}

function isGoogleGeminiFlashImagePreview(modelId: string | null | undefined): boolean {
  return modelId === 'gemini-3.1-flash-image-preview'
}

function isGoogleVeo31Model(modelId: string | null | undefined): boolean {
  return (
    modelId === 'veo-3.1-generate-preview'
    || modelId === 'veo-3.1-fast-generate-preview'
  )
}

export function normalizeRuntimeImageModelId(_provider: string, modelId: string | null | undefined) {
  return modelId ?? null
}

export function normalizeRuntimeModelKey(modelKey: string | null | undefined) {
  if (!modelKey) return modelKey ?? null
  const parsed = parseModelKeyStrict(modelKey)
  if (!parsed) return modelKey
  return composeModelKey(parsed.provider, parsed.modelId)
}

export function normalizeRuntimeImageResolution(
  provider: string,
  modelId: string | null | undefined,
  resolution: string | null | undefined,
) {
  if (!resolution) return resolution ?? null
  if (!isGoogleLikeProvider(provider) || !isGoogleGeminiFlashImagePreview(modelId)) {
    return resolution
  }
  return resolution === '0.5K' ? '1K' : resolution
}

export function normalizeRuntimeImageOptions<T extends { resolution?: string | null }>(
  provider: string,
  modelId: string | null | undefined,
  options: T,
): T {
  const normalizedResolution = normalizeRuntimeImageResolution(provider, modelId, options.resolution)
  if (normalizedResolution === options.resolution) return options
  return {
    ...options,
    resolution: normalizedResolution ?? undefined,
  }
}

function shouldForceGoogleVeo31DurationToEightSeconds(input: {
  provider: string
  modelId: string | null | undefined
  resolution?: string | null
  generationMode?: string | null
  lastFrameImageUrl?: string | null
}) {
  if (!isGoogleLikeProvider(input.provider) || !isGoogleVeo31Model(input.modelId)) {
    return false
  }

  const normalizedResolution = input.resolution?.trim().toLowerCase()
  if (input.generationMode === 'firstlastframe') return true
  if (input.lastFrameImageUrl) return true
  return normalizedResolution === '1080p' || normalizedResolution === '4k'
}

export function normalizeRuntimeVideoOptions<T extends {
  resolution?: string | null
  duration?: number | null
  generationMode?: string | null
  lastFrameImageUrl?: string | null
}>(
  provider: string,
  modelId: string | null | undefined,
  options: T,
): T {
  if (!shouldForceGoogleVeo31DurationToEightSeconds({
    provider,
    modelId,
    resolution: options.resolution,
    generationMode: options.generationMode,
    lastFrameImageUrl: options.lastFrameImageUrl,
  })) {
    return options
  }

  if (options.duration === 8) return options
  return {
    ...options,
    duration: 8,
  }
}

export function normalizeRuntimeCapabilitySelections(input: {
  modelType: 'llm' | 'image' | 'video'
  provider: string
  modelId: string
  selections?: Record<string, CapabilityValue>
}): Record<string, CapabilityValue> {
  const source = input.selections || {}

  if (input.modelType === 'image') {
    const normalizedResolution = normalizeRuntimeImageResolution(
      input.provider,
      input.modelId,
      typeof source.resolution === 'string' ? source.resolution : null,
    )
    if (normalizedResolution === source.resolution) return source
    return {
      ...source,
      ...(normalizedResolution ? { resolution: normalizedResolution } : {}),
    }
  }

  if (input.modelType === 'video') {
    const normalized = normalizeRuntimeVideoOptions(input.provider, input.modelId, {
      resolution: typeof source.resolution === 'string' ? source.resolution : null,
      duration: typeof source.duration === 'number' ? source.duration : null,
      generationMode: typeof source.generationMode === 'string' ? source.generationMode : null,
      lastFrameImageUrl: null,
    })
    if (normalized.duration === source.duration) return source
    return {
      ...source,
      ...(typeof normalized.duration === 'number' ? { duration: normalized.duration } : {}),
    }
  }

  return source
}

export function normalizeCapabilitySelectionsForModelKey(input: {
  selections?: CapabilitySelections
  modelType: 'llm' | 'image' | 'video'
  modelKey: string
}): CapabilitySelections | undefined {
  if (!input.selections) return input.selections
  const parsed = parseModelKeyStrict(input.modelKey)
  if (!parsed) return input.selections
  const entry = input.selections[input.modelKey]
  if (!entry) return input.selections

  const normalizedEntry = normalizeRuntimeCapabilitySelections({
    modelType: input.modelType,
    provider: parsed.provider,
    modelId: parsed.modelId,
    selections: entry,
  })
  if (normalizedEntry === entry) return input.selections

  return {
    ...input.selections,
    [input.modelKey]: normalizedEntry,
  }
}
