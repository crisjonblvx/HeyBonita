"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { BonitaSidebar } from "@/components/BonitaSidebar"
import { getSupabaseClient } from "@/lib/supabase-browser"

type KnowledgeEntry = {
  id: string
  name: string
  category: string
  subcategory?: string | null
  biography?: string | null
}

const WISDOM_QUOTES = [
  { text: "Each one, teach one.", origin: "African American proverb" },
  { text: "When you pray, move your feet.", origin: "African proverb" },
  { text: "The axe forgets; the tree remembers.", origin: "Zimbabwean proverb" },
  { text: "A people without the knowledge of their past history is like a tree without roots.", origin: "Marcus Garvey" },
  { text: "Until the lion tells his side of the story, the tale of the hunt will always glorify the hunter.", origin: "African proverb" },
  { text: "I am not free while any woman is unfree, even when her shackles are very different from my own.", origin: "Audre Lorde" },
]

export default function CommunityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [recentEntries, setRecentEntries] = useState<KnowledgeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [wisdomIndex, setWisdomIndex] = useState(0)

  useEffect(() => {
    setWisdomIndex(Math.floor(Math.random() * WISDOM_QUOTES.length))
  }, [])

  const fetchRecentEntries = useCallback(async () => {
    setLoadingEntries(true)
    try {
      const client = getSupabaseClient()
      if (!client) {
        setLoadingEntries(false)
        return
      }
      const { data } = await client
        .from("knowledge_entries")
        .select("id, name, category, subcategory, biography")
        .not("biography", "is", null)
        .neq("biography", "")
        .order("created_at", { ascending: false })
        .limit(6)
      if (data) setRecentEntries(data)
    } catch {
      // ignore
    } finally {
      setLoadingEntries(false)
    }
  }, [])

  useEffect(() => {
    fetchRecentEntries()
  }, [fetchRecentEntries])

  const wisdom = WISDOM_QUOTES[wisdomIndex]

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-deep)" }}>
      <BonitaSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="relative z-10 flex flex-1 flex-col pl-0 lg:pl-[280px]">
        <div className="p-6 md:p-8">
          <h1
            className="mb-2 text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Community
          </h1>
          <p
            className="mb-8"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            Where our stories, regional histories, and family knowledge live.
            Bonita learns from the community — and the community grows with Bonita.
          </p>

          {/* Cultural Wisdom */}
          <section className="mb-10">
            <div
              className="rounded-2xl border-2 p-6 md:p-8"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--bonita-gold)",
              }}
            >
              <p
                className="mb-1 text-xs font-medium tracking-widest uppercase"
                style={{ color: "var(--bonita-gold-muted)", fontFamily: "var(--font-body)" }}
              >
                Cultural Wisdom
              </p>
              <blockquote
                className="mb-3 text-xl md:text-2xl font-semibold italic leading-relaxed"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                &ldquo;{wisdom?.text}&rdquo;
              </blockquote>
              <p
                className="text-sm"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
              >
                — {wisdom?.origin}
              </p>
              <button
                type="button"
                onClick={() => setWisdomIndex((i) => (i + 1) % WISDOM_QUOTES.length)}
                className="mt-4 text-sm hover:underline"
                style={{ color: "var(--bonita-gold-muted)", fontFamily: "var(--font-body)" }}
              >
                Show another ↻
              </button>
            </div>
          </section>

          {/* Recently Added Knowledge */}
          <section className="mb-10">
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Recently Added to the Knowledge Base
            </h2>
            {loadingEntries ? (
              <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Loading...</p>
            ) : recentEntries.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                Connect to the knowledge base to see recent entries.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border p-4 transition-colors hover:border-[var(--bonita-gold-muted)]"
                    style={{
                      background: "var(--bg-card)",
                      borderColor: "var(--bg-surface-light)",
                    }}
                  >
                    <p
                      className="mb-1 font-semibold truncate"
                      style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                    >
                      {entry.name}
                    </p>
                    <span
                      className="mb-2 inline-block rounded px-1.5 py-0.5 text-xs"
                      style={{
                        background: "var(--bonita-burgundy)",
                        color: "var(--bonita-gold-muted)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {entry.subcategory?.trim() || entry.category}
                    </span>
                    {entry.biography && (
                      <p
                        className="mt-2 text-sm line-clamp-3"
                        style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
                      >
                        {entry.biography}
                      </p>
                    )}
                    <Link
                      href={`/chat?ask=${encodeURIComponent("Tell me about " + entry.name)}&autosubmit=true`}
                      className="mt-3 block rounded-lg px-3 py-2 text-center text-sm font-medium transition-opacity hover:opacity-90"
                      style={{
                        background: "var(--bonita-gold)",
                        color: "var(--bg-deep)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Ask Bonita about this
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="mb-10">
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Explore with Bonita
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/explore"
                className="flex flex-col items-center rounded-xl border-2 p-6 text-center transition-colors hover:border-[var(--bonita-gold)]"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--bg-surface-light)",
                }}
              >
                <span className="mb-3 text-3xl">📚</span>
                <span className="font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  Knowledge Base
                </span>
                <span className="mt-1 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  108,000+ entries
                </span>
              </Link>
              <Link
                href="/map"
                className="flex flex-col items-center rounded-xl border-2 p-6 text-center transition-colors hover:border-[var(--bonita-gold)]"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--bg-surface-light)",
                }}
              >
                <span className="mb-3 text-3xl">🗺️</span>
                <span className="font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  Cultural Map
                </span>
                <span className="mt-1 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  30+ regions
                </span>
              </Link>
              <Link
                href="/chat"
                className="flex flex-col items-center rounded-xl border-2 p-6 text-center transition-colors hover:border-[var(--bonita-gold)]"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--bg-surface-light)",
                }}
              >
                <span className="mb-3 text-3xl">💬</span>
                <span className="font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  Chat with Bonita
                </span>
                <span className="mt-1 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  Ask anything
                </span>
              </Link>
              <Link
                href="/chat?ask=Tell%20me%20a%20grandmother%20proverb&autosubmit=true"
                className="flex flex-col items-center rounded-xl border-2 p-6 text-center transition-colors hover:border-[var(--bonita-gold)]"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--bg-surface-light)",
                }}
              >
                <span className="mb-3 text-3xl">✨</span>
                <span className="font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  Grandmother Wisdom
                </span>
                <span className="mt-1 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  Proverbs & sayings
                </span>
              </Link>
            </div>
          </section>

          {/* Coming Soon Features */}
          <section>
            <div
              className="rounded-xl border p-6"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--bg-surface-light)",
              }}
            >
              <h3
                className="mb-3 font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Coming to Community
              </h3>
              <ul className="space-y-2" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                <li className="flex items-center gap-2 text-sm">
                  <span style={{ color: "var(--bonita-gold)" }}>●</span> Submit your own stories and family histories
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span style={{ color: "var(--bonita-gold)" }}>●</span> Community-voted knowledge additions
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span style={{ color: "var(--bonita-gold)" }}>●</span> Regional community groups
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <span style={{ color: "var(--bonita-gold)" }}>●</span> Cultural calendar of events
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
