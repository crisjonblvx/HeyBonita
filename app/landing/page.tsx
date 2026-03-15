"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { AnimatedCounter } from "@/components/AnimatedCounter"

export default function LandingPage() {
  const pricingRef = useRef<HTMLDivElement>(null)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stats, setStats] = useState<{
    musicians: number
    activists: number
    total: number
  }>({ musicians: 84424, activists: 2369, total: 108784 })

  useEffect(() => {
    fetch("/api/core/v1/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.musicians) setStats(d)
      })
      .catch(() => {})
  }, [])

  const handleUpgrade = async (plan: "pro" | "home") => {
    const variantId =
      plan === "pro"
        ? process.env.NEXT_PUBLIC_LS_PRO_VARIANT_ID
        : process.env.NEXT_PUBLIC_LS_HOME_VARIANT_ID
    const res = await fetch("/api/core/v1/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, plan }),
    })
    const { url, error } = await res.json()
    if (url) window.location.href = url
    else console.error("Checkout error:", error)
  }

  return (
    <div className="min-h-screen" style={{ background: "#080504" }}>
      {/* Section 1 — Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 py-16 md:flex-row md:gap-12 md:px-12 lg:px-20">
        <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
          <h1
            className="mb-4 max-w-2xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            The cultural oracle built for us.
          </h1>
          <p
            className="mb-8 max-w-xl text-lg"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
          >
            <AnimatedCounter target={stats.total} suffix="+" /> entries of Black and Brown history, music, art, and wisdom. Ask anything.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <Link
              href="/auth"
              className="rounded-xl px-6 py-3.5 text-base font-medium transition-opacity hover:opacity-90"
              style={{
                background: "var(--bonita-gold)",
                color: "var(--bg-deep)",
                fontFamily: "var(--font-body)",
              }}
            >
              Start for free
            </Link>
            <Link
              href="/auth"
              className="rounded-xl border-2 px-6 py-3.5 text-base font-medium transition-opacity hover:opacity-90"
              style={{
                borderColor: "var(--bonita-gold)",
                color: "var(--bonita-gold)",
                fontFamily: "var(--font-body)",
              }}
            >
              Meet Bonita
            </Link>
          </div>
        </div>
        <div className="relative mt-12 flex-shrink-0 md:mt-0">
          <div
            className="absolute inset-0 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--bonita-gold-glow)" }}
          />
          <div
            className="relative h-72 w-72 overflow-hidden rounded-full md:h-80 md:w-80 lg:h-[380px] lg:w-[380px]"
            style={{ border: "2px solid rgba(197,150,58,0.4)", boxShadow: "0 0 60px rgba(197,150,58,0.15)" }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted={muted}
              loop
              playsInline
              poster="/Real_Bonita.png"
              className="h-full w-full object-cover"
            >
              <source src={process.env.NEXT_PUBLIC_BONITA_WELCOME_VIDEO_URL || ""} type="video/mp4" />
            </video>
            <img
              src="/Real_Bonita.png"
              alt="Bonita Applebum"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          </div>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "rgba(197,150,58,0.2)", border: "1px solid rgba(197,150,58,0.4)" }}
          >
            <span style={{ fontSize: 16 }}>{muted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}</span>
          </button>
        </div>
        <p
          className="mt-4 text-center text-sm italic md:hidden"
          style={{ color: "rgba(197,150,58,0.8)", fontFamily: "var(--font-display)" }}
        >
          &ldquo;Hey love. I&apos;m Bonita. Ask me anything.&rdquo;
        </p>
      </section>

      {/* Section 2 — What Bonita Knows */}
      <section className="border-t px-6 py-16 md:px-12 lg:px-20" style={{ borderColor: "rgba(197,150,58,0.2)" }}>
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-10 text-center text-2xl font-semibold md:text-3xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            What Bonita Knows
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <span className="mb-2 text-4xl" aria-hidden>&#127925;</span>
              <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--bonita-gold-crown)" }}>
                <AnimatedCounter target={stats.musicians} />
              </p>
              <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Musicians</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="mb-2 text-4xl" aria-hidden>&#9994;&#127998;</span>
              <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--bonita-gold-crown)" }}>
                <AnimatedCounter target={stats.activists} />
              </p>
              <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Activists</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="mb-2 text-4xl" aria-hidden>&#128220;</span>
              <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--bonita-gold-crown)" }}>
                <AnimatedCounter target={1422} />
              </p>
              <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>Historical Events</p>
            </div>
          </div>
          <p className="mt-8 text-center text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Grandmother proverbs. Regional histories. Cultural connections. All in one place.
          </p>
        </div>
      </section>

      {/* Section 3 — How She's Different */}
      <section className="border-t px-6 py-16 md:px-12 lg:px-20" style={{ borderColor: "rgba(197,150,58,0.2)" }}>
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-10 text-center text-2xl font-semibold md:text-3xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            How She&apos;s Different
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Standard AI</p>
              <ul className="space-y-2" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                <li className="line-through decoration-red-500/80">&quot;No evidence&quot; means it didn&apos;t happen</li>
                <li className="line-through decoration-red-500/80">Institutional records only</li>
                <li className="line-through decoration-red-500/80">Neutral and balanced</li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--bonita-gold-crown)" }}>Bonita</p>
              <ul className="space-y-2" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                <li><em>Absent evidence &#8800; suppressed evidence</em></li>
                <li><em>Oral traditions are primary sources</em></li>
                <li><em>Intentionally positioned. Built for us.</em></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Pricing */}
      <section
        ref={pricingRef}
        className="border-t px-6 py-16 md:px-12 lg:px-20"
        style={{ borderColor: "rgba(197,150,58,0.2)" }}
      >
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-10 text-center text-2xl font-semibold md:text-3xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Pricing
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* FREE */}
            <div
              className="rounded-2xl border-2 p-6 transition-colors hover:border-[var(--bonita-gold-muted)]"
              style={{ background: "var(--bg-card)", borderColor: "var(--bg-surface-light)" }}
            >
              <h3 className="mb-1 text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>FREE</h3>
              <p className="mb-4 text-2xl font-bold" style={{ color: "var(--bonita-gold)" }}>$0/mo</p>
              <ul className="mb-6 space-y-2 text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                <li>&#8226; 10 conversations/day</li>
                <li>&#8226; Text only</li>
                <li>&#8226; Cultural fact of the day</li>
              </ul>
              <Link href="/auth" className="block w-full rounded-lg border-2 py-2.5 text-center text-sm font-medium" style={{ borderColor: "var(--bg-surface-light)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>Start free</Link>
            </div>

            {/* PRO */}
            <div
              className="rounded-2xl border-2 p-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--bonita-gold)" }}
            >
              <span className="mb-2 inline-block rounded px-2 py-0.5 text-xs font-medium" style={{ background: "var(--bonita-burgundy)", color: "var(--bonita-gold-crown)", fontFamily: "var(--font-body)" }}>RECOMMENDED</span>
              <h3 className="mb-1 text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>PRO</h3>
              <p className="mb-4 text-2xl font-bold" style={{ color: "var(--bonita-gold)" }}>$19.99/mo</p>
              <ul className="mb-6 space-y-2 text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                <li>&#8226; Unlimited conversations</li>
                <li>&#8226; Inline images &amp; portraits</li>
                <li>&#8226; 30 min video calls with Bonita/mo</li>
                <li>&#8226; Conversation history</li>
              </ul>
              <button type="button" onClick={() => handleUpgrade("pro")} className="block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90" style={{ background: "var(--bonita-gold)", color: "var(--bg-deep)", fontFamily: "var(--font-body)" }}>Go Pro</button>
            </div>

            {/* HOME */}
            <div
              className="rounded-2xl border-2 p-6 transition-colors hover:border-[var(--bonita-gold-muted)]"
              style={{ background: "var(--bg-card)", borderColor: "var(--bg-surface-light)" }}
            >
              <h3 className="mb-1 text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>HOME</h3>
              <p className="mb-4 text-2xl font-bold" style={{ color: "var(--bonita-gold)" }}>$49.99/mo</p>
              <ul className="mb-6 space-y-2 text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                <li>&#8226; Everything in Pro</li>
                <li>&#8226; 2 hours video calls/mo</li>
                <li>&#8226; Priority responses</li>
              </ul>
              <button type="button" onClick={() => handleUpgrade("home")} className="block w-full rounded-lg border-2 py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90" style={{ borderColor: "var(--bonita-gold)", color: "var(--bonita-gold)", fontFamily: "var(--font-body)" }}>Go Home</button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — Footer */}
      <footer className="border-t px-6 py-8 md:px-12 lg:px-20" style={{ borderColor: "rgba(197,150,58,0.2)" }}>
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
            Built by ContentCreators.life &middot; &copy; 2026 &middot; heybonita.ai
          </p>
          <div className="flex gap-6">
            <Link href="/chat" className="text-sm hover:underline" style={{ fontFamily: "var(--font-body)", color: "var(--bonita-gold-muted)" }}>Privacy</Link>
            <Link href="/chat" className="text-sm hover:underline" style={{ fontFamily: "var(--font-body)", color: "var(--bonita-gold-muted)" }}>Terms</Link>
            <Link href="/chat" className="text-sm hover:underline" style={{ fontFamily: "var(--font-body)", color: "var(--bonita-gold-muted)" }}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
