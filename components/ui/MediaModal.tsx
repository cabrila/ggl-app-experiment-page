"use client"

import { useEffect, useCallback, useState } from "react"
import { X, ExternalLink, Loader2 } from "lucide-react"

interface MediaModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
}

// Extract video ID and generate embed URL
function getEmbedUrl(url: string): { embedUrl: string | null; platform: string } {
  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (youtubeMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`,
      platform: "YouTube",
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      platform: "Vimeo",
    }
  }

  // Google Drive (video preview)
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveMatch) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      platform: "Google Drive",
    }
  }

  return { embedUrl: null, platform: "Unknown" }
}

export default function MediaModal({ isOpen, onClose, url, title }: MediaModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const { embedUrl, platform } = getEmbedUrl(url)

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
      setIsLoading(true)
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-4xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-white font-sans">{title}</h3>
            )}
            <p className="text-sm text-white/50 font-sans">{platform}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="font-sans">Open in new tab</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0f1f17]">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          )}

          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title || "Media content"}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
              <p className="font-sans mb-4">Unable to embed this media</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="font-sans">Open in new tab</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
