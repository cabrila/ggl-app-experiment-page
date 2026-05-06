"use client"

import { useState } from "react"
import { ExternalLink, Play, X } from "lucide-react"
import { getVideoPlatform, getVideoThumbnailUrl, getVideoEmbedUrl } from "@/utils/videoUtils"

interface VideoEmbedProps {
  url: string
  title?: string
  autoplay?: boolean
  loop?: boolean
  controls?: boolean
  muted?: boolean
  thumbnailOnly?: boolean
  className?: string
  markIn?: number
  markOut?: number
  onError?: (error: string) => void
}

export default function VideoEmbed({
  url,
  title = "Video",
  autoplay = false,
  loop = false,
  controls = true,
  muted = true,
  thumbnailOnly = false,
  className = "",
  markIn,
  markOut,
  onError,
}: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const platform = getVideoPlatform(url)

  if (!platform) {
    const errorMsg = "Unsupported video platform"
    onError?.(errorMsg)
    return (
      <div className={`aspect-video bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">{errorMsg}</p>
          <p className="text-xs mt-1">Supports Vimeo and YouTube</p>
        </div>
      </div>
    )
  }

  const thumbnailUrl = getVideoThumbnailUrl(url)
  const embedUrl = getVideoEmbedUrl(url, { autoplay, loop, controls, muted, start: markIn, end: markOut })

  const handlePlay = () => {
    if (thumbnailOnly) return
    setIsLoading(true)
    setIsPlaying(true)
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleThumbnailError = () => {
    setHasError(true)
  }

  const openInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (thumbnailOnly || !isPlaying) {
    return (
      <div className={`relative aspect-video bg-gray-100 rounded-lg overflow-hidden group ${className}`}>
        {/* Thumbnail */}
        {!hasError && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={handleThumbnailError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">🎥</div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs mt-1 capitalize">{platform} Video</p>
            </div>
          </div>
        )}

        {/* Platform Badge */}
        <div
          className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white ${
            platform === "vimeo" ? "bg-blue-600" : "bg-red-600"
          }`}
        >
          {platform === "vimeo" ? "Vimeo" : "YouTube"}
        </div>

        {/* Play Button Overlay */}
        {!thumbnailOnly && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 cursor-pointer"
            onClick={handlePlay}
          >
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
              <Play className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" />
            </div>
          </div>
        )}

        {/* External Link Button */}
        <button
          onClick={openInNewTab}
          className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title={`Open on ${platform === "vimeo" ? "Vimeo" : "YouTube"}`}
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    )
  }

  // Full embed view
  return (
    <div className={`relative aspect-video bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <div className="text-center text-gray-500">
            <p className="text-sm">Unable to load video</p>
            <button onClick={openInNewTab} className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline">
              Open in new tab
            </button>
          </div>
        </div>
      )}

      {/* Close/Minimize Button */}
      <button
        onClick={() => setIsPlaying(false)}
        className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded text-white"
        title="Close video"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}
