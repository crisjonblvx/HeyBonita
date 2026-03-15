import { CULTURAL_RELEVANCE_KEYWORDS } from "../categories"

export function isCulturallyRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  return CULTURAL_RELEVANCE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))
}

export function isValidEntry(entry: any): boolean {
  if (!entry) return false
  if (!entry.name || typeof entry.name !== "string") return false
  if (!entry.category || typeof entry.category !== "string") return false
  if (!entry.biography || typeof entry.biography !== "string") return false
  if (entry.culturally_relevant === false) return false
  if (entry.biography.length < 20) return false
  return true
}
