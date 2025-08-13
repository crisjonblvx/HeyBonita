# Integrating with BonitaCore (Server-side Only)

**Base URL**: `https://bonitacore.vercel.app/api/core/v1`

**Auth header (server-side only)**: `x-service-token: <SERVICE_TOKEN>`

## Recommended Pattern (Next.js / v0 app)

Create a server **proxy** in your app (not in BonitaCore):

\`\`\`ts
// app/api/core/[...path]/route.ts (in your consuming app)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = `${process.env.BONITACORE_BASE_URL}/${params.path.join("/")}`;
  
  const r = await fetch(target, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-service-token": process.env.BONITACORE_SERVICE_TOKEN || ""
    },
    body: await req.text()
  });
  
  return new NextResponse(await r.text(), { 
    status: r.status, 
    headers: { "content-type": "application/json" }
  });
}
\`\`\`

**Do not use the token in the browser or client components. Never set NEXT_PUBLIC_* for this token.**

## Smoke Tests

\`\`\`bash
curl -s -X POST \
  -H "x-service-token: <SERVICE_TOKEN>" \
  https://bonitacore.vercel.app/api/core/v1/health
\`\`\`

## Keep BonitaCore API strictly server-side

- Confirm no files under `app/(app)` or any client component import server env vars.
- BonitaCore should expose only `/api/core/v1/*` routes and docs.

## Guard to discourage direct browser use

- In `src/core/guard.ts`, leave auth as-is.
- In docs, clearly state: "Calls must originate from a server. Use a proxy. Browser calls will be blocked in production network policy."
