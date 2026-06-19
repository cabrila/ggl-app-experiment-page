"use client"

import { useState, useEffect } from "react"
import { X, Send, Mail, FileText, FileJson, FileSpreadsheet, Check, Loader2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"

export type ShareableToolType = 
  | "character-bible" 
  | "location-overview" 
  | "actor-list" 
  | "prop-list" 
  | "scene-list"

interface ShareModalProps {
  onClose: () => void
  toolType: ShareableToolType
  projectName: string
  data: unknown
}

const toolLabels: Record<ShareableToolType, string> = {
  "character-bible": "Character Bible",
  "location-overview": "Location Overview",
  "actor-list": "Actor List",
  "prop-list": "Prop List",
  "scene-list": "Scene List",
}

export default function ShareModal({ onClose, toolType, projectName, data }: ShareModalProps) {
  const toolLabel = toolLabels[toolType]
  
  const [fromEmail, setFromEmail] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState(`${toolLabel}: ${projectName}`)
  const [message, setMessage] = useState(
`Hi,

Here's a ${toolLabel} extracted from the screenplay "${projectName}".

I generated this using GoGreenlight Tools — you can try it for free here:
https://tools.gogreenlight.ai

Best regards`
  )
  
  const [formats, setFormats] = useState({
    pdf: true,
    json: false,
    excel: false,
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill from email with logged-in user's email
  useEffect(() => {
    const user = getCurrentUser()
    if (user?.email) {
      setFromEmail(user.email)
    }
  }, [])

  const hasSelectedFormat = formats.pdf || formats.json || formats.excel
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidFromEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)
  const canSubmit = isValidEmail && isValidFromEmail && hasSelectedFormat && !isSubmitting

  const toggleFormat = (format: "pdf" | "json" | "excel") => {
    setFormats((prev) => ({ ...prev, [format]: !prev[format] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject,
          message,
          formats,
          toolType,
          projectName,
          data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#1a2e23] to-[#152019] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-sans">Share via Email</h2>
              <p className="text-xs text-white/50 font-sans">{toolLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 font-sans">Email Sent!</h3>
            <p className="text-white/60 text-sm text-center font-sans mb-6">
              Your {toolLabel.toLowerCase()} has been shared successfully.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors font-sans"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* From Field */}
            <div>
              <label htmlFor="share-from" className="block text-sm font-medium text-white/70 mb-1.5 font-sans">
                From
              </label>
              <input
                autoComplete="off"
                id="share-from"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-sans"
                required
              />
            </div>

            {/* To Field */}
            <div>
              <label htmlFor="share-email" className="block text-sm font-medium text-white/70 mb-1.5 font-sans">
                To
              </label>
              <input
                autoComplete="off"
                id="share-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-sans"
                required
              />
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="share-subject" className="block text-sm font-medium text-white/70 mb-1.5 font-sans">
                Subject
              </label>
              <input
                autoComplete="off"
                id="share-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-sans"
                required
              />
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="share-message" className="block text-sm font-medium text-white/70 mb-1.5 font-sans">
                Message
              </label>
              <textarea
                autoComplete="off"
                id="share-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none font-sans text-sm"
                required
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2 font-sans">
                Attachments
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleFormat("pdf")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-sans text-sm ${
                    formats.pdf
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                  {formats.pdf && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFormat("json")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-sans text-sm ${
                    formats.json
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <FileJson className="w-4 h-4" />
                  <span>JSON</span>
                  {formats.json && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFormat("excel")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-sans text-sm ${
                    formats.excel
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel</span>
                  {formats.excel && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
              </div>
              {!hasSelectedFormat && (
                <p className="text-xs text-amber-400/80 mt-2 font-sans">Please select at least one format</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400 font-sans">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors font-sans"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
