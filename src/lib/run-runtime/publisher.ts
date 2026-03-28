import { publishRuntimeChannelMessage } from '@/lib/runtime-event-bus'
import { shouldUseInMemoryRuntimeBus } from '@/lib/runtime-mode'
import { appendRunEventWithSeq } from './service'
import type { RunEventInput } from './types'

const RUN_CHANNEL_PREFIX = 'run-events:project:'

export function getProjectRunChannel(projectId: string) {
  return `${RUN_CHANNEL_PREFIX}${projectId}`
}

export async function publishRunEvent(input: RunEventInput) {
  const event = await appendRunEventWithSeq(input)
  const message = {
    id: event.id,
    type: 'run.event',
    runId: event.runId,
    projectId: event.projectId,
    userId: event.userId,
    seq: event.seq,
    eventType: event.eventType,
    stepKey: event.stepKey || null,
    attempt: event.attempt || null,
    lane: event.lane || null,
    payload: event.payload || null,
    ts: event.createdAt,
  }
  const serializedMessage = JSON.stringify(message)
  if (shouldUseInMemoryRuntimeBus()) {
    await publishRuntimeChannelMessage(getProjectRunChannel(event.projectId), serializedMessage)
  } else {
    const { redis } = await import('../redis')
    await redis.publish(getProjectRunChannel(event.projectId), serializedMessage)
  }
  return message
}

