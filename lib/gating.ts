import { SupabaseClient } from "@supabase/supabase-js"

export type GatingResult =
  | { allowed: true }
  | { allowed: false; reason: "no_profile" | "limit_reached"; plan?: string; limit?: number }

export async function checkPlanAccess(userId: string, supabase: SupabaseClient): Promise<GatingResult> {
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, query_limit")
    .eq("id", userId)
    .single()

  if (!profile) return { allowed: false, reason: "no_profile" }

  if (profile.plan === "home") return { allowed: true }

  const queryLimit = profile.query_limit ?? 10

  const { data: usage } = await supabase
    .from("usage")
    .select("id, query_count")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle()

  let currentCount = 0
  let usageId: string | null = null

  if (usage) {
    currentCount = usage.query_count ?? 0
    usageId = usage.id
  } else {
    const { data: newUsage } = await supabase
      .from("usage")
      .insert({ user_id: userId, month: currentMonth, query_count: 0 })
      .select("id")
      .single()
    usageId = newUsage?.id ?? null
  }

  if (currentCount >= queryLimit) {
    return { allowed: false, reason: "limit_reached", plan: profile.plan, limit: queryLimit }
  }

  if (usageId) {
    await supabase
      .from("usage")
      .update({ query_count: currentCount + 1, updated_at: new Date().toISOString() })
      .eq("id", usageId)
  }

  return { allowed: true }
}
