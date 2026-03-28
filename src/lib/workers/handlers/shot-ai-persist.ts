import { composeModelKey, parseModelKeyStrict } from '@core/model-config-contract'
import type { ProjectRepository } from '@engine/repositories/project-repository'
import type { UserPreferenceRepository } from '@engine/repositories/user-preference-repository'

function normalizeModelKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = parseModelKeyStrict(trimmed)
  if (!parsed) return null
  return composeModelKey(parsed.provider, parsed.modelId)
}

export async function resolveAnalysisModel(input: {
  projectId: string
  userId: string
  projectRepository: Pick<ProjectRepository, 'getProjectAnalysisContext'>
  userPreferenceRepository: Pick<UserPreferenceRepository, 'getAnalysisModel'>
}): Promise<{
  id: string
  analysisModel: string
}> {
  const [projectContext, userPreferenceAnalysisModel] = await Promise.all([
    input.projectRepository.getProjectAnalysisContext(input.projectId),
    input.userPreferenceRepository.getAnalysisModel(input.userId),
  ])
  if (!projectContext) throw new Error('Novel promotion project not found')

  // 优先读项目配置，fallback 到用户全局设置
  const analysisModel =
    normalizeModelKey(projectContext.analysisModel) ??
    userPreferenceAnalysisModel
  if (!analysisModel) throw new Error('请先在项目设置中配置分析模型')

  return { id: projectContext.novelPromotionProjectId, analysisModel }
}

export async function requireProjectLocation(input: {
  locationId: string
  projectInternalId: string
  projectRepository: Pick<ProjectRepository, 'getProjectLocation'>
}) {
  const location = await input.projectRepository.getProjectLocation(
    input.locationId,
    input.projectInternalId,
  )
  if (!location) throw new Error('Location not found')
  return location
}

export async function persistLocationDescription(params: {
  locationId: string
  imageIndex: number
  modifiedDescription: string
  projectRepository: Pick<ProjectRepository, 'updateLocationImageDescription'>
}) {
  return await params.projectRepository.updateLocationImageDescription({
    locationId: params.locationId,
    imageIndex: params.imageIndex,
    modifiedDescription: params.modifiedDescription,
  })
}


