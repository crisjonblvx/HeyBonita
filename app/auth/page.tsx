"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase-browser"

export const dynamic = "force-dynamic"

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) return
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event: string, session: unknown) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        setTimeout(() => {
          window.location.href = "/chat"
        }, 100)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const client = getSupabaseClient()
    if (!client) {
      setError("Auth is not configured. Check your environment.")
      return
    }
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter email and password.")
      return
    }
    setLoading(true)
    try {
      if (mode === "signin") {
        const { data, error: err } = await client.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        })
        if (err) {
          setError(err.message)
          return
        }
        if (data.session) {
          setTimeout(() => {
            window.location.href = "/chat"
          }, 100)
        }
      } else {
        const { error: err } = await client.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
        })
        if (err) {
          setError(err.message)
          return
        }
        setShowConfirmation(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "#080504" }}>
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✉️</div>
          <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Check your email
          </h2>
          <p className="text-zinc-400 text-sm" style={{ fontFamily: "var(--font-body)" }}>
            We sent a confirmation link to <span className="text-amber-400">{email}</span>. Click the link to activate
            your account, then come back here to sign in.
          </p>
          <button
            type="button"
            onClick={() => setShowConfirmation(false)}
            className="text-sm text-amber-400 hover:underline"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "#080504" }}>
      <div className="w-full max-w-sm">
        <h1
          className="mb-8 text-center text-2xl font-bold tracking-[0.2em]"
          style={{ fontFamily: "var(--font-display)", color: "var(--bonita-gold-crown)" }}
        >
          BONITA
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-sm font-medium"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--bonita-gold)]"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--bg-surface-light)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-sm font-medium"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--bonita-gold)]"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--bg-surface-light)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500" style={{ fontFamily: "var(--font-body)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-medium transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{
              background: "var(--bonita-gold)",
              color: "var(--bg-deep)",
              fontFamily: "var(--font-body)",
            }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-4 w-full text-center text-sm underline-offset-2 hover:underline"
          style={{ fontFamily: "var(--font-body)", color: "var(--bonita-gold-muted)" }}
        >
          {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
        </button>

        <Link
          href="/landing"
          className="mt-8 block text-center text-sm underline-offset-2 hover:underline"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
