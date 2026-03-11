import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[Cleveland Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Check your .env.",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const PAGE_SIZE = 100

type ClevelandArtwork = {
  id: number
  accession_number?: string
  title?: string
  tombstone?: string
  description?: string
  creation_date?: string
  technique?: string
  creators?: { name?: string; description?: string }[]
  culture?: string[]
  department?: string
  type?: string
  url?: string
  images?: Record<string, { url?: string }>
  [key: string]: unknown
}

type ClevelandResponse = {
  info?: { total?: number }
  data?: ClevelandArtwork[]
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchPage(skip: number): Promise<ClevelandResponse> {
  const url = `https://openaccess-api.clevelandart.org/api/artworks/?african_american_artists=1&limit=${PAGE_SIZE}&skip=${skip}`
  const res = await fetch(url, {
    headers: { "User-Agent": "BonitaClevelandSeeder/1.0 (https://contentcreators.life)" },
  })
  if (!res.ok) return {}
  return (await res.json()) as ClevelandResponse
}

async function main() {
  console.log("[Cleveland Seeder] Starting Cleveland Museum seed (african_american_artists=1)...")

  let totalInserted = 0
  let skip = 0
  let totalFetched = 0

  while (true) {
    await sleep(200)
    const resp = await fetchPage(skip)
    const data = resp.data ?? []
    const total = resp.info?.total ?? 0

    if (!data.length) break

    for (const item of data) {
      const sourceId = String(item.id)

      const { data: existing } = await supabase
        .from("artifacts")
        .select("id")
        .eq("source_museum", "Cleveland")
        .eq("source_id", sourceId)
        .limit(1)

      if (existing?.length) continue

      const title = item.title || item.tombstone || "Untitled"
      const creator = item.creators?.[0]?.name || item.creators?.[0]?.description || null
      const imageUrl = item.images?.web?.url ?? null

      const { error } = await supabase.from("artifacts").insert({
        source_museum: "Cleveland",
        source_id: sourceId,
        title,
        description: item.description || item.tombstone || null,
        creator,
        date_created: item.creation_date || null,
        medium: item.technique || null,
        culture: Array.isArray(item.culture) ? item.culture.join(", ") : item.culture || null,
        classification: item.type || item.department || null,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        metadata: item,
      })

      if (!error) {
        totalInserted += 1
        console.log(`[Cleveland Seeder] [${skip + 1}-${skip + data.length}] Loaded: ${title}`)
      }
    }

    totalFetched += data.length
    if (data.length < PAGE_SIZE || totalFetched >= total) break
    skip += PAGE_SIZE
  }

  const { count } = await supabase
    .from("artifacts")
    .select("id", { count: "exact", head: true })
    .eq("source_museum", "Cleveland")

  console.log(
    `[Cleveland Seeder] Done. New this run: ${totalInserted}. Cleveland artifacts total: ${typeof count === "number" ? count : "?"}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[Cleveland Seeder] Fatal:", err)
    process.exit(1)
  })
