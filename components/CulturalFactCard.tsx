"use client"

import { useState, useEffect } from "react"

type Entry = {
  id?: string
  name?: string
  biography?: string
  category?: string
}

export function CulturalFactCard() {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchRandom() {
    setLoading(true)
    try {
      const url = "/api/core/v1/knowledge/random"
      let res = await fetch(url, { cache: "no-store" })
      if (!res.ok && res.status === 500) {
        res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" })
      }
      const json = await res.json()
      if (json?.ok && json?.entry) {
        setEntry(json.entry)
      } else {
        setEntry({ name: "Bonita", biography: "Your cultural oracle. Ask me anything — culture, history, science, music, art." })
      }
    } catch {
      setEntry({ name: "Bonita", biography: "Knowledge is growing. Ask me something." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRandom()
  }, [])

  useEffect(() => {
    const t = setInterval(fetchRandom, 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="rounded-xl border p-3 transition-opacity"
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(197, 150, 58, 0.25)",
      }}
    >
      <p className="bonita-label mb-1.5" style={{ color: "var(--bonita-gold-muted)" }}>
        ✦ DID YOU KNOW
      </p>
      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading...
        </p>
      ) : entry ? (
        <div className="animate-in fade-in duration-300">
          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {entry.name}
          </p>
          <p
            className="mt-1 line-clamp-3 text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {entry.biography || "No summary yet."}
          </p>
          <button
            type="button"
            onClick={fetchRandom}
            className="mt-2 text-xs transition-colors hover:opacity-80"
            style={{ color: "var(--bonita-gold-muted)" }}
          >
            Refresh fact
          </button>
        </div>
      ) : null}
    </div>
  )
}
