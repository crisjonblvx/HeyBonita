import { checkServiceToken } from "../_utils/auth"

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

  // TODO: replace with your real trends logic
  const result = { ok: true, echo: body, source: "BonitaCore.trends" }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
