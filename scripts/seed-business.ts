import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { fetchCategoryMembers, fetchSummary, upsertWikiEntry, sleep } from "./_wiki-helpers"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[Business Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const BUSINESS_CATEGORIES = [
  "African-American_businesspeople",
  "African-American_billionaires",
  "African-American-owned_companies",
  "African-American_banks",
]

const SPECIFIC_ARTICLES = [
  "Black_Wall_Street",
  "Madam_C._J._Walker",
  "Robert_F._Smith_(investor)",
  "BET_(TV_network)",
  "Essence_(magazine)",
  "Ebony_(magazine)",
  "Motown_Records",
  "Def_Jam_Recordings",
  "Bad_Boy_Records",
  "Death_Row_Records",
  "Cash_Money_Records",
  "Roc-A-Fella_Records",
  "Tyler_Perry_Studios",
]

const TARGET_CATEGORY = "business"

async function main() {
  console.log(`[Business Seeder] Starting (${BUSINESS_CATEGORIES.length} categories + ${SPECIFIC_ARTICLES.length} articles) → ${TARGET_CATEGORY}`)
  let totalInserted = 0
  const seenTitles = new Set<string>()

  for (const categoryName of BUSINESS_CATEGORIES) {
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
    console.log(`[Business Seeder] ${categoryName} done.`)
  }

  for (const title of SPECIFIC_ARTICLES) {
    if (seenTitles.has(title)) continue
    seenTitles.add(title)
    await sleep(1000)
    const summary = await fetchSummary(title)
    if (!summary?.title) continue
    const name = summary.title
    const inserted = await upsertWikiEntry(supabase, {
      name,
      biography: summary.extract || null,
      description: summary.description || null,
      category: TARGET_CATEGORY,
      subcategory: "business",
      tags: summary.description ? [summary.description] : [],
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`,
    })
    if (inserted) {
      totalInserted += 1
      console.log(`[Business Seeder] Loaded: ${name}`)
    }
  }

  const { count } = await supabase.from("knowledge_entries").select("id", { count: "exact", head: true }).eq("category", TARGET_CATEGORY)
  console.log(`[Business Seeder] Done. New: ${totalInserted}. Total ${TARGET_CATEGORY}: ${typeof count === "number" ? count : "?"}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
