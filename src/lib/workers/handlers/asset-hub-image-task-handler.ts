import {
  createTaskExecutionContext,
  type WorkerTaskJob,
} from '@engine/runtime-context'
import { addCharacterPromptSuffix, addLocationPromptSuffix, getArtStylePrompt } from '@/lib/constants'
import { encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { PRIMARY_APPEARANCE_INDEX } from '@/lib/constants'
import {
  assertTaskActive,
  getUserModels,
} from '../utils'
import {
  AnyObj,
  generateLabeledImageToCos,
  parseJsonStringArray,
} from './image-task-handler-shared'

export async function handleAssetHubImageTask(job: WorkerTaskJob) {
  const context = createTaskExecutionContext(job)
  const assetHubRepository = context.repositories.assetHub
  const payload = (job.data.payload || {}) as AnyObj
  const userId = job.data.userId
  const userModels = await getUserModels(userId)
  const artStyle = getArtStylePrompt(
    typeof payload.artStyle === 'string' ? payload.artStyle : undefined,
    job.data.locale,
  )

  if (payload.type === 'character') {
    const characterId = typeof payload.id === 'string' ? payload.id : null
    if (!characterId) throw new Error('Global character id missing')

    const character = await assetHubRepository.getGlobalCharacterWithAppearances(characterId, userId)

    if (!character) throw new Error('Global character not found')

    const appearanceIndex = Number(payload.appearanceIndex ?? PRIMARY_APPEARANCE_INDEX)
    const appearance = character.appearances.find((appearanceItem) => appearanceItem.appearanceIndex === appearanceIndex)
    if (!appearance) throw new Error('Global character appearance not found')

    const modelId = userModels.characterModel
    if (!modelId) throw new Error('User character model not configured')

    const descriptions = parseJsonStringArray(appearance.descriptions)
    const base = descriptions.length ? descriptions : [appearance.description || '']
    const count = normalizeImageGenerationCount('character', payload.count)
    const imageUrls: string[] = []

    for (let i = 0; i < count; i++) {
      const raw = base[i] || base[0]
      const prompt = artStyle ? `${addCharacterPromptSuffix(raw)}，${artStyle}` : addCharacterPromptSuffix(raw)
      const cosKey = await generateLabeledImageToCos({
        job,
        userId,
        modelId,
        prompt,
        label: `${character.name} - ${appearance.changeReason || '形象'}`,
        targetId: `${appearance.id}-${i}`,
        keyPrefix: 'global-character',
        options: {
          aspectRatio: '3:2',
        },
      })
      imageUrls.push(cosKey)
    }

    await assertTaskActive(job, 'persist_global_character_image')
    await assetHubRepository.updateGlobalCharacterAppearance(appearance.id, {
      imageUrls: encodeImageUrls(imageUrls),
      imageUrl: imageUrls[0] || null,
      selectedIndex: null,
    })

    return { type: payload.type, appearanceId: appearance.id, imageCount: imageUrls.length }
  }

  if (payload.type === 'location') {
    const locationId = typeof payload.id === 'string' ? payload.id : null
    if (!locationId) throw new Error('Global location id missing')

    const location = await assetHubRepository.getGlobalLocationWithImages(locationId, userId)

    if (!location || !location.images?.length) throw new Error('Global location not found')

    const modelId = userModels.locationModel
    if (!modelId) throw new Error('User location model not configured')

    const count = normalizeImageGenerationCount('location', payload.count)
    const targetImages = Object.prototype.hasOwnProperty.call(payload, 'count')
      ? location.images.slice(0, count)
      : location.images

    for (const image of targetImages) {
      if (!image.description) continue
      const prompt = artStyle ? `${addLocationPromptSuffix(image.description)}，${artStyle}` : addLocationPromptSuffix(image.description)

      const cosKey = await generateLabeledImageToCos({
        job,
        userId,
        modelId,
        prompt,
        label: location.name,
        targetId: image.id,
        keyPrefix: 'global-location',
        options: {
          aspectRatio: '1:1',
        },
      })

      await assertTaskActive(job, 'persist_global_location_image')
      await assetHubRepository.updateGlobalLocationImage(image.id, { imageUrl: cosKey })
    }

    return { type: payload.type, locationId: location.id, imageCount: targetImages.length }
  }

  throw new Error(`Unsupported asset-hub image type: ${String(payload.type)}`)
}



