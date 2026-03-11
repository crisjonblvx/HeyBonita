import { checkServiceToken } from "../_utils/auth"
import { applyCors, corsPreflight } from "../_utils/cors"

type TrendItem = {
  title: string
  summary: string
  source: string
  timestamp: string
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}

export async function POST(req: Request) {
  const unauth = checkServiceToken(req)
  if (unauth) return applyCors(req, unauth, { methods: "POST,OPTIONS" })

  const url = new URL(req.url)
  const debug = url.searchParams.get("debug") === "true"

  try {
    const trends: TrendItem[] = []
    const debugInfo: any = {}

    const newsApiKey = process.env.NEWSAPI_KEY
    if (newsApiKey) {
      try {
        const newsResponse = await fetch(
          `https://newsapi.org/v2/top-headlines?country=us&category=entertainment&pageSize=5&apiKey=${newsApiKey}`,
        )

        if (newsResponse.ok) {
          const newsData = await newsResponse.json()
          const newsItems =
            newsData.articles?.slice(0, 3).map((article: any) => ({
              title: article.title,
              summary: article.description || article.title,
              source: `NewsAPI - ${article.source?.name || "News"}`,
              timestamp: new Date(article.publishedAt || Date.now()).toISOString(),
            })) || []

          trends.push(...newsItems)
          if (debug) debugInfo.newsapi = { status: "success", count: newsItems.length }
        } else {
          if (debug) debugInfo.newsapi = { status: "error", code: newsResponse.status }
        }
      } catch (error) {
        if (debug)
          debugInfo.newsapi = { status: "error", message: error instanceof Error ? error.message : "Unknown error" }
      }
    } else {
      if (debug) debugInfo.newsapi = { status: "not_configured" }
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey && trends.length === 0) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content:
                  "Generate 3 current cultural trends in music, entertainment, or business. Format as JSON array with title, summary, source, timestamp fields.",
              },
            ],
            max_tokens: 500,
            temperature: 0.8,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content || ""

          try {
            const aiTrends = JSON.parse(content)
            if (Array.isArray(aiTrends)) {
              trends.push(
                ...aiTrends.map((trend: any) => ({
                  title: trend.title || "Cultural Trend",
                  summary: trend.summary || trend.description || "",
                  source: trend.source || "AI Analysis",
                  timestamp: trend.timestamp || new Date().toISOString(),
                })),
              )
            }
            if (debug) debugInfo.openai = { status: "success", trends_generated: aiTrends.length }
          } catch (parseError) {
            if (debug) debugInfo.openai = { status: "parse_error", content }
          }
        } else {
          if (debug) debugInfo.openai = { status: "error", code: response.status }
        }
      } catch (error) {
        if (debug)
          debugInfo.openai = { status: "error", message: error instanceof Error ? error.message : "Unknown error" }
      }
    }

    // Return results or no_data status
    if (trends.length === 0) {
      return applyCors(
        req,
        new Response(
        JSON.stringify({
          status: "no_data",
          ...(debug && { debug: debugInfo }),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
        ),
        { methods: "POST,OPTIONS" },
      )
    }

    const result = {
      trends,
      timestamp: new Date().toISOString(),
      ...(debug && { debug: debugInfo }),
    }

    return applyCors(
      req,
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      { methods: "POST,OPTIONS" },
    )
  } catch (error) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        status: "no_data",
        ...(debug && { debug: { error: error instanceof Error ? error.message : "Unknown error" } }),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
      ),
      { methods: "POST,OPTIONS" },
    )
  }
}
