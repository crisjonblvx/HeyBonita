"use client"

import { useState, useEffect } from "react"
import { BonitaAvatar } from "./BonitaAvatar"

function PersonImage({ name, compact }: { name: string; compact?: boolean }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const trimmed = name.trim()
  useEffect(() => {
    if (!trimmed) return
    fetch(`/api/core/v1/images?name=${encodeURIComponent(trimmed)}`)
      .then((r) => r.json())
      .then((data: { url?: string | null; originalimage?: string | null }) =>
        setImageUrl(data.url || data.originalimage || null),
      )
      .catch(() => setImageUrl(null))
  }, [trimmed])
  if (!trimmed) return null
  if (!imageUrl) {
    return (
      <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>
        {trimmed}
      </strong>
    )
  }
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border-2 bg-[var(--bg-surface)] shadow-[0_8px_18px_rgba(0,0,0,0.55)] ${compact ? "my-2 p-2" : "my-3 p-3"}`}
      style={{ borderColor: "var(--bonita-gold-crown)" }}
    >
      <img
        src={imageUrl}
        alt={trimmed}
        className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-16 sm:w-16"
      />
      <span
        className="font-semibold"
        style={{
          color: "var(--text-primary)",
          fontSize: "14px",
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
        }}
      >
        {trimmed}
      </span>
    </div>
  )
}

/** Split content by [[Name]] and group consecutive names for side-by-side layout */
function parseBonitaMessage(
  content: string,
): ({ type: "text"; content: string } | { type: "images"; names: string[] })[] {
  const parts = content.split(/(\[\[.*?\]\])/g)
  const nodes: ({ type: "text"; content: string } | { type: "images"; names: string[] })[] = []
  let i = 0
  while (i < parts.length) {
    const part = parts[i]
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const names: string[] = []
      while (i < parts.length && parts[i].startsWith("[[") && parts[i].endsWith("]]")) {
        names.push(parts[i].slice(2, -2).trim())
        i++
      }
      if (names.length) nodes.push({ type: "images", names })
    } else {
      if (part) nodes.push({ type: "text", content: part })
      i++
    }
  }
  return nodes
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  hadRagResults?: boolean
  feedbackSubmitted?: boolean
}

type MessageBubbleProps = {
  message: ChatMessage
  onFeedback?: (message: ChatMessage, rating: "up" | "down", reason?: string) => void
  onCopy?: (message: ChatMessage) => void
  onRegenerate?: (message: ChatMessage) => void
  showFeedbackReason?: boolean
  feedbackReasonOptions?: { code: string; label: string }[]
  onFeedbackReasonSelect?: (message: ChatMessage, code: string) => void
  feedbackTargetId?: string | null
}

const FEEDBACK_OPTIONS = [
  { code: "inaccurate_facts", label: "Inaccurate facts" },
  { code: "wrong_tone", label: "Wrong tone" },
  { code: "too_generic", label: "Too generic" },
  { code: "missing_cultural_context", label: "Missing cultural context" },
  { code: "did_not_answer", label: "Didn't answer my question" },
]

export function MessageBubble({
  message,
  onFeedback,
  onCopy,
  onRegenerate,
  showFeedbackReason,
  feedbackReasonOptions = FEEDBACK_OPTIONS,
  onFeedbackReasonSelect,
  feedbackTargetId,
}: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isFeedbackDisabled = !!message.feedbackSubmitted
  const showActions =
    message.role === "assistant" && (onFeedback || onCopy || onRegenerate) && !isFeedbackDisabled

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-400`}
    >
      {!isUser && (
        <div className="flex shrink-0 flex-col items-center gap-1">
          <BonitaAvatar size="sm" />
          <span className="bonita-label">BONITA</span>
        </div>
      )}
      <div className={`flex max-w-[85%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser ? "bonita-bubble-user rounded-br-md" : "bonita-bubble-bonita rounded-bl-md"
          }`}
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            lineHeight: 1.7,
          }}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="space-y-2">
              {parseBonitaMessage(message.content).map((node, idx) =>
                node.type === "text" ? (
                  <span key={idx} className="whitespace-pre-wrap">
                    {node.content}
                  </span>
                ) : (
                  <div key={idx} className="flex flex-wrap gap-3 gap-y-2">
                    {node.names.map((n, i) => (
                      <PersonImage key={`${idx}-${i}-${n}`} name={n} compact={node.names.length > 1} />
                    ))}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
        {showActions && (
          <div
            className="mt-2 flex flex-wrap items-center gap-2 text-xs"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {onFeedback && (
              <>
                <button
                  type="button"
                  onClick={() => onFeedback(message, "up")}
                  className="flex items-center gap-1 transition-colors hover:text-[var(--bonita-gold)]"
                  aria-label="Helpful"
                >
                  <span role="img" aria-hidden>👍🏾</span> Helpful
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(message, "down")}
                  className="flex items-center gap-1 transition-colors hover:text-[var(--bonita-gold)]"
                  aria-label="Missed it"
                >
                  <span role="img" aria-hidden>👎🏾</span> Missed it
                </button>
              </>
            )}
            {onCopy && (
              <button
                type="button"
                onClick={() => onCopy(message)}
                className="flex items-center gap-1 transition-colors hover:text-[var(--bonita-gold)]"
                aria-label="Copy"
              >
                <span role="img" aria-hidden>📋</span> Copy
              </button>
            )}
            {onRegenerate && (
              <button
                type="button"
                onClick={() => onRegenerate(message)}
                className="flex items-center gap-1 transition-colors hover:text-[var(--bonita-gold)]"
                aria-label="Regenerate"
              >
                <span role="img" aria-hidden>🔄</span> Regenerate
              </button>
            )}
          </div>
        )}
        {showFeedbackReason && feedbackTargetId === message.id && onFeedbackReasonSelect && (
          <div className="mt-1 flex flex-wrap gap-2">
            {feedbackReasonOptions.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => onFeedbackReasonSelect(message, opt.code)}
                className="rounded-full border px-2 py-1 text-xs transition-colors hover:border-[var(--bonita-gold)] hover:text-[var(--bonita-gold)]"
                style={{ borderColor: "var(--bg-surface-light)", color: "var(--text-secondary)" }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
