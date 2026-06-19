// Utilities for parsing submitted media values (videos + images).
// Multiple values are persisted as newline-separated strings in the same
// data field the single value originally used, so we split on newlines here.

export interface VideoEmbed {
  platform: "youtube" | "vimeo"
  embedUrl: string
  originalUrl: string
}

/**
 * Parse a URL into an embeddable YouTube/Vimeo player URL.
 * Returns null if the URL is not a recognized video link.
 */
export function getVideoEmbed(url: string): VideoEmbed | null {
  if (!url) return null
  const trimmed = url.trim()

  // YouTube
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]+)/,
    /youtube\.com\/watch\?.*v=([\w-]+)/,
  ]
  for (const pattern of youtubePatterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return {
        platform: "youtube",
        embedUrl: `https://www.youtube.com/embed/${match[1]}`,
        originalUrl: trimmed,
      }
    }
  }

  // Vimeo
  const vimeoPatterns = [/player\.vimeo\.com\/video\/(\d+)/, /vimeo\.com\/(\d+)/]
  for (const pattern of vimeoPatterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return {
        platform: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${match[1]}`,
        originalUrl: trimmed,
      }
    }
  }

  return null
}

/** Heuristically determine whether a value is an image URL / data URI. */
export function isImageValue(value: string): boolean {
  if (!value) return false
  const v = value.trim()
  if (v.startsWith("data:image/")) return true
  if (/\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(v)) return true
  // Common image hosts that don't include a file extension
  if (/picsum\.photos|images\.unsplash\.com|\/image\//i.test(v)) return true
  return false
}

/** Split a stored field value into its individual entries (newline-separated). */
export function splitMultiValue(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean)
}

/** Join multiple entries back into a single stored field value. */
export function joinMultiValue(values: string[]): string {
  return values.join("\n")
}
