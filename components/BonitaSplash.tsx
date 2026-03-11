"use client"

import { useEffect, useState } from "react"

type BonitaSplashProps = {
  onComplete: () => void
  durationMs?: number
}

export function BonitaSplash({ onComplete, durationMs = 2500 }: BonitaSplashProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 500)
    }, durationMs)
    return () => clearTimeout(t)
  }, [durationMs, onComplete])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: "var(--bg-deep)",
        backgroundImage: "radial-gradient(ellipse at center, var(--bg-surface) 0%, var(--bg-deep) 70%)",
      }}
    >
      <div className="bonita-gradient-b bonita-glow-pulse flex h-[140px] w-[140px] shrink-0 items-center justify-center rounded-full">
        <span
          className="font-bold italic text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-display)", fontSize: "4rem" }}
        >
          B
        </span>
      </div>
      <p
        className="mt-6 tracking-[0.3em]"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "2.5rem",
          color: "var(--text-primary)",
        }}
      >
        BONITA
      </p>
      <p
        className="mt-2 text-sm"
        style={{ fontFamily: "var(--font-body)", color: "var(--bonita-gold-muted)" }}
      >
        Cultural Oracle • Knowledge Keeper • Truth-Teller
      </p>
      <div className="mt-8 flex gap-1.5">
        <span
          className="h-2 w-2 rounded-full bg-[var(--bonita-gold)]"
          style={{ animation: "bonita-bounce-dot 1.4s ease-in-out infinite both" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[var(--bonita-gold)]"
          style={{ animation: "bonita-bounce-dot 1.4s ease-in-out infinite 0.2s both" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[var(--bonita-gold)]"
          style={{ animation: "bonita-bounce-dot 1.4s ease-in-out infinite 0.4s both" }}
        />
      </div>
    </div>
  )
}
