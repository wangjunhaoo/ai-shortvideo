import { logError as _ulogError } from '@/lib/logging/core'
import { addRuntimeChannelListener } from '@/lib/runtime-event-bus'
import { shouldUseInMemoryRuntimeBus } from '@/lib/runtime-mode'

type MessageHandler = (message: string) => void

type RedisSubscriber = {
  on: {
    (event: 'message', handler: (channel: string, message: string) => void): void
    (event: 'error', handler: (error: Error) => void): void
  }
  subscribe: (channel: string) => Promise<unknown>
  unsubscribe: (channel: string) => Promise<unknown>
}

class SharedSubscriber {
  private readonly listeners = new Map<string, Map<number, MessageHandler>>()
  private readonly runtimeBusEnabled = shouldUseInMemoryRuntimeBus()
  private readonly channelTeardowns = new Map<string, () => Promise<void>>()
  private listenerSeq = 1
  private subscriberPromise: Promise<RedisSubscriber> | null = null

  private dispatchMessage(channel: string, message: string) {
    const channelListeners = this.listeners.get(channel)
    if (!channelListeners || channelListeners.size === 0) return

    for (const handler of channelListeners.values()) {
      try {
        handler(message)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        _ulogError(`[SSE:shared] listener error channel=${channel} error=${message}`)
      }
    }
  }

  private async ensureRedisSubscriber() {
    if (this.subscriberPromise) {
      return await this.subscriberPromise
    }

    this.subscriberPromise = import('../redis').then(({ createSubscriber }) => {
      const subscriber = createSubscriber() as unknown as RedisSubscriber
      subscriber.on('message', (channel, message) => {
        this.dispatchMessage(channel, message)
      })
      subscriber.on('error', (error) => {
        _ulogError(`[SSE:shared] redis error: ${error?.message || 'unknown'}`)
      })
      return subscriber
    })

    return await this.subscriberPromise
  }

  async addChannelListener(channel: string, handler: MessageHandler): Promise<() => Promise<void>> {
    let channelListeners = this.listeners.get(channel)
    if (!channelListeners) {
      channelListeners = new Map<number, MessageHandler>()
      this.listeners.set(channel, channelListeners)
    }

    const listenerId = this.listenerSeq++
    channelListeners.set(listenerId, handler)

    try {
      if (channelListeners.size === 1) {
        if (this.runtimeBusEnabled) {
          const teardown = await addRuntimeChannelListener(channel, (message) => {
            this.dispatchMessage(channel, message)
          })
          this.channelTeardowns.set(channel, teardown)
        } else {
          const subscriber = await this.ensureRedisSubscriber()
          await subscriber.subscribe(channel)
        }
      }
    } catch (error) {
      channelListeners.delete(listenerId)
      if (channelListeners.size === 0) {
        this.listeners.delete(channel)
      }
      throw error
    }

    return async () => {
      const listeners = this.listeners.get(channel)
      if (!listeners) return

      listeners.delete(listenerId)
      if (listeners.size > 0) return

      this.listeners.delete(channel)
      if (this.runtimeBusEnabled) {
        const teardown = this.channelTeardowns.get(channel)
        this.channelTeardowns.delete(channel)
        try {
          await teardown?.()
        } catch {}
        return
      }

      try {
        const subscriber = await this.ensureRedisSubscriber()
        await subscriber.unsubscribe(channel)
      } catch {}
    }
  }
}

type GlobalSharedSubscriber = typeof globalThis & {
  __waoowaooSharedSubscriber?: SharedSubscriber
}

const globalForSharedSubscriber = globalThis as GlobalSharedSubscriber

export function getSharedSubscriber() {
  if (!globalForSharedSubscriber.__waoowaooSharedSubscriber) {
    globalForSharedSubscriber.__waoowaooSharedSubscriber = new SharedSubscriber()
  }
  return globalForSharedSubscriber.__waoowaooSharedSubscriber
}
