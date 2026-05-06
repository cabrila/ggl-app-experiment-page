"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, ImagePlus, Trash2, CheckCircle } from "lucide-react"

interface FeedbackModalProps {
  onClose: () => void
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [heading, setHeading] = useState("")
  const [message, setMessage] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setScreenshot(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setScreenshotPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveScreenshot = () => {
    setScreenshot(null)
    setScreenshotPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("heading", heading)
      formData.append("message", message)
      
      if (screenshot) {
        formData.append("screenshot", screenshot)
      }
      if (screenshotPreview) {
        formData.append("screenshotUrl", screenshotPreview)
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          heading,
          message,
          screenshotUrl: screenshotPreview,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit feedback")
      }

      setIsSubmitting(false)
      setIsSuccess(true)

      // Close modal after showing success
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      console.error("[v0] Feedback submission error:", err)
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback. Please try again."
      )
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-[#1a3a25] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white font-sans">
            Feedback & Requests
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 px-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 font-sans">
              Thank you!
            </h3>
            <p className="text-white/60 text-sm text-center font-sans">
              Your feedback has been submitted successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300 font-sans">{error}</p>
              </div>
            )}

            {/* Heading (Optional) */}
            <div>
              <label
                htmlFor="feedback-heading"
                className="block text-sm font-medium text-white/70 mb-1.5 font-sans"
              >
                Subject <span className="text-white/40">(optional)</span>
              </label>
              <input
                id="feedback-heading"
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Brief summary of your feedback"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-sans"
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="feedback-message"
                className="block text-sm font-medium text-white/70 mb-1.5 font-sans"
              >
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your feature request, feedback, or comment..."
                rows={5}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none font-sans"
              />
            </div>

            {/* Screenshot (Optional) */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 font-sans">
                Screenshot <span className="text-white/40">(optional)</span>
              </label>
              
              {screenshotPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white/80 hover:text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove screenshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-white/50 hover:text-white/70 hover:border-white/30 hover:bg-white/10 transition-all font-sans text-sm"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span>Attach a screenshot</span>
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors font-sans"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
