import { checkServiceToken } from "../_utils/auth"

type Msg = { role: "system" | "user" | "assistant"; content: string }

function normalize(body: any): Msg[] {
  if (Array.isArray(body?.messages)) return body.messages as Msg[]
  if (typeof body?.prompt === "string") return [{ role: "user", content: body.prompt }]
  if (typeof body?.input === "string") return [{ role: "user", content: body.input }]
  return [{ role: "user", content: JSON.stringify(body ?? {}) }]
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-service-token",
    },
  })
}

export async function POST(req: Request) {
  const unauth = checkServiceToken(req)
  if (unauth) return unauth

  const url = new URL(req.url)
  const debug = url.searchParams.get("debug") === "true"

  const body = await req.json().catch(() => ({}))
  const messages = normalize(body)
  const lastMessage = messages.at(-1)?.content ?? ""

  try {
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          role: "assistant",
          content: "no_data",
          ...(debug && { debug: { error: "OpenAI API key not configured" } }),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are BonitaCore, a cultural intelligence engine. Provide insights on music, entertainment, business, and global trends. Be accurate and data-focused. No personality - just clean analysis.",
          },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({
          role: "assistant",
          content: "no_data",
          ...(debug && { debug: { openai_error: error, status: response.status } }),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || "no_data"

    const result = {
      role: "assistant" as const,
      content,
      ...(debug && {
        debug: {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          tokens_used: data.usage?.total_tokens,
        },
      }),
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: "no_data",
        ...(debug && { debug: { error: error instanceof Error ? error.message : "Unknown error" } }),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
