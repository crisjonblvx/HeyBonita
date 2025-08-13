import type { NextRequest } from "next/server"
import { ok, err } from "@/src/core/utils/json"
import { requireServiceAuth } from "@/src/core/guard"
import { rateLimit } from "@/src/core/rateLimit"

export async function POST(req: NextRequest) {
  const denied = requireServiceAuth(req)
  if (denied) return denied

  const ip = req.headers.get("x-forwarded-for") || "ip"
  const tok = req.headers.get("x-bonita-service-token") || "tok"
  if (!rateLimit(`${ip}:${tok}:/api/core/v1/voice`, 120, 60_000)) {
    return err("Rate limited", undefined, 429)
  }

  try {
    const { text, voiceId } = await req.json()
    if (!text) return err("text is required", undefined, 400)

    const key = process.env.ELEVENLABS_API_KEY
    const voice = voiceId || process.env.ELEVENLABS_VOICE_ID

    if (!key || !voice) {
      return ok({ ok: false, note: "stub (no ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID)" })
    }

    // TODO: implement ElevenLabs API call
    return ok({ ok: true, text, voiceId: voice, audioUrl: null })
  } catch (e: any) {
    return err("Voice generation failed", e?.message || String(e), 500)
  }
}
