import { checkServiceToken } from "../_utils/auth"
import { getSupabaseAdminClient } from "@/lib/supabase"
import { buildBonitaSystemPrompt } from "@/lib/bonita-prompt-builder"
import { applyCors, corsHeadersFor, corsPreflight, detectAppOrigin } from "../_utils/cors"

type Msg = { role: "system" | "user" | "assistant"; content: string }

type StreamAnthropicOptions = {
  apiKey: string
  model: string
  systemPrompt: string
  outgoingMessages: Msg[]
  body: { session_id?: string }
  appOrigin: string
  userId?: string
  cors: Headers
}

function streamAnthropic(options: StreamAnthropicOptions): Response {
  const { apiKey, model, systemPrompt, outgoingMessages, body, appOrigin, userId, cors } = options
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullContent = ""
      try {
        const messages = outgoingMessages.filter((m) => m.role !== "system").map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            system: systemPrompt,
            messages,
            stream: true,
          }),
        })

        if (!response.ok) {
          const raw = await response.text().catch(() => "")
          console.error("[BONITA BRAIN] Anthropic API error:", response.status, raw)
          controller.enqueue(encoder.encode("Bonita hit a snag. Try again in a moment."))
          controller.close()
          return
        }

        if (!response.body) {
          controller.enqueue(encoder.encode("Bonita couldn't reach her brain. Try again in a moment."))
          controller.close()
          return
        }

        const reader = response.body.getReader()
        const textDecoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += textDecoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const raw = line.slice(6).trim()
            if (raw === "[DONE]") continue
            let data:
              | { type?: string; delta?: { type?: string; text?: string } }
              | { type?: "error"; error?: { message?: string } }
            try {
              data = JSON.parse(raw) as typeof data
            } catch {
              continue
            }
            if (data?.type === "error") {
              console.error("[BONITA BRAIN] Anthropic stream error event:", (data as any)?.error)
              controller.enqueue(encoder.encode("Bonita hit a snag. Try again in a moment."))
              controller.close()
              return
            }
            if (data?.type === "message_stop") continue
            if (data?.type !== "content_block_delta" || data?.delta?.type !== "text_delta") continue
            const text = data.delta?.text
            if (typeof text === "string" && text) {
              fullContent += text
              controller.enqueue(encoder.encode(text))
            }
          }
        }

        const supabase = getSupabaseAdminClient()
        if (supabase && fullContent.trim().length > 0) {
          const assistantMessage: Msg = { role: "assistant", content: fullContent }
          const fullMessages = [...outgoingMessages, assistantMessage]
          const sessionId =
            (typeof body?.session_id === "string" && body.session_id) ||
            (globalThis.crypto && "randomUUID" in globalThis.crypto ? (crypto.randomUUID() as string) : `session_${Date.now()}`)
          await supabase.from("conversations").insert({
            session_id: sessionId,
            user_id: userId ?? null,
            app_origin: appOrigin,
            messages: fullMessages,
          })
          if (userId) {
            const { data: existing } = await supabase.from("user_context").select("conversation_count").eq("user_id", userId).maybeSingle()
            const currentCount = typeof existing?.conversation_count === "number" ? existing.conversation_count : 0
            if (existing) {
              await supabase.from("user_context").update({ last_active: new Date().toISOString(), conversation_count: currentCount + 1 }).eq("user_id", userId)
            } else {
              await supabase.from("user_context").insert({ user_id: userId, last_active: new Date().toISOString(), conversation_count: 1 })
            }
          }
        }
      } catch (err) {
        console.error("[BONITA BRAIN] Anthropic streaming error:", err)
        controller.enqueue(encoder.encode("Bonita hit a snag. Try again in a moment."))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...Object.fromEntries(cors.entries()) },
  })
}

type ChatBody = {
  message?: string
  conversationHistory?: Msg[]
  app_origin?: string
  user_id?: string
}

function normalizeBody(body: any): { message: string; history: Msg[]; appOrigin?: string; userId?: string } {
  // New shape (preferred)
  if (typeof body?.message === "string") {
    return {
      message: body.message,
      history: Array.isArray(body.conversationHistory) ? (body.conversationHistory as Msg[]) : [],
      appOrigin: typeof body.app_origin === "string" ? body.app_origin : undefined,
      userId: typeof body.user_id === "string" ? body.user_id : undefined,
    }
  }

  // Backwards-compatible fallbacks
  if (Array.isArray(body?.messages)) {
    const msgs = body.messages as Msg[]
    const last = msgs.at(-1)
    return {
      message: last?.content || "",
      history: msgs.slice(0, -1),
      appOrigin: undefined,
      userId: undefined,
    }
  }

  if (typeof body?.prompt === "string") {
    return {
      message: body.prompt,
      history: [],
      appOrigin: undefined,
      userId: undefined,
    }
  }

  if (typeof body?.input === "string") {
    return {
      message: body.input,
      history: [],
      appOrigin: undefined,
      userId: undefined,
    }
  }

  const raw = JSON.stringify(body ?? {})
  return {
    message: raw,
    history: [],
    appOrigin: undefined,
    userId: undefined,
  }
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}

export async function POST(req: Request) {
  const unauth = checkServiceToken(req)
  if (unauth) return applyCors(req, unauth, { methods: "POST,OPTIONS" })

  const url = new URL(req.url)
  const debug = url.searchParams.get("debug") === "true"

  const body = (await req.json().catch(() => ({}))) as ChatBody | any
  const { message: userMessage, history, appOrigin, userId } = normalizeBody(body)
  const effectiveAppOrigin = detectAppOrigin(req, appOrigin)
  const lastMessage = userMessage ?? ""

  if (!lastMessage) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        role: "assistant",
        content: "no_data",
        ...(debug && { debug: { error: "Empty message" } }),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
      ),
      { methods: "POST,OPTIONS" },
    )
  }

  const systemPrompt = await buildBonitaSystemPrompt({
    userMessage: lastMessage,
    appOrigin: effectiveAppOrigin,
    userId: userId || null,
  })

  const outgoingMessages: Msg[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: lastMessage },
  ]

  const provider = (process.env.BONITA_BRAIN_PROVIDER || "ollama").toLowerCase()
  const bonitaBrainModel = process.env.BONITA_BRAIN_MODEL || (provider === "anthropic" ? "claude-sonnet-4-6" : "mistral")
  if (provider === "anthropic") {
    console.log("[BONITA BRAIN] Using Anthropic model:", bonitaBrainModel)
  }

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return applyCors(
        req,
        new Response(
        JSON.stringify({
          ok: false,
          error: "Anthropic provider requires ANTHROPIC_API_KEY in your environment.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
        ),
        { methods: "POST,OPTIONS" },
      )
    }
    const cors = corsHeadersFor(req, { methods: "POST,OPTIONS" })
    return streamAnthropic({
      apiKey,
      model: bonitaBrainModel,
      systemPrompt,
      outgoingMessages,
      body: body as any,
      appOrigin: effectiveAppOrigin,
      userId: userId ?? undefined,
      cors,
    })
  }

  const bonitaBrainUrl = process.env.BONITA_BRAIN_URL
  if (!bonitaBrainUrl) {
    return applyCors(
      req,
      new Response(
      JSON.stringify({
        ok: false,
        error: "Bonita's brain is not connected. Set BONITA_BRAIN_URL (Ollama) or BONITA_BRAIN_PROVIDER=anthropic with ANTHROPIC_API_KEY.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
      ),
      { methods: "POST,OPTIONS" },
    )
  }

  const baseUrl = bonitaBrainUrl.replace(/\/$/, "")
  const targetUrl = `${baseUrl}/api/chat`

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullContent = ""

      try {
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: bonitaBrainModel,
            messages: outgoingMessages,
            stream: true,
          }),
        })

        if (!response.body) {
          controller.enqueue(
            encoder.encode(
              "Bonita ran into an issue reaching her brain. Make sure Ollama is running and try again.",
            ),
          )
          controller.close()
          return
        }

        const reader = response.body.getReader()
        const textDecoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = textDecoder.decode(value)
          buffer += chunk

          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            let data: any
            try {
              data = JSON.parse(trimmed)
            } catch {
              continue
            }

            const token: string | undefined =
              data?.choices?.[0]?.delta?.content ??
              data?.message?.content ??
              (typeof data?.response === "string" ? data.response : undefined)

            if (!token) continue

            fullContent += token
            controller.enqueue(encoder.encode(token))
          }
        }

        // Persist conversation + user context updates once streaming is complete
        const supabase = getSupabaseAdminClient()
        if (supabase && fullContent.trim().length > 0) {
          const assistantMessage: Msg = {
            role: "assistant",
            content: fullContent,
          }
          const fullMessages = [...outgoingMessages, assistantMessage]

          const sessionId =
            (typeof (body as any)?.session_id === "string" && (body as any).session_id) ||
            (globalThis.crypto && "randomUUID" in globalThis.crypto
              ? (crypto.randomUUID() as string)
              : `session_${Date.now()}`)

          await supabase.from("conversations").insert({
            session_id: sessionId,
            user_id: userId || null,
            app_origin: effectiveAppOrigin,
            messages: fullMessages,
          })

          if (userId) {
            const { data: existing } = await supabase
              .from("user_context")
              .select("conversation_count")
              .eq("user_id", userId)
              .maybeSingle()

            const currentCount =
              typeof existing?.conversation_count === "number" ? existing.conversation_count : 0

            if (existing) {
              await supabase
                .from("user_context")
                .update({
                  last_active: new Date().toISOString(),
                  conversation_count: currentCount + 1,
                })
                .eq("user_id", userId)
            } else {
              await supabase.from("user_context").insert({
                user_id: userId,
                last_active: new Date().toISOString(),
                conversation_count: 1,
              })
            }
          }
        }
      } catch (error) {
        console.error("[BONITA BRAIN] Streaming error:", error)
        controller.enqueue(
          encoder.encode(
            "Bonita hit a snag talking to her brain. Check Ollama and try again in a moment.",
          ),
        )
      } finally {
        controller.close()
      }
    },
  })

  return applyCors(
    req,
    new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    }),
    { methods: "POST,OPTIONS" },
  )
}
