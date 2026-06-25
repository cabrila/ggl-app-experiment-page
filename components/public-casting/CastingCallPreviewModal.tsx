"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ExternalLink, Send, CheckCircle, ImagePlus, Plus, Trash2 } from "lucide-react"
import { CastingCall, PublicCastingProject } from "@/types/public-casting"
import { usePublicCasting } from "./PublicCastingContext"
import { splitMultiValue, joinMultiValue, getVideoEmbed } from "@/utils/mediaEmbed"
import { isProfilePictureField } from "@/utils/profilePicture"
import ProfilePictureField from "@/components/ui/ProfilePictureField"

interface CastingCallPreviewModalProps {
  castingCall: CastingCall
  project?: PublicCastingProject
  onClose: () => void
}

export default function CastingCallPreviewModal({ castingCall, project, onClose }: CastingCallPreviewModalProps) {
  const { addSubmission } = usePublicCasting()
  const [formData, setFormData] = useState<Record<string, string>>({})
  // Per-URL-field row state so empty inputs persist while typing/adding.
  const [urlRows, setUrlRows] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [talentPoolConsent, setTalentPoolConsent] = useState(false)

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

  // Add an entry to a multi-value field (used for multiple image uploads)
  const handleAddMultiValue = (fieldLabel: string, value = "") => {
    const values = splitMultiValue(formData[fieldLabel])
    values.push(value)
    handleInputChange(fieldLabel, joinMultiValue(values))
  }

  // Remove one entry from a multi-value field
  const handleRemoveMultiValue = (fieldLabel: string, index: number) => {
    const values = splitMultiValue(formData[fieldLabel])
    values.splice(index, 1)
    handleInputChange(fieldLabel, joinMultiValue(values))
  }

  // Read selected image files as data URLs and append them to a multi-value field.
  const handleImageFiles = (fieldLabel: string, files: FileList | null) => {
    if (!files) return
    Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => handleAddMultiValue(fieldLabel, reader.result as string)
        reader.readAsDataURL(file)
      })
  }

  // --- URL field rows (kept in dedicated state so empty rows persist) ---
  const getUrlRows = (fieldLabel: string): string[] => {
    return urlRows[fieldLabel] ?? splitMultiValue(formData[fieldLabel])
  }

  // Sync a URL field's rows into both urlRows and formData (non-empty only)
  const syncUrlRows = (fieldLabel: string, rows: string[]) => {
    setUrlRows((prev) => ({ ...prev, [fieldLabel]: rows }))
    handleInputChange(fieldLabel, joinMultiValue(rows.filter((r) => r.trim() !== "")))
  }

  const handleUrlChange = (fieldLabel: string, index: number, value: string) => {
    const rows = [...getUrlRows(fieldLabel)]
    while (rows.length <= index) rows.push("")
    rows[index] = value
    syncUrlRows(fieldLabel, rows)
  }

  const handleAddUrl = (fieldLabel: string) => {
    const rows = [...getUrlRows(fieldLabel)]
    rows.push("")
    syncUrlRows(fieldLabel, rows)
  }

  const handleRemoveUrl = (fieldLabel: string, index: number) => {
    const rows = [...getUrlRows(fieldLabel)]
    rows.splice(index, 1)
    syncUrlRows(fieldLabel, rows)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Completed casting calls do not accept new submissions
    if (castingCall.isCompleted) {
      return
    }

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
    
    // Add submission to context (include talent pool consent when enabled).
    // Consent is on by default — only an explicit `false` disables it.
    const submissionData = castingCall.talentPoolConsentEnabled !== false
      ? { ...formData, "Talent Pool Consent": talentPoolConsent ? "Yes" : "No" }
      : formData
    addSubmission(castingCall.id, submissionData)
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleReset = () => {
    const initialData: Record<string, string> = {}
    castingCall.fields.forEach(field => {
      initialData[field.label] = ""
    })
    setFormData(initialData)
    setUrlRows({})
    setIsSubmitted(false)
    setErrors({})
    setTalentPoolConsent(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
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
              onClick={() => {
                if (castingCall.id === "preview") {
                  alert("Please save this casting call first to generate a public link.");
                } else {
                  window.open(`${window.location.origin}/actor-submission/${castingCall.id}`, "_blank");
                }
              }}
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
          ) : castingCall.isCompleted ? (
            // Closed State - completed casting calls do not accept submissions
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 font-sans">
                This Casting Call is Completed
              </h2>
              <p className="text-white/60 font-sans max-w-sm mb-6">
                {castingCall.title} is no longer accepting new submissions. Uncheck &quot;Completed&quot; in the casting call settings to reopen it.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-medium text-sm transition-all font-sans"
              >
                Close Preview
              </button>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit}>
              {/* Header Image */}
              {castingCall.headerImageUrl && (
                <div className="w-full h-40 rounded-xl overflow-hidden mb-6">
                  <img
                    src={castingCall.headerImageUrl || "/placeholder.svg"}
                    alt={`${castingCall.title} header`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
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
                        autoComplete="off"
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
                        <option value="" className="bg-[#1a4a2a] text-white/50">{field.placeholder || "Select an option"}</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt} className="bg-[#1a4a2a] text-white">{opt}</option>
                        ))}
                      </select>
                    ) : field.type === "image" ? (
                      isProfilePictureField(field) ? (
                        // Standard single profile picture: click-to-upload or drag & drop
                        <ProfilePictureField
                          value={formData[field.label] || ""}
                          onChange={(val) => handleInputChange(field.label, val)}
                          accent="emerald"
                          error={errors[field.label]}
                          placeholder={field.placeholder || "Click or drag to upload a profile picture"}
                        />
                      ) : (
                        <div className="space-y-2">
                          {/* Existing uploaded images */}
                          {splitMultiValue(formData[field.label]).length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {splitMultiValue(formData[field.label]).map((img, idx) => (
                                <div key={idx} className="relative group/img">
                                  <img
                                    src={img || "/placeholder.svg"}
                                    alt={`Upload ${idx + 1}`}
                                    className="w-full h-20 rounded-lg object-cover border border-white/10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMultiValue(field.label, idx)}
                                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500/80 rounded-md text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                                    title="Remove image"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Real image upload (click or drag and drop) */}
                          <label
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault()
                              handleImageFiles(field.label, e.dataTransfer.files)
                            }}
                            className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-white/5 border border-dashed rounded-xl text-white/50 cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all font-sans text-sm ${
                              errors[field.label] ? "border-red-500/50" : "border-white/20"
                            }`}
                          >
                            <ImagePlus className="w-6 h-6" />
                            <span>{field.placeholder || "Click or drag images to upload"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => handleImageFiles(field.label, e.target.files)}
                              autoComplete="off"
                            />
                          </label>
                        </div>
                      )
                    ) : field.type === "url" ? (
                      <div className="space-y-2">
                        {(() => {
                          const urls = getUrlRows(field.label)
                          const rows = urls.length > 0 ? urls : [""]
                          return rows.map((url, idx) => {
                            const embed = getVideoEmbed(url)
                            return (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="url"
                                    placeholder={field.placeholder || "Paste a YouTube or Vimeo link"}
                                    value={url}
                                    onChange={(e) => handleUrlChange(field.label, idx, e.target.value)}
                                    autoComplete="off"
                                    className={`flex-1 px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-white/30 font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                                      errors[field.label] ? "border-red-500/50" : "border-white/10"
                                    }`}
                                  />
                                  {rows.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveUrl(field.label, idx)}
                                      className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-xl text-white/50 hover:text-red-400 transition-colors"
                                      title="Remove link"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                {embed && (
                                  <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10">
                                    <iframe
                                      src={embed.embedUrl}
                                      title={`Video preview ${idx + 1}`}
                                      className="w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })
                        })()}
                        <button
                          type="button"
                          onClick={() => handleAddUrl(field.label)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-colors font-sans"
                        >
                          <Plus className="w-4 h-4" />
                          Add another link
                        </button>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        autoComplete="off"
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

                {/* Talent Pool Consent - rendered at the very end of the form;
                    enabled by default unless explicitly turned off */}
                {castingCall.talentPoolConsentEnabled !== false && (
                  <label className="flex items-start gap-3 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={talentPoolConsent}
                      onChange={(e) => setTalentPoolConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/5 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
                      autoComplete="off"
                    />
                    <span className="text-sm text-white/70 font-sans leading-relaxed">
                      {castingCall.talentPoolConsentText ||
                        "I consent to being added to the talent pool to be considered for future projects."}
                    </span>
                  </label>
                )}

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
