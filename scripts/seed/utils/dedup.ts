import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _brain: SupabaseClient | null = null

function getBrain(): SupabaseClient {
  if (!_brain) {
    const url = process.env.BONITA_BRAIN_URL
    const key = process.env.BONITA_BRAIN_SERVICE_KEY
    if (!url || !key) {
      throw new Error("BONITA_BRAIN_URL and BONITA_BRAIN_SERVICE_KEY must be set")
    }
    _brain = createClient(url, key)
  }
  return _brain
}

export const brain = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getBrain() as any)[prop]
  },
})

export async function entryExists(name: string): Promise<boolean> {
  const { count } = await getBrain()
    .from("knowledge_entries")
    .select("*", { count: "exact", head: true })
    .ilike("name", name.trim())
  return (count ?? 0) > 0
}

export async function regionExists(city: string, state: string, title: string): Promise<boolean> {
  const { count } = await getBrain()
    .from("regional_knowledge")
    .select("*", { count: "exact", head: true })
    .ilike("city", city)
    .ilike("state", state)
    .ilike("title", `%${title.slice(0, 30)}%`)
  return (count ?? 0) > 0
}
