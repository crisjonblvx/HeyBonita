type EventPayload = Record<string, unknown>

export const bonitaEvents = {
  async track(event: string, payload: EventPayload = {}) {
    try {
      const endpoint = process.env.BONITA_EVENTS_URL || process.env.NEXT_PUBLIC_BONITA_EVENTS_URL
      if (!endpoint) return

      await fetch(`${endpoint}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, ...payload, timestamp: new Date().toISOString() }),
      }).catch(() => {})
    } catch {
      // event tracking is fire-and-forget
    }
  },
}
