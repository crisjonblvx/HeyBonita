"use client"

import nextDynamic from "next/dynamic"

const CulturalMap = nextDynamic(() => import("@/components/CulturalMap"), { ssr: false })

export default function MapPage() {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <CulturalMap />
    </div>
  )
}
