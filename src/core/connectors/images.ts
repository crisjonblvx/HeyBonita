type GenOpts = {
  prompt: string
  size?: "256x256" | "512x512" | "1024x1024" | "2048x2048"
  n?: number
  provider?: "openai" | "stability"
}

const asArrayBuffer = async (res: Response) => new Uint8Array(await res.arrayBuffer())

export async function generateImage(opts: GenOpts) {
  const size = opts.size || "1024x1024"
  const n = Math.max(1, Math.min(opts.n ?? 1, 4))
  const provider = (opts.provider || (process.env.OPENAI_API_KEY ? "openai" : "stability")) as "openai" | "stability"

  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY
    if (!key) return { ok: false, error: "Missing OPENAI_API_KEY" }
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"

    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, prompt: opts.prompt, size, n }),
    })
    const json = await r.json().catch(() => null)
    if (!r.ok) return { ok: false, status: r.status, error: "openai_image_error", details: json }

    // OpenAI returns base64 or URLs depending on config; here URLs by default
    const urls = (json?.data || []).map((d: any) => d.url || d.b64_json || null).filter(Boolean)
    return { ok: true, provider, size, n, data: { urls } }
  }

  // stability (image bytes)
  const skey = process.env.STABILITY_API_KEY
  if (!skey) return { ok: false, error: "Missing STABILITY_API_KEY (and OPENAI_API_KEY not set)" }
  const model = process.env.STABILITY_MODEL || "stable-diffusion-xl-1024-v1-0"

  const r = await fetch(`https://api.stability.ai/v1/generation/${model}/text-to-image`, {
    method: "POST",
    headers: { authorization: `Bearer ${skey}`, "content-type": "application/json" },
    body: JSON.stringify({
      text_prompts: [{ text: opts.prompt }],
      height: Number(size.split("x")[1]),
      width: Number(size.split("x")[0]),
      samples: n,
    }),
  })

  if (!r.ok) {
    let details: any = null
    try {
      details = await r.json()
    } catch {}
    return { ok: false, status: r.status, error: "stability_error", details }
  }

  const result = await r.json()
  // return base64 strings; storage layer can upload & return URLs
  const imagesB64: string[] = (result?.artifacts || []).map((a: any) => a.base64).filter(Boolean)
  return { ok: true, provider, size, n, data: { base64: imagesB64 } }
}
