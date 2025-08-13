import { type NextRequest, NextResponse } from "next/server"

export function requireServiceAuth(req: NextRequest) {
  const token = req.headers.get("x-bonita-service-token")?.trim()
  const allow = (process.env.ALLOWED_SERVICE_TOKENS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (!token || !allow.includes(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
