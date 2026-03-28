import {
  createTaskExecutionContext,
  type WorkerTaskJob,
} from '@engine/runtime-context'
import {
  assertTaskActive,
  getUserModels,
  resolveImageSourceFromGeneration,
  stripLabelBar,
  toSignedUrlIfCos,
  uploadImageSourceToCos,
  withLabelBar,
} from '../utils'
import {
  normalizeReferenceImagesForGeneration,
} from '@/lib/media/outbound-image'
import {
  AnyObj,
  parseImageUrls,
} from './image-task-handler-shared'
import { encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { PRIMARY_APPEARANCE_INDEX } from '@/lib/constants'
import { createScopedLogger } from '@/lib/logging/core'
import {
  buildCharacterDescriptionFields,
  generateModifiedAssetDescription,
  readIndexedDescription,
} from './modify-description-sync'

const logger = createScopedLogger({ module: 'worker.asset-hub-modify' })

function readModifyInstruction(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function handleAssetHubModifyTask(job: WorkerTaskJob) {
  const context = createTaskExecutionContext(job)
  const assetHubRepository = context.repositories.assetHub
  const payload = (job.data.payload || {}) as AnyObj
  const userId = job.data.userId
  const userModels = await getUserModels(userId)
  const editModel = userModels.editModel
  if (!editModel) throw new Error('User edit model not configured')

  const generationOptions = payload.generationOptions as Record<string, unknown> | undefined
  const resolution = typeof generationOptions?.resolution === 'string'
    ? generationOptions.resolution
    : undefined
  const modifyInstruction = readModifyInstruction(payload.modifyPrompt)

  if (payload.type === 'character') {
    const character = await assetHubRepository.getGlobalCharacterWithAppearances(String(payload.id), userId)
    if (!character) throw new Error('Global character not found')

    const appearanceIndex = Number(payload.appearanceIndex ?? PRIMARY_APPEARANCE_INDEX)
    const appearance = character.appearances.find((appearanceItem) => appearanceItem.appearanceIndex === appearanceIndex)
    if (!appearance) throw new Error('Global character appearance not found')

    const imageUrls = parseImageUrls(appearance.imageUrls, 'globalCharacterAppearance.imageUrls')
    const targetImageIndex = Number(payload.imageIndex ?? appearance.selectedIndex ?? 0)
    const currentKey = imageUrls[targetImageIndex] || appearance.imageUrl
    const currentUrl = toSignedUrlIfCos(currentKey, 3600)
    if (!currentUrl) throw new Error('No global character image to modify')

    const extraReferenceInputs: string[] = []
    if (Array.isArray(payload.extraImageUrls)) {
      for (const url of payload.extraImageUrls) {
        if (typeof url === 'string' && url.trim().length > 0) {
          extraReferenceInputs.push(url.trim())
        }
      }
    }
    const requiredReference = await stripLabelBar(currentUrl)
    const normalizedExtras = await normalizeReferenceImagesForGeneration(extraReferenceInputs)
    const referenceImages = Array.from(new Set([requiredReference, ...normalizedExtras]))
    const currentDescription = readIndexedDescription({
      descriptions: appearance.descriptions,
      fallbackDescription: appearance.description,
      index: targetImageIndex,
    })

    const prompt = `请根据以下指令修改图片，保持人物核心特征一致：\n${modifyInstruction}`
    const source = await resolveImageSourceFromGeneration(job, {
      userId,
      modelId: editModel,
      prompt,
      options: {
        referenceImages,
        aspectRatio: '3:2',
        ...(resolution ? { resolution } : {}),
      },
    })

    const label = `${character.name} - ${appearance.changeReason || '形象'}`
    const labeled = await withLabelBar(source, label)
    const cosKey = await uploadImageSourceToCos(labeled, 'global-character-modify', appearance.id)

    while (imageUrls.length <= targetImageIndex) imageUrls.push('')
    imageUrls[targetImageIndex] = cosKey

    const selectedIndex = appearance.selectedIndex
    const shouldUpdateMain = selectedIndex === targetImageIndex || selectedIndex === null || imageUrls.length === 1

    let descriptionFields: { description: string; descriptions: string } | null = null
    if (currentDescription && modifyInstruction && userModels.analysisModel) {
      try {
        const nextDescription = await generateModifiedAssetDescription({
          userId,
          model: userModels.analysisModel,
          locale: job.data.locale,
          type: 'character',
          currentDescription,
          modifyInstruction,
          referenceImages: normalizedExtras,
        })
        descriptionFields = buildCharacterDescriptionFields({
          descriptions: appearance.descriptions,
          fallbackDescription: appearance.description,
          index: targetImageIndex,
          nextDescription,
        })
      } catch (err) {
        logger.warn({ message: '资产库角色描述同步失败', details: { error: String(err) } })
      }
    }

    await assertTaskActive(job, 'persist_global_character_modify')
    await assetHubRepository.updateGlobalCharacterAppearance(appearance.id, {
      previousImageUrl: appearance.imageUrl || null,
      previousImageUrls: appearance.imageUrls,
      previousDescription: appearance.description || null,
      previousDescriptions: appearance.descriptions ?? null,
      imageUrls: encodeImageUrls(imageUrls),
      imageUrl: shouldUpdateMain ? cosKey : appearance.imageUrl,
      ...(descriptionFields || {}),
    })

    return { type: payload.type, appearanceId: appearance.id, imageUrl: cosKey }
  }

  if (payload.type === 'location') {
    const location = await assetHubRepository.getGlobalLocationWithImages(String(payload.id), userId)
    if (!location) throw new Error('Global location not found')

    const targetImageIndex = Number(payload.imageIndex ?? 0)
    const locationImage = location.images.find((imageItem) => imageItem.imageIndex === targetImageIndex)
    if (!locationImage?.imageUrl) throw new Error('Global location image not found')

    const currentUrl = toSignedUrlIfCos(locationImage.imageUrl, 3600)
    if (!currentUrl) throw new Error('No global location image to modify')

    const extraReferenceInputs: string[] = []
    if (Array.isArray(payload.extraImageUrls)) {
      for (const url of payload.extraImageUrls) {
        if (typeof url === 'string' && url.trim().length > 0) {
          extraReferenceInputs.push(url.trim())
        }
      }
    }
    const requiredReference = await stripLabelBar(currentUrl)
    const normalizedExtras = await normalizeReferenceImagesForGeneration(extraReferenceInputs)
    const referenceImages = Array.from(new Set([requiredReference, ...normalizedExtras]))

    const prompt = `请根据以下指令修改场景图片，保持整体风格一致：\n${modifyInstruction}`
    const source = await resolveImageSourceFromGeneration(job, {
      userId,
      modelId: editModel,
      prompt,
      options: {
        referenceImages,
        aspectRatio: '1:1',
        ...(resolution ? { resolution } : {}),
      },
    })

    const labeled = await withLabelBar(source, location.name)
    const cosKey = await uploadImageSourceToCos(labeled, 'global-location-modify', locationImage.id)

    let extractedDescription: string | undefined
    if (locationImage.description && modifyInstruction && userModels.analysisModel) {
      try {
        extractedDescription = await generateModifiedAssetDescription({
          userId,
          model: userModels.analysisModel,
          locale: job.data.locale,
          type: 'location',
          currentDescription: locationImage.description,
          modifyInstruction,
          referenceImages: normalizedExtras,
          locationName: location.name,
        })
      } catch (err) {
        logger.warn({ message: '资产库场景描述同步失败', details: { error: String(err) } })
      }
    }

    await assertTaskActive(job, 'persist_global_location_modify')
    await assetHubRepository.updateGlobalLocationImage(locationImage.id, {
      previousImageUrl: locationImage.imageUrl,
      previousDescription: locationImage.description || null,
      imageUrl: cosKey,
      ...(extractedDescription ? { description: extractedDescription } : {}),
    })

    return { type: payload.type, locationImageId: locationImage.id, imageUrl: cosKey }
  }

  throw new Error(`Unsupported asset-hub modify type: ${String(payload.type)}`)
}



