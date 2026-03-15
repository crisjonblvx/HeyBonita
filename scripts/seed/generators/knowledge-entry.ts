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

export async function generateKnowledgeEntry(
  name: string,
  category: string,
  context?: string,
) {
  try {
    const prompt = `You are seeding a cultural knowledge database called Bonita's Brain — a sovereign AI knowledge system centered on Black, Indigenous, and Brown communities and their contributions to humanity.

Generate a knowledge entry for: "${name}"
Category: ${category}
${context ? `Context: ${context}` : ""}

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "name": "full name",
  "category": "${category}",
  "subcategory": "specific subcategory",
  "nationality": "American / Nigerian / Jamaican etc",
  "birth_year": number or null,
  "death_year": number or null,
  "biography": "2-4 sentence biography. Be specific, accurate, and culturally grounded. Just state who they are and what they did.",
  "key_contributions": ["contribution 1", "contribution 2", "contribution 3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "culturally_relevant": true or false
}

If this person/topic is NOT relevant to Black, Indigenous, or Brown cultural history, set culturally_relevant to false.
If you are not confident in the accuracy of the information, set culturally_relevant to false.`

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    return JSON.parse(text.replace(/```json|```/g, "").trim())
  } catch (err) {
    console.error("  ⚠ Generation error for:", name, String(err).slice(0, 120))
    return null
  }
}
