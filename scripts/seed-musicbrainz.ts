import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[MusicBrainz Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Check your .env.",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const TAGS = [
  "hip hop",
  "r&b",
  "soul",
  "jazz",
  "blues",
  "funk",
  "gospel",
  "reggae",
  "salsa",
  "afrobeat",
  "neo-soul",
  "trap",
  "house",
  "techno",
  "dancehall",
  "cumbia",
  "bachata",
  "bossa nova",
]

type MusicBrainzArtist = {
  id: string
  name: string
  "life-span"?: { begin?: string; end?: string }
  disambiguation?: string
  tags?: { name: string; count?: number }[]
}

type MusicBrainzResponse = {
  artists?: MusicBrainzArtist[]
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchArtistsByTag(tag: string, offset = 0): Promise<MusicBrainzArtist[]> {
  const url = `https://musicbrainz.org/ws/2/artist/?query=tag:${encodeURIComponent(tag)}&limit=100&offset=${offset}&fmt=json`
  const res = await fetch(url, {
    headers: {
      "User-Agent": "BonitaMusicBrainzSeeder/1.0 (https://contentcreators.life)",
    },
  })
  if (!res.ok) return []
  const data = (await res.json()) as MusicBrainzResponse
  return data.artists ?? []
}

async function main() {
  console.log(`[MusicBrainz Seeder] Starting MusicBrainz seed (${TAGS.length} tags, 1 req/sec)...`)

  let totalInserted = 0
  const seenIds = new Set<string>()

  for (const tag of TAGS) {
    let offset = 0
    let hasMore = true

    while (hasMore) {
      await sleep(1100)
      const artists = await fetchArtistsByTag(tag, offset)
      if (!artists.length) break

      for (const artist of artists) {
        if (seenIds.has(artist.id)) continue
        seenIds.add(artist.id)

        const { data: existing } = await supabase
          .from("knowledge_entries")
          .select("id")
          .eq("source", "musicbrainz")
          .eq("source_url", `https://musicbrainz.org/artist/${artist.id}`)
          .limit(1)

        if (existing?.length) continue

        const begin = artist["life-span"]?.begin
        const end = artist["life-span"]?.end
        const bio = [begin && `Active from ${begin}`, end && begin !== end && `to ${end}`, artist.disambiguation]
          .filter(Boolean)
          .join(". ")

        const { error } = await supabase.from("knowledge_entries").insert({
          category: "musician",
          subcategory: tag,
          name: artist.name,
          biography: bio || null,
          key_contributions: null,
          tags: artist.tags?.map((t) => t.name).slice(0, 10) || [tag],
          source: "musicbrainz",
          source_url: `https://musicbrainz.org/artist/${artist.id}`,
        })

        if (!error) {
          totalInserted += 1
          console.log(`[MusicBrainz Seeder] [${tag}] Loaded: ${artist.name}`)
        }
      }

      offset += 100
      hasMore = artists.length === 100
    }

    console.log(`[MusicBrainz Seeder] Tag "${tag}" done.`)
  }

  const { count } = await supabase
    .from("knowledge_entries")
    .select("id", { count: "exact", head: true })
    .eq("source", "musicbrainz")

  console.log(
    `[MusicBrainz Seeder] Done. New this run: ${totalInserted}. MusicBrainz knowledge_entries total: ${typeof count === "number" ? count : "?"}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[MusicBrainz Seeder] Fatal:", err)
    process.exit(1)
  })
