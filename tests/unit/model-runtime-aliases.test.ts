import { describe, expect, it } from 'vitest'
import {
  normalizeRuntimeCapabilitySelections,
  normalizeRuntimeImageOptions,
  normalizeRuntimeVideoOptions,
} from '@core/model-runtime-aliases'

describe('model runtime normalization', () => {
  it('upgrades google nano banana retired 0.5K resolution to 1K', () => {
    expect(normalizeRuntimeCapabilitySelections({
      modelType: 'image',
      provider: 'google',
      modelId: 'gemini-3.1-flash-image-preview',
      selections: { resolution: '0.5K' },
    })).toEqual({ resolution: '1K' })

    expect(normalizeRuntimeImageOptions('gemini-compatible:gm-1', 'gemini-3.1-flash-image-preview', {
      resolution: '0.5K',
      aspectRatio: '1:1',
    })).toEqual({
      resolution: '1K',
      aspectRatio: '1:1',
    })
  })

  it('forces veo 3.1 interpolation and high-resolution runs to eight seconds', () => {
    expect(normalizeRuntimeCapabilitySelections({
      modelType: 'video',
      provider: 'google',
      modelId: 'veo-3.1-generate-preview',
      selections: {
        resolution: '1080p',
        duration: 6,
      },
    })).toEqual({
      resolution: '1080p',
      duration: 8,
    })

    expect(normalizeRuntimeVideoOptions('google', 'veo-3.1-fast-generate-preview', {
      resolution: '720p',
      duration: 6,
      generationMode: 'firstlastframe',
      lastFrameImageUrl: '/api/files/last-frame.png',
    })).toEqual({
      resolution: '720p',
      duration: 8,
      generationMode: 'firstlastframe',
      lastFrameImageUrl: '/api/files/last-frame.png',
    })
  })
})
