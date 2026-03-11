"use client"

export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-3 animate-in slide-in-from-bottom-2 fade-in duration-400">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-surface-light)",
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontStyle: "italic",
            color: "var(--bonita-gold-muted)",
          }}
        >
          B
        </div>
        <span className="bonita-label">BONITA</span>
      </div>
      <div
        className="bonita-bubble-bonita flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3"
        style={{ minHeight: "44px" }}
      >
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
