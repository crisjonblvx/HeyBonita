import type { NextRequest } from "next/server"
import { ok, err } from "@/src/core/utils/json"
import { requireServiceAuth } from "@/src/core/guard"
import { rateLimit } from "@/src/core/rateLimit"
import { lumaGenerate } from "@/src/core/connectors/luma"

export async function POST(req: NextRequest) {
  const denied = requireServiceAuth(req)
  if (denied) return denied

  const ip = req.headers.get("x-forwarded-for") || "ip"
  const tok = req.headers.get("x-bonita-service-token") || "tok"
  if (!rateLimit(`${ip}:${tok}:/api/core/v1/video`, 120, 60_000)) {
    return err("Rate limited", undefined, 429)
  }

  try {
    const { prompt, model = "ray2" } = await req.json()
    if (!prompt) return err("prompt is required", undefined, 400)

    const result = await lumaGenerate({ prompt, model })
    return ok(result)
  } catch (e: any) {
    return err("Video generation failed", e?.message || String(e), 500)
  }
}
