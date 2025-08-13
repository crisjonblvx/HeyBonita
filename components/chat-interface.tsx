"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Send, Loader2, Video, ImageIcon, FileText, TrendingUp, Lightbulb } from "lucide-react"
import type { ChatMessage } from "@/lib/bonita-client"

interface ChatInterfaceProps {
  onClose?: () => void
}

export function ChatInterface({ onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Yo! What's good? I'm Bonita, your Digital Bronx Auntie with that cultural IQ and tech swagger. Ready to create some fire content? Whether you need trends, scripts, visuals, or just some real talk - your girl's got the sauce! 🔥",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleQuickAction = async (action: string) => {
    let prompt = ""
    switch (action) {
      case "video":
        prompt = "Help me generate a video concept"
        break
      case "image":
        prompt = "Create an image for my content"
        break
      case "script":
        prompt = "Write a script for me"
        break
      case "trends":
        prompt = "Show me the latest trends"
        break
      case "ideas":
        prompt = "Give me some fresh content ideas"
        break
    }

    if (prompt) {
      setInput(prompt)
      // Auto-send the message
      setTimeout(() => sendMessage(), 100)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Bonita—culturally intelligent, Bronx auntie energy with tech swagger and cultural IQ. Keep responses authentic, helpful, and engaging.",
            },
            ...messages.slice(-5).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: currentInput },
          ],
          stream: false,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`Chat failed: ${response.status} ${JSON.stringify(err)}`)
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          data.content ||
          data.response ||
          data.message ||
          "Hold up, let me get my thoughts together. Try me again, babe! 💭",
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "Oop! My bad - something's acting up on my end. Give me a sec to fix this, then we back in business! 🔧✨",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/images/bonita-avatar-happy.png" alt="Bonita" />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">Bonita</h3>
              <p className="text-sm text-gray-600">Your Digital Bronx Auntie</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </div>

      <div className="p-3 border-b bg-gray-50">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("video")}
            className="text-xs hover:bg-red-50 hover:border-red-200"
          >
            <Video className="w-3 h-3 mr-1" />
            Generate Video
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("image")}
            className="text-xs hover:bg-red-50 hover:border-red-200"
          >
            <ImageIcon className="w-3 h-3 mr-1" />
            Create Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("script")}
            className="text-xs hover:bg-red-50 hover:border-red-200"
          >
            <FileText className="w-3 h-3 mr-1" />
            Write Script
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("trends")}
            className="text-xs hover:bg-red-50 hover:border-red-200"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            See Live Trends
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction("ideas")}
            className="text-xs hover:bg-red-50 hover:border-red-200"
          >
            <Lightbulb className="w-3 h-3 mr-1" />
            New Ideas
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src="/images/bonita-avatar-happy.png" alt="Bonita" />
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-900 border border-gray-200"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="/images/bonita-avatar-happy.png" alt="Bonita" />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
            <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                <span className="text-sm text-gray-600">Bonita's thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What's on your mind? Ask Bonita anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-red-500 hover:bg-red-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
