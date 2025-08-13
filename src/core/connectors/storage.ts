export async function storeImages(urlsOrBase64: string[]) {
  const out: string[] = []
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  const hasCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )

  // Prefer Blob if available
  if (blobToken) {
    for (const item of urlsOrBase64) {
      // item may be a remote URL or base64; upload as needed
      const res = await fetch("https://blob.vercel-storage.com", {
        method: "POST",
        headers: { "x-vercel-blob-authorization": `Bearer ${blobToken}` },
        body:
          typeof item === "string" && item.startsWith("http")
            ? await (await fetch(item)).arrayBuffer()
            : Buffer.from(item, "base64"),
      })
      const json = await res.json()
      if (res.ok && json?.url) out.push(json.url)
    }
    return out
  }

  // Cloudinary example (unsigned upload with server signature would be safer – keep simple here)
  if (hasCloudinary) {
    // (Optional) Implement signed upload here if you want Cloudinary instead of Blob
    // For now return original items:
    return urlsOrBase64
  }

  // If no storage configured, just return originals
  return urlsOrBase64
}
