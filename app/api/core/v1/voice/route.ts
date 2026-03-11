import type { NextRequest } from "next/server"
import { ok, err } from "@/src/core/utils/json"
import { requireServiceAuth } from "@/src/core/guard"
import { rateLimit } from "@/src/core/rateLimit"
import { applyCors, corsPreflight } from "../_utils/cors"

export async function POST(req: NextRequest) {
  const denied = requireServiceAuth(req)
  if (denied) return applyCors(req, denied, { methods: "POST,OPTIONS" })

  const ip = req.headers.get("x-forwarded-for") || "ip"
  const tok = req.headers.get("x-bonita-service-token") || "tok"
  if (!rateLimit(`${ip}:${tok}:/api/core/v1/voice`, 120, 60_000)) {
    return applyCors(req, err("Rate limited", undefined, 429), { methods: "POST,OPTIONS" })
  }

  try {
    const { text, voiceId } = await req.json()
    if (!text)
      return applyCors(req, err("text is required", undefined, 400), { methods: "POST,OPTIONS" })

    const key = process.env.ELEVENLABS_API_KEY
    const voice = voiceId || process.env.ELEVENLABS_VOICE_ID

    if (!key || !voice) {
      return applyCors(
        req,
        ok({ ok: false, note: "stub (no ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID)" }),
        { methods: "POST,OPTIONS" },
      )
    }

    // TODO: implement ElevenLabs API call
    return applyCors(req, ok({ ok: true, text, voiceId: voice, audioUrl: null }), {
      methods: "POST,OPTIONS",
    })
  } catch (e: any) {
    return applyCors(req, err("Voice generation failed", e?.message || String(e), 500), {
      methods: "POST,OPTIONS",
    })
  }
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}
