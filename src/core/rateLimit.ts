const buckets = new Map<string, { t: number; n: number }>()

export function rateLimit(key: string, max = 60, windowMs = 60_000) {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now - b.t > windowMs) {
    buckets.set(key, { t: now, n: 1 })
    return true
  }
  if (b.n >= max) return false
  b.n++
  return true
}
