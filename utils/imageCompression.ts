/**
 * Shared image compression utility for all modals.
 * Compresses data-URL images using canvas before they are stored in state/localStorage.
 */

interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  /** JPEG quality 0-1. Default 0.7 */
  quality?: number
  /** Skip compression for images smaller than this byte count. Default 50 KB */
  skipBelowBytes?: number
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.7,
  skipBelowBytes: 50_000,
}

/**
 * Estimate a data-URL's byte size (base64 overhead is ~33%).
 */
function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1]
  if (!base64) return 0
  return Math.ceil((base64.length * 3) / 4)
}

/**
 * Compress a data-URL image. Returns a smaller JPEG data-URL.
 * If the image is already small or compression fails, returns the original.
 */
export async function compressImage(
  dataUrl: string,
  opts?: CompressOptions,
): Promise<string> {
  const { maxWidth, maxHeight, quality, skipBelowBytes } = { ...DEFAULTS, ...opts }

  // Skip non-data-URLs (external links, placeholder SVGs, etc.)
  if (!dataUrl.startsWith("data:image")) return dataUrl

  // Skip if already small
  if (estimateDataUrlBytes(dataUrl) < skipBelowBytes) return dataUrl

  return new Promise<string>((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        let { width, height } = img

        // Calculate scale
        const scale = Math.min(1, maxWidth / width, maxHeight / height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(dataUrl)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        const compressed = canvas.toDataURL("image/jpeg", quality)

        // Only use compressed version if it's actually smaller
        if (compressed.length < dataUrl.length) {
          resolve(compressed)
        } else {
          resolve(dataUrl)
        }
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/**
 * Compress multiple data-URL images in parallel.
 */
export async function compressImages(
  dataUrls: string[],
  opts?: CompressOptions,
): Promise<string[]> {
  return Promise.all(dataUrls.map((url) => compressImage(url, opts)))
}
