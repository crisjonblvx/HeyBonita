import { getSupabaseBrain } from "@/lib/supabase-brain"
import { applyCors, corsPreflight } from "../../../_utils/cors"

/** Topics to explore when cron runs (subset of seed script). */
const TOPICS_TO_EXPLORE = [
  { name: "Divine Nine", category: "cultural_concept" },
  { name: "David Blackwell", category: "scientist_inventor" },
  { name: "Hip hop", category: "cultural_concept" },
  { name: "Historically black colleges and universities", category: "cultural_concept" },
  { name: "Afrofuturism", category: "cultural_concept" },
  { name: "George Washington Carver", category: "scientist_inventor" },
  { name: "A Tribe Called Quest", category: "musician" },
  { name: "Romare Bearden", category: "visual_artist" },
  { name: "Zora Neale Hurston", category: "author" },
  { name: "Frederick Douglass", category: "activist" },
  { name: "Juneteenth", category: "cultural_concept" },
  { name: "Black Arts Movement", category: "cultural_concept" },
  { name: "Harlem Renaissance", category: "cultural_concept" },
  { name: "Kwanzaa", category: "cultural_concept" },
  { name: "Marie Van Brittan Brown", category: "scientist_inventor" },
  { name: "Grandmaster Flash", category: "musician" },
  { name: "Alice Walker", category: "author" },
  { name: "John Singleton", category: "filmmaker" },
  { name: "Frida Kahlo", category: "visual_artist" },
  { name: "Bayard Rustin", category: "activist" },
]

type WikiSummary = {
  title?: string
  extract?: string
  description?: string
}

type Topic = { name: string; category: string }

async function fetchSummary(topic: Topic): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.name)}`
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BonitaFeed/1.0 (https://contentcreators.life)" },
    })
    if (!res.ok) return null
    return (await res.json()) as WikiSummary
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const secret = process.env.BONITA_INGEST_SECRET || ""
  const headerSecret = req.headers.get("x-bonita-ingest-secret") || ""
  if (!secret || headerSecret !== secret) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "POST,OPTIONS" },
    )
  }

  const supabase = getSupabaseBrain()
  if (!supabase) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "Supabase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "POST,OPTIONS" },
    )
  }

  const body = (await req.json().catch(() => ({}))) as { limit?: number; from_gaps_only?: boolean }
  const limit = Math.min(Math.max(body.limit ?? 20, 1), 50)
  const fromGapsOnly = body.from_gaps_only === true

  let inserted = 0
  type TopicWithGap = { topic: Topic; gapId?: string }
  const work: TopicWithGap[] = []

  if (!fromGapsOnly) {
    const shuffled = [...TOPICS_TO_EXPLORE].sort(() => Math.random() - 0.5)
    work.push(...shuffled.slice(0, limit).map((topic) => ({ topic })))
  }

  const { data: gapRows } = await supabase
    .from("knowledge_gaps")
    .select("id, query")
    .eq("status", "open")
    .limit(limit)

  const gaps = (gapRows ?? []) as { id: string; query: string }[]
  const seen = new Set(work.map((w) => w.topic.name.toLowerCase()))
  for (const g of gaps) {
    const q = (g.query || "").trim()
    if (q && !seen.has(q.toLowerCase())) {
      seen.add(q.toLowerCase())
      work.push({ topic: { name: q, category: "general" }, gapId: g.id })
    }
  }

  const resolvedGapIds: string[] = []

  for (const { topic, gapId } of work) {
    const summary = await fetchSummary(topic)
    if (!summary?.title) continue

    const name = summary.title
    const biography = summary.extract || null
    const description = summary.description || null

    const { data: existing } = await supabase
      .from("knowledge_entries")
      .select("id")
      .eq("name", name)
      .limit(1)

    if (existing?.length) continue

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

    if (!error) {
      inserted += 1
      if (gapId) resolvedGapIds.push(gapId)
    }

    await new Promise((r) => setTimeout(r, 200))
  }

  if (resolvedGapIds.length) {
    await supabase
      .from("knowledge_gaps")
      .update({ status: "resolved" })
      .in("id", resolvedGapIds)
  }

  await supabase
    .from("knowledge_sources")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("source_key", "wikipedia")

  return applyCors(
    req,
    new Response(
      JSON.stringify({ ok: true, inserted, resolved_gaps: resolvedGapIds.length }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
    { methods: "POST,OPTIONS" },
  )
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}
