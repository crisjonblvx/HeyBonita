"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-browser"

type Stat = {
  label: string
  value: string
}

type ProfileRow = {
  id: string
  email?: string | null
  plan?: string | null
  is_admin?: boolean | null
  created_at?: string | null
}

type ApiKeyRow = {
  id: string
  display_name?: string | null
  app_key?: string | null
  plan?: string | null
  requests_this_month?: number | null
  is_active?: boolean | null
}

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stat[]>([])
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([])
  const [userPage, setUserPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    async function guardAndLoad() {
      const client = getSupabaseClient()
      if (!client) {
        router.replace("/landing")
        return
      }
      const { data } = await client.auth.getSession()
      const user = data.session?.user
      if (!user) {
        router.replace("/landing")
        return
      }
      const { data: profile } = await client
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle()
      if (!profile?.is_admin) {
        router.replace("/chat")
        return
      }
      setAuthorized(true)

      const newStats: Stat[] = []
      try {
        const [{ count: userCount }, { count: knowledgeCount }, { count: convoCount }] =
          await Promise.all([
            client.from("profiles").select("*", { count: "exact", head: true }),
            client
              .from("knowledge_entries")
              .select("*", { count: "exact", head: true }),
            client
              .from("conversations")
              .select("*", { count: "exact", head: true }),
          ])
        newStats.push(
          { label: "Total Users", value: userCount != null ? String(userCount) : "N/A" },
          {
            label: "Knowledge Entries",
            value: knowledgeCount != null ? String(knowledgeCount) : "N/A",
          },
          {
            label: "Conversations",
            value: convoCount != null ? String(convoCount) : "N/A",
          },
        )
      } catch {
        // ignore, keep empty stats
      }
      newStats.push({ label: "Active API Keys", value: "N/A" })
      setStats(newStats)

      try {
        const { data: userRows } = await client
          .from("profiles")
          .select("id, email, plan, is_admin, created_at")
          .order("created_at", { ascending: false })
          .limit(200)
        setUsers(userRows || [])
      } catch {
        setUsers([])
      }

      try {
        const { data: keyRows } = await client
          .from("api_keys")
          .select("id, display_name, app_key, plan, requests_this_month, is_active")
        setApiKeys(keyRows || [])
      } catch {
        setApiKeys([])
      }

      setLoading(false)
    }
    guardAndLoad()
  }, [router])

  const pagedUsers = users.slice((userPage - 1) * pageSize, userPage * pageSize)
  const totalUserPages = Math.max(1, Math.ceil(users.length / pageSize))

  const toggleUserAdmin = async (id: string, next: boolean) => {
    const client = getSupabaseClient()
    if (!client) return
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_admin: next } : u)))
    try {
      await client.from("profiles").update({ is_admin: next }).eq("id", id)
    } catch {
      // ignore
    }
  }

  const toggleApiKeyActive = async (id: string, next: boolean) => {
    const client = getSupabaseClient()
    if (!client) return
    setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: next } : k)))
    try {
      await client.from("api_keys").update({ is_active: next }).eq("id", id)
    } catch {
      // ignore
    }
  }

  if (!authorized || loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg-deep)" }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "var(--bonita-gold)",
            borderRightColor: "var(--bonita-gold-muted)",
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <h1
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Bonita Admin
        </h1>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border p-4"
              style={{
                borderColor: "var(--bg-surface-light)",
                background: "var(--bg-card)",
              }}
            >
              <p
                className="text-xs uppercase tracking-wide"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
              >
                {s.label}
              </p>
              <p
                className="mt-2 text-xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <section className="mb-10 rounded-xl border" style={{ borderColor: "var(--bg-surface-light)", background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--bg-surface-light)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Users
            </h2>
            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
              {users.length} total
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs" style={{ fontFamily: "var(--font-body)" }}>
              <thead>
                <tr style={{ background: "var(--bg-surface)" }}>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Admin</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u) => (
                  <tr key={u.id} className="border-t" style={{ borderColor: "var(--bg-surface-light)" }}>
                    <td className="px-3 py-2 align-top" style={{ color: "var(--text-secondary)" }}>
                      {u.email || "—"}
                    </td>
                    <td className="px-3 py-2 align-top" style={{ color: "var(--text-secondary)" }}>
                      {u.plan || "Free"}
                    </td>
                    <td className="px-3 py-2 align-top" style={{ color: "var(--text-muted)" }}>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <label className="inline-flex items-center gap-1 text-[11px]">
                        <input
                          type="checkbox"
                          checked={!!u.is_admin}
                          onChange={(e) => toggleUserAdmin(u.id, e.target.checked)}
                        />
                        <span>Admin</span>
                      </label>
                    </td>
                  </tr>
                ))}
                {pagedUsers.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-xs"
                      colSpan={4}
                      style={{ color: "var(--text-muted)" }}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalUserPages > 1 && (
            <div className="flex items-center justify-center gap-3 border-t px-4 py-2" style={{ borderColor: "var(--bg-surface-light)" }}>
              <button
                type="button"
                disabled={userPage <= 1}
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                className="rounded-md px-2 py-1 text-xs disabled:opacity-40"
                style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
              >
                Prev
              </button>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Page {userPage} of {totalUserPages}
              </span>
              <button
                type="button"
                disabled={userPage >= totalUserPages}
                onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                className="rounded-md px-2 py-1 text-xs disabled:opacity-40"
                style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* API Keys table */}
        <section className="rounded-xl border" style={{ borderColor: "var(--bg-surface-light)", background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--bg-surface-light)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              API Keys
            </h2>
            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
              {apiKeys.length || 0} keys
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs" style={{ fontFamily: "var(--font-body)" }}>
              <thead>
                <tr style={{ background: "var(--bg-surface)" }}>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Requests (month)</th>
                  <th className="px-3 py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id} className="border-t" style={{ borderColor: "var(--bg-surface-light)" }}>
                    <td className="px-3 py-2 align-top" style={{ color: "var(--text-secondary)" }}>
                      {k.display_name || "—"}
                    </td>
                    <td className="px-3 py-2 align-top" style={{ color: "var(--text-muted)" }}>
                      {k.app_key || "—"}
                    </td>
                    <td className="px-3 py-2 align-top" style={{ color: "var(--text-secondary)" }}>
                      {k.plan || "—"}
                    </td>
                    <td className="px-3 py-2 align-top" style={{ color: "var(--text-secondary)" }}>
                      {k.requests_this_month != null ? k.requests_this_month : 0}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <label className="inline-flex items-center gap-1 text-[11px]">
                        <input
                          type="checkbox"
                          checked={!!k.is_active}
                          onChange={(e) => toggleApiKeyActive(k.id, e.target.checked)}
                        />
                        <span>Active</span>
                      </label>
                    </td>
                  </tr>
                ))}
                {apiKeys.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-xs"
                      colSpan={5}
                      style={{ color: "var(--text-muted)" }}
                    >
                      No API keys found or table not configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

