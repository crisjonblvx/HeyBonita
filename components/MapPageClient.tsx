"use client"

import dynamic from "next/dynamic"

const CulturalMap = dynamic(() => import("@/components/CulturalMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <p className="text-sm text-amber-400">Loading cultural map...</p>
    </div>
  ),
})

export function MapPageClient() {
  return <CulturalMap />
}
