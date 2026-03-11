import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[Bonita Seeder] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Check your .env.",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

type Topic = {
  name: string
  category: string
}

const musicians: string[] = [
  "Ray Charles",
  "Sam Cooke",
  "Al Green",
  "Curtis Mayfield",
  "Sly Stone",
  "Dizzy Gillespie",
  "Charlie Parker",
  "Louis Armstrong",
  "Duke Ellington",
  "Count Basie",
  "Billie Holiday",
  "Robert Johnson",
  "Muddy Waters",
  "B. B. King",
  "Bessie Smith",
  "Run-DMC",
  "Public Enemy (band)",
  "Big Daddy Kane",
  "Grandmaster Flash",
  "Afrika Bambaataa",
  "Lil Wayne",
  "Kanye West",
  "Tyler, the Creator",
  "Anderson .Paak",
  "Steve Lacy (musician)",
  "Burna Boy",
  "Wizkid",
  "Tito Puente",
  "Daddy Yankee",
  "Peter Tosh",
  "Derrick May (musician)",
  "Kevin Saunderson",
  "Larry Levan",
  "DJ Premier",
  "Madlib",
  "Flying Lotus",
  "Kaytranada",
  "Metro Boomin",
  "Timbaland",
  "Swizz Beatz",
  "Rapsody",
  "Noname (rapper)",
  "JID",
  "Megan Thee Stallion",
  "H.E.R.",
  "Summer Walker",
  "Daniel Caesar",
]

const authors: string[] = [
  "Ta-Nehisi Coates",
  "Ibram X. Kendi",
  "Isabel Wilkerson",
  "Richard Wright (author)",
  "Alice Walker",
  "Gwendolyn Brooks",
  "Claude McKay",
  "Amiri Baraka",
  "Sonia Sanchez",
  "Derek Walcott",
  "Pablo Neruda",
  "Julia Alvarez",
  "Elizabeth Acevedo",
]

const scientistsInventors: string[] = [
  "George Washington Carver",
  "Mark Dean (computer scientist)",
  "Elijah McCoy",
  "Philip Emeagwali",
  "Marie Van Brittan Brown",
  "Otis Boykin",
  "Norbert Rillieux",
  "Jan Ernst Matzeliger",
  "James Edward Maceo West",
  "Valerie Thomas",
]

const filmmakers: string[] = [
  "John Singleton",
  "Steve McQueen (director)",
  "Charles Burnett (director)",
  "Alfonso Cuarón",
  "Guillermo del Toro",
  "Robert Rodriguez",
  "Shonda Rhimes",
  "Lena Waithe",
  "Issa Rae",
]

const visualArtists: string[] = [
  "Amy Sherald",
  "Romare Bearden",
  "Alma Thomas",
  "Diego Rivera",
  "Frida Kahlo",
]

const activists: string[] = [
  "Marcus Garvey",
  "Kwame Nkrumah",
  "Audre Lorde",
  "Frantz Fanon",
  "Frederick Douglass",
  "Cornel West",
  "Bayard Rustin",
]

const sports: string[] = [
  "Michael Jordan",
  "Wilma Rudolph",
  "Arthur Ashe",
  "Jim Brown",
  "Pelé",
  "Venus Williams",
]

const fashion: string[] = [
  "Kerby Jean-Raymond",
  "Aurora James",
  "Oscar de la Renta",
  "Carolina Herrera (fashion designer)",
]

const culturalConcepts: string[] = [
  "Black Arts Movement",
  "Great Migration (African American)",
  "Pan-Africanism",
  "Négritude",
  "Gullah Geechee people",
  "Juneteenth",
  "Kwanzaa",
  "Homecoming (United States)",
]

const topics: Topic[] = [
  ...musicians.map((name) => ({ name, category: "musician" })),
  ...authors.map((name) => ({ name, category: "author" })),
  ...scientistsInventors.map((name) => ({ name, category: "scientist_inventor" })),
  ...filmmakers.map((name) => ({ name, category: "filmmaker" })),
  ...visualArtists.map((name) => ({ name, category: "visual_artist" })),
  ...activists.map((name) => ({ name, category: "activist" })),
  ...sports.map((name) => ({ name, category: "athlete" })),
  ...fashion.map((name) => ({ name, category: "fashion" })),
  ...culturalConcepts.map((name) => ({ name, category: "cultural_concept" })),
]

type WikiSummary = {
  title?: string
  extract?: string
  description?: string
}

async function fetchSummary(topic: Topic): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    topic.name,
  )}`
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "BonitaSeeder/1.0 (https://contentcreators.life)",
      },
    })
    if (!res.ok) {
      console.warn(`[Bonita Seeder] Wikipedia returned ${res.status} for ${topic.name}`)
      return null
    }
    const data = (await res.json()) as WikiSummary
    return data
  } catch (e) {
    console.warn(`[Bonita Seeder] Failed to fetch ${topic.name}:`, e)
    return null
  }
}

async function upsertKnowledge(topic: Topic, summary: WikiSummary) {
  const name = summary.title || topic.name
  const biography = summary.extract || null
  const description = summary.description || null

  // Skip if we already have this name
  const { data: existing, error: selectError } = await supabase
    .from("knowledge_entries")
    .select("id")
    .eq("name", name)
    .limit(1)

  if (selectError) {
    console.warn(`[Bonita Seeder] Select error for ${name}:`, selectError.message)
  }

  if (existing && existing.length > 0) {
    console.log(`[Bonita Seeder] Skipping existing: ${name}`)
    return
  }

  const { error } = await supabase.from("knowledge_entries").insert({
    category: topic.category,
    subcategory: null,
    name,
    biography,
    key_contributions: null,
    tags: description ? [description] : [],
    source: "wikipedia",
    source_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`,
  })

  if (error) {
    console.error(`[Bonita Seeder] Insert error for ${name}:`, error.message)
  } else {
    console.log(`[Bonita Seeder] Loaded: ${name} (${topic.category})`)
  }
}

async function main() {
  console.log(`[Bonita Seeder] Starting Wikipedia seeding for ${topics.length} topics...`)

  let processed = 0
  for (const topic of topics) {
    processed += 1
    console.log(`[Bonita Seeder] [${processed}/${topics.length}] Fetching ${topic.name}...`)
    const summary = await fetchSummary(topic)
    if (summary) {
      await upsertKnowledge(topic, summary)
    }
    // Small delay to be polite to Wikipedia
    await new Promise((r) => setTimeout(r, 250))
  }

  const { data: countData } = await supabase
    .from("knowledge_entries")
    .select("id", { count: "exact", head: true })

  console.log(
    `[Bonita Seeder] Done. knowledge_entries total rows: ${countData ? countData.length : "unknown"}`,
  )
}

main()
  .then(() => {
    console.log("[Bonita Seeder] Completed.")
    process.exit(0)
  })
  .catch((err) => {
    console.error("[Bonita Seeder] Fatal error:", err)
    process.exit(1)
  })

