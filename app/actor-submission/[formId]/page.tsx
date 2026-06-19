"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Check, CheckCircle, ImagePlus, X, Trash2, AlertCircle } from "lucide-react"
import { splitMultiValue, getVideoEmbed } from "@/utils/mediaEmbed"
import { isProfilePictureField } from "@/utils/profilePicture"
import ProfilePictureField from "@/components/ui/ProfilePictureField"

export default function ActorSubmissionForm() {
  const params = useParams()
  const formId = params.formId as string
  
  const [formConfig, setFormConfig] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)

  // Dynamic form state
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [urlRows, setUrlRows] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [talentPoolConsent, setTalentPoolConsent] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/casting-call/${formId}`);
        if (res.ok) {
          const config = await res.json();
          setFormConfig(config);
          
          // Initialize form data
          const initialData: Record<string, string> = {}
          config.fields?.forEach((field: any) => {
            initialData[field.label] = ""
          })
          setFormData(initialData)
        } else {
          setConfigError("Casting call not found or is no longer active.")
        }
      } catch (e) {
        setConfigError("Failed to connect to server.");
        console.error("Failed to load casting call config", e);
      } finally {
        setConfigLoading(false);
      }
    }
    loadConfig();
  }, [formId]);

  const handleInputChange = (label: string, value: string) => {
    setFormData((prev) => ({ ...prev, [label]: value }))
    if (errors[label]) {
      setErrors((prev) => ({ ...prev, [label]: false }))
    }
  }

  // Multi-image upload handlers
  const handleImageFiles = (label: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFormData((prev) => {
          const existing = splitMultiValue(prev[label])
          return { ...prev, [label]: [...existing, result].join("|||") }
        })
      }
      reader.readAsDataURL(file)
    })
    if (errors[label]) setErrors((prev) => ({ ...prev, [label]: false }))
  }

  const handleRemoveMultiValue = (label: string, indexToRemove: number) => {
    setFormData((prev) => {
      const existing = splitMultiValue(prev[label])
      const updated = existing.filter((_, i) => i !== indexToRemove)
      return { ...prev, [label]: updated.join("|||") }
    })
  }

  // URL list handlers
  const getUrlRows = (label: string) => urlRows[label] || []
  const handleUrlChange = (label: string, index: number, value: string) => {
    setUrlRows((prev) => {
      const current = prev[label] || [""]
      const updated = [...current]
      updated[index] = value
      if (index === updated.length - 1 && value.trim() !== "") {
        updated.push("") // Add empty row
      }
      return { ...prev, [label]: updated }
    })
    setFormData((prev) => {
      const current = urlRows[label] || [""]
      const updated = [...current]
      updated[index] = value
      const cleanUrls = updated.filter((u) => u.trim() !== "")
      return { ...prev, [label]: cleanUrls.join("|||") }
    })
    if (errors[label]) setErrors((prev) => ({ ...prev, [label]: false }))
  }

  const handleRemoveUrl = (label: string, index: number) => {
    setUrlRows((prev) => {
      const current = prev[label] || [""]
      const updated = current.filter((_, i) => i !== index)
      if (updated.length === 0) updated.push("")
      return { ...prev, [label]: updated }
    })
    setFormData((prev) => {
      const current = urlRows[label] || [""]
      const updated = current.filter((_, i) => i !== index)
      const cleanUrls = updated.filter((u) => u.trim() !== "")
      return { ...prev, [label]: cleanUrls.join("|||") }
    })
  }

  const validateForm = () => {
    if (!formConfig) return false
    const newErrors: Record<string, boolean> = {}
    let isValid = true
    formConfig.fields.forEach((field: any) => {
      if (field.required) {
        const val = formData[field.label]
        if (!val || val.trim() === "") {
          newErrors[field.label] = true
          isValid = false
        }
      }
    })
    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Pass the raw formData object directly as actorData.
      // The backend/approval system will parse the custom field labels.
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/submit-actor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          castingCallId: formId,
          actorData: formData,
        })
      });
      console.log("✅ Submitted successfully to Firestore via backend-service");
      setSubmitted(true)
    } catch (error) {
      console.error("❌ Failed to submit to backend-service:", error);
      setSubmitError("Failed to submit form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (configLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (configError || !formConfig) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md border border-slate-700">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Form Unavailable</h1>
          <p className="text-slate-400">{configError || "This casting call does not exist or has been closed."}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full text-center shadow-xl shadow-black/50">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 font-sans">Submission Received!</h1>
          <p className="text-slate-400 font-sans mb-6">
            Thank you for your submission. Your profile has been sent to the casting team for {formConfig.projectName}.
          </p>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              <strong>What's next?</strong> The team will review your materials and reach out directly if they'd like to schedule an audition.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Note: The public submission form uses a modern dark theme to match the Greenlight brand
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden border border-slate-700">
          
          {/* Header Image */}
          {formConfig.headerImageUrl && (
            <div className="w-full h-48 sm:h-64 bg-slate-900 relative">
              <img
                src={formConfig.headerImageUrl}
                alt="Casting call header"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent" />
            </div>
          )}

          {/* Form Header */}
          <div className={`px-8 ${formConfig.headerImageUrl ? '-mt-12 relative z-10' : 'pt-10'} text-center mb-8`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-sm mb-4 font-sans font-medium shadow-lg backdrop-blur-md">
              {formConfig.projectName}
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 font-sans">
              {formConfig.title}
            </h1>
            {formConfig.description && (
              <p className="text-slate-300 font-sans max-w-lg mx-auto leading-relaxed">
                {formConfig.description}
              </p>
            )}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-8">
            
            {submitError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-rose-300 text-sm">{submitError}</p>
              </div>
            )}

            <div className="space-y-6">
              {formConfig.fields?.map((field: any) => (
                <div key={field.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-300 mb-2 font-sans">
                    {field.label}
                    {field.required && <span className="text-rose-400 ml-1">*</span>}
                  </label>
                  
                  {field.type === "textarea" ? (
                    <textarea
                      placeholder={field.placeholder}
                      value={formData[field.label] || ""}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      rows={4}
                      autoComplete="off"
                      className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 font-sans resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                        errors[field.label] ? "border-rose-500/50 focus:ring-rose-500/50 focus:border-rose-500/50" : "border-slate-700"
                      }`}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={formData[field.label] || ""}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none ${
                        errors[field.label] ? "border-rose-500/50 focus:ring-rose-500/50 focus:border-rose-500/50" : "border-slate-700"
                      }`}
                    >
                      <option value="" className="text-slate-500">{field.placeholder || "Select an option"}</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "image" ? (
                    isProfilePictureField(field) ? (
                      <ProfilePictureField
                        value={formData[field.label] || ""}
                        onChange={(val) => handleInputChange(field.label, val)}
                        accent="emerald"
                        error={errors[field.label]}
                        placeholder={field.placeholder || "Click or drag to upload a profile picture"}
                      />
                    ) : (
                      <div className="space-y-3">
                        {splitMultiValue(formData[field.label]).length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {splitMultiValue(formData[field.label]).map((img, idx) => (
                              <div key={idx} className="relative group/img aspect-square rounded-xl overflow-hidden border border-slate-700">
                                <img src={img || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMultiValue(field.label, idx)}
                                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-500 rounded-lg text-white opacity-0 group-hover/img:opacity-100 transition-all backdrop-blur-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className={`w-full flex flex-col items-center justify-center gap-3 px-4 py-8 bg-slate-950 border border-dashed rounded-xl text-slate-400 cursor-pointer hover:bg-slate-900 transition-all font-sans text-sm ${errors[field.label] ? "border-rose-500/50" : "border-slate-700 hover:border-emerald-500/50"}`}>
                          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                            <ImagePlus className="w-6 h-6 text-slate-300" />
                          </div>
                          <span>{field.placeholder || "Click or drag images to upload"}</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageFiles(field.label, e.target.files)} />
                        </label>
                      </div>
                    )
                  ) : field.type === "url" ? (
                    <div className="space-y-3">
                      {(() => {
                        const urls = getUrlRows(field.label)
                        const rows = urls.length > 0 ? urls : [""]
                        return rows.map((url, idx) => {
                          const embed = getVideoEmbed(url)
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  placeholder={field.placeholder || "Paste a link"}
                                  value={url}
                                  onChange={(e) => handleUrlChange(field.label, idx, e.target.value)}
                                  className={`flex-1 px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${errors[field.label] ? "border-rose-500/50 focus:ring-rose-500/50" : "border-slate-700"}`}
                                />
                                {rows.length > 1 && (
                                  <button type="button" onClick={() => handleRemoveUrl(field.label, idx)} className="p-3 bg-slate-900 hover:bg-rose-500/20 border border-slate-700 rounded-xl text-slate-400 hover:text-rose-400 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {embed && (
                                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-700 shadow-inner">
                                  <iframe src={embed.embedUrl} className="w-full h-full" allowFullScreen />
                                </div>
                              )}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                      placeholder={field.placeholder}
                      value={formData[field.label] || ""}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      autoComplete="off"
                      className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-white placeholder-slate-500 font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                        errors[field.label] ? "border-rose-500/50 focus:ring-rose-500/50 focus:border-rose-500/50" : "border-slate-700"
                      }`}
                    />
                  )}
                  {errors[field.label] && (
                    <p className="mt-2 text-sm text-rose-400 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> This field is required</p>
                  )}
                </div>
              ))}
            </div>

            {formConfig.talentPoolConsentEnabled && (
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center pt-0.5">
                    <input
                      type="checkbox"
                      checked={talentPoolConsent}
                      onChange={(e) => setTalentPoolConsent(e.target.checked)}
                      className="w-5 h-5 appearance-none border-2 border-slate-600 rounded bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-800"
                    />
                    <Check className={`absolute inset-0 m-auto w-3.5 h-3.5 text-white pointer-events-none transition-opacity ${talentPoolConsent ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <span className="text-sm text-slate-300 leading-relaxed font-sans group-hover:text-white transition-colors">
                    {formConfig.talentPoolConsentText || "I consent to being added to the talent pool to be considered for future projects."}
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Profile...</span>
                </div>
              ) : (
                "Submit Casting Profile"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
