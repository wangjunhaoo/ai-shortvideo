import {
  createTaskExecutionContext,
  type WorkerTaskJob,
} from '@engine/runtime-context'
import { addLocationPromptSuffix, getArtStylePrompt, isArtStyleValue, type ArtStyleValue } from '@/lib/constants'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { reportTaskProgress } from '../shared'
import {
  assertTaskActive,
  getProjectModels,
} from '../utils'
import {
  AnyObj,
  generateLabeledImageToCos,
  pickFirstString,
} from './image-task-handler-shared'

function resolvePayloadArtStyle(payload: AnyObj): ArtStyleValue | undefined {
  if (!Object.prototype.hasOwnProperty.call(payload, 'artStyle')) return undefined
  const parsedArtStyle = typeof payload.artStyle === 'string' ? payload.artStyle.trim() : ''
  if (!isArtStyleValue(parsedArtStyle)) {
    throw new Error('Invalid artStyle in IMAGE_LOCATION payload')
  }
  return parsedArtStyle
}

function resolveRequestedLocationCount(payload: AnyObj): number | null {
  if (!Object.prototype.hasOwnProperty.call(payload, 'count')) return null
  return normalizeImageGenerationCount('location', payload.count)
}

export async function handleLocationImageTask(job: WorkerTaskJob) {
  const context = createTaskExecutionContext(job)
  const projectRepository = context.repositories.project
  const payload = (job.data.payload || {}) as AnyObj
  const projectId = job.data.projectId
  const userId = job.data.userId
  const models = await getProjectModels(projectId, userId)
  const modelId = models.locationModel
  if (!modelId) throw new Error('Location model not configured')
  const requestedCount = resolveRequestedLocationCount(payload)

  const payloadArtStyle = resolvePayloadArtStyle(payload)
  const artStyle = getArtStylePrompt(payloadArtStyle ?? models.artStyle, job.data.locale)

  // targetId may be locationId (group) or locationImageId (single)
  const maybeLocationImage = await projectRepository.getLocationImageById(job.data.targetId)

  let locationImages: Array<NonNullable<Awaited<ReturnType<typeof projectRepository.getLocationImageById>>>> = []
  // 用于存储 locationId -> name 的映射，避免 images 子集缺少 location 关联
  const locationNameMap: Record<string, string> = {}

  if (maybeLocationImage) {
    // 来源 location 名字已 include，先记录
    if (maybeLocationImage.location?.name) {
      locationNameMap[maybeLocationImage.locationId] = maybeLocationImage.location.name
    }
    if (payload.imageIndex !== undefined) {
      locationImages = [maybeLocationImage]
    } else {
      const location = await projectRepository.getLocationWithImages(maybeLocationImage.locationId)
      if (location?.name) {
        locationNameMap[maybeLocationImage.locationId] = location.name
      }
      const orderedImages = (location?.images || [maybeLocationImage]).map((image) => ({
        ...image,
        location: { name: location?.name || locationNameMap[image.locationId] || '场景' },
      }))
      locationImages = requestedCount === null ? orderedImages : orderedImages.slice(0, requestedCount)
    }
  } else {
    const locationId = pickFirstString(payload.id, payload.locationId, job.data.targetId)
    if (!locationId) throw new Error('Location id missing')

    const location = await projectRepository.getLocationWithImages(locationId)

    if (!location || !location.images?.length) {
      throw new Error('Location images not found')
    }

    // 记录 location 名字
    locationNameMap[locationId] = location.name

    if (payload.imageIndex !== undefined) {
      const image = location.images.find((it) => it.imageIndex === Number(payload.imageIndex))
      if (!image) throw new Error(`Location image not found for imageIndex=${payload.imageIndex}`)
      locationImages = [{ ...image, location: { name: location.name } }]
    } else {
      const images = requestedCount === null ? location.images : location.images.slice(0, requestedCount)
      locationImages = images.map((image) => ({ ...image, location: { name: location.name } }))
    }
  }

  const locationIds = Array.from(new Set(locationImages.map((it) => it.locationId)))

  for (let i = 0; i < locationImages.length; i++) {
    const item = locationImages[i]
    // 优先用映射表中的名字，回退到 item.location?.name，最后才用默认值
    const name = locationNameMap[item.locationId] || item.location?.name || '场景'
    const promptBody = item.description || ''
    if (!promptBody) continue

    const prompt = artStyle ? `${addLocationPromptSuffix(promptBody)}，${artStyle}` : addLocationPromptSuffix(promptBody)
    await reportTaskProgress(job, 20 + Math.floor((i / Math.max(locationImages.length, 1)) * 55), {
      stage: 'generate_location_image',
      imageId: item.id,
    })

    const cosKey = await generateLabeledImageToCos({
      job,
      userId,
      modelId,
      prompt,
      label: name,
      targetId: item.id,
      keyPrefix: 'location',
      options: {
        aspectRatio: '1:1',
      },
    })

    await assertTaskActive(job, 'persist_location_image')
    await projectRepository.updateLocationImage({
      imageId: item.id,
      imageUrl: cosKey,
    })
  }

  return {
    updated: locationImages.length,
    locationIds,
  }
}



