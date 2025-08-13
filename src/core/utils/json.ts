export function ok(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  })
}

export function err(message: string, details?: any, status = 400) {
  return ok({ error: message, details }, status)
}
