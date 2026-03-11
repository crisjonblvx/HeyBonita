import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { fetchCategoryMembers, fetchSummary, upsertWikiEntry, sleep } from "./_wiki-helpers"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[Dance Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const DANCE_CATEGORIES = [
  "African-American_dance",
  "Hip-hop_dance",
  "Jazz_dance",
  "Caribbean_dance",
  "Latin_dances",
  "African_dances",
  "Street_dance",
]

const EXTRA_ARTICLES = [
  "Stepping_(African-American)",
  "Breaking_(dance)",
  "Popping",
  "Locking_(dance)",
  "Krumping",
  "Voguing",
  "Ring_shout",
  "Cakewalk",
  "Lindy_Hop",
  "Salsa_(dance)",
  "Capoeira",
  "Dancehall_(dance)",
  "Second_line_(parades)",
]

const TARGET_CATEGORY = "dance"

async function main() {
  console.log(`[Dance Seeder] Starting (${DANCE_CATEGORIES.length} categories + ${EXTRA_ARTICLES.length} articles) → ${TARGET_CATEGORY}`)
  let totalInserted = 0
  const seenTitles = new Set<string>()

  for (const categoryName of DANCE_CATEGORIES) {
    await sleep(1000)
    const members = await fetchCategoryMembers(categoryName)
    const titles = Array.from(new Set(members.map((m) => m.title)))
    for (const title of titles) {
      if (seenTitles.has(title)) continue
      seenTitles.add(title)
      const summary = await fetchSummary(title)
      if (!summary?.title) continue
      const name = summary.title
      const inserted = await upsertWikiEntry(supabase, {
        name,
        biography: summary.extract || null,
        description: summary.description || null,
        category: TARGET_CATEGORY,
        subcategory: categoryName,
        tags: summary.description ? [summary.description, categoryName] : [categoryName],
        sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`,
      })
      if (inserted) totalInserted += 1
    }
    console.log(`[Dance Seeder] ${categoryName} done.`)
  }

  for (const title of EXTRA_ARTICLES) {
    if (seenTitles.has(title)) continue
    seenTitles.add(title)
    const summary = await fetchSummary(title)
    if (!summary?.title) continue
    const name = summary.title
    const inserted = await upsertWikiEntry(supabase, {
      name,
      biography: summary.extract || null,
      description: summary.description || null,
      category: TARGET_CATEGORY,
      subcategory: TARGET_CATEGORY,
      tags: summary.description ? [summary.description, TARGET_CATEGORY] : [TARGET_CATEGORY],
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`,
    })
    if (inserted) {
      totalInserted += 1
      console.log(`[Dance Seeder] Loaded: ${name}`)
    }
  }

  const { count } = await supabase.from("knowledge_entries").select("id", { count: "exact", head: true }).eq("category", TARGET_CATEGORY)
  console.log(`[Dance Seeder] Done. New: ${totalInserted}. Total ${TARGET_CATEGORY}: ${typeof count === "number" ? count : "?"}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
