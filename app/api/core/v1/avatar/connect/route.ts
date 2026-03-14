import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const message =
    typeof body?.message === "string" ? body.message : "Hey love, I'm Bonita. Your Bronx auntie with all the wisdom. Ask me anything."

  if (!process.env.RUNWAY_API_KEY) {
    return NextResponse.json({ error: "Runway not configured" }, { status: 503 })
  }

  try {
    const response = await fetch("https://api.runwayml.com/v1/avatar/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        avatarId: process.env.NEXT_PUBLIC_BONITA_AVATAR_ID || "3d6635bd-7048-4aa8-abef-ba653739019d",
        text: message,
        voice: { speed: 1.0 },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("Runway API error:", response.status, errText)
      return NextResponse.json(
        { error: "Avatar generation failed", detail: errText },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Avatar error:", error)
    return NextResponse.json({ error: "Avatar generation failed" }, { status: 500 })
  }
}
