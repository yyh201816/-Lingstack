import type { RuntimeEvent, RuntimeEventHandler, RuntimeEventType } from "./agent-runtime.types"

class RuntimeEventBus {
  private handlers = new Map<RuntimeEventType, Set<RuntimeEventHandler>>()
  private allHandlers = new Set<RuntimeEventHandler>()

  on(type: RuntimeEventType, handler: RuntimeEventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    return () => this.off(type, handler)
  }

  onAll(handler: RuntimeEventHandler): () => void {
    this.allHandlers.add(handler)
    return () => this.allHandlers.delete(handler)
  }

  off(type: RuntimeEventType, handler: RuntimeEventHandler): void {
    this.handlers.get(type)?.delete(handler)
  }

  emit(type: RuntimeEventType, taskId: string, payload?: Record<string, unknown>): void {
    const event: RuntimeEvent = {
      type,
      taskId,
      timestamp: new Date().toISOString(),
      payload,
    }

    this.handlers.get(type)?.forEach((handler) => {
      try {
        handler(event)
      } catch (error) {
        console.error("[RuntimeEventBus] handler error:", error)
      }
    })

    this.allHandlers.forEach((handler) => {
      try {
        handler(event)
      } catch (error) {
        console.error("[RuntimeEventBus] all-handler error:", error)
      }
    })
  }

  clear(): void {
    this.handlers.clear()
    this.allHandlers.clear()
  }
}

export const runtimeEventBus = new RuntimeEventBus()
