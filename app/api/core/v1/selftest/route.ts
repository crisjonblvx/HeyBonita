import type { NextRequest } from "next/server"

const ok = (d: any, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } })
const err = (m: string, d?: any, s = 400) => ok({ error: m, details: d }, s)

function mask(s?: string) {
  if (!s) return ""
  return s.slice(0, 6) + "…(" + s.length + ")"
}

export async function POST(req: NextRequest) {
  // 1) verify service token header
  const token = req.headers.get("x-bonita-service-token")?.trim() || ""
  const allow = (process.env.ALLOWED_SERVICE_TOKENS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const auth = !!token && allow.includes(token)

  // 2) parallel provider checks (cheap, safe calls)
  const checks: Record<string, Promise<{ ok: boolean; detail?: any }>> = {
    openai: (async () => {
      const key = process.env.OPENAI_API_KEY
      if (!key) return { ok: false, detail: "missing OPENAI_API_KEY" }
      try {
        // cheapest safe check: list models
        const r = await fetch("https://api.openai.com/v1/models", { headers: { authorization: `Bearer ${key}` } })
        return { ok: r.ok, detail: r.ok ? "models ok" : { status: r.status, text: await r.text().catch(() => null) } }
      } catch (e: any) {
        return { ok: false, detail: e?.message || String(e) }
      }
    })(),
    luma: (async () => {
      const key = process.env.LUMA_API_KEY
      if (!key) return { ok: false, detail: "missing LUMA_API_KEY" }
      try {
        // hit a known endpoint with minimal payload; if it 401s, we'll report
        const r = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify({ prompt: "ping", model: "ray-2", aspect_ratio: "16:9", duration: 1 }),
        })
        // non-200 still proves auth/path; we just report it
        return { ok: r.status !== 401, detail: { status: r.status, text: await r.text().catch(() => null) } }
      } catch (e: any) {
        return { ok: false, detail: e?.message || String(e) }
      }
    })(),
    elevenlabs: (async () => {
      const key = process.env.ELEVENLABS_API_KEY
      if (!key) return { ok: false, detail: "missing ELEVENLABS_API_KEY" }
      try {
        const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } })
        return { ok: r.ok, detail: r.ok ? "voices ok" : { status: r.status, text: await r.text().catch(() => null) } }
      } catch (e: any) {
        return { ok: false, detail: e?.message || String(e) }
      }
    })(),
    newsapi: (async () => {
      const key = process.env.NEWSAPI_KEY
      if (!key) return { ok: false, detail: "missing NEWSAPI_KEY" }
      try {
        const r = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1`, {
          headers: { "x-api-key": key },
        })
        return {
          ok: r.ok,
          detail: r.ok ? "top-headlines ok" : { status: r.status, text: await r.text().catch(() => null) },
        }
      } catch (e: any) {
        return { ok: false, detail: e?.message || String(e) }
      }
    })(),
    blob: (async () => {
      const tok = process.env.BLOB_READ_WRITE_TOKEN
      if (!tok) return { ok: false, detail: "missing BLOB_READ_WRITE_TOKEN (optional)" }
      try {
        // dry-run: small upload
        const r = await fetch("https://blob.vercel-storage.com", {
          method: "POST",
          headers: { "x-vercel-blob-authorization": `Bearer ${tok}` },
          body: Buffer.from("ping"),
        })
        const j = await r.json().catch(() => null)
        return { ok: r.ok && !!j?.url, detail: j || { status: r.status } }
      } catch (e: any) {
        return { ok: false, detail: e?.message || String(e) }
      }
    })(),
  }

  const results = Object.fromEntries(await Promise.all(Object.entries(checks).map(async ([k, p]) => [k, await p])))

  return ok({
    ok: auth && Object.values(results).some((r) => r.ok),
    auth: { provided: !!token, matches: auth, allowedCount: allow.length },
    env: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY ? mask(process.env.OPENAI_API_KEY) : "",
      LUMA_API_KEY: !!process.env.LUMA_API_KEY ? mask(process.env.LUMA_API_KEY) : "",
      ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY ? mask(process.env.ELEVENLABS_API_KEY) : "",
      NEWSAPI_KEY: !!process.env.NEWSAPI_KEY ? mask(process.env.NEWSAPI_KEY) : "",
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN ? "(set)" : "",
    },
    providers: results,
  })
}
