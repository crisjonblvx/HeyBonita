import type { NextRequest } from "next/server"
import { requireServiceAuth } from "@/src/core/guard"
import { applyCors, corsPreflight } from "../_utils/cors"

const ok = (d: any, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } })
const err = (m: string, d?: any, s = 400) => ok({ error: m, details: d }, s)

export async function POST(req: NextRequest) {
  const denied = requireServiceAuth(req)
  if (denied) return applyCors(req, denied, { methods: "POST,OPTIONS" })

  const key = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
  if (!key) return applyCors(req, err("Missing OPENAI_API_KEY"), { methods: "POST,OPTIONS" })

  try {
    const { prompt, size = "1024x1024", n = 1 } = await req.json()
    if (!prompt) return applyCors(req, err("prompt is required"), { methods: "POST,OPTIONS" })

    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, prompt, size, n, response_format: "url" }),
    })
    const json = await r.json().catch(() => null)
    if (!r.ok)
      return applyCors(req, err("openai_image_error", json || { status: r.status }, r.status), {
        methods: "POST,OPTIONS",
      })

    const urls = (json?.data || []).map((d: any) => d.url).filter(Boolean)
    return applyCors(req, ok({ ok: true, model, size, n, urls }), { methods: "POST,OPTIONS" })
  } catch (e: any) {
    return applyCors(req, err("image_generation_failed", e?.message || String(e), 500), {
      methods: "POST,OPTIONS",
    })
  }
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}
