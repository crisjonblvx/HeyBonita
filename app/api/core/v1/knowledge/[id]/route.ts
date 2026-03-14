import { getSupabaseBrain } from "@/lib/supabase-brain"
import { applyCors, corsPreflight } from "../../_utils/cors"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseBrain()
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

  const { id } = await params
  if (!id) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "GET,OPTIONS" },
    )
  }

  const { data, error } = await supabase.from("knowledge_entries").select("*").eq("id", id).single()

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        ok: false,
        error: status === 404 ? "Not found" : "Failed to load knowledge entry",
        detail: error.message,
      }),
      {
        status,
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
        entry: data,
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

