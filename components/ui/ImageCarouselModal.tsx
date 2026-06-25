"use client"

import { useEffect, useCallback, useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface ImageCarouselModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  /** Index to open on. */
  startIndex?: number
  title?: string
}

/**
 * Full-screen modal that displays a set of images with previous/next
 * navigation, keyboard arrows, a thumbnail strip, and a counter.
 */
export default function ImageCarouselModal({
  isOpen,
  onClose,
  images,
  startIndex = 0,
  title = "Images",
}: ImageCarouselModalProps) {
  const [index, setIndex] = useState(startIndex)

  const count = images.length
  const goPrev = useCallback(() => {
    setIndex((i) => (count === 0 ? 0 : (i - 1 + count) % count))
  }, [count])
  const goNext = useCallback(() => {
    setIndex((i) => (count === 0 ? 0 : (i + 1) % count))
  }, [count])

  // Sync to the requested start index whenever the modal is (re)opened.
  useEffect(() => {
    if (isOpen) setIndex(startIndex)
  }, [isOpen, startIndex])

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    },
    [onClose, goPrev, goNext],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleKey])

  if (!isOpen || count === 0) return null

  const current = images[Math.min(index, count - 1)]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      />

      {/* Modal */}
      <div className="relative w-full h-full sm:w-[90vw] sm:h-[90vh] sm:max-w-5xl bg-[#0f1f17] sm:rounded-2xl border-0 sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white font-sans">{title}</h2>
            <p className="text-xs text-white/50 font-sans">
              {index + 1} of {count}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
            aria-label="Close image viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image stage */}
        <div className="flex-1 relative flex items-center justify-center bg-[#0a0f0c] min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current || "/placeholder.svg"}
            alt={`${title} ${index + 1}`}
            className="max-w-full max-h-full object-contain"
          />

          {count > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {count > 1 && (
          <div className="flex items-center gap-2 p-3 border-t border-white/10 overflow-x-auto shrink-0">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === index ? "border-emerald-500" : "border-transparent hover:border-white/30"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img || "/placeholder.svg"} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
