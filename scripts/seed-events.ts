import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import {
  fetchCategoryMembers,
  fetchSummary,
  upsertWikiEntry,
  extractYear,
  sleep,
} from "./_wiki-helpers"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[Events Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const EVENT_CATEGORIES = [
  "African-American_civil_rights_movement_events",
  "Civil_rights_protests_in_the_United_States",
  "Race_riots_in_the_United_States",
  "Reconstruction_Era",
  "Jim_Crow_laws",
  "Desegregation_in_the_United_States",
  "Black_Lives_Matter",
  "African-American_history",
  "History_of_slavery_in_the_United_States",
  "Underground_Railroad",
  "African-American_firsts",
  "Haitian_Revolution",
  "United_States_civil_rights_case_law",
]

const TARGET_CATEGORY = "historical-event"

async function main() {
  console.log(`[Events Seeder] Starting (${EVENT_CATEGORIES.length} categories) → ${TARGET_CATEGORY}`)
  let totalInserted = 0
  const seenTitles = new Set<string>()

  for (const categoryName of EVENT_CATEGORIES) {
    await sleep(1000)
    const members = await fetchCategoryMembers(categoryName)
    if (!members.length) {
      console.log(`[Events Seeder] No members: ${categoryName}`)
      continue
    }
    const titles = Array.from(new Set(members.map((m) => m.title)))
    let idx = 0
    for (const title of titles) {
      if (seenTitles.has(title)) continue
      seenTitles.add(title)
      idx += 1
      const summary = await fetchSummary(title)
      if (!summary?.title) continue
      const name = summary.title
      const bio = summary.extract || null
      const year = extractYear(bio || summary.description || "")
      const inserted = await upsertWikiEntry(supabase, {
        name,
        biography: bio,
        description: summary.description || null,
        category: TARGET_CATEGORY,
        subcategory: categoryName,
        tags: summary.description ? [summary.description, categoryName] : [categoryName],
        sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`,
        birthYear: year,
      })
      if (inserted) {
        totalInserted += 1
        console.log(`[Category: ${categoryName}] [${idx}/${titles.length}] Loaded: ${name}`)
      }
    }
    console.log(`[Events Seeder] ${categoryName} done.`)
  }

  const { count } = await supabase.from("knowledge_entries").select("id", { count: "exact", head: true }).eq("category", TARGET_CATEGORY)
  console.log(`[Events Seeder] Done. New: ${totalInserted}. Total ${TARGET_CATEGORY}: ${typeof count === "number" ? count : "?"}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
