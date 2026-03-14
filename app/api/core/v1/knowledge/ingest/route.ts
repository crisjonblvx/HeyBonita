import { getSupabaseBrain } from "@/lib/supabase-brain"
import { applyCors, corsPreflight } from "../../_utils/cors"

type NMAAHCItem = {
  id: string
  title?: string
  description?: string
  content?: {
    descriptiveNonRepeating?: {
      title?: { content?: string }
      online_media?: { media?: { content?: string }[] }
    }
    freetext?: Record<string, { label?: string; content?: string }[]>
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

  const { limit = 100 } = (await req.json().catch(() => ({}))) as { limit?: number }
  const pageSize = Math.min(Math.max(limit, 1), 100)

  const apiKey = process.env.SMITHSONIAN_API_KEY
  if (!apiKey) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({ ok: false, error: "SMITHSONIAN_API_KEY not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
      ),
      { methods: "POST,OPTIONS" },
    )
  }

  let totalInserted = 0
  let start = 0

  // Paginate through results in batches
  while (true) {
    const searchUrl = new URL("https://api.si.edu/openaccess/api/v1.0/search")
    searchUrl.searchParams.set("api_key", apiKey)
    searchUrl.searchParams.set("q", "unit_code:NMAAHC")
    searchUrl.searchParams.set("rows", String(pageSize))
    searchUrl.searchParams.set("start", String(start))

    const searchRes = await fetch(searchUrl.toString())
    if (!searchRes.ok) {
      const text = await searchRes.text()
      return applyCors(
        req,
        new Response(
        JSON.stringify({
          ok: false,
          error: "Failed to fetch NMAAHC data",
          detail: text,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
        ),
        { methods: "POST,OPTIONS" },
      )
    }

    const searchJson = (await searchRes.json().catch(() => ({}))) as {
      response?: { docs?: { id: string }[]; rowCount?: number }
    }
    const ids = searchJson.response?.docs?.map((d) => d.id).filter(Boolean) ?? []
    if (!ids.length) break

    const artifacts: any[] = []

    for (const id of ids) {
      const itemUrl = new URL(
        `https://api.si.edu/openaccess/api/v1.0/content/${encodeURIComponent(id)}`,
      )
      itemUrl.searchParams.set("api_key", apiKey)

      const itemRes = await fetch(itemUrl.toString())
      if (!itemRes.ok) continue

      const itemJson = (await itemRes
        .json()
        .catch(() => ({}))) as { response?: { rows?: NMAAHCItem[] } }
      const item = itemJson.response?.rows?.[0]
      if (!item) continue

      const title =
        item.title || item.content?.descriptiveNonRepeating?.title?.content || "Untitled artifact"

      const description =
        item.content?.freetext?.notes?.[0]?.content ||
        item.content?.freetext?.physdesc?.[0]?.content ||
        item.description ||
        null

      const imageUrl =
        item.content?.descriptiveNonRepeating?.online_media?.media?.[0]?.content || null

      artifacts.push({
        source_museum: "NMAAHC",
        source_id: item.id,
        title,
        description,
        creator: null,
        date_created: null,
        medium: null,
        culture: null,
        classification: null,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        metadata: item,
      })
    }

    if (artifacts.length) {
      const { error } = await supabase.from("artifacts").insert(artifacts)
      if (error) {
        return applyCors(
          req,
          new Response(
          JSON.stringify({
            ok: false,
            error: "Failed to insert artifacts",
            detail: error.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
          ),
          { methods: "POST,OPTIONS" },
        )
      }
      totalInserted += artifacts.length
    }

    if (ids.length < pageSize) break
    start += pageSize
  }

  // Update knowledge_sources last_synced_at for Smithsonian source
  await supabase
    .from("knowledge_sources")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("source_key", "smithsonian_nmaahc")

  return applyCors(
    req,
    new Response(
      JSON.stringify({
        ok: true,
        inserted: totalInserted,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
    { methods: "POST,OPTIONS" },
  )
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}

