import { ok } from "@/src/core/utils/json"
import { applyCors, corsPreflight } from "../_utils/cors"

export async function POST(req: Request) {
  return applyCors(
    req,
    ok({
      name: process.env.CORE_NAME || "bonita-core",
      version: process.env.CORE_VERSION || "v1",
      build: Date.now(),
    }),
    { methods: "POST,OPTIONS" },
  )
}

export async function OPTIONS(req: Request) {
  return corsPreflight(req, { methods: "POST,OPTIONS" })
}
