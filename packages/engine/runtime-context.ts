import type { TaskJobLike } from '@shared/contracts/task-job'
import { createScopedLogger } from '@/lib/logging/core'
import type { TaskJobData } from '@/lib/task/types'
import { defaultAssetHubRepository, type AssetHubRepository } from './repositories/asset-hub-repository'
import { defaultProjectRepository, type ProjectRepository } from './repositories/project-repository'
import { defaultTaskRepository, type TaskRepository } from './repositories/task-repository'
import { defaultUserPreferenceRepository, type UserPreferenceRepository } from './repositories/user-preference-repository'

export type WorkerTaskJob = TaskJobLike<TaskJobData>

export type WorkerTaskHandler<TResult = Record<string, unknown> | void> = (
  job: WorkerTaskJob,
) => Promise<TResult>

export type TaskExecutionContext = {
  job: WorkerTaskJob
  data: TaskJobData
  taskId: string
  projectId: string
  userId: string
  queueName: string
  repositories: {
    task: TaskRepository
    project: ProjectRepository
    assetHub: AssetHubRepository
    userPreference: UserPreferenceRepository
  }
}

const DEFAULT_WORKER_REPOSITORIES = {
  task: defaultTaskRepository,
  project: defaultProjectRepository,
  assetHub: defaultAssetHubRepository,
  userPreference: defaultUserPreferenceRepository,
} as const

export function createTaskExecutionContext(
  job: WorkerTaskJob,
  repositories: TaskExecutionContext['repositories'] = DEFAULT_WORKER_REPOSITORIES,
): TaskExecutionContext {
  return {
    job,
    data: job.data,
    taskId: job.data.taskId,
    projectId: job.data.projectId,
    userId: job.data.userId,
    queueName: job.queueName,
    repositories,
  }
}

export function createTaskExecutionLogger(job: WorkerTaskJob, action: string, module: string) {
  return createScopedLogger({
    module,
    action,
    requestId: job.data.trace?.requestId || undefined,
    taskId: job.data.taskId,
    projectId: job.data.projectId,
    userId: job.data.userId,
  })
}
