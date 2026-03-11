"use client"

const PROMPTS = [
  "Tell me about the Divine Nine",
  "Who is David Blackwell?",
  "History of hip-hop origins",
  "HBCU legacy in STEM",
  "Black inventors we should know",
  "Tell me about Afrofuturism",
]

type QuickPromptsProps = {
  onSelect: (text: string) => void
  disabled?: boolean
}

export function QuickPrompts({ onSelect, disabled }: QuickPromptsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {PROMPTS.map((text) => (
        <button
          key={text}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(text)}
          className="rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-250 hover:border-[var(--bonita-gold)] hover:bg-[var(--bonita-gold-glow)] hover:text-[var(--bonita-gold)] disabled:opacity-50"
          style={{
            borderColor: "var(--bonita-gold-muted)",
            color: "var(--text-secondary)",
            background: "transparent",
            fontFamily: "var(--font-body)",
          }}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
