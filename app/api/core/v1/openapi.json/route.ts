import { ok } from "@/src/core/utils/json"

export async function GET() {
  const oas = {
    openapi: "3.0.0",
    info: { title: "Bonita Core API", version: "v1" },
    paths: {
      "/api/core/v1/health": {
        post: {
          summary: "Health",
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/core/v1/version": {
        post: {
          summary: "Version",
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/core/v1/search": {
        post: {
          summary: "Search",
          requestBody: {},
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/core/v1/trends": {
        post: {
          summary: "Trends",
          requestBody: {},
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/core/v1/video": {
        post: {
          summary: "Video",
          requestBody: {},
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/core/v1/voice": {
        post: {
          summary: "Voice",
          requestBody: {},
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/core/v1/image": {
        post: {
          summary: "Generate image",
          requestBody: { required: true },
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/core/v1/chat": {
        post: {
          summary: "Chat completion",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { type: "object", properties: { messages: { type: "array" } } },
                    { type: "object", properties: { prompt: { type: "string" } } },
                    { type: "object", properties: { input: { type: "string" } } },
                  ],
                },
              },
            },
          },
          responses: { "200": { description: "Chat response with messages array" } },
        },
      },
    },
  }
  return ok(oas)
}
