import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })
import { PRIORITY_CATEGORIES } from "./categories"
import { searchWikipedia, getWikipediaSummary } from "./sources/wikipedia"
import { generateKnowledgeEntry } from "./generators/knowledge-entry"
import { generateRegionalEntry } from "./generators/regional-entry"
import { entryExists, regionExists, brain } from "./utils/dedup"
import { isCulturallyRelevant, isValidEntry } from "./utils/quality"

const DRY_RUN = process.env.DRY_RUN === "true"
const DELAY_MS = 500
const CATEGORY_FILTER = process.argv.find((a) => a.startsWith("--category="))?.split("=")[1]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function seedKnowledgeCategory(config: (typeof PRIORITY_CATEGORIES)[0]) {
  console.log(`\n  Seeding category: ${config.category} (target: ${config.target})`)
  let inserted = 0
  let skipped = 0

  for (const topic of config.topics) {
    if (inserted >= config.target) break
    console.log(`  Searching: ${topic}`)

    let names: string[]
    try {
      names = await searchWikipedia(topic, 20)
    } catch (err) {
      console.error(`  Wikipedia search failed for "${topic}":`, err)
      continue
    }

    for (const name of names) {
      if (inserted >= config.target) break

      if (await entryExists(name)) {
        skipped++
        continue
      }

      let summary = ""
      try {
        summary = await getWikipediaSummary(name)
      } catch {
        // proceed without summary
      }

      if (summary && !isCulturallyRelevant(summary)) {
        skipped++
        continue
      }

      const entry = await generateKnowledgeEntry(
        name,
        config.category,
        summary.slice(0, 300),
      )

      if (!isValidEntry(entry)) {
        skipped++
        await sleep(DELAY_MS)
        continue
      }

      if (DRY_RUN) {
        console.log(`  [DRY] Would insert: ${entry.name} (${entry.category}/${entry.subcategory})`)
        inserted++
        await sleep(DELAY_MS)
        continue
      }

      const { error } = await brain.from("knowledge_entries").insert({
        name: entry.name,
        category: entry.category,
        subcategory: entry.subcategory,
        nationality: entry.nationality,
        birth_year: entry.birth_year,
        death_year: entry.death_year,
        biography: entry.biography,
        key_contributions: entry.key_contributions,
        tags: entry.tags,
        source: "auto-seeder-v1",
      })

      if (error) {
        console.error(`  Insert error for ${name}:`, error.message)
      } else {
        inserted++
        console.log(`  [${inserted}] ${entry.name} (${entry.category})`)
      }

      await sleep(DELAY_MS)
    }
  }

  console.log(`  ${config.category}: ${inserted} inserted, ${skipped} skipped`)
  return inserted
}

async function seedRegionalCategory(config: (typeof PRIORITY_CATEGORIES)[0]) {
  console.log(`\n  Seeding regional knowledge (target: ${config.target})`)
  let inserted = 0
  let skipped = 0

  for (const topic of config.topics) {
    if (inserted >= config.target) break
    console.log(`  Generating regional entry for: ${topic}`)

    const entry = await generateRegionalEntry(topic)
    if (!entry || !entry.culturally_relevant || !entry.city || !entry.content) {
      skipped++
      await sleep(DELAY_MS)
      continue
    }

    if (await regionExists(entry.city, entry.state || "", entry.title || "")) {
      skipped++
      continue
    }

    if (DRY_RUN) {
      console.log(`  [DRY] Would insert regional: ${entry.city}, ${entry.state} — ${entry.title}`)
      inserted++
      await sleep(DELAY_MS)
      continue
    }

    const { error } = await brain.from("regional_knowledge").insert({
      city: entry.city,
      state: entry.state,
      title: entry.title,
      content: entry.content,
      source: "auto-seeder-v1",
    })

    if (error) {
      console.error(`  Insert error for regional ${entry.city}:`, error.message)
    } else {
      inserted++
      console.log(`  [${inserted}] ${entry.city}, ${entry.state} — ${entry.title}`)
    }

    await sleep(DELAY_MS)
  }

  console.log(`  regional: ${inserted} inserted, ${skipped} skipped`)
  return inserted
}

async function main() {
  console.log("Bonita Auto-Seeder starting...")
  if (DRY_RUN) console.log("DRY RUN MODE — no database writes\n")

  const categories = CATEGORY_FILTER
    ? PRIORITY_CATEGORIES.filter((c) => c.category === CATEGORY_FILTER)
    : PRIORITY_CATEGORIES

  if (categories.length === 0) {
    console.error(`No category found matching: ${CATEGORY_FILTER}`)
    console.log("Available:", PRIORITY_CATEGORIES.map((c) => c.category).join(", "))
    process.exit(1)
  }

  console.log(`Running ${categories.length} categories\n`)

  let totalInserted = 0

  for (const config of categories) {
    if (config.category === "regional") {
      totalInserted += await seedRegionalCategory(config)
    } else {
      totalInserted += await seedKnowledgeCategory(config)
    }
  }

  if (!DRY_RUN) {
    const { count } = await brain
      .from("knowledge_entries")
      .select("*", { count: "exact", head: true })

    console.log(`\nSeeder complete!`)
    console.log(`   New entries added: ${totalInserted}`)
    console.log(`   Total in database: ${count?.toLocaleString()}`)
  } else {
    console.log(`\nDry run complete! Would have added: ${totalInserted}`)
  }
}

main().catch(console.error)
