import { CORS, postToCore } from "../_core/bonitacore"

export const dynamic = "force-dynamic"

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q") || undefined
  const limit = url.searchParams.get("limit")
  return postToCore("/trends", { q, limit: limit ? Number(limit) : 12 })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  return postToCore("/trends", body)
}
