import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const { variantId, plan } = await req.json()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: session.user.email,
            custom: { user_id: session.user.id, plan },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://heybonita.ai"}/chat?upgraded=true`,
            receipt_link_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://heybonita.ai"}/chat`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: process.env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  })

  const data = await response.json()
  const checkoutUrl = data?.data?.attributes?.url
  if (!checkoutUrl) {
    console.error("LS checkout error:", JSON.stringify(data))
    return NextResponse.json({ error: "Could not create checkout" }, { status: 500 })
  }
  return NextResponse.json({ url: checkoutUrl })
}
