import { getSupabaseAdminClient } from "@/lib/supabase"
import { applyCors, corsPreflight } from "../../_utils/cors"

type SourceRow = {
  id: string
  source_key: string
  is_active: boolean
  sync_frequency_minutes?: number | null
  last_synced_at?: string | null
}

function isAuthorized(req: Request): boolean {
  const secret = process.env.BONITA_INGEST_SECRET || ""
  const cronSecret = process.env.CRON_SECRET || ""
  const headerSecret = req.headers.get("x-bonita-ingest-secret") || ""
  const authHeader = req.headers.get("authorization") || ""
  if (secret && headerSecret === secret) return true
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  return false
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
      }),
      { methods: "GET,POST,OPTIONS" },
    )
  }
  return applyCors(req, await runFeed(req), { methods: "GET,POST,OPTIONS" })
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
      }),
      { methods: "GET,POST,OPTIONS" },
    )
  }
  return applyCors(req, await runFeed(req), { methods: "GET,POST,OPTIONS" })
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "GET,POST,OPTIONS" })
}

async function runFeed(req: Request): Promise<Response> {
  const secret = process.env.BONITA_INGEST_SECRET || ""

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return new Response(JSON.stringify({ ok: false, error: "Supabase not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { data: sources, error } = await supabase
    .from("knowledge_sources")
    .select("*")
    .eq("is_active", true)

  if (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Failed to load knowledge_sources",
        detail: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  const now = new Date()
  const ran: { source_key: string; status: string }[] = []
  const ingestUrl = new URL("/api/core/v1/knowledge/ingest", req.url).toString()
  const ingestWikiUrl = new URL("/api/core/v1/knowledge/ingest/wikipedia", req.url).toString()

  for (const row of (sources || []) as SourceRow[]) {
    const freqMinutes = row.sync_frequency_minutes ?? 1440 // default daily
    const last =
      row.last_synced_at && !Number.isNaN(Date.parse(row.last_synced_at))
        ? new Date(row.last_synced_at)
        : null

    const due =
      !last || now.getTime() - last.getTime() >= freqMinutes * 60 * 1000

    if (!due) {
      ran.push({ source_key: row.source_key, status: "skipped_not_due" })
      continue
    }

    try {
      if (row.source_key === "smithsonian_nmaahc") {
        const res = await fetch(ingestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bonita-ingest-secret": secret,
          },
          body: JSON.stringify({ limit: 100 }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok) {
          ran.push({
            source_key: row.source_key,
            status: `error:${json?.error || res.status}`,
          })
        } else {
          ran.push({
            source_key: row.source_key,
            status: `ok:${json?.inserted ?? 0}`,
          })
          // last_synced_at updated by ingest route
        }
      } else if (row.source_key === "wikipedia") {
        const res = await fetch(ingestWikiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bonita-ingest-secret": secret,
          },
          body: JSON.stringify({ limit: 20 }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok) {
          ran.push({
            source_key: row.source_key,
            status: `error:${json?.error || res.status}`,
          })
        } else {
          ran.push({
            source_key: row.source_key,
            status: `ok:${json?.inserted ?? 0}`,
          })
          // last_synced_at updated by ingest/wikipedia route
        }
      } else {
        ran.push({ source_key: row.source_key, status: "skipped_unknown_source" })
      }
    } catch (e) {
      ran.push({
        source_key: row.source_key,
        status: `error:${e instanceof Error ? e.message : String(e)}`,
      })
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      ran,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  )
}

