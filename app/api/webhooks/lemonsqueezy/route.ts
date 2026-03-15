import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import { PLAN_MODE_ACCESS, PLAN_QUERY_LIMITS } from "@/lib/modes"

const VARIANT_TO_PLAN: Record<string, string> = {}

function resolveVariantPlan() {
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

function derivePlan(variantId: string | undefined, customPlan: string | undefined): string {
  if (variantId) {
    const mapped = resolveVariantPlan()[String(variantId)]
    if (mapped) return mapped
  }
  return customPlan || "pro"
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-signature")

  if (process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
    const hmac = crypto.createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET)
    const digest = hmac.update(rawBody).digest("hex")
    if (signature !== digest) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  const payload = JSON.parse(rawBody)
  const eventName: string = payload.meta?.event_name || ""
  const userId: string | undefined = payload.meta?.custom_data?.user_id
  const customPlan: string | undefined = payload.meta?.custom_data?.plan
  const variantId: string | undefined = payload.data?.attributes?.variant_id?.toString()
  const customerId = payload.data?.attributes?.customer_id
  const subscriptionId = payload.data?.id
  const orderId = payload.data?.attributes?.order_id
  const status: string = payload.data?.attributes?.status || "active"
  const renewsAt: string | undefined = payload.data?.attributes?.renews_at

  if (!userId) return NextResponse.json({ received: true })

  const heybonita = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  if (["subscription_created", "subscription_updated"].includes(eventName)) {
    const plan = derivePlan(variantId, customPlan)
    const queryLimit = PLAN_QUERY_LIMITS[plan] ?? 10
    const modeAccess = PLAN_MODE_ACCESS[plan] ?? ["east-coast"]

    await heybonita.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status,
        ls_customer_id: customerId ? String(customerId) : null,
        ls_subscription_id: subscriptionId ? String(subscriptionId) : null,
        ls_variant_id: variantId || null,
        ls_order_id: orderId ? String(orderId) : null,
        renews_at: renewsAt || null,
        current_period_end: renewsAt || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    await heybonita
      .from("profiles")
      .update({
        plan,
        query_limit: queryLimit,
        mode_access: modeAccess,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
  }

  if (["subscription_cancelled", "subscription_expired"].includes(eventName)) {
    await heybonita.from("subscriptions").upsert(
      {
        user_id: userId,
        plan: "free",
        status: "cancelled",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    await heybonita
      .from("profiles")
      .update({
        plan: "free",
        query_limit: 10,
        mode_access: ["east-coast"],
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
  }

  return NextResponse.json({ received: true })
}
