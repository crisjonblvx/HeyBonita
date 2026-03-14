"use client"

import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

/**
 * Returns the Supabase browser client (cookie-based session storage for SSR/middleware).
 * Returns null on server or when env vars are missing.
 */
export function getSupabaseClient() {
  if (typeof window === "undefined") return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url?.trim() || !key?.trim()) {
    if (typeof console !== "undefined") {
      console.warn("[Bonita] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Supabase client is disabled.")
    }
    return null
  }
  if (!client) client = createBrowserClient(url, key)
  return client
}

