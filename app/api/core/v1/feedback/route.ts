import { getSupabaseAdminClient } from "@/lib/supabase"
import { getSupabaseBrain } from "@/lib/supabase-brain"
import { applyCors, corsPreflight, detectAppOrigin } from "../_utils/cors"

type FeedbackRating = "up" | "down" | "helpful" | "missed"

type FeedbackReason =
  | "inaccurate_facts"
  | "wrong_tone"
  | "too_generic"
  | "missing_cultural_context"
  | "did_not_answer"

type FeedbackBody = {
  // New preferred shape
  conversation_id?: string
  message_index?: number
  rating: FeedbackRating
  reason?: FeedbackReason
  user_query?: string
  bonita_response?: string
  app_origin?: string
  user_id?: string
  had_rag_results?: boolean

  // Backwards-compatible fields
  query?: string
  response?: string
}

export async function POST(req: Request) {
  const admin = getSupabaseAdminClient()
  const brain = getSupabaseBrain()
  if (!brain) {
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

  const query = (body.user_query || body.query || "").trim()
  const response = (body.bonita_response || body.response || "").trim()
  const rawRating = body.rating

  if (!query || !response || !rawRating) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        ok: false,
        error:
          "user_query/bonita_response (or query/response) and rating are required",
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

  const conversationId =
    typeof body.conversation_id === "string" && body.conversation_id.trim().length
      ? body.conversation_id.trim()
      : null
  const messageIndex =
    typeof body.message_index === "number" && Number.isFinite(body.message_index)
      ? body.message_index
      : null

  // Normalize rating to canonical 'up' | 'down' for storage/analytics
  const rating: "up" | "down" =
    rawRating === "helpful"
      ? "up"
      : rawRating === "missed"
      ? "down"
      : rawRating === "up"
      ? "up"
      : "down"

  let trustScore = 1

  if (userId && admin) {
    const { data: userRow } = await admin
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
      await admin
        .from("user_context")
        .update({
          ...update,
          last_active: new Date().toISOString(),
        })
        .eq("user_id", userId)
    }
  }

  const { error } = await brain.from("response_feedback").insert({
    query,
    response,
    rating,
    reason,
    app_origin: appOrigin,
    user_id: userId,
    conversation_id: conversationId,
    message_index: messageIndex,
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

  // Knowledge gaps: only when Bonita truly "missed" the mark
  if (
    rating === "down" &&
    reason &&
    (reason === "did_not_answer" || reason === "missing_cultural_context")
  ) {
    const topic = query.split(/[.!?]/)[0].slice(0, 160)
    await brain.from("knowledge_gaps").insert({
      query,
      topic,
      app_origin: appOrigin,
      user_id: userId,
      status: "open",
    })
  }

  // Basic feedback abuse detection: many downs, no ups recently
  if (userId) {
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const downsRes = await brain
      .from("response_feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("rating", "down")
      .gte("created_at", windowStart)

    const upsRes = await brain
      .from("response_feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("rating", "up")
      .gte("created_at", windowStart)

    const downs = typeof downsRes.count === "number" ? downsRes.count : 0
    const ups = typeof upsRes.count === "number" ? upsRes.count : 0

    if (downs >= 10 && ups === 0) {
      await brain.from("moderation_log").insert({
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

