# BonitaCore API

A centralized API service for AI-powered content generation and web intelligence.

## Deployed Instance

- **Base URL**: `https://bonitacore.vercel.app/api/core/v1`
- **Authentication**: Include `x-service-token` header (server-side only)
- **Service Token**: Contact administrator for access credentials

## Features

- **Image Generation**: OpenAI-powered image creation (URLs only, no storage)
- **Video Generation**: Luma AI video synthesis
- **Voice Generation**: ElevenLabs text-to-speech
- **Web Search**: Perplexity AI web intelligence
- **News Trends**: NewsAPI trending content
- **Health Monitoring**: Comprehensive self-testing and monitoring

## Integration (Server-side Only)

⚠️ **Security Notice**: This API must only be called from server-side code. Never expose service tokens in client-side code or browser environments.

### Recommended Pattern (Next.js Proxy)

Create a server proxy in your consuming application:

\`\`\`typescript
// app/api/core/[...path]/route.ts (in your consuming app)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = `${process.env.BONITACORE_BASE_URL}/${params.path.join("/")}`;
  
  const response = await fetch(target, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-service-token": process.env.BONITACORE_SERVICE_TOKEN || ""
    },
    body: await req.text()
  });
  
  return new NextResponse(await response.text(), { 
    status: response.status, 
    headers: { "content-type": "application/json" }
  });
}
\`\`\`

### Direct HTTP Requests (Server-side)

\`\`\`bash
# Health check
curl -X GET https://bonitacore.vercel.app/api/core/v1/health \
  -H "x-service-token: <SERVICE_TOKEN>"

# Generate image
curl -X POST https://bonitacore.vercel.app/api/core/v1/image \
  -H "Content-Type: application/json" \
  -H "x-service-token: <SERVICE_TOKEN>" \
  -d '{"prompt": "A beautiful sunset", "size": "1024x1024"}'
\`\`\`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check API availability |
| `/version` | GET | Get version information |
| `/selftest` | GET | Test all provider connections |
| `/image` | POST | Generate images with OpenAI |
| `/video` | POST | Generate videos with Luma AI |
| `/voice` | POST | Generate speech with ElevenLabs |
| `/search` | POST | Search web with Perplexity |
| `/trends` | POST | Get news trends with NewsAPI |
| `/openapi.json` | GET | OpenAPI specification |

## Environment Variables (Server-side)

\`\`\`env
# Required for your consuming application
BONITACORE_BASE_URL=https://bonitacore.vercel.app/api/core/v1
BONITACORE_SERVICE_TOKEN=<contact_administrator>

# Do NOT use NEXT_PUBLIC_* prefixes for these tokens
\`\`\`

## Security

- All endpoints require service token authentication
- Rate limiting is enforced per token
- Sensitive environment variables are masked in responses
- No data persistence - stateless API design
- **Server-side only** - browser calls will be blocked

## Error Handling

All endpoints return consistent error responses:

\`\`\`json
{
  "ok": false,
  "error": "Descriptive error message"
}
\`\`\`

## Support

For access credentials or issues, contact the administrator. Check the self-test endpoint to verify provider connectivity.
