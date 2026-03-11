import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[LOC Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Check your .env.",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const COLLECTIONS = [
  "african-american-photographs-1900-paris-exposition",
  "african-american-band-music-and-recordings",
  "civil-rights-history-project",
  "rosa-parks-papers",
  "naacp-records",
  "frederick-douglass-papers",
]

const SEARCH_QUERIES = [
  "african american history",
  "civil rights",
  "jazz",
  "harlem renaissance",
  "hip hop",
  "negro leagues",
  "HBCU",
]

type LocItem = {
  id?: string
  title?: string
  description?: string | string[]
  item?: { title?: string; description?: string[] }
  resources?: { url?: string }[]
  image_url?: string
  [key: string]: unknown
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function extractTitle(item: LocItem): string {
  return (
    item.title ||
    item.item?.title ||
    (Array.isArray(item.description) ? item.description[0] : item.description) ||
    "Untitled"
  )
}

function extractDescription(item: LocItem): string | null {
  if (typeof item.description === "string") return item.description
  if (Array.isArray(item.description) && item.description.length) return item.description.join(" ")
  return item.item?.description?.[0] || null
}

function extractImageUrl(item: LocItem): string | null {
  if (item.image_url) return item.image_url
  const res = item.resources?.[0]
  return (res && "url" in res ? (res as { url?: string }).url : null) || null
}

async function fetchCollection(name: string): Promise<LocItem[]> {
  const url = `https://www.loc.gov/collections/${name}/?fo=json&c=100`
  const res = await fetch(url, {
    headers: { "User-Agent": "BonitaLOCSeeder/1.0 (https://contentcreators.life)" },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { results?: LocItem[]; content?: { results?: LocItem[] } }
  return data.results ?? data.content?.results ?? []
}

async function fetchSearch(query: string): Promise<LocItem[]> {
  const url = `https://www.loc.gov/search/?q=${encodeURIComponent(query)}&fo=json&c=100`
  const res = await fetch(url, {
    headers: { "User-Agent": "BonitaLOCSeeder/1.0 (https://contentcreators.life)" },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { results?: LocItem[]; content?: { results?: LocItem[] } }
  return data.results ?? data.content?.results ?? []
}

async function main() {
  console.log(
    `[LOC Seeder] Starting Library of Congress seed (${COLLECTIONS.length} collections + ${SEARCH_QUERIES.length} searches)...`,
  )

  let totalInserted = 0
  const seenIds = new Set<string>()

  for (const name of COLLECTIONS) {
    await sleep(500)
    const results = await fetchCollection(name)
    console.log(`[LOC Seeder] Collection "${name}": ${results.length} items`)

    for (const item of results) {
      const id = item.id || extractTitle(item)
      if (seenIds.has(id)) continue
      seenIds.add(id)

      const { data: existing } = await supabase
        .from("artifacts")
        .select("id")
        .eq("source_museum", "LOC")
        .eq("source_id", id)
        .limit(1)

      if (existing?.length) continue

      const title = extractTitle(item)
      const { error } = await supabase.from("artifacts").insert({
        source_museum: "LOC",
        source_id: id,
        title,
        description: extractDescription(item),
        creator: null,
        date_created: null,
        medium: null,
        culture: null,
        classification: name,
        image_url: extractImageUrl(item),
        thumbnail_url: extractImageUrl(item),
        metadata: item,
      })

      if (!error) {
        totalInserted += 1
        console.log(`[LOC Seeder] [${name}] Loaded: ${title}`)
      }
    }
  }

  for (const query of SEARCH_QUERIES) {
    await sleep(500)
    const results = await fetchSearch(query)
    console.log(`[LOC Seeder] Search "${query}": ${results.length} items`)

    for (const item of results) {
      const id = item.id || extractTitle(item)
      if (seenIds.has(id)) continue
      seenIds.add(id)

      const { data: existing } = await supabase
        .from("artifacts")
        .select("id")
        .eq("source_museum", "LOC")
        .eq("source_id", id)
        .limit(1)

      if (existing?.length) continue

      const title = extractTitle(item)
      const { error } = await supabase.from("artifacts").insert({
        source_museum: "LOC",
        source_id: id,
        title,
        description: extractDescription(item),
        creator: null,
        date_created: null,
        medium: null,
        culture: null,
        classification: `search:${query}`,
        image_url: extractImageUrl(item),
        thumbnail_url: extractImageUrl(item),
        metadata: item,
      })

      if (!error) {
        totalInserted += 1
        console.log(`[LOC Seeder] [${query}] Loaded: ${title}`)
      }
    }
  }

  const { count } = await supabase
    .from("artifacts")
    .select("id", { count: "exact", head: true })
    .eq("source_museum", "LOC")

  console.log(
    `[LOC Seeder] Done. New this run: ${totalInserted}. LOC artifacts total: ${typeof count === "number" ? count : "?"}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[LOC Seeder] Fatal:", err)
    process.exit(1)
  })
