export function checkServiceToken(req: Request) {
  const expected =
    process.env.BONITACORE_SERVICE_TOKEN ||
    process.env.NEXT_PUBLIC_BONITA_SERVICE_TOKEN ||
    ""
  const got = req.headers.get("x-service-token") || ""
  if (!expected || !got || got !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  return null // OK
}
