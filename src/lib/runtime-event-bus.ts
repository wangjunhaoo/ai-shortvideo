import { EventEmitter } from 'node:events'

type RuntimeMessageHandler = (message: string) => void

class RuntimeEventBus {
  private readonly emitter = new EventEmitter()

  constructor() {
    this.emitter.setMaxListeners(200)
  }

  publish(channel: string, message: string) {
    this.emitter.emit(channel, message)
  }

  addChannelListener(channel: string, handler: RuntimeMessageHandler) {
    this.emitter.on(channel, handler)
    return async () => {
      this.emitter.off(channel, handler)
    }
  }
}

type GlobalRuntimeEventBus = typeof globalThis & {
  __waoowaooRuntimeEventBus?: RuntimeEventBus
}

function getRuntimeEventBus() {
  const runtimeGlobal = globalThis as GlobalRuntimeEventBus
  if (!runtimeGlobal.__waoowaooRuntimeEventBus) {
    runtimeGlobal.__waoowaooRuntimeEventBus = new RuntimeEventBus()
  }
  return runtimeGlobal.__waoowaooRuntimeEventBus
}

export async function publishRuntimeChannelMessage(channel: string, message: string) {
  getRuntimeEventBus().publish(channel, message)
}

export async function addRuntimeChannelListener(channel: string, handler: RuntimeMessageHandler) {
  return await getRuntimeEventBus().addChannelListener(channel, handler)
}
