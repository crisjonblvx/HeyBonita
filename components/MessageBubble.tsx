"use client"

import { BonitaAvatar } from "./BonitaAvatar"

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
          <p className="whitespace-pre-wrap">{message.content}</p>
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
