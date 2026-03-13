import { getSupabaseAdminClient } from "@/lib/supabase"
import { applyCors, corsPreflight } from "../_utils/cors"

export const dynamic = "force-dynamic"
const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate" }
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

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

  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")?.trim() || undefined
  const search = searchParams.get("search")?.trim() || undefined
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)))
  const offset = (page - 1) * limit

  let query = supabase
    .from("knowledge_entries")
    .select("id, name, category, subcategory, image_url, biography", { count: "exact" })

  if (category) query = query.eq("category", category)
  if (search) query = query.ilike("name", `%${search}%`)

  query = query
    .not("name", "is", null)
    .neq("name", "")
    .not("name", "like", "%?????%")

  const { data, error, count } = await query
    .order("image_url", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1)

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

  return applyCors(
    req,
    new Response(
      JSON.stringify({
        ok: true,
        entries: data ?? [],
        total: count ?? 0,
        page,
        limit,
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
