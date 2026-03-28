import { rendererApiRequest as apiFetch } from '@renderer/clients/http-client'
import { taskRoutes, withQuery } from '@shared/contracts/renderer-api-routes'

export function getTaskStatus(taskId: string) {
  return apiFetch(taskRoutes.detail(taskId), {
    method: 'GET',
    cache: 'no-store',
  })
}

export function listTasks(params: URLSearchParams) {
  return apiFetch(withQuery(taskRoutes.root, params), {
    method: 'GET',
    cache: 'no-store',
  })
}

export function dismissTasks(taskIds: string[]) {
  return apiFetch(taskRoutes.dismiss, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskIds }),
  })
}

export function fetchTaskTargetStates(
  projectId: string,
  targets: Array<{
    targetType: string
    targetId: string
    types?: string[]
  }>,
) {
  return apiFetch(taskRoutes.targetStates, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId, targets }),
  })
}
