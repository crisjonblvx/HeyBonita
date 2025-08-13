export const dynamic = "force-dynamic"

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export const BASE = process.env.BONITACORE_BASE_URL!
export const TOKEN = process.env.BONITACORE_SERVICE_TOKEN!

export function corsResponse(body: any, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  })
}

export async function postToCore(path: string, payload: any) {
  console.log(`BonitaCore ${path} request:`, {
    hasBaseUrl: !!BASE,
    hasToken: !!TOKEN,
    baseUrl: BASE,
    tokenLength: TOKEN?.length || 0,
  })

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload ?? {}),
  })

  const upstreamText = await res.text()

  if (!res.ok) {
    return corsResponse(
      {
        upstreamStatus: res.status,
        message: `BonitaCore error on ${path}`,
        debug: {
          baseUrl: BASE,
          tokenLen: TOKEN?.length || 0,
          hint: "401 usually means bad/missing token or wrong header",
          upstreamText,
        },
      },
      res.status,
    )
  }

  return corsResponse(upstreamText, res.status)
}
