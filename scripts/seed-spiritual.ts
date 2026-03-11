import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { fetchCategoryMembers, fetchSummary, upsertWikiEntry, sleep } from "./_wiki-helpers"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[Spiritual Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const SPIRITUAL_CATEGORIES = [
  "African-American_Christianity",
  "African_Methodist_Episcopal_Church",
  "Black_church",
  "Gospel_music",
  "Negro_spiritual",
  "Nation_of_Islam",
  "African-American_Muslims",
  "Rastafari",
  "Haitian_Vodou",
  "Santería",
  "Candomblé",
  "Yoruba_religion",
  "African_diaspora_religions",
]

const TARGET_CATEGORY = "spiritual"

async function main() {
  console.log(`[Spiritual Seeder] Starting (${SPIRITUAL_CATEGORIES.length} categories) → ${TARGET_CATEGORY}`)
  let totalInserted = 0
  const seenTitles = new Set<string>()

  for (const categoryName of SPIRITUAL_CATEGORIES) {
    await sleep(300)
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
    console.log(`[Spiritual Seeder] ${categoryName} done.`)
  }

  const { count } = await supabase.from("knowledge_entries").select("id", { count: "exact", head: true }).eq("category", TARGET_CATEGORY)
  console.log(`[Spiritual Seeder] Done. New: ${totalInserted}. Total ${TARGET_CATEGORY}: ${typeof count === "number" ? count : "?"}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
