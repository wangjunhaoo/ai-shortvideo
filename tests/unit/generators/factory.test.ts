import { describe, expect, it } from 'vitest'
import { createAudioGenerator, createImageGenerator, createVideoGenerator } from '@/lib/generators/factory'
import { GoogleVeoVideoGenerator } from '@/lib/generators/video/google'
import { OpenAICompatibleVideoGenerator } from '@/lib/generators/video/openai-compatible'
import { BailianAudioGenerator, BailianImageGenerator, BailianVideoGenerator, SiliconFlowAudioGenerator } from '@/lib/generators/official'
import { extractModelKey, resolveModelCapabilityGenerationOptions } from '@engine/config-service'

describe('generator factory', () => {
  it('routes gemini-compatible video provider to Google video generator', () => {
    const generator = createVideoGenerator('gemini-compatible:gm-1')
    expect(generator).toBeInstanceOf(GoogleVeoVideoGenerator)
  })

  it('routes bailian official providers to official generators', () => {
    expect(createImageGenerator('bailian')).toBeInstanceOf(BailianImageGenerator)
    expect(createVideoGenerator('bailian')).toBeInstanceOf(BailianVideoGenerator)
    expect(createAudioGenerator('bailian')).toBeInstanceOf(BailianAudioGenerator)
  })

  it('routes siliconflow audio provider to official generator', () => {
    expect(createAudioGenerator('siliconflow')).toBeInstanceOf(SiliconFlowAudioGenerator)
  })

  it('keeps google image model key and upgrades retired runtime resolution values', () => {
    expect(extractModelKey('google::gemini-3.1-flash-image-preview')).toBe('google::gemini-3.1-flash-image-preview')
    expect(resolveModelCapabilityGenerationOptions({
      modelType: 'image',
      modelKey: 'google::gemini-3.1-flash-image-preview',
      runtimeSelections: {
        resolution: '0.5K',
      },
    })).toEqual({ resolution: '1K' })

    const generator = createImageGenerator('google', 'google::gemini-3.1-flash-image-preview') as {
      modelId?: string
    }
    expect(generator.modelId).toBe('gemini-3.1-flash-image-preview')
  })

  it('forces unsupported veo 3.1 duration combinations onto eight seconds at runtime', () => {
    const normalized = resolveModelCapabilityGenerationOptions({
      modelType: 'video',
      modelKey: 'google::veo-3.1-generate-preview',
      runtimeSelections: {
        generationMode: 'normal',
        resolution: '1080p',
        duration: 6,
      },
    })

    expect(normalized).toMatchObject({
      resolution: '1080p',
      duration: 8,
    })
  })

  it('autofills veo 3.0 fast video defaults and normalizes unsupported pricing combinations', () => {
    expect(resolveModelCapabilityGenerationOptions({
      modelType: 'video',
      modelKey: 'google::veo-3.0-fast-generate-001',
      runtimeSelections: {
        generationMode: 'normal',
      },
    })).toMatchObject({
      resolution: '720p',
      duration: 4,
    })

    expect(resolveModelCapabilityGenerationOptions({
      modelType: 'video',
      modelKey: 'google::veo-3.0-fast-generate-001',
      runtimeSelections: {
        generationMode: 'normal',
        resolution: '1080p',
      },
    })).toMatchObject({
      resolution: '1080p',
      duration: 8,
    })
  })
})
