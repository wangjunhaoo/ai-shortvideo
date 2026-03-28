import { prisma } from '@engine/prisma'
import {
  rollbackTaskBillingForTask,
  touchTaskHeartbeat,
  tryMarkTaskCompleted,
  tryMarkTaskFailed,
  tryMarkTaskProcessing,
  trySetTaskExternalId,
  tryUpdateTaskProgress,
  updateTaskBillingInfo,
  isTaskActive,
} from '@/lib/task/service'
import type { TaskBillingInfo } from '@/lib/task/types'

export type WorkerTaskBillingRollbackResult = Awaited<ReturnType<typeof rollbackTaskBillingForTask>>

export interface TaskRepository {
  touchHeartbeat(taskId: string): Promise<boolean>
  markProcessing(taskId: string): Promise<boolean>
  markCompleted(taskId: string, resultPayload?: Record<string, unknown> | null): Promise<boolean>
  markFailed(taskId: string, errorCode: string, errorMessage: string): Promise<boolean>
  updateProgress(taskId: string, progress: number, payload?: Record<string, unknown> | null): Promise<boolean>
  updateBillingInfo(taskId: string, billingInfo: TaskBillingInfo | null): Promise<unknown>
  rollbackBillingForTask(params: Parameters<typeof rollbackTaskBillingForTask>[0]): Promise<WorkerTaskBillingRollbackResult>
  isActive(taskId: string): Promise<boolean>
  setExternalId(taskId: string, externalId: string): Promise<boolean>
  getExternalId(taskId: string): Promise<string | null>
}

export const defaultTaskRepository: TaskRepository = {
  async touchHeartbeat(taskId) {
    return await touchTaskHeartbeat(taskId)
  },
  async markProcessing(taskId) {
    return await tryMarkTaskProcessing(taskId)
  },
  async markCompleted(taskId, resultPayload) {
    return await tryMarkTaskCompleted(taskId, resultPayload)
  },
  async markFailed(taskId, errorCode, errorMessage) {
    return await tryMarkTaskFailed(taskId, errorCode, errorMessage)
  },
  async updateProgress(taskId, progress, payload) {
    return await tryUpdateTaskProgress(taskId, progress, payload)
  },
  async updateBillingInfo(taskId, billingInfo) {
    return await updateTaskBillingInfo(taskId, billingInfo)
  },
  async rollbackBillingForTask(params) {
    return await rollbackTaskBillingForTask(params)
  },
  async isActive(taskId) {
    return await isTaskActive(taskId)
  },
  async setExternalId(taskId, externalId) {
    return await trySetTaskExternalId(taskId, externalId)
  },
  async getExternalId(taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { externalId: true },
    })
    const value = task?.externalId?.trim()
    return value || null
  },
}

