import { createClient } from "@supabase/supabase-js"

/**
 * Server-side only — Bonita's sovereign knowledge brain (bonita-data-layer).
 * Use for: knowledge_entries, regional_knowledge, cultural_*, artifacts, conversations, response_feedback, etc.
 * Auth, profiles, subscriptions, user_context stay on the default (heybonita) client.
 */
export function getSupabaseBrain() {
  const url = process.env.BONITA_BRAIN_URL
  const key = process.env.BONITA_BRAIN_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
