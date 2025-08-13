import { CORS, postToCore } from "../_core/bonitacore"

export const dynamic = "force-dynamic"

type Msg = { role: "system" | "user" | "assistant"; content: string }

function normalize(body: any): { messages: Msg[]; stream?: boolean; meta?: any } {
  if (Array.isArray(body?.messages)) return { messages: body.messages as Msg[], stream: !!body.stream, meta: body.meta }
  if (typeof body?.prompt === "string")
    return { messages: [{ role: "user", content: body.prompt }], stream: !!body.stream, meta: body.meta }
  if (typeof body?.input === "string")
    return { messages: [{ role: "user", content: body.input }], stream: !!body.stream, meta: body.meta }
  return { messages: [{ role: "user", content: JSON.stringify(body ?? {}) }], stream: false }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET() {
  return postToCore("/chat", { messages: [{ role: "user", content: "Hello from HeyBonita.ai" }] })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  return postToCore("/chat", normalize(body))
}
