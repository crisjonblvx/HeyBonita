import type { NextRequest } from "next/server"
import { ok, err } from "@/src/core/utils/json"
import { requireServiceAuth } from "@/src/core/guard"
import { rateLimit } from "@/src/core/rateLimit"
import { lumaGenerate } from "@/src/core/connectors/luma"
import { applyCors, corsPreflight } from "../_utils/cors"

export async function POST(req: NextRequest) {
  const denied = requireServiceAuth(req)
  if (denied) return applyCors(req, denied, { methods: "POST,OPTIONS" })

  const ip = req.headers.get("x-forwarded-for") || "ip"
  const tok = req.headers.get("x-bonita-service-token") || "tok"
  if (!rateLimit(`${ip}:${tok}:/api/core/v1/video`, 120, 60_000)) {
    return applyCors(req, err("Rate limited", undefined, 429), { methods: "POST,OPTIONS" })
  }

  try {
    const { prompt, model = "ray2" } = await req.json()
    if (!prompt)
      return applyCors(req, err("prompt is required", undefined, 400), { methods: "POST,OPTIONS" })

    const result = await lumaGenerate({ prompt, model })
    return applyCors(req, ok(result), { methods: "POST,OPTIONS" })
  } catch (e: any) {
    return applyCors(req, err("Video generation failed", e?.message || String(e), 500), {
      methods: "POST,OPTIONS",
    })
  }
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}
