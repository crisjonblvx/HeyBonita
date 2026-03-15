import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-signature")
  const hmac = crypto.createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)
  const digest = hmac.update(rawBody).digest("hex")
  if (signature !== digest) return NextResponse.json({ error: "Invalid signature" }, { status: 401 })

  const payload = JSON.parse(rawBody)
  const eventName = payload.meta?.event_name
  const userId = payload.meta?.custom_data?.user_id
  const plan = payload.meta?.custom_data?.plan
  const customerId = payload.data?.attributes?.customer_id
  const subscriptionId = payload.data?.id
  const status = payload.data?.attributes?.status

  if (!userId) return NextResponse.json({ received: true })

  const heybonita = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  if (["subscription_created", "subscription_updated"].includes(eventName)) {
    await heybonita.from("subscriptions").upsert({
      user_id: userId, plan: plan || "pro", status: status || "active",
      ls_customer_id: String(customerId), ls_subscription_id: String(subscriptionId),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    await heybonita.from("profiles").update({ plan: plan || "pro" }).eq("id", userId)
  }

  if (["subscription_cancelled", "subscription_expired"].includes(eventName)) {
    await heybonita.from("subscriptions").upsert({
      user_id: userId, plan: "free", status: "cancelled",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    await heybonita.from("profiles").update({ plan: "free" }).eq("id", userId)
  }

  return NextResponse.json({ received: true })
}
