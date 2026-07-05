export class TelemetryService {
  private events: Array<{ type: string; data: unknown; timestamp: string }> = []
  log(type: string, data: unknown = {}) {
    const entry = { type, data, timestamp: new Date().toISOString() }
    this.events.push(entry)
    if (import.meta.env.DEV) console.debug('[telemetry]', type, data)
  }
  getEvents() { return [...this.events] }
  clear() { this.events = [] }
}
export const telemetry = new TelemetryService()
