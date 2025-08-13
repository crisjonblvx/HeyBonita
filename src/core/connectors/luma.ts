const ALIAS: Record<string, string> = {
  ray2: "ray-2",
  "ray-2": "ray-2",
  ray: "ray-2",
}

export async function lumaGenerate({ prompt, model = "ray2" }: { prompt: string; model?: string }) {
  const key = process.env.LUMA_API_KEY
  if (!key) return { ok: false, note: "stub (no LUMA_API_KEY)" }

  const m = ALIAS[model.toLowerCase()] || model
  const r = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      prompt,
      model: m,
      aspect_ratio: "16:9",
      duration: 5,
    }),
  })

  const text = await r.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }

  return r.ok ? { ok: true, data: json } : { ok: false, status: r.status, error: "luma_error", details: json }
}
