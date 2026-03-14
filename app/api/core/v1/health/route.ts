import { getSupabaseBrain } from "@/lib/supabase-brain"
import { applyCors, corsPreflight } from "../_utils/cors"

export async function GET(req: Request) {
  const provider = (process.env.BONITA_BRAIN_PROVIDER || "ollama").toLowerCase()
  const bonitaBrainModel =
    process.env.BONITA_BRAIN_MODEL ||
    (provider === "anthropic" ? "claude-sonnet-4-20250514" : "mistral")
  const bonitaBrainUrl = process.env.BONITA_BRAIN_URL

  const supabase = getSupabaseBrain()

  let knowledgeEntries: number | null = null
  if (supabase) {
    const { count } = await supabase.from("knowledge_entries").select("id", { count: "exact", head: true })
    knowledgeEntries = typeof count === "number" ? count : null
  }

  const payload: Record<string, unknown> = {
    ok: true,
    service: "bonita-core",
    provider,
    model: bonitaBrainModel,
    supabase_connected: !!supabase,
    ...(knowledgeEntries !== null && { knowledge_entries: knowledgeEntries }),
  }

  if (provider === "anthropic") {
    payload.anthropic_configured = !!process.env.ANTHROPIC_API_KEY
    return applyCors(
      req,
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "GET,OPTIONS" },
    )
  }

  let ollamaModels: any[] = []
  let ollamaError: string | null = null

  if (bonitaBrainUrl) {
    try {
      const baseUrl = bonitaBrainUrl.replace(/\/$/, "")
      const res = await fetch(`${baseUrl}/api/tags`)
      if (res.ok) {
        const json = (await res.json()) as { models?: any[] }
        ollamaModels = json.models ?? []
      } else {
        ollamaError = `Ollama /api/tags returned status ${res.status}`
      }
    } catch (e) {
      ollamaError = e instanceof Error ? e.message : String(e)
    }
  } else {
    ollamaError = "BONITA_BRAIN_URL not set"
  }

  const availableModelNames = ollamaModels.map((m) => m.name)
  const modelAvailable = availableModelNames.includes(bonitaBrainModel)

  Object.assign(payload, {
    bonita_brain_url: bonitaBrainUrl || null,
    model_available: modelAvailable,
    available_models: availableModelNames,
    ...(ollamaError && { ollama_error: ollamaError }),
    ...(bonitaBrainUrl &&
      !modelAvailable && {
        model_hint: `Model ${bonitaBrainModel} is not downloaded. Run: ollama pull ${bonitaBrainModel}`,
      }),
  })

  return applyCors(
    req,
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
    { methods: "GET,OPTIONS" },
  )
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "GET,OPTIONS" })
}
