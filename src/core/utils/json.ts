export function ok<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  })
}

export function err<TDetails = unknown>(
  message: string,
  details?: TDetails,
  status = 400,
): Response {
  return ok({ error: message, details }, status)
}
