# BONITA KNOWLEDGE FEEDING SYSTEM
## The Engine That Keeps Bonita's Brain Growing

### Overview

Bonita needs to handle two kinds of questions:
1. **Cultural/specialized** — HBCU history, Black inventors, hip-hop origins, Divine Nine, etc. (her unique strength)
2. **General knowledge** — math homework, current events, "what is photosynthesis," coding help, etc. (what students and the public also need)

This document defines the system that continuously feeds Bonita from free/cheap data sources so she can handle both, and keep getting smarter every day.

---

## ARCHITECTURE: HOW BONITA ANSWERS QUESTIONS

```
User asks a question
        │
        ▼
┌─────────────────────┐
│  Bonita Brain API    │
│  /api/core/v1/chat   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  1. CLASSIFY INTENT  │  ← Is this cultural? General? Current events?
└────────┬────────────┘
         │
    ┌────┴────────────┐
    ▼                 ▼
┌──────────┐   ┌──────────────┐
│ CULTURAL │   │ GENERAL /    │
│ KNOWLEDGE│   │ CURRENT      │
│ (RAG)    │   │ (Base Model  │
│          │   │  + RAG)      │
└────┬─────┘   └──────┬───────┘
     │                │
     ▼                ▼
┌──────────┐   ┌──────────────┐
│ Supabase │   │ Wikipedia    │
│ pgvector │   │ Wikidata     │
│ search   │   │ Open APIs    │
│          │   │ + Base Model │
└────┬─────┘   └──────┬───────┘
     │                │
     └───────┬────────┘
             ▼
┌──────────────────────┐
│  2. COMPOSE RESPONSE  │
│  In Bonita's voice    │
│  With sources cited   │
└──────────────────────┘
```

### Key Principle: RAG First, Model Second

When someone asks Bonita a question:
1. **Search her knowledge base** (Supabase pgvector) for relevant entries
2. If strong matches found → use them as context for the response
3. If no matches → fall back to the base model's general knowledge (Mistral knows a LOT)
4. **Always respond in Bonita's voice** regardless of source

This means Bonita can answer "Who is David Blackwell?" with rich cultural context from her knowledge base AND answer "What is the quadratic formula?" from the base model's training data. She doesn't need to have everything in Supabase — just the things that make her uniquely Bonita.

---

## FREE & LOW-COST DATA SOURCES

### Tier 1: ALWAYS FREE, NO KEY NEEDED

| Source | API | What It Provides | Rate Limit | Use Case |
|--------|-----|-----------------|------------|----------|
| **Wikipedia API** | `en.wikipedia.org/api/rest_v1/` | Full article text, summaries, images for any topic | Generous | General knowledge, biographies, science, history |
| **Wikidata API** | `wikidata.org/w/api.php` | Structured data (birth/death dates, occupations, awards, relationships) | Generous | Structured biographical data, fact-checking |
| **Met Museum API** | `collectionapi.metmuseum.org/public/collection/v1/` | 470,000+ artworks, images, metadata | 80 req/sec | Art, cultural artifacts |
| **Library of Congress API** | `loc.gov/search/?fo=json` | Millions of items, photos, newspapers, manuscripts | No key needed | History, primary sources, photographs |
| **Open Library API** | `openlibrary.org/api/` | 20M+ book records, many with full text | Generous | Book data, reading recommendations |
| **MusicBrainz API** | `musicbrainz.org/ws/2/` | Artists, albums, recordings, relationships | 1 req/sec | Music data, discographies |
| **Project Gutenberg** | `gutenberg.org` | 70,000+ free eBooks | Direct download | Classic literature, historic texts |
| **Cleveland Museum API** | `openaccess-api.clevelandart.org/api/` | 64,000+ artworks with `african_american_artists` filter | Generous | Art by Black artists specifically |
| **DPLA API** | `api.dp.la/v2/` | Aggregated cultural heritage from 4,000+ institutions | Free w/ key | Cultural materials, historic photos |

### Tier 2: FREE WITH API KEY (quick registration)

| Source | API Key Source | What It Provides | Use Case |
|--------|---------------|-----------------|----------|
| **Smithsonian Open Access** | `api.si.edu` | 11M+ records including NMAAHC | Cultural artifacts, African American history |
| **News API** | `newsapi.org` | Current news articles | Current events (100 req/day free) |
| **Wolfram Alpha** | `products.wolframalpha.com/api` | Math, science, computation | Student math/science questions (2000 req/month free) |

### Tier 3: LOW-COST / PREMIUM (for scale)

| Source | Cost | What It Provides | When to Add |
|--------|------|-----------------|-------------|
| **Perplexity API** | ~$5/month | Real-time web search + AI | When Bonita needs current events |
| **Brave Search API** | Free tier + paid | Web search results | General question fallback |
| **Google Knowledge Graph** | Free tier | Structured entity data | Entity verification |

---

## THE FEEDING PIPELINE

### Architecture

```
┌─────────────────────────────────────────────────┐
│            BONITA KNOWLEDGE FEEDER               │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ SCHEDULER    │  │ SOURCE ADAPTERS           │  │
│  │ (pg_cron or  │  │                           │  │
│  │  Vercel Cron)│  │ ├─ WikipediaAdapter       │  │
│  │              │  │ ├─ SmithsonianAdapter     │  │
│  │ Daily:       │  │ ├─ MetMuseumAdapter       │  │
│  │  - Wikipedia │  │ ├─ LibraryOfCongressAdapter│  │
│  │  - News      │  │ ├─ MusicBrainzAdapter     │  │
│  │              │  │ ├─ WikidataAdapter        │  │
│  │ Weekly:      │  │ ├─ OpenLibraryAdapter     │  │
│  │  - Museums   │  │ ├─ ClevelandMuseumAdapter │  │
│  │  - LOC       │  │ └─ NewsAdapter            │  │
│  │              │  │                           │  │
│  │ Monthly:     │  └──────────┬───────────────┘  │
│  │  - Full sync │             │                   │
│  └──────┬───────┘             │                   │
│         │                     ▼                   │
│         │            ┌────────────────┐           │
│         └───────────▶│ PROCESSOR      │           │
│                      │                │           │
│                      │ 1. Fetch data  │           │
│                      │ 2. Normalize   │           │
│                      │ 3. Deduplicate │           │
│                      │ 4. Embed       │           │
│                      │ 5. Store       │           │
│                      └───────┬────────┘           │
│                              │                    │
│                              ▼                    │
│                     ┌────────────────┐            │
│                     │ SUPABASE       │            │
│                     │ knowledge_     │            │
│                     │ entries +      │            │
│                     │ artifacts      │            │
│                     └────────────────┘            │
└─────────────────────────────────────────────────┘
```

### Implementation: API Routes

```
app/api/core/v1/knowledge/
├── ingest/
│   ├── route.ts              ← Manual trigger (admin only)
│   ├── smithsonian/route.ts  ← Smithsonian NMAAHC ingestion
│   ├── wikipedia/route.ts    ← Wikipedia bulk ingestion
│   ├── met/route.ts          ← Met Museum ingestion
│   ├── loc/route.ts          ← Library of Congress ingestion
│   ├── musicbrainz/route.ts  ← MusicBrainz ingestion
│   └── news/route.ts         ← Current events ingestion
├── feed/
│   └── route.ts              ← Cron endpoint — runs all adapters
```

### Cron Schedule (via Vercel Cron or pg_cron)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/core/v1/knowledge/feed",
      "schedule": "0 3 * * *"
    }
  ]
}
```

This runs at 3 AM daily. The feed endpoint:
1. Checks which sources haven't been synced recently
2. Runs the appropriate adapters
3. Normalizes data into `knowledge_entries` or `artifacts` format
4. Generates embeddings using a free/self-hosted embedder
5. Upserts into Supabase (deduplicates by `source` + `source_id`)

---

## SOURCE ADAPTER SPECS

### 1. Wikipedia Adapter
**Purpose:** General knowledge backbone — biographies, science, history, math, etc.
**Frequency:** Daily for watchlist, weekly for bulk
**Free:** Yes, no key needed

```typescript
// Pseudocode
async function ingestWikipedia(topics: string[]) {
  for (const topic of topics) {
    // 1. Get article summary
    const summary = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
    );
    
    // 2. Get structured data from Wikidata
    const wikidata = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&titles=${topic}&sites=enwiki&format=json`
    );
    
    // 3. Normalize and store
    await upsertKnowledge({
      category: classifyCategory(summary),
      name: summary.title,
      biography: summary.extract,
      source: 'wikipedia',
      source_url: summary.content_urls.desktop.page,
      // ... etc
    });
  }
}
```

**Topics to seed with:**
- All ~200+ people from the Bonita DNA doc
- All HBCUs
- All Divine Nine organizations
- Key cultural movements (Harlem Renaissance, Black Arts Movement, Hip-Hop, Afrofuturism)
- Scientific concepts students commonly ask about
- Historical events

### 2. Smithsonian/NMAAHC Adapter
**Purpose:** African American cultural artifacts
**Frequency:** Weekly
**Free:** Yes, with API key from api.si.edu

```
GET https://api.si.edu/openaccess/api/v1.0/search
  ?q=unit_code:NMAAHC
  &api_key=YOUR_KEY
  &rows=100
  &start=0
```

### 3. Met Museum Adapter
**Purpose:** Art across all cultures
**Frequency:** Weekly
**Free:** Yes, no key needed

```
GET https://collectionapi.metmuseum.org/public/collection/v1/search?q=african+american
GET https://collectionapi.metmuseum.org/public/collection/v1/objects/[objectID]
```

### 4. Library of Congress Adapter
**Purpose:** Historic documents, photos, newspapers
**Frequency:** Weekly
**Free:** Yes, no key needed

```
GET https://www.loc.gov/search/?q=african+american&fo=json
GET https://www.loc.gov/collections/african-american-photographs-1900-paris-exposition/?fo=json
GET https://www.loc.gov/collections/african-american-band-music-and-recordings/?fo=json
```

### 5. MusicBrainz Adapter
**Purpose:** Music artist data, discographies
**Frequency:** Monthly
**Free:** Yes, 1 request per second

```
GET https://musicbrainz.org/ws/2/artist/?query=artist:"A Tribe Called Quest"&fmt=json
GET https://musicbrainz.org/ws/2/release-group/?artist=[MBID]&type=album&fmt=json
```

### 6. News Adapter (for current events)
**Purpose:** Keep Bonita aware of what's happening now
**Frequency:** Daily
**Free:** NewsAPI free tier (100 requests/day)

```
GET https://newsapi.org/v2/top-headlines?country=us&category=general&apiKey=YOUR_KEY
GET https://newsapi.org/v2/everything?q=HBCU+OR+hip-hop+OR+"Black+history"&apiKey=YOUR_KEY
```

---

## EMBEDDING STRATEGY

Bonita needs vector embeddings to do semantic search. Options:

### Free / Self-Hosted
1. **Supabase Edge Function + `all-MiniLM-L6-v2`** — Run embedding generation as an Edge Function
2. **Ollama with `nomic-embed-text`** — Run alongside Mistral on the same GPU
3. **HuggingFace Inference API** — Free tier, 1000 requests/day

### Recommended Approach
```typescript
// Use Supabase Edge Function for embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  // Option A: Call your self-hosted Ollama
  const response = await fetch(`${process.env.BONITA_BRAIN_URL}/api/embeddings`, {
    method: 'POST',
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text })
  });
  
  // Option B: HuggingFace free API
  const response = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    {
      headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` },
      body: JSON.stringify({ inputs: text })
    }
  );
  
  return response.json();
}
```

---

## HOW BONITA HANDLES GENERAL QUESTIONS

For questions that AREN'T in her cultural knowledge base:

### Strategy: RAG + Model Fallback + Live Lookup

```typescript
async function handleChat(userMessage: string) {
  // 1. Search Bonita's knowledge base
  const knowledgeResults = await searchKnowledge(userMessage);
  
  // 2. If strong matches found, use them as context
  if (knowledgeResults.length > 0 && knowledgeResults[0].similarity > 0.75) {
    return respondWithContext(knowledgeResults, userMessage);
  }
  
  // 3. For general questions, check if it's something we can look up
  const isCurrentEvents = detectCurrentEvents(userMessage);
  const isFactual = detectFactualQuery(userMessage);
  
  if (isCurrentEvents) {
    // Search news/Wikipedia for recent info
    const liveData = await fetchLiveContext(userMessage);
    return respondWithContext(liveData, userMessage);
  }
  
  if (isFactual) {
    // Quick Wikipedia lookup
    const wikiData = await searchWikipedia(userMessage);
    if (wikiData) {
      return respondWithContext(wikiData, userMessage);
    }
  }
  
  // 4. Fall back to base model's general knowledge
  // Mistral 7B knows a LOT — math, science, coding, history, etc.
  return respondFromModel(userMessage);
}
```

### Key: She ALWAYS responds in her voice

Even when answering a math question, Bonita sounds like Bonita:

**Generic AI:** "The quadratic formula is x = (-b ± √(b²-4ac)) / 2a"

**Bonita:** "Alright, let me break this down for you. The quadratic formula is x = (-b ± √(b²-4ac)) / 2a. It finds the solutions to any quadratic equation ax² + bx + c = 0. Fun fact — this formula traces back to ancient Babylonian mathematicians, and al-Khwarizmi — a Persian mathematician whose name literally gives us the word 'algorithm.' Math has always been global. Now, want me to walk through an example?"

---

## DAILY FEEDING SCHEDULE

| Time | Task | Source | Est. Records |
|------|------|--------|-------------|
| 3:00 AM | News sync | NewsAPI | ~20 articles |
| 3:05 AM | Wikipedia watchlist | Wikipedia | ~50 articles |
| 3:30 AM | Trending topics | Wikipedia | ~20 articles |
| Every Sunday 3 AM | Museum sync | Smithsonian + Met + Cleveland | ~500 new artifacts |
| Every Sunday 3:30 AM | LOC sync | Library of Congress | ~200 new items |
| 1st of month | Full resync | All sources | Full refresh |

---

## MONITORING & QUALITY

### Dashboard (build later, but track from the start)
- Total knowledge entries count
- Entries by category
- Last sync time per source
- Average embedding quality score
- Most-asked topics without good matches (knowledge gaps)
- User feedback scores

### Knowledge Gap Detection
When Bonita can't find a good match and falls back to the base model:
1. Log the question and topic
2. After accumulating gaps, batch-create entries from Wikipedia/Wikidata
3. This is how Bonita *learns from her conversations*

---

## ENV VARS NEEDED

```env
# Already configured
SUPABASE_URL=https://kkripdeolrxqigkopwlq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
BONITA_BRAIN_URL=http://your-ollama-host:11434
BONITA_BRAIN_MODEL=mistral
BONITA_INGEST_SECRET=your_ingest_secret

# New for feeding system
SMITHSONIAN_API_KEY=          # Free from api.si.edu
HF_TOKEN=                      # Free from huggingface.co (for embeddings)
NEWS_API_KEY=                  # Free from newsapi.org (100 req/day)
DPLA_API_KEY=                  # Free from dp.la

# Optional / future
WOLFRAM_APP_ID=                # Free 2000 req/month from wolframalpha.com
BRAVE_API_KEY=                 # Free tier from brave.com/search/api
```

---

## MONETIZATION NOTES

When you're ready to monetize:

### Free Tier
- 20 messages/day with Bonita
- Access to Explore Knowledge (browse only)
- "Powered by ContentCreators.life" branding

### Bonita Pro ($9.99/month)
- Unlimited conversations
- Full knowledge base access + semantic search
- Cultural Map feature
- Priority response speed
- No branding

### Bonita Education ($4.99/month per student or free for HBCU students)
- Unlimited conversations
- Study mode (Bonita helps with homework in her voice)
- Citation mode (she provides sources for research papers)
- HBCU students free — verify with .edu email from HBCU domain

### API Access ($29.99/month)
- For developers who want to build on Bonita
- `/api/core/v1/chat`, `/api/core/v1/search`, `/api/core/v1/knowledge`
- Rate limited but generous

---

## IMPLEMENTATION ORDER FOR CURSOR

### Phase 1 (This Week)
- [ ] Wikipedia adapter — bulk ingest the DNA doc people + general knowledge topics
- [ ] Embedding pipeline — generate embeddings for all 234+ existing entries
- [ ] Enhanced `/api/core/v1/chat` — RAG search → context injection → model response
- [ ] Wikipedia live lookup fallback for general questions

### Phase 2 (Next Week)
- [ ] Museum adapters (Smithsonian, Met, Cleveland)
- [ ] Library of Congress adapter
- [ ] News adapter for current events
- [ ] Cron schedule via Vercel or pg_cron

### Phase 3 (Week 3)
- [ ] Knowledge gap detection and logging
- [ ] MusicBrainz adapter for artist discographies
- [ ] Explore Knowledge page (`/explore`)
- [ ] Auto-expanding knowledge from gap detection

### Phase 4 (Month 2)
- [ ] Community knowledge submissions
- [ ] Moderation pipeline
- [ ] Monetization gates (free/pro/education tiers)
- [ ] Usage analytics dashboard

---

*Bonita doesn't stop learning. Every day, her brain gets bigger. Every conversation teaches her what she doesn't know yet. Every community contribution makes her more complete. She's not a static product — she's a living cultural institution.*
