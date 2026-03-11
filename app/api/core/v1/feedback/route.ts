import { getSupabaseAdminClient } from "@/lib/supabase"
import { applyCors, corsPreflight, detectAppOrigin } from "../_utils/cors"

type FeedbackBody = {
  query: string
  response: string
  app_origin?: string
  user_id?: string
  rating: "up" | "down"
  had_rag_results?: boolean
  reason?:
    | "inaccurate_facts"
    | "wrong_tone"
    | "too_generic"
    | "missing_cultural_context"
    | "did_not_answer"
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "Supabase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "POST,OPTIONS" },
    )
  }

  const body = (await req.json().catch(() => ({}))) as Partial<FeedbackBody>
  const query = (body.query || "").trim()
  const response = (body.response || "").trim()
  const rating = body.rating

  if (!query || !response || (rating !== "up" && rating !== "down")) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        ok: false,
        error: "query, response, and rating ('up' | 'down') are required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
      ),
      { methods: "POST,OPTIONS" },
    )
  }

  const appOrigin = detectAppOrigin(req, body.app_origin)
  const userId = body.user_id || null
  const hadRagResults = body.had_rag_results ?? true
  const reason = body.reason || null

  let trustScore = 1

  if (userId) {
    const { data: userRow } = await supabase
      .from("user_context")
      .select("trust_score,total_helpful_votes,total_missed_votes")
      .eq("user_id", userId)
      .maybeSingle()

    if (typeof userRow?.trust_score === "number") {
      trustScore = userRow.trust_score
    }

    const update: Record<string, any> = {}
    if (rating === "up") {
      update.total_helpful_votes = (userRow?.total_helpful_votes || 0) + 1
    } else if (rating === "down") {
      update.total_missed_votes = (userRow?.total_missed_votes || 0) + 1
    }
    if (Object.keys(update).length > 0) {
      await supabase
        .from("user_context")
        .update({
          ...update,
          last_active: new Date().toISOString(),
        })
        .eq("user_id", userId)
    }
  }

  const { error } = await supabase.from("response_feedback").insert({
    query,
    response,
    rating,
    reason,
    app_origin: appOrigin,
    user_id: userId,
  })

  if (error) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        ok: false,
        error: "Failed to record feedback",
        detail: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
      ),
      { methods: "POST,OPTIONS" },
    )
  }

  if (rating === "down" && !hadRagResults && trustScore >= 2) {
    await supabase.from("knowledge_gaps").insert({
      query,
      app_origin: appOrigin,
      user_id: userId,
      status: "open",
    })
  }

  // Basic feedback abuse detection: many downs, no ups recently
  if (userId) {
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const downsRes = await supabase
      .from("response_feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("rating", "down")
      .gte("created_at", windowStart)

    const upsRes = await supabase
      .from("response_feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("rating", "up")
      .gte("created_at", windowStart)

    const downs = typeof downsRes.count === "number" ? downsRes.count : 0
    const ups = typeof upsRes.count === "number" ? upsRes.count : 0

    if (downs >= 10 && ups === 0) {
      await supabase.from("moderation_log").insert({
        user_id: userId,
        type: "feedback_abuse",
        details: { downs, ups, window_start: windowStart },
      })
    }
  }

  return applyCors(
    req,
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
    { methods: "POST,OPTIONS" },
  )
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}

