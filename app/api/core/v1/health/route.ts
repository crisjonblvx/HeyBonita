import { ok } from "@/src/core/utils/json"

export async function POST() {
  return ok({ ok: true, service: "bonita-core" })
}
