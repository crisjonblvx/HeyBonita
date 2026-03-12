"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

if (typeof window !== "undefined") {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Non-fatal: components that depend on auth should handle null client gracefully.
    console.warn(
      "[Bonita] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Auth features are disabled.",
    )
  } else {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
      },
    })
  }
}

export const supabaseBrowserClient = client

