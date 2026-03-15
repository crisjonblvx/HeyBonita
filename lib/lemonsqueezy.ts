import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js"

export function setupLS() {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! })
}
