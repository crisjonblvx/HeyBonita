"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowserClient } from "@/lib/supabase-browser"

export default function RootRedirect() {
  const router = useRouter()
  const [decided, setDecided] = useState(false)

  useEffect(() => {
    if (!decided) {
      const go = async () => {
        if (supabaseBrowserClient) {
          const { data: { session } } = await supabaseBrowserClient.auth.getSession()
          if (session) {
            router.replace("/chat")
            return
          }
        }
        router.replace("/landing")
      }
      go()
      setDecided(true)
    }
  }, [decided, router])

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "#080504" }}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
        style={{
          borderTopColor: "var(--bonita-gold)",
          borderRightColor: "var(--bonita-gold-muted)",
        }}
      />
    </div>
  )
}
