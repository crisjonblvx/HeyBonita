import { getSupabaseAdminClient } from "@/lib/supabase"
import { applyCors, corsPreflight } from "../../_utils/cors"

export const dynamic = "force-dynamic"
const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate" }

export async function GET(req: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "Supabase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...NO_CACHE },
      }),
      { methods: "GET,OPTIONS" },
    )
  }

  // Simple random: sample up to 100 rows, then pick one in memory.
  const { data, error } = await supabase.from("knowledge_entries").select("*").limit(100)

  if (error) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        ok: false,
        error: "Failed to load knowledge entries",
        detail: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...NO_CACHE },
      },
      ),
      { methods: "GET,OPTIONS" },
    )
  }

  if (!data || data.length === 0) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "No knowledge entries available" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...NO_CACHE },
      }),
      { methods: "GET,OPTIONS" },
    )
  }

  const randomIndex = Math.floor(Math.random() * data.length)
  const entry = data[randomIndex]

  return applyCors(
    req,
    new Response(
      JSON.stringify({
        ok: true,
        entry,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...NO_CACHE },
      },
    ),
    { methods: "GET,OPTIONS" },
  )
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "GET,OPTIONS" })
}

