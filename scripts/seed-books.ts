import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[Books Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Check your .env.",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const SUBJECTS = [
  "african_american_fiction",
  "african_american_history",
  "african_american_poetry",
  "black_history",
  "civil_rights",
  "hip_hop",
  "harlem_renaissance",
  "jazz_music",
  "latin_american_literature",
  "african_literature",
  "black_feminism",
  "pan_africanism",
]

type OpenLibraryWork = {
  key: string
  title: string
  authors?: { key: string; name: string }[]
  first_publish_year?: number
  subject?: string[]
}

type OpenLibrarySubjectsResponse = {
  key: string
  name: string
  work_count: number
  works: OpenLibraryWork[]
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchSubject(subject: string): Promise<OpenLibraryWork[]> {
  const url = `https://openlibrary.org/subjects/${subject}.json?limit=200`
  const res = await fetch(url, {
    headers: { "User-Agent": "BonitaBooksSeeder/1.0 (https://contentcreators.life)" },
  })
  if (!res.ok) return []
  const data = (await res.json()) as OpenLibrarySubjectsResponse
  return data.works ?? []
}

async function main() {
  console.log(`[Books Seeder] Starting Open Library seed (${SUBJECTS.length} subjects)...`)

  let totalInserted = 0
  const seenKeys = new Set<string>()

  for (const subject of SUBJECTS) {
    await sleep(300)
    const works = await fetchSubject(subject)
    console.log(`[Books Seeder] Subject "${subject}": ${works.length} works`)

    for (const work of works) {
      const key = work.key
      if (seenKeys.has(key)) continue
      seenKeys.add(key)

      const { data: existing } = await supabase
        .from("knowledge_documents")
        .select("id")
        .eq("source", "open_library")
        .eq("source_url", `https://openlibrary.org${key}`)
        .limit(1)

      if (existing?.length) continue

      const authors = work.authors?.map((a) => a.name).join(", ") || null
      const description = [
        authors && `By ${authors}.`,
        work.first_publish_year && `First published ${work.first_publish_year}.`,
        work.subject?.slice(0, 5).join(", "),
      ]
        .filter(Boolean)
        .join(" ")

      const { error } = await supabase.from("knowledge_documents").insert({
        title: work.title,
        authors: authors || null,
        description: description || null,
        source: "open_library",
        source_url: `https://openlibrary.org${key}`,
        content_type: "book",
        metadata: work,
      })

      if (!error) {
        totalInserted += 1
        console.log(`[Books Seeder] [${subject}] Loaded: ${work.title}`)
      }
    }
  }

  const { count } = await supabase
    .from("knowledge_documents")
    .select("id", { count: "exact", head: true })
    .eq("content_type", "book")

  console.log(
    `[Books Seeder] Done. New this run: ${totalInserted}. knowledge_documents (book) total: ${typeof count === "number" ? count : "?"}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[Books Seeder] Fatal:", err)
    process.exit(1)
  })
