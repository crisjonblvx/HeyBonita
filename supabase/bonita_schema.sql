-- Bonita AI cultural knowledge schema
-- Mirrors the "SUPABASE SCHEMA EXPANSION" section of docs/Bonita_DNAmd.md

-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base for cultural content
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,        -- 'scientist', 'musician', 'author', etc.
  subcategory TEXT,              -- 'mathematician', 'jazz', 'novelist', etc.
  name TEXT NOT NULL,
  birth_year INTEGER,
  death_year INTEGER,
  nationality TEXT,
  biography TEXT,
  key_works JSONB,               -- [{title, year, description}]
  key_contributions JSONB,       -- [{contribution, impact, year}]
  quotes JSONB,                  -- [{quote, context, year}]
  related_people TEXT[],         -- names or external IDs for related figures
  tags TEXT[],
  source TEXT,                   -- where the data came from
  source_url TEXT,
  image_url TEXT,                -- cached thumbnail (e.g. from Wikipedia) for chat images
  embedding VECTOR(384),         -- for semantic search (pgvector)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Museum/archive artifacts
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_museum TEXT NOT NULL,   -- 'NMAAHC', 'Met', 'Cleveland', 'LOC'
  source_id TEXT,                -- original ID from the API
  title TEXT NOT NULL,
  description TEXT,
  creator TEXT,
  date_created TEXT,
  medium TEXT,
  culture TEXT,
  classification TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  embedding VECTOR(384),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations and learning
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT,
  messages JSONB NOT NULL,       -- [{role, content, timestamp}]
  topic_tags TEXT[],
  feedback_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Books and documents (Open Library, etc.)
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT,
  description TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  content_type TEXT NOT NULL DEFAULT 'book',
  metadata JSONB,
  embedding VECTOR(384),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_source ON knowledge_documents(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_content_type ON knowledge_documents(content_type);

-- Bonita's growing knowledge (user-contributed)
CREATE TABLE IF NOT EXISTS community_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  verified BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  embedding VECTOR(384),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_entries(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_entries USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_entries
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_artifacts_source ON artifacts(source_museum);
CREATE INDEX IF NOT EXISTS idx_artifacts_embedding ON artifacts
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Regional / state-level deep cultural knowledge (e.g. 18+ entries per state for RAG)
CREATE TABLE IF NOT EXISTS regional_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regional_knowledge_state ON regional_knowledge(state);
CREATE INDEX IF NOT EXISTS idx_regional_knowledge_title ON regional_knowledge(title);

-- Admin flag on profiles (for dashboard & access control)
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

