import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import {
  fetchCategoryMembers,
  fetchSummary,
  upsertWikiEntry,
  sleep,
} from "./_wiki-helpers"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[Places Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const PLACE_CATEGORIES = [
  "African-American_neighborhoods",
  "African-American_historic_places",
  "Neighborhoods_in_New_York_City",
  "Neighborhoods_in_Atlanta",
  "Neighborhoods_in_Chicago",
  "Neighborhoods_in_Los_Angeles",
  "Neighborhoods_in_Houston",
  "Neighborhoods_in_New_Orleans",
  "Neighborhoods_in_Detroit",
  "Neighborhoods_in_Washington,_D.C.",
]

const EXTRA_ARTICLES = [
  "Apollo_Theater",
  "Cotton_Club",
  "Savoy_Ballroom",
  "1520_Sedgwick_Avenue",
  "Lorraine_Motel",
  "Edmund_Pettus_Bridge",
  "Greenwood_District,_Tulsa",
  "Bronzeville,_Chicago",
  "Sweet_Auburn",
  "Leimert_Park",
  "Treme",
  "Congo_Square",
  "Motown_Records",
  "Stax_Records",
  "Electric_Lady_Studios",
]

const TARGET_CATEGORY = "place"

async function main() {
  console.log(`[Places Seeder] Starting (${PLACE_CATEGORIES.length} categories + ${EXTRA_ARTICLES.length} articles) → ${TARGET_CATEGORY}`)
  let totalInserted = 0
  const seenTitles = new Set<string>()

  for (const categoryName of PLACE_CATEGORIES) {
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
    console.log(`[Places Seeder] Category ${categoryName} done.`)
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
      console.log(`[Places Seeder] Loaded: ${name}`)
    }
  }

  const { count } = await supabase.from("knowledge_entries").select("id", { count: "exact", head: true }).eq("category", TARGET_CATEGORY)
  console.log(`[Places Seeder] Done. New: ${totalInserted}. Total ${TARGET_CATEGORY}: ${typeof count === "number" ? count : "?"}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
