"use client"

import Link from "next/link"
import { BonitaSidebar } from "@/components/BonitaSidebar"
import { useState } from "react"

export default function CommunityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
          <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
            Bonita grows with community input. Submit knowledge, upvote, and contribute — coming
            soon.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm"
            style={{ color: "var(--bonita-gold)" }}
          >
            ← Back to Chat
          </Link>
        </div>
      </main>
    </div>
  )
}
