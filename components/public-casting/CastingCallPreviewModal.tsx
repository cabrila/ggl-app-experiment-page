"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ExternalLink, Send, CheckCircle, ImagePlus } from "lucide-react"
import { CastingCall, PublicCastingProject } from "@/types/public-casting"
import { usePublicCasting } from "./PublicCastingContext"

interface CastingCallPreviewModalProps {
  castingCall: CastingCall
  project?: PublicCastingProject
  onClose: () => void
}

export default function CastingCallPreviewModal({ castingCall, project, onClose }: CastingCallPreviewModalProps) {
  const { addSubmission } = usePublicCasting()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // Initialize form data
  useEffect(() => {
    const initialData: Record<string, string> = {}
    castingCall.fields.forEach(field => {
      initialData[field.label] = ""
    })
    setFormData(initialData)
  }, [castingCall.fields])

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    document.addEventListener("keydown", handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [handleEscape])

  const handleInputChange = (fieldLabel: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldLabel]: value }))
    // Clear error when user starts typing
    if (errors[fieldLabel]) {
      setErrors(prev => ({ ...prev, [fieldLabel]: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const newErrors: Record<string, boolean> = {}
    let hasErrors = false
    
    castingCall.fields.forEach(field => {
      if (field.required && !formData[field.label]?.trim()) {
        newErrors[field.label] = true
        hasErrors = true
      }
    })

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Add submission to context
    addSubmission(castingCall.id, formData)
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleReset = () => {
    const initialData: Record<string, string> = {}
    castingCall.fields.forEach(field => {
      initialData[field.label] = ""
    })
    setFormData(initialData)
    setIsSubmitted(false)
    setErrors({})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Full screen on mobile, centered on larger screens */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-[#1a3a25] sm:rounded-2xl border-0 sm:border border-white/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white font-sans">Form Preview</h2>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full font-sans font-medium">
              Live Test Mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(castingCall.shareableLink, "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white text-sm transition-all font-sans"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isSubmitted ? (
            // Success State
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 font-sans">
                Submission Received!
              </h2>
              <p className="text-white/60 font-sans max-w-sm mb-6">
                Your test submission has been added to the submissions list. Check the Submissions view to see it.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-medium text-sm transition-all font-sans"
                >
                  Submit Another
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium text-sm transition-colors font-sans"
                >
                  Close Preview
                </button>
              </div>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit}>
              {/* Form Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full text-emerald-300 text-sm mb-4 font-sans font-medium">
                  {castingCall.projectName}
                </div>
                <h1 className="text-2xl font-bold text-white mb-2 font-sans">
                  {castingCall.title}
                </h1>
                {castingCall.description && (
                  <p className="text-white/60 font-sans max-w-md mx-auto">
                    {castingCall.description}
                  </p>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4 max-w-md mx-auto">
                {castingCall.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-white/70 mb-1.5 font-sans">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        placeholder={field.placeholder}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-white/30 font-sans resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                          errors[field.label] ? "border-red-500/50" : "border-white/10"
                        }`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                          errors[field.label] ? "border-red-500/50" : "border-white/10"
                        }`}
                      >
                        <option value="">{field.placeholder || "Select an option"}</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === "image" ? (
                      <div
                        className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-white/5 border border-dashed rounded-xl text-white/50 cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all font-sans text-sm ${
                          errors[field.label] ? "border-red-500/50" : "border-white/20"
                        }`}
                        onClick={() => {
                          // Simulate image upload
                          const fakeImageUrl = `https://picsum.photos/seed/${Date.now()}/200/200`
                          handleInputChange(field.label, fakeImageUrl)
                        }}
                      >
                        {formData[field.label] ? (
                          <div className="flex items-center gap-3">
                            <img 
                              src={formData[field.label]} 
                              alt="Uploaded" 
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <span className="text-emerald-400">Image uploaded</span>
                          </div>
                        ) : (
                          <>
                            <ImagePlus className="w-6 h-6" />
                            <span>{field.placeholder || "Click to upload an image"}</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-white/30 font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                          errors[field.label] ? "border-red-500/50" : "border-white/10"
                        }`}
                      />
                    )}
                    {errors[field.label] && (
                      <p className="text-red-400 text-xs mt-1 font-sans">This field is required</p>
                    )}
                  </div>
                ))}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors font-sans mt-6"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 bg-white/5 shrink-0">
          <p className="text-center text-sm text-white/50 font-sans">
            {isSubmitted 
              ? "Test submission completed. View results in the Submissions tab."
              : "This is a live test. Submissions will appear in your submissions list."
            }
          </p>
        </div>
      </div>
    </div>
  )
}
