"use client"

import { useState, useRef, useEffect } from "react"
import { X, UserPlus, CheckCircle, Mail, User } from "lucide-react"

interface FeedbackUserModalProps {
  onClose: () => void
}

export default function FeedbackUserModal({ onClose }: FeedbackUserModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/feedback/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to sign up")
      }

      setIsSubmitting(false)
      setIsSuccess(true)

      // Close modal after showing success
      setTimeout(() => {
        onClose()
      }, 3000)
    } catch (err) {
      console.error("[v0] Feedback user sign-up error:", err)
      setError(
        err instanceof Error ? err.message : "Failed to sign up. Please try again."
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
            Join Our Community
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
              Welcome aboard!
            </h3>
            <p className="text-white/60 text-sm text-center font-sans">
              Thank you for joining our feedback community. We&apos;ll be in touch!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Description */}
            <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-sm text-emerald-200/80 font-sans">
                We&apos;d love your input! You may receive occasional emails about feedback sessions and workshops. Unsubscribe anytime - completely optional.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300 font-sans">{error}</p>
              </div>
            )}

            {/* Name (Optional) */}
            <div>
              <label
                htmlFor="feedback-user-name"
                className="block text-sm font-medium text-white/70 mb-1.5 font-sans"
              >
                Name <span className="text-white/40">(optional)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  autoComplete="off"
                  id="feedback-user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-sans"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="feedback-user-email"
                className="block text-sm font-medium text-white/70 mb-1.5 font-sans"
              >
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  autoComplete="off"
                  id="feedback-user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-sans"
                />
              </div>
            </div>

            {/* Consent Notice */}
            <p className="text-xs text-white/40 font-sans">
              By signing up, you agree to receive occasional emails from GoGreenlight about feedback opportunities. You can unsubscribe at any time.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors font-sans"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing up...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Join Community</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
