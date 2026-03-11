/**
 * Shared Wikipedia API helpers for gap-filling seeders.
 * Category API + Summary API + upsert into knowledge_entries.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export type CategoryMember = { pageid: number; title: string }
export type WikiSummary = {
  title?: string
  extract?: string
  description?: string
  type?: string
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchCategoryMembers(categoryName: string): Promise<CategoryMember[]> {
  const all: CategoryMember[] = []
  let cmcontinue: string | undefined
  while (true) {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${categoryName}`,
      cmlimit: "500",
      cmtype: "page",
      format: "json",
    })
    if (cmcontinue) params.set("cmcontinue", cmcontinue)
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
      headers: { "User-Agent": "BonitaCultureSeeder/1.0 (https://contentcreators.life)" },
    })
    await sleep(1000)
    if (!res.ok) break
    const json = (await res.json()) as {
      query?: { categorymembers?: CategoryMember[] }
      continue?: { cmcontinue?: string }
    }
    const members = json.query?.categorymembers ?? []
    all.push(...members)
    cmcontinue = json.continue?.cmcontinue
    if (!cmcontinue) break
  }
  return all
}

export async function fetchSummary(title: string): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BonitaCultureSeeder/1.0 (https://contentcreators.life)" },
    })
    await sleep(1000)
    if (!res.ok) return null
    const data = (await res.json()) as WikiSummary
    if (data.type === "disambiguation") return null
    return data
  } catch {
    return null
  }
}

/** Extract a plausible year from text (first 4-digit year in 1xxx or 2xxx). */
export function extractYear(text: string | null | undefined): number | null {
  if (!text) return null
  const match = text.match(/\b(1\d{3}|20\d{2})\b/)
  return match ? parseInt(match[1], 10) : null
}

export async function upsertWikiEntry(
  supabase: SupabaseClient,
  opts: {
    name: string
    biography: string | null
    description: string | null
    category: string
    subcategory?: string | null
    tags?: string[]
    sourceUrl: string
    birthYear?: number | null
  },
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("knowledge_entries")
    .select("id")
    .eq("name", opts.name)
    .limit(1)
  if (existing?.length) return false

  const { error } = await supabase.from("knowledge_entries").insert({
    category: opts.category,
    subcategory: opts.subcategory ?? null,
    name: opts.name,
    biography: opts.biography,
    key_contributions: null,
    tags: opts.tags ?? [],
    source: "wikipedia",
    source_url: opts.sourceUrl,
    birth_year: opts.birthYear ?? null,
  })
  if (error) {
    console.error(`[Seeder] Insert error for ${opts.name}:`, error.message)
    return false
  }
  return true
}
