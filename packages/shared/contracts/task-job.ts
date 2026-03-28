export type TaskJobBackoff =
  | number
  | {
    type?: string
    delay?: number
  }

export type TaskJobOptions = {
  attempts?: number
  backoff?: TaskJobBackoff
}

export interface TaskJobLike<TData> {
  id?: string
  name?: string
  data: TData
  queueName: string
  attemptsMade: number
  opts: TaskJobOptions
}
