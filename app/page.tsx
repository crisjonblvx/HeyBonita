export default function HomePage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">BonitaCore API</h1>
      <p className="text-lg mb-8 text-gray-600">
        A centralized API service for AI-powered content generation and web intelligence.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Deployed Instance</h2>
        <div className="space-y-2">
          <p>
            <strong>Base URL:</strong>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">https://bonitacore.vercel.app/api/core/v1</code>
          </p>
          <p>
            <strong>Authentication:</strong> Include{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">x-service-token</code> header
          </p>
          <p>
            <strong>Service Token:</strong> Contact administrator for access token
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>

        <div className="grid gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">Health Check</h3>
            <p className="text-sm text-gray-600 mb-2">Check API availability and status</p>
            <code className="bg-gray-100 px-2 py-1 rounded">GET /api/core/v1/health</code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">Version Info</h3>
            <p className="text-sm text-gray-600 mb-2">Get API version and build information</p>
            <code className="bg-gray-100 px-2 py-1 rounded">GET /api/core/v1/version</code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">Self Test</h3>
            <p className="text-sm text-gray-600 mb-2">Comprehensive health check of all providers</p>
            <code className="bg-gray-100 px-2 py-1 rounded">GET /api/core/v1/selftest</code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">Image Generation</h3>
            <p className="text-sm text-gray-600 mb-2">Generate images using OpenAI (returns URLs only)</p>
            <code className="bg-gray-100 px-2 py-1 rounded">POST /api/core/v1/image</code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">Video Generation</h3>
            <p className="text-sm text-gray-600 mb-2">Generate videos using Luma AI</p>
            <code className="bg-gray-100 px-2 py-1 rounded">POST /api/core/v1/video</code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">Voice Generation</h3>
            <p className="text-sm text-gray-600 mb-2">Generate speech using ElevenLabs</p>
            <code className="bg-gray-100 px-2 py-1 rounded">POST /api/core/v1/voice</code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">Web Search</h3>
            <p className="text-sm text-gray-600 mb-2">Search web content using Perplexity AI</p>
            <code className="bg-gray-100 px-2 py-1 rounded">POST /api/core/v1/search</code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">News Trends</h3>
            <p className="text-sm text-gray-600 mb-2">Get trending news using NewsAPI</p>
            <code className="bg-gray-100 px-2 py-1 rounded">POST /api/core/v1/trends</code>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">OpenAPI Spec</h3>
            <p className="text-sm text-gray-600 mb-2">Get complete API documentation in OpenAPI format</p>
            <code className="bg-gray-100 px-2 py-1 rounded">GET /api/core/v1/openapi.json</code>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Integration</h2>
        <p className="mb-4">For security, integrate via server-side proxy only. See documentation for details.</p>
        <p className="text-sm text-gray-600">
          Direct browser calls are not supported. Use a server-side proxy in your application.
        </p>
      </div>
    </div>
  )
}
