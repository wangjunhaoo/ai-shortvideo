import type { WorkerTaskJob } from '@engine/runtime-context'
import { executeAiTextStep } from '@/lib/ai-runtime'
import { withInternalLLMStreamCallbacks } from '@/lib/llm-observe/internal-stream-context'
import { createWorkerLLMStreamCallbacks, createWorkerLLMStreamContext } from './llm-stream'

export async function runShotPromptCompletion(params: {
  job: WorkerTaskJob
  model: string
  prompt: string
  action: string
  streamContextKey: string
  streamStepId: string
  streamStepTitle: string
}): Promise<string> {
  const streamContext = createWorkerLLMStreamContext(params.job, params.streamContextKey)
  const streamCallbacks = createWorkerLLMStreamCallbacks(params.job, streamContext)
  return await (async () => {
    try {
      const result = await withInternalLLMStreamCallbacks(
        streamCallbacks,
        async () =>
          await executeAiTextStep({
            userId: params.job.data.userId,
            model: params.model,
            messages: [{ role: 'user', content: params.prompt }],
            temperature: 0.7,
            projectId: params.job.data.projectId,
            action: params.action,
            meta: {
              stepId: params.streamStepId,
              stepTitle: params.streamStepTitle,
              stepIndex: 1,
              stepTotal: 1,
            },
          }),
      )
      return result.text
    } finally {
      await streamCallbacks.flush()
    }
  })()
}



