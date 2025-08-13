import { ok } from "@/src/core/utils/json"

export async function POST() {
  return ok({
    name: process.env.CORE_NAME || "bonita-core",
    version: process.env.CORE_VERSION || "v1",
    build: Date.now(),
  })
}
