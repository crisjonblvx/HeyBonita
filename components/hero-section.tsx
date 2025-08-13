"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, TrendingUp, Sparkles, Heart, BarChart3 } from "lucide-react"
import Image from "next/image"
import { ChatInterface } from "./chat-interface"
import { TrendsPanel } from "./trends-panel"

export function HeroSection() {
  const [showChat, setShowChat] = useState(false)
  const [showTrends, setShowTrends] = useState(false)

  return (
    <section className="w-full px-6 py-12 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
              Meet Bonita, Your <span className="text-red-500">Digital Bronx Auntie</span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
              AI-powered content creation with authentic cultural intelligence. Get real advice, trend intelligence,
              content optimization, and creative support from someone who actually gets the culture.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-base font-medium"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Chatting
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-3 text-base font-medium border-gray-300 hover:bg-gray-50 text-red-500 bg-transparent"
              onClick={() => setShowTrends(true)}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              See Live Trends
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border-0 font-medium">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Real Cultural Intelligence
            </Badge>
            <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-pink-50 text-pink-600 border-0 font-medium">
              <Heart className="w-4 h-4 mr-1.5" />
              Authentic Voice
            </Badge>
            <Badge
              variant="secondary"
              className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 border-0 font-medium"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Trend Analysis
            </Badge>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bonita-avatar-happy-zmg40RR8EGy633HVlwdlxqyG4vIWnR.png"
              alt="Bonita - Your Digital Bronx Auntie"
              width={400}
              height={400}
              className="w-80 h-80 lg:w-96 lg:h-96 object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Chat Interface Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ChatInterface onClose={() => setShowChat(false)} />
        </div>
      )}

      {/* Trends Panel Modal */}
      {showTrends && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 z-10 bg-white shadow-md hover:bg-gray-100"
              onClick={() => setShowTrends(false)}
            >
              ✕
            </Button>
            <TrendsPanel />
          </div>
        </div>
      )}
    </section>
  )
}
