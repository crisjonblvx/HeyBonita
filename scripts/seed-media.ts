import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { fetchSummary, upsertWikiEntry, sleep } from "./_wiki-helpers"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[Media Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const MEDIA_ARTICLES = [
  "Ebony_(magazine)",
  "Jet_(magazine)",
  "Essence_(magazine)",
  "The_Source_(magazine)",
  "Vibe_(magazine)",
  "XXL_(magazine)",
  "Black_Enterprise",
  "BET_(TV_network)",
  "Soul_Train",
  "Def_Comedy_Jam",
  "Showtime_at_the_Apollo",
  "The_Wire",
  "Atlanta_(TV_series)",
  "Insecure_(TV_series)",
  "A_Different_World_(TV_series)",
  "Living_Single",
  "Fresh_Prince_of_Bel-Air",
  "Chicago_Defender",
  "Pittsburgh_Courier",
  "Amsterdam_News",
  "The_Crisis_(magazine)",
  "WorldStarHipHop",
]

const TARGET_CATEGORY = "media"

async function main() {
  console.log(`[Media Seeder] Starting (${MEDIA_ARTICLES.length} articles) → ${TARGET_CATEGORY}`)
  let totalInserted = 0

  for (const title of MEDIA_ARTICLES) {
    await sleep(1000)
    const summary = await fetchSummary(title)
    if (!summary?.title) continue
    const name = summary.title
    const inserted = await upsertWikiEntry(supabase, {
      name,
      biography: summary.extract || null,
      description: summary.description || null,
      category: TARGET_CATEGORY,
      subcategory: "media",
      tags: summary.description ? [summary.description] : [],
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`,
    })
    if (inserted) {
      totalInserted += 1
      console.log(`[Media Seeder] Loaded: ${name}`)
    }
  }

  const { count } = await supabase.from("knowledge_entries").select("id", { count: "exact", head: true }).eq("category", TARGET_CATEGORY)
  console.log(`[Media Seeder] Done. New: ${totalInserted}. Total ${TARGET_CATEGORY}: ${typeof count === "number" ? count : "?"}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
