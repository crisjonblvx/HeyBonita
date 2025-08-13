import type { NextRequest } from "next/server"
import { ok, err } from "@/src/core/utils/json"
import { requireServiceAuth } from "@/src/core/guard"
import { rateLimit } from "@/src/core/rateLimit"

export async function POST(req: NextRequest) {
  const denied = requireServiceAuth(req)
  if (denied) return denied

  const ip = req.headers.get("x-forwarded-for") || "ip"
  const tok = req.headers.get("x-bonita-service-token") || "tok"
  if (!rateLimit(`${ip}:${tok}:/api/core/v1/trends`, 120, 60_000)) {
    return err("Rate limited", undefined, 429)
  }

  try {
    const { categories, freshness } = await req.json()
    if (!categories || !Array.isArray(categories)) {
      return err("categories array is required", undefined, 400)
    }

    // TODO: call connectors here. For now, stub:
    return ok({ ok: true, categories, freshness, buckets: [] })
  } catch (e: any) {
    return err("Trends failed", e?.message || String(e), 500)
  }
}
