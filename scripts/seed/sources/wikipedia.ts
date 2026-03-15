const WIKI_HEADERS = {
  "User-Agent": "BonitaSeeder/1.0 (https://heybonita.ai; seeder@heybonita.ai)",
  Accept: "application/json",
}

export async function searchWikipedia(query: string, limit = 20): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: String(limit),
    format: "json",
  })
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    headers: WIKI_HEADERS,
  })
  if (!res.ok) {
    console.error("  Wikipedia search HTTP error:", res.status)
    return []
  }
  const data = await res.json()
  return (data?.query?.search || []).map((r: any) => r.title)
}

export async function getWikipediaSummary(title: string): Promise<string> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: WIKI_HEADERS },
  )
  if (!res.ok) return ""
  const data = await res.json()
  return data?.extract || ""
}
