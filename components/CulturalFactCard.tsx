"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase-browser"

type Entry = {
  id?: string
  name?: string
  biography?: string
  category?: string
}

export function CulturalFactCard() {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)

  const fetchRandom = useCallback(async () => {
    // Do not call the random knowledge API if there is no authenticated user.
    if (!isAuthenticated) return

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
        setEntry({
          name: "Bonita",
          biography:
            "Your cultural oracle. Ask me anything — culture, history, science, music, art.",
        })
      }
    } catch {
      setEntry({
        name: "Bonita",
        biography: "Knowledge is growing. Ask me something.",
      })
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const client = getSupabaseClient()
        if (!client) {
          if (isMounted) {
            setIsAuthenticated(false)
            setEntry({
              name: "Bonita",
              biography:
                "Sign in to unlock deeper cultural knowledge. For now, ask me anything.",
            })
          }
          return
        }

        const { data, error } = await client.auth.getUser()
        if (error || !data?.user) {
          if (isMounted) {
            setIsAuthenticated(false)
            setEntry({
              name: "Bonita",
              biography:
                "Sign in to unlock deeper cultural knowledge. For now, ask me anything.",
            })
          }
          return
        }

        if (isMounted) {
          setIsAuthenticated(true)
          // Now that we know the user is authenticated, fetch the first fact.
          fetchRandom()
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false)
          setEntry({
            name: "Bonita",
            biography:
              "Knowledge is growing. Ask me something while we connect the dots.",
          })
        }
      } finally {
        if (isMounted) {
          setCheckedAuth(true)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [fetchRandom])

  useEffect(() => {
    if (!isAuthenticated) return

    const t = setInterval(fetchRandom, 30_000)
    return () => clearInterval(t)
  }, [fetchRandom, isAuthenticated])

  return (
    <div
      className="rounded-xl border p-3 transition-opacity"
      style={{
        background:
          "linear-gradient(to bottom, rgba(232,184,75,0.18), transparent 18%), rgba(197,150,58,0.05)",
        border: "1px solid rgba(197, 150, 58, 0.3)",
      }}
    >
      <p
        className="bonita-label mb-1.5"
        style={{ color: "var(--bonita-gold)", letterSpacing: "0.18em" }}
      >
        ✦ DID YOU KNOW
      </p>
      {(!checkedAuth && loading) || (checkedAuth && loading) ? (
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
            className="mt-2 inline-flex items-center gap-1 text-xs transition-colors hover:opacity-80"
            style={{ color: "var(--bonita-gold-muted)" }}
          >
            <span className="bonita-refresh-icon">↻</span>
            <span>Refresh fact</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
