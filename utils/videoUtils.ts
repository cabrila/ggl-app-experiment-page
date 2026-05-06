export interface VideoEmbed {
  id: string
  url: string
  videoId: string
  platform: "vimeo" | "youtube"
  title?: string
  taggedActorNames?: string[]
  isTagged?: boolean
  markIn?: number // in seconds
  markOut?: number // in seconds
  duration?: number // in seconds
}

// Keep VimeoVideo for backward compatibility
export interface VimeoVideo extends VideoEmbed {
  platform: "vimeo"
}

export function parseVimeoUrl(url: string): string | null {
  // Add null/undefined check
  if (!url || typeof url !== "string") {
    return null
  }

  try {
    // Handle direct video ID input
    if (/^\d+$/.test(url.trim())) {
      return url.trim()
    }

    const parsedUrl = new URL(url)
    const pathname = parsedUrl.pathname

    // Check for direct video URL: vimeo.com/ID
    if (/^\/\d+$/.test(pathname)) {
      return pathname.slice(1)
    }

    // Check for player URL: player.vimeo.com/video/ID
    if (pathname.startsWith("/video/")) {
      return pathname.slice(7)
    }

    // Check for standard URL and extract the ID
    const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
    if (match && match[1]) {
      return match[1]
    }

    return null
  } catch (e) {
    // If the URL is invalid, try to match a simple ID
    const match = url.match(/^(\d+)$/)
    if (match && match[1]) {
      return match[1]
    }
    return null
  }
}

export function isValidVimeoUrl(url: string): boolean {
  return parseVimeoUrl(url) !== null
}

export function parseYouTubeUrl(url: string): string | null {
  // Add null/undefined check
  if (!url || typeof url !== "string") {
    return null
  }

  try {
    // Handle direct video ID input
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      return url.trim()
    }

    // YouTube URL patterns
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch (e) {
    return null
  }
}

export function isValidYouTubeUrl(url: string): boolean {
  return parseYouTubeUrl(url) !== null
}

export function createYouTubeEmbedUrl(
  videoId: string,
  options?: {
    autoplay?: boolean
    loop?: boolean
    controls?: boolean
    mute?: boolean
    start?: number
    end?: number
  },
): string {
  const params = new URLSearchParams()

  if (options?.autoplay) params.set("autoplay", "1")
  if (options?.loop) params.set("loop", "1")
  if (!options?.controls) params.set("controls", "0")
  if (options?.mute) params.set("mute", "1")
  if (options?.start && options.start > 0) params.set("start", Math.floor(options.start).toString())
  if (options?.end && options.end > 0) params.set("end", Math.floor(options.end).toString())
  if (options?.loop) params.set("playlist", videoId) // Required for loop to work

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

export function createYouTubeThumbnailUrl(
  videoId: string,
  quality: "default" | "medium" | "high" | "standard" | "maxres" = "medium",
): string {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    standard: "sddefault",
    maxres: "maxresdefault",
  }

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

export function getVideoPlatform(url: string): "vimeo" | "youtube" | null {
  if (!url || typeof url !== "string") {
    return null
  }

  if (isValidVimeoUrl(url)) return "vimeo"
  if (isValidYouTubeUrl(url)) return "youtube"
  return null
}

export function extractVideoId(url: string): string | null {
  const platform = getVideoPlatform(url)
  if (!platform) return null

  return platform === "vimeo" ? parseVimeoUrl(url) : parseYouTubeUrl(url)
}

export function parseVideoUrl(url: string): { platform: "vimeo" | "youtube"; videoId: string } | null {
  const platform = getVideoPlatform(url)
  if (!platform) return null

  const videoId = extractVideoId(url)
  if (!videoId) return null

  return { platform, videoId }
}

export function createVideoThumbnailUrl(platform: "vimeo" | "youtube", videoId: string): string {
  return platform === "vimeo" ? createVimeoThumbnailUrl(videoId) : createYouTubeThumbnailUrl(videoId)
}

/**
 * Creates a Vimeo embed URL from a video ID
 * @param videoId The Vimeo video ID
 * @returns The embed URL
 */
export function createVimeoEmbedUrl(
  videoId: string,
  options?: {
    autoplay?: boolean
    loop?: boolean
    controls?: boolean
    muted?: boolean
  },
): string {
  const params = new URLSearchParams({
    h: "0",
    badge: "0",
    autopause: "0",
    player_id: "0",
  })

  if (options?.autoplay) params.set("autoplay", "1")
  if (options?.loop) params.set("loop", "1")
  if (options?.muted) params.set("muted", "1")
  if (!options?.controls) params.set("controls", "0")

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`
}

export function createVimeoThumbnailUrl(videoId: string): string {
  return `https://vumbnail.com/${videoId}.jpg`
}

export function formatTimecode(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function parseTimecode(timecode: string): number {
  const parts = timecode.split(":").map((part) => Number.parseInt(part, 10))
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

/**
 * Creates a Vimeo embed URL with markers for start and end times
 * @param videoId The Vimeo video ID
 * @param markIn Optional start time in seconds
 * @param markOut Optional end time in seconds (handled via JavaScript)
 * @returns The embed URL with time parameters
 */
export function createVimeoEmbedUrlWithMarkers(videoId: string, markIn?: number, markOut?: number): string {
  let url = `https://player.vimeo.com/video/${videoId}?h=0&badge=0&autopause=0&player_id=0`

  // Add start time if provided
  if (markIn !== undefined && markIn > 0) {
    url += `#t=${markIn}s`
  }

  return url
}

/**
 * Creates a YouTube embed URL with markers for start and end times
 * @param videoId The YouTube video ID
 * @param markIn Optional start time in seconds
 * @param markOut Optional end time in seconds
 * @returns The embed URL with time parameters
 */
export function createYouTubeEmbedUrlWithMarkers(videoId: string, markIn?: number, markOut?: number): string {
  const options: any = {}

  if (markIn !== undefined && markIn > 0) {
    options.start = markIn
  }

  if (markOut !== undefined && markOut > 0) {
    options.end = markOut
  }

  return createYouTubeEmbedUrl(videoId, options)
}

export function validateTimeMarkers(
  markIn?: number,
  markOut?: number,
  duration?: number,
): { isValid: boolean; error?: string } {
  if (markIn !== undefined && markIn < 0) {
    return { isValid: false, error: "Mark in cannot be negative" }
  }

  if (markOut !== undefined && markOut < 0) {
    return { isValid: false, error: "Mark out cannot be negative" }
  }

  if (markIn !== undefined && markOut !== undefined && markIn >= markOut) {
    return { isValid: false, error: "Mark in must be before mark out" }
  }

  if (duration !== undefined) {
    if (markIn !== undefined && markIn > duration) {
      return { isValid: false, error: "Mark in cannot exceed video duration" }
    }
    if (markOut !== undefined && markOut > duration) {
      return { isValid: false, error: "Mark out cannot exceed video duration" }
    }
  }

  return { isValid: true }
}

export function isValidVideoUrl(url: string): boolean {
  return getVideoPlatform(url) !== null
}

export function getVideoEmbedUrl(
  url: string,
  options?: {
    autoplay?: boolean
    loop?: boolean
    controls?: boolean
    muted?: boolean
    start?: number
    end?: number
  },
): string | null {
  const videoData = parseVideoUrl(url)
  if (!videoData) return null

  const { platform, videoId } = videoData

  if (platform === "vimeo") {
    return createVimeoEmbedUrl(videoId, options)
  } else {
    return createYouTubeEmbedUrl(videoId, options)
  }
}

export function getVideoThumbnailUrl(url: string): string | null {
  const videoData = parseVideoUrl(url)
  if (!videoData) return null

  return createVideoThumbnailUrl(videoData.platform, videoData.videoId)
}

export function getVideoEmbedUrlWithMarkers(url: string, markIn?: number, markOut?: number): string | null {
  const videoData = parseVideoUrl(url)
  if (!videoData) return null

  const { platform, videoId } = videoData
  return platform === "vimeo"
    ? createVimeoEmbedUrlWithMarkers(videoId, markIn, markOut)
    : createYouTubeEmbedUrlWithMarkers(videoId, markIn, markOut)
}
