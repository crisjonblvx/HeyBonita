import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[Bonita Bulk Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Check your .env.",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

type CategoryConfig = {
  name: string
}

type CategoryMember = {
  pageid: number
  title: string
}

type WikiSummary = {
  title?: string
  extract?: string
  description?: string
  type?: string
}

const CATEGORIES: string[] = [
  // Black scientists, mathematicians, inventors
  "African-American scientists",
  "African-American mathematicians",
  "African-American inventors",
  "African-American engineers",
  "African-American physicians",
  "African-American chemists",
  "African-American physicists",
  "African-American astronauts",
  "African-American women scientists",

  // Musicians
  "African-American male rappers",
  "African-American women rappers",
  "African-American male singer-songwriters",
  "African-American women singer-songwriters",
  "African-American record producers",
  "American jazz musicians",
  "American blues musicians",
  "American soul musicians",
  "American funk musicians",
  "Salsa musicians",
  "Reggae musicians",
  "Afrobeat musicians",
  "American hip hop musicians",
  "Neo soul singers",

  // Authors and poets
  "African-American novelists",
  "African-American poets",
  "African-American dramatists and playwrights",
  "African-American journalists",
  "African-American non-fiction writers",
  "Afro-Caribbean writers",
  "Latin American novelists",

  // Filmmakers and actors
  "African-American film directors",
  "African-American television directors",
  "African-American screenwriters",
  "African-American film producers",
  "Mexican film directors",

  // Visual artists
  "African-American painters",
  "African-American sculptors",
  "African-American photographers",
  "African-American contemporary artists",
  "Mexican painters",

  // Activists and leaders
  "African-American civil rights activists",
  "African-American feminists",
  "Pan-Africanists",
  "American civil rights activists",
  "Chicano activists",

  // Athletes
  "African-American basketball players",
  "African-American baseball players",
  "African-American boxers",
  "African-American track and field athletes",
  "African-American tennis players",

  // HBCUs and institutions
  "Historically black colleges and universities",
  "African-American fraternities and sororities",

  // Architecture and design
  "African-American architects",
  "African-American fashion designers",

  // Culinary
  "African-American chefs",

  // Cultural movements and concepts
  "Harlem Renaissance",
  "Black Arts Movement",
  "Afrofuturism",
  "Hip hop culture",
  "African-American culture",
  "African-American history",

  // Latin/Caribbean culture
  "Afro-Caribbean culture",
  "Puerto Rican musicians",
  "Cuban musicians",
  "Dominican Republic musicians",
]

function categorizeEntry(categoryName: string): string {
  const name = categoryName.toLowerCase()

  if (
    name.includes("scientist") ||
    name.includes("physicist") ||
    name.includes("chemist") ||
    name.includes("physician") ||
    name.includes("mathematician") ||
    name.includes("astronaut") ||
    name.includes("engineer")
  )
    return "scientist"

  if (
    name.includes("rapper") ||
    name.includes("singer") ||
    name.includes("musician") ||
    name.includes("producer")
  )
    return "musician"

  if (
    name.includes("novelist") ||
    name.includes("poet") ||
    name.includes("writer") ||
    name.includes("journalist") ||
    name.includes("dramatist") ||
    name.includes("playwright")
  )
    return "author"

  if (
    name.includes("director") ||
    name.includes("screenwriter") ||
    name.includes("film producer")
  )
    return "filmmaker"

  if (
    name.includes("painter") ||
    name.includes("sculptor") ||
    name.includes("photographer") ||
    name.includes("artist")
  )
    return "visual-artist"

  if (
    name.includes("activist") ||
    name.includes("feminist") ||
    name.includes("pan-african") ||
    name.includes("chicano")
  )
    return "activist"

  if (
    name.includes("basketball") ||
    name.includes("baseball") ||
    name.includes("boxer") ||
    name.includes("track") ||
    name.includes("tennis")
  )
    return "athlete"

  if (name.includes("architect")) return "architect"
  if (name.includes("fashion")) return "fashion"
  if (name.includes("chef")) return "culinary"
  if (name.includes("inventor")) return "inventor"
  if (name.includes("fraternit") || name.includes("sororit")) return "organization"
  if (name.includes("college") || name.includes("universit")) return "institution"
  return "cultural-movement"
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchCategoryMembers(category: CategoryConfig): Promise<CategoryMember[]> {
  const all: CategoryMember[] = []
  let cmcontinue: string | undefined

  while (true) {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category.name}`,
      cmlimit: "500",
      cmtype: "page",
      format: "json",
    })
    if (cmcontinue) params.set("cmcontinue", cmcontinue)

    const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`

    const res = await fetch(url, {
      headers: {
        "User-Agent": "BonitaBulkSeeder/1.0 (https://contentcreators.life)",
      },
    })
    await sleep(1000)

    if (!res.ok) {
      console.warn(
        `[Bonita Bulk Seeder] Failed to load category members for ${category.name}: ${res.status}`,
      )
      break
    }

    const json = (await res.json()) as {
      query?: { categorymembers?: CategoryMember[] }
      continue?: { cmcontinue?: string }
    }

    const members = json.query?.categorymembers ?? []
    all.push(...members)

    if (json.continue?.cmcontinue) {
      cmcontinue = json.continue.cmcontinue
    } else {
      break
    }
  }

  return all
}

async function fetchSummary(title: string): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "BonitaBulkSeeder/1.0 (https://contentcreators.life)",
      },
    })
    await sleep(1000)

    if (!res.ok) {
      console.warn(`[Bonita Bulk Seeder] Wikipedia returned ${res.status} for ${title}`)
      return null
    }

    const data = (await res.json()) as WikiSummary
    if (data.type === "disambiguation") {
      return null
    }
    return data
  } catch (e) {
    console.warn(`[Bonita Bulk Seeder] Failed to fetch summary for ${title}:`, e)
    return null
  }
}

async function upsertKnowledge(
  title: string,
  summary: WikiSummary,
  categoryName: string,
): Promise<boolean> {
  const name = summary.title || title
  const biography = summary.extract || null
  const description = summary.description || null
  const baseCategory = categorizeEntry(categoryName)

  const { data: existing, error: selectError } = await supabase
    .from("knowledge_entries")
    .select("id")
    .eq("name", name)
    .limit(1)

  if (selectError) {
    console.warn(`[Bonita Bulk Seeder] Select error for ${name}:`, selectError.message)
  }

  if (existing && existing.length > 0) {
    return false
  }

  const { error } = await supabase.from("knowledge_entries").insert({
    category: baseCategory,
    subcategory: categoryName,
    name,
    biography,
    key_contributions: null,
    tags: description ? [description, categoryName] : [categoryName],
    source: "wikipedia",
    source_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`,
  })

  if (error) {
    console.error(`[Bonita Bulk Seeder] Insert error for ${name}:`, error.message)
    return false
  }

  return true
}

async function main() {
  console.log(
    `[Bonita Bulk Seeder] Starting bulk Wikipedia category seeding for ${CATEGORIES.length} categories...`,
  )

  let totalInserted = 0

  for (const categoryName of CATEGORIES) {
    const config: CategoryConfig = { name: categoryName }
    console.log(`[Bonita Bulk Seeder] Loading category: ${categoryName}`)

    const members = await fetchCategoryMembers(config)
    if (!members.length) {
      console.log(`[Bonita Bulk Seeder] No members found for category: ${categoryName}`)
      continue
    }

    const uniqueTitles = Array.from(new Set(members.map((m) => m.title)))
    const total = uniqueTitles.length
    let insertedForCategory = 0
    let index = 0

    for (const title of uniqueTitles) {
      index += 1
      const summary = await fetchSummary(title)
      if (!summary) continue

      const inserted = await upsertKnowledge(title, summary, categoryName)
      if (inserted) {
        insertedForCategory += 1
        totalInserted += 1
        console.log(
          `[Category: ${categoryName}] [${index}/${total}] Loaded: ${summary.title || title}`,
        )
      } else {
        console.log(
          `[Category: ${categoryName}] [${index}/${total}] Skipped existing: ${
            summary.title || title
          }`,
        )
      }
    }

    console.log(
      `[Bonita Bulk Seeder] Category complete: ${categoryName} — new entries: ${insertedForCategory}/${total}`,
    )
  }

  const { count } = await supabase
    .from("knowledge_entries")
    .select("id", { count: "exact", head: true })

  console.log(
    `[Bonita Bulk Seeder] Done. New entries this run: ${totalInserted}. knowledge_entries total rows: ${
      typeof count === "number" ? count : "unknown"
    }`,
  )
}

main()
  .then(() => {
    console.log("[Bonita Bulk Seeder] Completed.")
    process.exit(0)
  })
  .catch((err) => {
    console.error("[Bonita Bulk Seeder] Fatal error:", err)
    process.exit(1)
  })

