import type { NextRequest } from "next/server"

function unauthorized(msg = "Unauthorized") {
  return new Response(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  })
}

function cors(headers: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    ...headers,
  }
}

const SERVICE_TOKEN = process.env.BONITACORE_SERVICE_TOKEN

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() })
}

export async function POST(req: NextRequest) {
  // --- Auth ---
  const auth = req.headers.get("authorization") || ""
  const xKey = req.headers.get("x-api-key") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : xKey

  if (!SERVICE_TOKEN || token !== SERVICE_TOKEN) {
    return unauthorized("Invalid or missing token")
  }

  // --- Body normalization (accepts messages[], prompt, or input) ---
  const body = await req.json().catch(() => ({}))
  const messages = Array.isArray(body?.messages)
    ? body.messages
    : typeof body?.prompt === "string"
      ? [{ role: "user", content: body.prompt }]
      : typeof body?.input === "string"
        ? [{ role: "user", content: body.input }]
        : [{ role: "user", content: JSON.stringify(body) }]

  // TODO: swap this echo with your actual model call (OpenAI/Anthropic/etc.)
  const reply = {
    role: "assistant",
    content: `Echo: ${messages?.[messages.length - 1]?.content ?? "ping"}`,
  }

  return new Response(JSON.stringify({ messages: [...messages, reply] }), {
    status: 200,
    headers: cors({ "Content-Type": "application/json" }),
  })
}
