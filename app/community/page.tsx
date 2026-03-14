"use client"

export default function CommunityPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-24 text-center">
      <div className="mb-6 text-5xl">🌍</div>
      <h1
        className="mb-3 text-2xl font-bold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Community is coming
      </h1>
      <p className="max-w-md leading-relaxed text-sm text-zinc-400" style={{ fontFamily: "var(--font-body)" }}>
        This is where your stories, regional histories, and family knowledge will live. Bonita learns from the
        community — and the community grows with Bonita.
      </p>
      <span className="mt-6 text-xs text-amber-600">Coming soon</span>
    </div>
  )
}
