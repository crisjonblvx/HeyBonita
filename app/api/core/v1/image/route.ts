import type { NextRequest } from "next/server"
import { requireServiceAuth } from "@/src/core/guard"

const ok = (d: any, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } })
const err = (m: string, d?: any, s = 400) => ok({ error: m, details: d }, s)

export async function POST(req: NextRequest) {
  const denied = requireServiceAuth(req)
  if (denied) return denied

  const key = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
  if (!key) return err("Missing OPENAI_API_KEY")

  try {
    const { prompt, size = "1024x1024", n = 1 } = await req.json()
    if (!prompt) return err("prompt is required")

    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, prompt, size, n, response_format: "url" }),
    })
    const json = await r.json().catch(() => null)
    if (!r.ok) return err("openai_image_error", json || { status: r.status }, r.status)

    const urls = (json?.data || []).map((d: any) => d.url).filter(Boolean)
    return ok({ ok: true, model, size, n, urls })
  } catch (e: any) {
    return err("image_generation_failed", e?.message || String(e), 500)
  }
}
