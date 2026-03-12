import { getSupabaseAdminClient } from "@/lib/supabase"
import { applyCors, corsPreflight } from "../_utils/cors"

/**
 * GET /api/core/v1/images?name=David+Blackwell
 * Returns a thumbnail URL for a person/place/topic: cached in knowledge_entries or from Wikipedia.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawName = searchParams.get("name")
  const name = (rawName ?? "").trim().slice(0, 200)
  if (!name) {
    return applyCors(
      request,
      new Response(JSON.stringify({ url: null, source: "missing_name" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "GET,OPTIONS" },
    )
  }

  const supabase = getSupabaseAdminClient()
  if (supabase) {
    const { data: row } = await supabase
      .from("knowledge_entries")
      .select("id, image_url")
      .ilike("name", `%${name}%`)
      .not("image_url", "is", null)
      .limit(1)
      .maybeSingle()

    if (row?.image_url) {
      return applyCors(
        request,
        new Response(JSON.stringify({ url: row.image_url, source: "cached" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
        { methods: "GET,OPTIONS" },
      )
    }

    const cleanName = name
      .replace(/\s+\(.*?\)\s*$/, "")
      .replace(/\s+in\s+\S.*$/, "")
      .trim()
    const wikiTitle = cleanName.replace(/\s+/g, " ")
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
    const wikiRes = await fetch(wikiUrl, {
      headers: { "User-Agent": "HeyBonita/1.0 (heybonita.ai)" },
    })
    const wiki = (await wikiRes.json().catch(() => null)) as {
      thumbnail?: { source?: string }
      originalimage?: { source?: string }
    } | null

    if (wiki?.thumbnail?.source) {
      if (row?.id) {
        await supabase
          .from("knowledge_entries")
          .update({ image_url: wiki.thumbnail.source })
          .eq("id", row.id)
      }
      return applyCors(
        request,
        new Response(
          JSON.stringify({
            url: wiki.thumbnail.source,
            originalimage: wiki.originalimage?.source ?? undefined,
            source: "wikipedia",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
        { methods: "GET,OPTIONS" },
      )
    }
  }

  return applyCors(
    request,
    new Response(JSON.stringify({ url: null, source: "not_found" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
    { methods: "GET,OPTIONS" },
  )
}

export async function OPTIONS(request: Request) {
  return corsPreflight(request, { methods: "GET,OPTIONS" })
}
