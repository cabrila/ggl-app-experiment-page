export interface ImageValidationResult {
  isValid: boolean
  error?: string
  processedUrl?: string
}

export function validateImageUrl(url: string): ImageValidationResult {
  if (!url || typeof url !== "string") {
    return { isValid: false, error: "Invalid URL provided" }
  }

  // Check if it's a base64 data URL
  if (url.startsWith("data:image/")) {
    try {
      // Basic validation of base64 data URL format
      const [header, data] = url.split(",")
      if (!header || !data) {
        return { isValid: false, error: "Invalid base64 format" }
      }
      return { isValid: true, processedUrl: url }
    } catch (error) {
      return { isValid: false, error: "Invalid base64 data" }
    }
  }

  // Check if it's a valid HTTP/HTTPS URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      new URL(url)
      return { isValid: true, processedUrl: url }
    } catch (error) {
      return { isValid: false, error: "Invalid HTTP URL" }
    }
  }

  // Check if it's a relative path
  if (url.startsWith("/")) {
    return { isValid: true, processedUrl: url }
  }

  // If it's just a string identifier, it's valid but needs placeholder
  return { isValid: true, processedUrl: url }
}

export function generatePlaceholderUrl(
  seed = "?",
  width = 400,
  height = 500,
  backgroundColor = "e5e7eb",
  textColor = "6b7280",
): string {
  const encodedSeed = encodeURIComponent(seed)
  return `/placeholder.svg?height=${height}&width=${width}&text=${encodedSeed}&bg=${backgroundColor}&color=${textColor}`
}

export function processImageForDisplay(
  imageUrl: string,
  fallbackSeed?: string,
  dimensions?: { width: number; height: number },
): string {
  const validation = validateImageUrl(imageUrl)

  if (!validation.isValid || !validation.processedUrl) {
    return generatePlaceholderUrl(fallbackSeed || "?", dimensions?.width, dimensions?.height)
  }

  // If it's just a string identifier, generate placeholder
  if (
    !validation.processedUrl.startsWith("data:") &&
    !validation.processedUrl.startsWith("http") &&
    !validation.processedUrl.startsWith("/")
  ) {
    return generatePlaceholderUrl(validation.processedUrl, dimensions?.width, dimensions?.height)
  }

  return validation.processedUrl
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}
