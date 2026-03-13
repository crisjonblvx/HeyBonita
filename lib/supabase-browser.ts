"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

if (typeof window !== "undefined") {
  if (!SUPABASE_URL?.trim() || !SUPABASE_ANON_KEY?.trim()) {
    console.warn(
      "[Bonita] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Supabase client is disabled.",
    )
    client = null
  } else {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
      },
    })
  }
}

export const supabaseBrowserClient = client

