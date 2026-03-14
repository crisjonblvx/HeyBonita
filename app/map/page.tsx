"use client"

import nextDynamic from "next/dynamic"

const CulturalMap = nextDynamic(() => import("@/components/CulturalMap"), { ssr: false })

export default function MapPage() {
  return (
    <div className="h-full w-full">
      <CulturalMap />
    </div>
  )
}
