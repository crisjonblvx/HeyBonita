"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { BonitaSidebar } from "@/components/BonitaSidebar"
import { BonitaAvatar } from "@/components/BonitaAvatar"
import { BonitaSplash } from "@/components/BonitaSplash"
import { MessageBubble, type ChatMessage } from "@/components/MessageBubble"
import { QuickPrompts } from "@/components/QuickPrompts"
import { TypingIndicator } from "@/components/TypingIndicator"
import "@runwayml/avatars-react/styles.css"

const AvatarCall = dynamic(
  () => import("@runwayml/avatars-react").then((m) => m.AvatarCall),
  { ssr: false },
)

function AskParamReader({ onAsk }: { onAsk: (value: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const ask = searchParams.get("ask")
    if (ask && typeof ask === "string") {
      onAsk(ask)
      if (typeof window !== "undefined") window.history.replaceState({}, "", window.location.pathname)
    }
  }, [searchParams, onAsk])
  return null
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [isPro] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("bonita_pro") === "true",
  )
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null)
  const [showSplash, setShowSplash] = useState(true)
  const [conversationId] = useState<string>(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID()
    }
    return `conv_${Date.now()}`
  })

  const handleSend = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim()
      if (!trimmed || loading) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      }

      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setInput("")
      setLoading(true)

      try {
        const res = await fetch("/api/core/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-service-token": process.env.NEXT_PUBLIC_BONITA_SERVICE_TOKEN || "",
          },
          body: JSON.stringify({
            message: trimmed,
            conversationHistory: nextMessages.map((m) => ({ role: m.role, content: m.content })),
            app_origin: "heybonita.ai",
          }),
        })

        if (!res.body) {
          const errorMessage: ChatMessage = {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: "Something went sideways. Give me a second and try again, love.",
          }
          setMessages((prev) => [...prev, errorMessage])
          return
        }

        const assistantId = `assistant-${Date.now()}`
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "", hadRagResults: true },
        ])

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ""

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          accumulated += chunk
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)),
          )
        }
      } catch {
        const errorMessage: ChatMessage = {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "Something went sideways. Give me a second and try again, love.",
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setLoading(false)
      }
    },
    [input, loading, messages],
  )

  async function handleFeedback(message: ChatMessage, rating: "up" | "down", reason?: string) {
    try {
      const idx = messages.findIndex((m) => m.id === message.id)
      await fetch("/api/core/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_index: idx >= 0 ? idx : null,
          rating: rating === "up" ? "helpful" : "missed",
          user_query:
            messages
              .slice()
              .reverse()
              .find((m) => m.role === "user")?.content || "",
          bonita_response: message.content,
          app_origin: "heybonita.ai",
          had_rag_results: message.hadRagResults ?? true,
          reason,
        }),
      })
      // Mark this message as having feedback so buttons disable
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, feedbackSubmitted: true } : m,
        ),
      )
    } catch {
      // ignore
    }
  }

  const handleQuickPrompt = (text: string) => {
    setInput(text)
    setTimeout(() => handleSend(text), 0)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-deep)" }}>
      <Suspense fallback={null}>
        <AskParamReader onAsk={setInput} />
      </Suspense>
      {showSplash && <BonitaSplash onComplete={() => setShowSplash(false)} />}

      <BonitaSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Ambient background (gradient; add public/Real_Bonita.png for bokeh image) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, var(--bonita-accent, #c9a227) 0%, transparent 50%), radial-gradient(ellipse 60% 80% at 80% 20%, rgba(201,162,39,0.15) 0%, transparent 40%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(40px)",
        }}
      />

      <main className="relative z-10 flex flex-1 flex-col pl-0 lg:pl-[280px]">
        {/* Chat header */}
        <header
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{
            borderColor: "var(--bg-surface-light)",
            background: "var(--bg-card)",
          }}
        >
          <BonitaAvatar size="md" />
          <div>
            <h1
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Bonita Applebum
            </h1>
            <p
              className="flex items-center gap-1.5 text-[11px]"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--status-online)" }}
              />
              Cultural Oracle • Always present
            </p>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {isEmpty && (
                <div className="flex flex-col items-center px-4 py-8 text-center">
                  <BonitaAvatar size="lg" className="mb-6" />
                  <p
                    className="mb-2 italic"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "2rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    Hey Bonita
                  </p>
                  <p
                    className="mb-6 max-w-md text-[15px] leading-relaxed"
                    style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
                  >
                    Your Bronx auntie with all the wisdom. Ask me about culture, history, science,
                    music, art — or just come talk.
                  </p>
                  <QuickPrompts onSelect={handleQuickPrompt} disabled={loading} />
                </div>
              )}

              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onFeedback={(msg, rating) => {
                    if (rating === "up") {
                      setFeedbackTargetId(null)
                      handleFeedback(msg, "up")
                    } else {
                      setFeedbackTargetId((id) => (id === m.id ? null : m.id))
                    }
                  }}
                  onCopy={async (msg) => {
                    try {
                      await navigator.clipboard.writeText(msg.content)
                    } catch {
                      // ignore
                    }
                  }}
                  onRegenerate={(msg) => {
                    const lastUser = [...messages]
                      .slice(0, messages.findIndex((x) => x.id === msg.id))
                      .reverse()
                      .find((x) => x.role === "user")
                    if (!lastUser) return
                    setMessages((prev) => prev.filter((x) => x.id !== msg.id))
                    handleSend(lastUser.content)
                  }}
                  feedbackTargetId={feedbackTargetId}
                  showFeedbackReason={true}
                  onFeedbackReasonSelect={(msg, code) => {
                    handleFeedback(msg, "down", code)
                    setFeedbackTargetId(null)
                  }}
                />
              ))}

              {loading && <TypingIndicator />}
            </div>
          </div>

          {/* Input area */}
          <div
            className="border-t p-3 md:p-4"
            style={{
              borderColor: "var(--bg-surface-light)",
              background: "rgba(13, 10, 8, 0.85)",
              backdropFilter: "blur(12px)",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="mx-auto max-w-3xl"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  placeholder="Talk to Bonita..."
                  className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--bonita-gold-crown)] focus:ring-2 focus:ring-[var(--bonita-gold-glow)] disabled:opacity-60"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--bg-surface-light)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{
                    background: input.trim()
                      ? "var(--bonita-gold-crown)"
                      : "linear-gradient(135deg, rgba(107,15,15,0.8), rgba(197,150,58,0.65))",
                    color: "var(--text-primary)",
                  }}
                  aria-label="Send"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </button>
              </div>
              <p
                className="mt-2 text-center text-[10px]"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                }}
              >
                Bonita draws from community knowledge, oral traditions, and institutional records.
                She keeps it real.
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Floating Bonita avatar button — video call (Pro) */}
      <button
        type="button"
        onClick={() => setAvatarModalOpen(true)}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 shadow-lg transition-transform hover:scale-105"
        style={{
          borderColor: "var(--bonita-gold)",
          background: "var(--bg-card)",
          boxShadow: "0 4px 20px var(--bonita-burgundy-glow)",
        }}
        aria-label="Video call with Bonita"
      >
        <img
          src="/Real_Bonita.png"
          alt="Bonita"
          width={56}
          height={56}
          className="h-full w-full object-cover"
          onError={(e) => {
            const el = e.currentTarget
            el.style.display = "none"
            if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = "flex"
          }}
        />
        <div
          className="hidden h-full w-full items-center justify-center text-xl font-bold italic"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--bonita-gold-crown)",
          }}
        >
          B
        </div>
      </button>

      {/* Avatar video call modal / drawer */}
      {avatarModalOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4"
          style={{ background: "rgba(8,5,4,0.92)" }}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border overflow-hidden"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--bonita-gold)",
            }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--bg-surface-light)" }}>
              <span style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                Video call with Bonita
              </span>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="rounded-lg p-2 transition-opacity hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-[320px] flex flex-col">
              {isPro ? (
                <AvatarCall
                  avatarId={process.env.NEXT_PUBLIC_BONITA_AVATAR_ID || ""}
                  connectUrl="/api/core/v1/avatar/connect"
                  avatarImageUrl="/Real_Bonita.png"
                  onEnd={() => setAvatarModalOpen(false)}
                  onError={(err) => console.error("Avatar call error:", err)}
                  className="flex-1 min-h-[320px] w-full"
                />
              ) : (
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <p style={{ color: "var(--text-primary)", fontSize: "1.125rem" }}>
                    Video calls with Bonita are for Pro members.
                  </p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Upgrade to talk face-to-face with your cultural oracle.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(false)}
                    className="rounded-xl px-5 py-2.5 text-sm font-medium"
                    style={{
                      background: "var(--bonita-gold)",
                      color: "var(--bg-deep)",
                    }}
                  >
                    Maybe later
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
