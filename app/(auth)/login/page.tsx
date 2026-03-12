"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabaseBrowserClient } from "@/lib/supabase-browser"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const client = supabaseBrowserClient
    if (!client) {
      setError("Authentication is temporarily unavailable. Please try again later.")
      return
    }

    if (!email || !password) {
      setError("Please enter both email and password.")
      return
    }

    setLoading(true)
    try {
      const { data, error: authError } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || "Unable to sign in. Please check your credentials.")
        return
      }

      if (!data?.user) {
        setError("No user returned from Supabase.")
        return
      }

      router.push("/")
    } catch (e) {
      setError("Unexpected error while signing in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--bg-deep)" }}>
      <div
        className="w-full max-w-sm rounded-xl border p-6 shadow-sm"
        style={{ background: "var(--bg-card)", borderColor: "var(--bg-surface-light)" }}
      >
        <h1
          className="mb-1 text-xl font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Log in to Bonita
        </h1>
        <p className="mb-4 text-xs" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
          Access your conversations and cultural knowledge.
        </p>

        {error && (
          <div
            className="mb-3 rounded-md px-3 py-2 text-xs"
            style={{ background: "rgba(220,38,38,0.08)", color: "var(--text-primary)" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] disabled:opacity-60"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--bg-surface-light)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] disabled:opacity-60"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--bg-surface-light)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--bonita-burgundy), var(--bonita-gold))",
              color: "var(--text-primary)",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p
          className="mt-4 text-center text-[11px]"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
        >
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="underline" style={{ color: "var(--bonita-gold)" }}>
            Sign up
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

