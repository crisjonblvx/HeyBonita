import { NextResponse } from "next/server"
import { getSupabaseBrain } from "@/lib/supabase-brain"
import { applyCors, corsPreflight } from "../_utils/cors"

export const revalidate = 3600

export async function GET(req: Request) {
  const supabase = getSupabaseBrain()

  if (!supabase) {
    return applyCors(
      req,
      NextResponse.json({
        musicians: 84424,
        activists: 2369,
        events: 30,
        regions: 55,
        total: 108784,
      }),
      { methods: "GET,OPTIONS" },
    )
  }

  const [musicians, activists, total] = await Promise.all([
    supabase.from("knowledge_entries").select("*", { count: "exact", head: true }).ilike("category", "%musician%"),
    supabase.from("knowledge_entries").select("*", { count: "exact", head: true }).ilike("category", "%activist%"),
    supabase.from("knowledge_entries").select("*", { count: "exact", head: true }),
  ])

  return applyCors(
    req,
    NextResponse.json({
      musicians: musicians.count ?? 84424,
      activists: activists.count ?? 2369,
      total: total.count ?? 108784,
    }),
    { methods: "GET,OPTIONS" },
  )
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "GET,OPTIONS" })
}
