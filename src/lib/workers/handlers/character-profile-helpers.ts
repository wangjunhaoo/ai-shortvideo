import { safeParseJsonObject } from '@/lib/json-repair'
import type { ProjectRepository } from '@engine/repositories/project-repository'

export type AnyObj = Record<string, unknown>

export function readText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function readRequiredString(value: unknown, field: string): string {
  const text = readText(value).trim()
  if (!text) {
    throw new Error(`${field} is required`)
  }
  return text
}

export function parseVisualResponse(responseText: string): AnyObj {
  return safeParseJsonObject(responseText) as AnyObj
}

export async function resolveProjectModel(
  projectRepository: Pick<ProjectRepository, 'getProjectAnalysisContext'>,
  projectId: string,
): Promise<{
  id: string
  novelPromotionProjectId: string
  analysisModel: string
}> {
  const project = await projectRepository.getProjectAnalysisContext(projectId)
  if (!project) throw new Error('Project not found')
  if (!project.analysisModel) throw new Error('请先在项目设置中配置分析模型')
  return {
    ...project,
    analysisModel: project.analysisModel,
  }
}

