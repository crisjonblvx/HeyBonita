import { getSupabaseAdminClient } from "@/lib/supabase"
import { applyCors, corsPreflight } from "../../_utils/cors"

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "Supabase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "GET,OPTIONS" },
    )
  }

  const { name: rawName } = await params
  const name = decodeURIComponent(rawName || "").trim()
  if (!name) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "GET,OPTIONS" },
    )
  }

  const url = new URL(req.url)
  const category = url.searchParams.get("category") || undefined

  let query = supabase.from("knowledge_entries").select("*").ilike("name", `%${name}%`).limit(20)

  if (category) {
    query = query.eq("category", category)
  }

  const { data, error } = await query

  if (error) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        ok: false,
        error: "Failed to look up person",
        detail: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
      ),
      { methods: "GET,OPTIONS" },
    )
  }

  return applyCors(
    req,
    new Response(
      JSON.stringify({
        ok: true,
        name,
        category: category || null,
        results: data ?? [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
    { methods: "GET,OPTIONS" },
  )
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "GET,OPTIONS" })
}

