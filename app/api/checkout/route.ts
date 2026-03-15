import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const VARIANT_TO_PLAN: Record<string, string> = {}

function getVariantPlanMap() {
  if (Object.keys(VARIANT_TO_PLAN).length === 0) {
    const free = process.env.NEXT_PUBLIC_LS_FREE_VARIANT_ID
    const pro = process.env.NEXT_PUBLIC_LS_PRO_VARIANT_ID
    const gold = process.env.NEXT_PUBLIC_LS_GOLD_VARIANT_ID
    const home = process.env.NEXT_PUBLIC_LS_HOME_VARIANT_ID
    if (free) VARIANT_TO_PLAN[free] = "free"
    if (pro) VARIANT_TO_PLAN[pro] = "pro"
    if (gold) VARIANT_TO_PLAN[gold] = "gold"
    if (home) VARIANT_TO_PLAN[home] = "home"
  }
  return VARIANT_TO_PLAN
}

export async function POST(req: Request) {
  const { variantId } = await req.json()
  if (!variantId) {
    return NextResponse.json({ error: "variantId is required" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const plan = getVariantPlanMap()[String(variantId)] || "pro"

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
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
            receipt_button_text: "Go to Bonita",
            receipt_thank_you_note: "Welcome to the culture.",
          },
          checkout_options: { embed: false },
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

  return NextResponse.json({ checkoutUrl })
}
