import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[Met Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Check your .env.",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// 150ms between requests to stay within Met API limits
const MET_RATE_MS = 150
const MAX_OBJECT_IDS_PER_TERM = 500

// Targeted terms for Black and Brown cultural collections (Met has 470k+ open access objects)
const SEARCH_TERMS = [
  "African American art",
  "Harlem",
  "African textile",
  "Caribbean art",
  "Mexican art",
  "Egyptian sculpture",
  "Islamic calligraphy",
  "Japanese woodblock",
  "Indian sculpture",
  "Pre-Columbian",
  "African mask",
  "jazz",
  "portrait photography",
  "civil rights",
  "quilt",
  "basketry",
  "african american",
  "african art",
  "caribbean",
  "latin american",
  "textile",
  "quilts",
  "photography",
  "egyptian",
  "islamic",
  "modern art",
  "contemporary art",
]

type MetSearchResponse = { total?: number; objectIDs?: number[] }
type MetObject = {
  objectID?: number
  title?: string
  objectDate?: string
  medium?: string
  culture?: string
  department?: string
  classification?: string
  primaryImage?: string
  primaryImageSmall?: string
  artistDisplayName?: string
  objectURL?: string
  [key: string]: unknown
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function searchIds(query: string): Promise<number[]> {
  const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: { "User-Agent": "BonitaMetSeeder/1.0 (https://contentcreators.life)" },
  })
  if (!res.ok) return []
  const data = (await res.json()) as MetSearchResponse
  const full = data.objectIDs ?? []
  return full.slice(0, MAX_OBJECT_IDS_PER_TERM)
}

async function fetchObject(id: number): Promise<MetObject | null> {
  const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
  const res = await fetch(url, {
    headers: { "User-Agent": "BonitaMetSeeder/1.0 (https://contentcreators.life)" },
  })
  if (!res.ok) return null
  return (await res.json()) as MetObject
}

async function main() {
  console.log(`[Met Seeder] Starting Met Museum bulk seed (${SEARCH_TERMS.length} search terms, up to ${MAX_OBJECT_IDS_PER_TERM} objects/term)...`)

  // Preload existing Met source_ids once — duplicate check is by source_id only (not title)
  const existingSourceIds = new Set<string>()
  let offset = 0
  const pageSize = 1000
  while (true) {
    const { data: rows, error } = await supabase
      .from("artifacts")
      .select("source_id")
      .eq("source_museum", "Met")
      .range(offset, offset + pageSize - 1)
    if (error) break
    const list = rows ?? []
    for (const r of list) {
      if (r.source_id) existingSourceIds.add(String(r.source_id))
    }
    if (list.length < pageSize) break
    offset += pageSize
  }
  console.log(`[Met Seeder] Already in DB: ${existingSourceIds.size} Met artifacts. Will skip those by source_id only.`)

  const seenIds = new Set<number>()
  let totalInserted = 0

  for (const query of SEARCH_TERMS) {
    console.log(`[Met Seeder] Search: "${query}"`)
    const ids = await searchIds(query)
    await sleep(MET_RATE_MS)

    const newIds = ids.filter((id) => !seenIds.has(id))
    console.log(`[Met Seeder] "${query}" — ${ids.length} IDs (max ${MAX_OBJECT_IDS_PER_TERM}/term), ${newIds.length} new to process`)
    let count = 0

    for (const id of newIds) {
      seenIds.add(id)
      const obj = await fetchObject(id)
      await sleep(MET_RATE_MS)

      if (!obj?.objectID) continue
      const sourceId = String(obj.objectID)
      if (existingSourceIds.has(sourceId)) continue

      const title = obj.title || "Untitled"
      const { error } = await supabase.from("artifacts").insert({
        source_museum: "Met",
        source_id: sourceId,
        title,
        description: obj.objectDate ? `${obj.objectDate}. ${obj.medium || ""}`.trim() || null : obj.medium || null,
        creator: obj.artistDisplayName || null,
        date_created: obj.objectDate || null,
        medium: obj.medium || null,
        culture: obj.culture || null,
        classification: obj.classification || null,
        image_url: obj.primaryImage || null,
        thumbnail_url: obj.primaryImageSmall || obj.primaryImage || null,
        metadata: obj,
      })

      if (!error) {
        existingSourceIds.add(sourceId)
        totalInserted += 1
        count += 1
        console.log(`[Met Seeder] [${query}] Loaded: ${title}`)
      }
    }

    console.log(`[Met Seeder] "${query}" — inserted: ${count} (processed ${newIds.length} objects)`)
  }

  const { count } = await supabase
    .from("artifacts")
    .select("id", { count: "exact", head: true })
    .eq("source_museum", "Met")

  console.log(
    `[Met Seeder] Done. New this run: ${totalInserted}. Met artifacts total: ${typeof count === "number" ? count : "?"}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[Met Seeder] Fatal:", err)
    process.exit(1)
  })
