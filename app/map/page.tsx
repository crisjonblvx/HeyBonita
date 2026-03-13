"use client"

import dynamic from "next/dynamic"

const CulturalMap = dynamic(() => import("@/components/CulturalMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[50vh] items-center justify-center text-amber-400">
      Loading map...
    </div>
  ),
})

export default function MapPage() {
  return <CulturalMap />
}
