type CorsConfig = {
  methods: string
  headers?: string
}

const STATIC_ALLOWED_HOSTS = new Set([
  "heybonita.ai",
  "www.heybonita.ai",
  "blvx.social",
  "hbcu.news",
  "readysetclass.com",
  "readysetclass.app",
])

function isDevAllowedHost(hostname: string): boolean {
  if (process.env.NODE_ENV === "production") return false
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
}

function getVercelAllowedHosts(): Set<string> {
  const out = new Set<string>()
  const vercelUrl = (process.env.VERCEL_URL || "").trim()
  if (vercelUrl) out.add(vercelUrl.toLowerCase())
  return out
}

function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export function getRequestOrigin(req: Request): string | null {
  const origin = (req.headers.get("origin") || "").trim()
  if (!origin) return null
  return safeParseUrl(origin)?.origin ?? null
}

export function isAllowedCorsOrigin(origin: string): boolean {
  const url = safeParseUrl(origin)
  if (!url) return false
  const hostname = url.hostname.toLowerCase()

  if (STATIC_ALLOWED_HOSTS.has(hostname)) return true
  if (isDevAllowedHost(hostname)) return true

  const vercelHosts = getVercelAllowedHosts()
  if (vercelHosts.has(hostname)) return true

  return false
}

export function corsHeadersFor(req: Request, config: CorsConfig): Headers {
  const h = new Headers()
  const origin = getRequestOrigin(req)

  if (origin && isAllowedCorsOrigin(origin)) {
    h.set("Access-Control-Allow-Origin", origin)
    h.set("Vary", "Origin")
  } else if (!origin) {
    h.set("Access-Control-Allow-Origin", "*")
  }

  h.set("Access-Control-Allow-Methods", config.methods)
  h.set(
    "Access-Control-Allow-Headers",
    config.headers ||
      "Content-Type, Authorization, x-service-token, x-bonita-service-token, x-bonita-ingest-secret",
  )
  h.set("Access-Control-Max-Age", "86400")
  return h
}

export function corsPreflight(req: Request, config: CorsConfig): Response {
  const origin = getRequestOrigin(req)
  if (origin && !isAllowedCorsOrigin(origin)) {
    return new Response(JSON.stringify({ ok: false, error: "Origin not allowed" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  return new Response(null, {
    status: 204,
    headers: corsHeadersFor(req, config),
  })
}

export function applyCors(req: Request, res: Response, config: CorsConfig): Response {
  const origin = getRequestOrigin(req)
  if (origin && !isAllowedCorsOrigin(origin)) return res

  const merged = new Headers(res.headers)
  for (const [k, v] of corsHeadersFor(req, config).entries()) merged.set(k, v)
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: merged,
  })
}

export function detectAppOrigin(req: Request, bodyAppOrigin?: string): string {
  const raw = (bodyAppOrigin || "").trim()
  if (raw) {
    const url =
      safeParseUrl(raw) ||
      safeParseUrl(raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`)
    if (url?.hostname) return url.hostname.toLowerCase()
    return raw.toLowerCase()
  }

  const origin = getRequestOrigin(req)
  const originHost = origin ? safeParseUrl(origin)?.hostname : null
  if (originHost) return originHost.toLowerCase()

  const referer = (req.headers.get("referer") || "").trim()
  const refHost = referer ? safeParseUrl(referer)?.hostname : null
  if (refHost) return refHost.toLowerCase()

  return "heybonita.ai"
}
