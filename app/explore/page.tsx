"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { BonitaSidebar } from "@/components/BonitaSidebar"

const CATEGORIES = [
  { key: "musician", label: "Musicians", count: 84408, icon: "🎵" },
  { key: "athlete", label: "Athletes", count: 7184, icon: "⚡" },
  { key: "author", label: "Authors & Writers", count: 5126, icon: "📖" },
  { key: "activist", label: "Activists", count: 2364, icon: "✊🏾" },
  { key: "filmmaker", label: "Filmmakers", count: 1572, icon: "🎬" },
  { key: "visual-artist", label: "Visual Artists", count: 1468, icon: "🎨" },
  { key: "historical-event", label: "Historical Events", count: 1422, icon: "📜" },
  { key: "scientist", label: "Scientists", count: 1143, icon: "🔬" },
  { key: "cultural-movement", label: "Cultural Movements", count: 982, icon: "🌊" },
  { key: "place", label: "Places", count: 840, icon: "📍" },
  { key: "culinary", label: "Food & Culinary", count: 709, icon: "🍽️" },
  { key: "spiritual", label: "Spiritual", count: 393, icon: "✨" },
  { key: "architect", label: "Architects", count: 356, icon: "🏛️" },
  { key: "fashion", label: "Fashion", count: 195, icon: "👑" },
  { key: "dance", label: "Dance", count: 194, icon: "💃🏾" },
  { key: "inventor", label: "Inventors", count: 113, icon: "💡" },
] as const

const PER_PAGE = 20

type Entry = {
  id: string
  name: string
  category: string
  image_url: string | null
  biography?: string | null
}

function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key
}

function InitialAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?"
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-full text-lg font-semibold"
      style={{
        background: "var(--bonita-burgundy)",
        color: "var(--bonita-gold-crown)",
        fontFamily: "var(--font-display)",
      }}
    >
      {initial}
    </div>
  )
}

export default function ExplorePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState<Entry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const categoryMeta = selectedCategory ? CATEGORIES.find((c) => c.key === selectedCategory) : null

  const fetchEntries = useCallback(async () => {
    if (!selectedCategory) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        page: String(page),
        limit: String(PER_PAGE),
      })
      if (search) params.set("search", search)
      const res = await fetch(`/api/core/v1/knowledge?${params}`)
      const json = await res.json()
      if (json.ok) {
        setEntries(json.entries ?? [])
        setTotal(json.total ?? 0)
      } else {
        setEntries([])
        setTotal(0)
      }
    } catch {
      setEntries([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, page, search])

  useEffect(() => {
    if (selectedCategory) fetchEntries()
  }, [selectedCategory, fetchEntries])

  const totalPages = Math.ceil(total / PER_PAGE)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  useEffect(() => {
    if (!selectedCategory) return
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput, selectedCategory])

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-deep)" }}>
      <BonitaSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="relative z-10 flex flex-1 flex-col pl-0 lg:pl-[280px]">
        <div className="p-6 md:p-8">
          {!selectedCategory ? (
            <>
              <h1
                className="mb-2 text-2xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Explore Knowledge
              </h1>
              <p
                className="mb-6"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
              >
                Browse by category, then ask Bonita about anyone or anything.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.key)
                      setSearch("")
                      setSearchInput("")
                      setPage(1)
                    }}
                    className="group flex flex-col items-center rounded-xl border-2 p-6 text-left transition-colors"
                    style={{
                      background: "var(--bg-card)",
                      borderColor: "var(--bg-surface-light)",
                      color: "var(--text-primary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--bonita-gold)"
                      e.currentTarget.style.background = "var(--bg-hover)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--bg-surface-light)"
                      e.currentTarget.style.background = "var(--bg-card)"
                    }}
                  >
                    <span className="mb-3 text-4xl" aria-hidden>
                      {cat.icon}
                    </span>
                    <span
                      className="mb-1 text-lg font-semibold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {cat.label}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
                    >
                      {cat.count.toLocaleString()} entries
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null)
                    setPage(1)
                    setSearch("")
                    setSearchInput("")
                  }}
                  className="flex items-center gap-1 text-sm transition-opacity hover:opacity-80"
                  style={{ color: "var(--bonita-gold)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
                >
                  Explore → {categoryMeta?.label ?? selectedCategory}
                </span>
              </div>

              <form onSubmit={handleSearchSubmit} className="mb-6">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search in this category..."
                  className="w-full max-w-md rounded-xl border px-4 py-2.5 text-sm outline-none transition-[border-color] focus:border-[var(--bonita-gold-crown)]"
                  style={{
                    background: "var(--bg-input)",
                    borderColor: "var(--bg-surface-light)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </form>

              {loading ? (
                <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  Loading…
                </p>
              ) : (
                <>
                  <p
                    className="mb-4 text-sm"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                  >
                    {total.toLocaleString()} result{total !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-col rounded-xl border p-4"
                        style={{
                          background: "var(--bg-card)",
                          borderColor: "var(--bg-surface-light)",
                        }}
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <div
                            className="h-12 w-12 shrink-0 overflow-hidden rounded-full"
                            style={{ background: "var(--bg-surface-light)" }}
                          >
                            {entry.image_url ? (
                              <img
                                src={entry.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <InitialAvatar name={entry.name} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate font-semibold"
                              style={{
                                fontFamily: "var(--font-display)",
                                color: "var(--text-primary)",
                              }}
                            >
                              {entry.name}
                            </p>
                            <span
                              className="inline-block rounded px-1.5 py-0.5 text-xs"
                              style={{
                                background: "var(--bonita-burgundy)",
                                color: "var(--bonita-gold-muted)",
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              {categoryLabel(entry.category)}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/?ask=${encodeURIComponent("Tell me about " + entry.name)}`}
                          className="mt-auto rounded-lg px-3 py-2 text-center text-sm font-medium transition-opacity hover:opacity-90"
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

                  {totalPages > 1 && (
                    <div
                      className="mt-6 flex flex-wrap items-center justify-center gap-2"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
                        style={{
                          background: "var(--bg-surface)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--bg-surface-light)",
                        }}
                      >
                        Previous
                      </button>
                      <span
                        className="px-2 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Page {page} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
                        style={{
                          background: "var(--bg-surface)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--bg-surface-light)",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
