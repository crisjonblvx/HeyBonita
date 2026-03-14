import { getSupabaseBrain } from "@/lib/supabase-brain"
import { applyCors, corsPreflight } from "../../_utils/cors"

export const dynamic = "force-dynamic"
const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate" }

export async function GET(req: Request) {
  const supabase = getSupabaseBrain()
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
  const region = searchParams.get("region")?.trim()
  if (!region) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "region query param is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...NO_CACHE },
      }),
      { methods: "GET,OPTIONS" },
    )
  }

  const pattern = `%${region}%`
  const { data, error } = await supabase
    .from("regional_knowledge")
    .select("id, state, title, content, source")
    .or(`title.ilike.${pattern},state.ilike.${pattern}`)
    .limit(1)
    .maybeSingle()

  if (error) {
    return applyCors(
      req,
      new Response(
        JSON.stringify({ ok: false, error: "Failed to load regional knowledge", detail: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...NO_CACHE } },
      ),
      { methods: "GET,OPTIONS" },
    )
  }

  return applyCors(
    req,
    new Response(
      JSON.stringify({ ok: true, entry: data ?? null }),
      { status: 200, headers: { "Content-Type": "application/json", ...NO_CACHE } },
    ),
    { methods: "GET,OPTIONS" },
  )
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "GET,OPTIONS" })
}
