"use client"

import { BonitaSidebar } from "@/components/BonitaSidebar"
import { useState } from "react"

export default function CommunityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-deep)" }}>
      <BonitaSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center pl-0 lg:pl-[280px]">
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
          <div className="mb-6 text-5xl">🌍</div>
          <h1
            className="mb-3 text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Community is coming
          </h1>
          <p
            className="max-w-md leading-relaxed text-sm"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
          >
            This is where your stories, regional histories, and family knowledge will live. Bonita
            learns from the community — and the community grows with Bonita.
          </p>
          <p
            className="mt-6 text-xs"
            style={{ fontFamily: "var(--font-body)", color: "var(--bonita-amber)" }}
          >
            Coming soon
          </p>
        </div>
      </main>
    </div>
  )
}
