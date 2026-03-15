import { NextResponse } from "next/server"
import RunwayML from "@runwayml/sdk"

export const dynamic = "force-dynamic"

const AVATAR_ID =
  process.env.NEXT_PUBLIC_BONITA_AVATAR_ID || "3d6635bd-7048-4aa8-abef-ba653739019d"
const RUNWAY_BASE = "https://api.dev.runwayml.com"

export async function POST(req: Request) {
  const apiKey = process.env.RUNWAY_API_KEY || process.env.RUNWAYML_API_SECRET
  if (!apiKey) {
    return NextResponse.json({ error: "Runway not configured" }, { status: 503 })
  }

  try {
    const client = new RunwayML({ apiKey, baseURL: RUNWAY_BASE })

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
        console.error("Runway session failed:", session.failure)
        return NextResponse.json(
          { error: session.failure },
          { status: 500 },
        )
      }
      await new Promise((r) => setTimeout(r, 1000))
    }

    if (!sessionKey) {
      return NextResponse.json(
        { error: "Session timed out" },
        { status: 504 },
      )
    }

    const consumeRes = await fetch(
      `${RUNWAY_BASE.replace(/\/$/, "")}/v1/realtime_sessions/${sessionId}/consume`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionKey}`,
          "X-Runway-Version": "2024-11-06",
        },
      },
    )
    if (!consumeRes.ok) {
      const errText = await consumeRes.text()
      console.error("Runway consume error:", consumeRes.status, errText)
      return NextResponse.json(
        { error: "Failed to get session credentials", detail: errText },
        { status: 502 },
      )
    }
    const credentials = await consumeRes.json()

    return NextResponse.json({
      sessionId,
      serverUrl: credentials.url,
      token: credentials.token,
      roomName: credentials.roomName,
    })
  } catch (error) {
    console.error("Avatar connect error:", error)
    return NextResponse.json(
      { error: "Failed to create avatar session" },
      { status: 500 },
    )
  }
}
