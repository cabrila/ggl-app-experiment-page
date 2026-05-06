"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Z_INDEX } from "@/utils/zIndex"

// This modal uses the highest z-index (9998) to ensure it appears above all other elements
// including the Player View Modal and any other UI components
interface PhotoViewerModalProps {
  photos: string[]
  initialIndex: number
  actorName: string
  onClose: () => void
}

export default function PhotoViewerModal({ photos, initialIndex, actorName, onClose }: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          handlePrevious()
          break
        case "ArrowRight":
          handleNext()
          break
        case "z":
        case "Z":
          setIsZoomed(!isZoomed)
          break
        case "r":
        case "R":
          setRotation((prev) => (prev + 90) % 360)
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isZoomed, onClose])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
    setIsZoomed(false)
    setRotation(0)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
    setIsZoomed(false)
    setRotation(0)
  }

  const handleImageError = (index: number) => {
    setImageErrors((prev) => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
  }

  const handleImageLoad = (index: number) => {
    setImageErrors((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  const getImageUrl = (index: number) => {
    if (imageErrors.has(index)) {
      const placeholderSeed = actorName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
      return ""
    }

    const photo = photos[index]
    if (!photo) {
      return ""
    }

    // Check if it's a base64 data URL (uploaded image)
    if (photo.startsWith("data:image/")) {
      return photo
    }

    // Check if it's a full URL
    if (photo.startsWith("http://") || photo.startsWith("https://")) {
      return photo
    }

    // Check if it's a relative path
    if (photo.startsWith("/")) {
      return photo
    }

    // If it's just a name/identifier, return empty string
    return ""
  }

  const currentPhoto = getImageUrl(currentIndex)

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4"
      style={{
        zIndex: Z_INDEX.PHOTO_VIEWER,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-black bg-opacity-50 text-white rounded-t-lg">
          <div>
            <h3 className="text-lg font-semibold">{actorName}</h3>
            <p className="text-sm opacity-75">
              Photo {currentIndex + 1} of {photos.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              title={isZoomed ? "Zoom Out (Z)" : "Zoom In (Z)"}
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>

            {/* Rotate Control */}
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              title="Rotate (R)"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Area */}
        <div className="flex-1 relative bg-black rounded-b-lg overflow-hidden">
          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                title="Previous (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                title="Next (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={`${actorName} - Photo ${currentIndex + 1}`}
                className={`max-w-full max-h-full object-contain transition-all duration-300 ${
                  isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                }`}
                style={{
                  transform: `rotate(${rotation}deg) ${isZoomed ? "scale(1.5)" : "scale(1)"}`,
                }}
                onClick={() => setIsZoomed(!isZoomed)}
                onLoad={() => handleImageLoad(currentIndex)}
                onError={() => handleImageError(currentIndex)}
              />
            ) : (
              <div className="text-slate-400 text-center">
                <div className="text-6xl mb-4">📷</div>
                <p>No image available</p>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded-lg p-2">
              <div className="flex gap-2 max-w-md overflow-x-auto">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index)
                      setIsZoomed(false)
                      setRotation(0)
                    }}
                    className={`flex-shrink-0 w-12 h-12 rounded border-2 transition-all ${
                      index === currentIndex
                        ? "border-emerald-400 opacity-100"
                        : "border-white border-opacity-30 opacity-60 hover:opacity-80"
                    }`}
                  >
                    {getImageUrl(index) ? (
                      <img
                        src={getImageUrl(index)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                        onError={() => handleImageError(index)}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 rounded flex items-center justify-center text-slate-400 text-xs">
                        {index + 1}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="absolute top-20 right-4 bg-black bg-opacity-70 text-white text-xs p-3 rounded-lg opacity-50 hover:opacity-100 transition-opacity">
          <div className="space-y-1">
            <div>← → Navigate</div>
            <div>Z Zoom</div>
            <div>R Rotate</div>
            <div>Esc Close</div>
          </div>
        </div>
      </div>
    </div>
  )
}
