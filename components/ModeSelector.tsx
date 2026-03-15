"use client"

import { useEffect, useState } from "react"
import { MODES, type ModeId, PLAN_MODE_ACCESS } from "@/lib/modes"
import { getSupabaseClient } from "@/lib/supabase-browser"

type ModeSelectorProps = {
  onModeChange: (modeId: ModeId) => void
}

const MODE_ORDER: ModeId[] = ["east-coast", "west-coast", "freshnicity"]

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  gold: "Gold",
  home: "Home",
}

function requiredPlanForMode(modeId: ModeId): string | null {
  for (const [plan, modes] of Object.entries(PLAN_MODE_ACCESS)) {
    if (modes.includes(modeId)) return null
  }
  return "gold"
}

function firstPlanWithMode(modeId: ModeId): string {
  for (const plan of ["pro", "gold", "home"]) {
    if (PLAN_MODE_ACCESS[plan]?.includes(modeId)) return plan
  }
  return "gold"
}

export function ModeSelector({ onModeChange }: ModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<ModeId>("east-coast")
  const [accessibleModes, setAccessibleModes] = useState<ModeId[]>(["east-coast"])

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("bonita_mode") : null
    if (saved && MODE_ORDER.includes(saved as ModeId)) {
      setSelectedMode(saved as ModeId)
      onModeChange(saved as ModeId)
    }
  }, [onModeChange])

  useEffect(() => {
    async function loadAccess() {
      const client = getSupabaseClient()
      if (!client) return
      const { data: { session } } = await client.auth.getSession()
      if (!session) return
      const { data } = await client
        .from("profiles")
        .select("mode_access")
        .eq("id", session.user.id)
        .single()
      if (data?.mode_access && Array.isArray(data.mode_access)) {
        setAccessibleModes(data.mode_access as ModeId[])
      }
    }
    loadAccess()
  }, [])

  const handleSelect = (modeId: ModeId) => {
    if (!accessibleModes.includes(modeId)) return
    setSelectedMode(modeId)
    onModeChange(modeId)
    if (typeof window !== "undefined") {
      localStorage.setItem("bonita_mode", modeId)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {MODE_ORDER.map((modeId) => {
        const mode = MODES[modeId]
        const locked = !accessibleModes.includes(modeId)
        const active = selectedMode === modeId

        return (
          <button
            key={modeId}
            type="button"
            onClick={() => handleSelect(modeId)}
            disabled={locked}
            className="relative rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all"
            style={{
              background: active ? "rgba(197,150,58,0.15)" : "transparent",
              border: active ? "1px solid var(--bonita-gold)" : "1px solid transparent",
              color: locked ? "var(--text-muted)" : active ? "var(--bonita-gold-crown)" : "var(--text-secondary)",
              cursor: locked ? "not-allowed" : "pointer",
              opacity: locked ? 0.5 : 1,
              fontFamily: "var(--font-body)",
            }}
            title={locked ? `Requires ${PLAN_LABELS[firstPlanWithMode(modeId)] || "upgrade"}` : mode.tagline}
          >
            {locked && <span className="mr-1">&#128274;</span>}
            {mode.name}
          </button>
        )
      })}
    </div>
  )
}
