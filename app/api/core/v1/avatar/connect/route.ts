import RunwayML from "@runwayml/sdk"
import { applyCors, corsPreflight } from "../../_utils/cors"

export const dynamic = "force-dynamic"
const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate" }

const AVATAR_ID = process.env.NEXT_PUBLIC_BONITA_AVATAR_ID
const API_KEY = process.env.RUNWAY_API_KEY || process.env.RUNWAYML_API_SECRET

export async function POST(req: Request) {
  if (!API_KEY) {
    return applyCors(
      req,
      new Response(
        JSON.stringify({ ok: false, error: "Runway avatar not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...NO_CACHE } },
      ),
      { methods: "POST,OPTIONS" },
    )
  }
  if (!AVATAR_ID) {
    return applyCors(
      req,
      new Response(
        JSON.stringify({ ok: false, error: "NEXT_PUBLIC_BONITA_AVATAR_ID not set" }),
        { status: 503, headers: { "Content-Type": "application/json", ...NO_CACHE } },
      ),
      { methods: "POST,OPTIONS" },
    )
  }

  const client = new RunwayML({ apiKey: API_KEY })

  try {
    const { id: sessionId } = await client.realtimeSessions.create({
      model: "gwm1_avatars",
      avatar: { type: "custom", avatarId: AVATAR_ID },
    })

    let sessionKey: string | undefined
    for (let i = 0; i < 60; i++) {
      const session = await client.realtimeSessions.retrieve(sessionId)
      if (session.status === "READY" && "sessionKey" in session) {
        sessionKey = session.sessionKey
        break
      }
      if (session.status === "FAILED" && "failure" in session) {
        return applyCors(
          req,
          new Response(
            JSON.stringify({ ok: false, error: session.failure }),
            { status: 500, headers: { "Content-Type": "application/json", ...NO_CACHE } },
          ),
          { methods: "POST,OPTIONS" },
        )
      }
      await new Promise((r) => setTimeout(r, 1000))
    }

    if (!sessionKey) {
      return applyCors(
        req,
        new Response(
          JSON.stringify({ ok: false, error: "Session timed out" }),
          { status: 504, headers: { "Content-Type": "application/json", ...NO_CACHE } },
        ),
        { methods: "POST,OPTIONS" },
      )
    }

    const baseUrl = client.baseURL.replace(/\/$/, "")
    const consumeRes = await fetch(`${baseUrl}/v1/realtime_sessions/${sessionId}/consume`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionKey}`,
        "X-Runway-Version": "2024-11-06",
      },
    })
    if (!consumeRes.ok) {
      const errText = await consumeRes.text()
      return applyCors(
        req,
        new Response(
          JSON.stringify({ ok: false, error: "Consume failed", detail: errText }),
          { status: 502, headers: { "Content-Type": "application/json", ...NO_CACHE } },
        ),
        { methods: "POST,OPTIONS" },
      )
    }
    const credentials = await consumeRes.json()

    return applyCors(
      req,
      new Response(
        JSON.stringify({
          sessionId,
          serverUrl: credentials.url,
          token: credentials.token,
          roomName: credentials.roomName,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...NO_CACHE } },
      ),
      { methods: "POST,OPTIONS" },
    )
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return applyCors(
      req,
      new Response(
        JSON.stringify({ ok: false, error: "Avatar session failed", detail: message }),
        { status: 500, headers: { "Content-Type": "application/json", ...NO_CACHE } },
      ),
      { methods: "POST,OPTIONS" },
    )
  }
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}
