import Anthropic from "@anthropic-ai/sdk"

let claude: Anthropic | null = null

function getClient(): Anthropic {
  if (!claude) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required to run the seeder")
    }
    claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return claude
}

export async function generateRegionalEntry(
  topic: string,
  context?: string,
) {
  try {
    const prompt = `You are seeding a regional knowledge database for Bonita's Brain — focused on Black, Indigenous, and Brown communities across the Americas.

Generate a regional knowledge entry about: "${topic}"
${context ? `Context: ${context}` : ""}

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "city": "city or community name",
  "state": "US state or region",
  "title": "short title for this knowledge entry",
  "content": "3-5 sentences about the cultural significance of this community/place. Be specific about people, events, and cultural traditions. Ground it in history.",
  "source": "auto-seeder-v1",
  "culturally_relevant": true or false
}

If this topic is NOT relevant to Black, Indigenous, or Brown cultural history, set culturally_relevant to false.`

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    return JSON.parse(text.replace(/```json|```/g, "").trim())
  } catch (err) {
    console.error("  ⚠ Generation error for regional:", topic, String(err).slice(0, 120))
    return null
  }
}
