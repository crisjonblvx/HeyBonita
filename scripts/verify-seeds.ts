import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[verify-seeds] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  console.log("=== Bonita seed verification audit ===\n")

  // Supabase/PostgREST often cap at 1000 rows per request; paginate in chunks
  const CHUNK = 1000

  // --- knowledge_entries by category (paginate to get all) ---
  const categoryCounts: Record<string, number> = {}
  let catOffset = 0
  while (true) {
    const { data: byCategory, error: errCat } = await supabase
      .from("knowledge_entries")
      .select("category")
      .range(catOffset, catOffset + CHUNK - 1)
    if (errCat) {
      console.log("knowledge_entries by category: Error —", errCat.message)
      break
    }
    const rows = byCategory ?? []
    for (const row of rows) {
      const c = row.category ?? "(null)"
      categoryCounts[c] = (categoryCounts[c] ?? 0) + 1
    }
    if (rows.length < CHUNK) break
    catOffset += CHUNK
  }
  console.log("knowledge_entries by category:")
  const catEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])
  for (const [cat, count] of catEntries) console.log(`  ${cat}: ${count}`)
  if (catEntries.length === 0) console.log("  (none)")
  console.log("")

  // --- knowledge_entries by source (paginate to get all) ---
  const sourceCounts: Record<string, number> = {}
  let srcOffset = 0
  while (true) {
    const { data: bySource, error: errSrc } = await supabase
      .from("knowledge_entries")
      .select("source")
      .range(srcOffset, srcOffset + CHUNK - 1)
    if (errSrc) {
      console.log("knowledge_entries by source: Error —", errSrc.message)
      break
    }
    const rows = bySource ?? []
    for (const row of rows) {
      const s = row.source ?? "(null)"
      sourceCounts[s] = (sourceCounts[s] ?? 0) + 1
    }
    if (rows.length < CHUNK) break
    srcOffset += CHUNK
  }
  console.log("knowledge_entries by source:")
  const srcEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])
  for (const [src, count] of srcEntries) console.log(`  ${src}: ${count}`)
  if (srcEntries.length === 0) console.log("  (none)")
  console.log("")

  // --- artifacts by source_museum (paginate) ---
  const museumCounts: Record<string, number> = {}
  let musOffset = 0
  while (true) {
    const { data: byMuseum, error: errMus } = await supabase
      .from("artifacts")
      .select("source_museum")
      .range(musOffset, musOffset + CHUNK - 1)
    if (errMus) {
      console.log("artifacts by source_museum: Error —", errMus.message)
      break
    }
    const rows = byMuseum ?? []
    for (const row of rows) {
      const m = row.source_museum ?? "(null)"
      museumCounts[m] = (museumCounts[m] ?? 0) + 1
    }
    if (rows.length < CHUNK) break
    musOffset += CHUNK
  }
  console.log("artifacts by source_museum:")
  const musEntries = Object.entries(museumCounts).sort((a, b) => b[1] - a[1])
  for (const [mus, count] of musEntries) console.log(`  ${mus}: ${count}`)
  if (musEntries.length === 0) console.log("  (none)")
  console.log("")

  // --- knowledge_documents by content_type (paginate) ---
  const ctCounts: Record<string, number> = {}
  let ctOffset = 0
  while (true) {
    const { data: byContentType, error: errCt } = await supabase
      .from("knowledge_documents")
      .select("content_type")
      .range(ctOffset, ctOffset + CHUNK - 1)
    if (errCt) {
      console.log("knowledge_documents by content_type: Error —", errCt.message)
      break
    }
    const rows = byContentType ?? []
    for (const row of rows) {
      const ct = row.content_type ?? "(null)"
      ctCounts[ct] = (ctCounts[ct] ?? 0) + 1
    }
    if (rows.length < CHUNK) break
    ctOffset += CHUNK
  }
  console.log("knowledge_documents by content_type:")
  const ctEntries = Object.entries(ctCounts).sort((a, b) => b[1] - a[1])
  for (const [ct, count] of ctEntries) console.log(`  ${ct}: ${count}`)
  if (ctEntries.length === 0) console.log("  (none)")
  console.log("")

  // --- regional_knowledge by state (if table exists) ---
  const { data: byState, error: errRegion } = await supabase
    .from("regional_knowledge")
    .select("state")
  if (errRegion) {
    console.log("regional_knowledge by state: N/A (table may not exist)\n")
  } else {
    const stateCounts: Record<string, number> = {}
    for (const row of byState ?? []) {
      const s = (row as { state?: string }).state ?? "(null)"
      stateCounts[s] = (stateCounts[s] ?? 0) + 1
    }
    console.log("regional_knowledge by state:")
    const stateEntries = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])
    for (const [state, count] of stateEntries) console.log(`  ${state}: ${count}`)
    if (stateEntries.length === 0) console.log("  (none)")
    console.log("")
  }

  // --- total row counts ---
  const tables = ["knowledge_entries", "artifacts", "knowledge_documents", "regional_knowledge"]
  let totalRows = 0
  console.log("Total row counts:")
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })
    if (error) {
      console.log(`  ${table}: N/A (${error.message})`)
    } else {
      console.log(`  ${table}: ${count ?? 0}`)
      totalRows += count ?? 0
    }
  }
  console.log(`  TOTAL: ${totalRows}\n`)

  // --- database size (not obtainable via Supabase client without a custom RPC)
  console.log("Database size: N/A\n")

  console.log("=== End audit ===")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
