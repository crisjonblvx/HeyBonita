interface BonitaCoreResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

interface ChatRequest {
  message: string
  context?: string
  userId?: string
}

interface TrendData {
  topic: string
  engagement: number
  growth: string
  category: string
}

class BonitaClient {
  private baseUrl: string
  private serviceToken: string

  constructor() {
    this.baseUrl = process.env.BONITACORE_BASE_URL || ""
    this.serviceToken = process.env.BONITACORE_SERVICE_TOKEN || ""
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<BonitaCoreResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.serviceToken}`,
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("BonitaCore API Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  async chat(request: ChatRequest): Promise<BonitaCoreResponse<{ response: string; suggestions?: string[] }>> {
    return this.makeRequest("/chat", {
      method: "POST",
      body: JSON.stringify(request),
    })
  }

  async getTrends(): Promise<BonitaCoreResponse<TrendData[]>> {
    return this.makeRequest("/trends")
  }

  async generateContent(
    prompt: string,
    type: "social" | "blog" | "email" = "social",
  ): Promise<BonitaCoreResponse<{ content: string }>> {
    return this.makeRequest("/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, type }),
    })
  }

  async getInsights(topic: string): Promise<BonitaCoreResponse<{ insights: string[]; recommendations: string[] }>> {
    return this.makeRequest("/insights", {
      method: "POST",
      body: JSON.stringify({ topic }),
    })
  }
}

export const bonitaClient = new BonitaClient()
export type { ChatMessage, ChatRequest, TrendData, BonitaCoreResponse }
