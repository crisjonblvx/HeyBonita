import { getSupabaseAdminClient } from "@/lib/supabase"
import { applyCors, corsPreflight } from "../_utils/cors"

type SearchBody = {
  query: string
  limit?: number
  includeArtifacts?: boolean
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<SearchBody>
  const query = body.query?.trim()
  const limit = body.limit && body.limit > 0 ? Math.min(body.limit, 20) : 10
  const includeArtifacts = body.includeArtifacts ?? true

  if (!query) {
    return applyCors(
      req,
      new Response(JSON.stringify({ ok: false, error: "query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "POST,OPTIONS" },
    )
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        ok: false,
        error: "Supabase not configured",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
      ),
      { methods: "POST,OPTIONS" },
    )
  }

  try {
    const [{ data: knowledge }, { data: artifacts }] = await Promise.all([
      supabase.rpc("match_knowledge", {
        query_text: query,
        match_limit: limit,
      }),
      includeArtifacts
        ? supabase.rpc("match_artifacts", {
            query_text: query,
            match_limit: limit,
          })
        : Promise.resolve({ data: null }),
    ])

    let knowledgeResults = (knowledge as any[]) || []
    let artifactResults = (artifacts as any[]) || []

    if (!knowledgeResults.length || (!artifactResults.length && includeArtifacts)) {
      const [{ data: knowledgeText }, { data: artifactsText }] = await Promise.all([
        supabase.rpc("search_knowledge_text", {
          query_text: query,
          match_limit: limit,
        }),
        includeArtifacts
          ? supabase.rpc("search_documents_text", {
              query_text: query,
              match_limit: limit,
              filter_origin: null,
            })
          : Promise.resolve({ data: null }),
      ])

      if (!knowledgeResults.length && Array.isArray(knowledgeText)) {
        knowledgeResults = knowledgeText as any[]
      }
      if (!artifactResults.length && Array.isArray(artifactsText)) {
        artifactResults = artifactsText as any[]
      }
    }

    return applyCors(
      req,
      new Response(
        JSON.stringify({
          ok: true,
          query,
          knowledge: knowledgeResults,
          artifacts: artifactResults,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
      { methods: "POST,OPTIONS" },
    )
  } catch (e: any) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        ok: false,
        error: "Search failed",
        detail: e?.message ?? String(e),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
      ),
      { methods: "POST,OPTIONS" },
    )
  }
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}
