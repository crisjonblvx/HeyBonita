function isSameAppOrigin(req: Request): boolean {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim()
  if (!appUrl) return false
  try {
    const appHost = new URL(appUrl).hostname.toLowerCase()
    const originRaw = req.headers.get("origin") || req.headers.get("referer") || ""
    const origin = originRaw.trim().replace(/\/+$/, "")
    if (!origin || !origin.startsWith("http")) return false
    const originHost = new URL(origin).hostname.toLowerCase()
    if (originHost === appHost) return true
    const vercelUrl = (process.env.VERCEL_URL || "").trim().toLowerCase().replace(/^https?:\/\//, "")
    if (vercelUrl && originHost === vercelUrl) return true
    return false
  } catch {
    return false
  }
}

export function checkServiceToken(req: Request) {
  const expected =
    process.env.BONITACORE_SERVICE_TOKEN ||
    process.env.NEXT_PUBLIC_BONITA_SERVICE_TOKEN ||
    ""
  const got = req.headers.get("x-service-token") || ""
  if (expected && got && got === expected) return null
  if (isSameAppOrigin(req)) return null
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  })
}
