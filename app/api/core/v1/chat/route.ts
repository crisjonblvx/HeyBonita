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

  const body = await req.json().catch(() => ({}))
  const messages = normalize(body)

  // TODO: call your LLM here (OpenAI/Anthropic/etc)
  const reply: Msg = { role: "assistant", content: `Echo: ${messages.at(-1)?.content ?? "ping"}` }

  return new Response(JSON.stringify({ messages: [...messages, reply] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
