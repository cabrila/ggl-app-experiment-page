"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Camera, Upload, X, Plus, Check, AlertCircle, Video, Loader2 } from "lucide-react"
import { validateImageFile, processImage } from "@/utils/imageProcessing"

interface FormData {
  name: string
  age: string
  gender: string
  ethnicity: string
  location: string
  contactPhone: string
  contactEmail: string
  agent: string
  playingAge: string
  skills: string[]
  availability: string[]
  experience: string
  notes: string
}

interface VideoSubmission {
  id: string
  platform: "youtube" | "vimeo"
  url: string
  title: string
}

interface FormPreviewModalProps {
  formSettings: {
    title: string
    description: string
    deadline: string
    isPublic: boolean
    requireApproval: boolean
    allowMultipleSubmissions: boolean
    collectPhotos: boolean
    collectVideos: boolean
  }
  characterId: string
  projectId: string
  characterName: string
  onClose: () => void
  onSubmissionComplete: (actorData: any) => void
}

export default function FormPreviewModal({
  formSettings,
  characterId,
  projectId,
  characterName,
  onClose,
  onSubmissionComplete,
}: FormPreviewModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    gender: "",
    ethnicity: "",
    location: "",
    contactPhone: "",
    contactEmail: "",
    agent: "",
    playingAge: "",
    skills: [],
    availability: [],
    experience: "",
    notes: "",
  })

  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [processedPhotos, setProcessedPhotos] = useState<string[]>([]) // Store processed images
  const [videos, setVideos] = useState<VideoSubmission[]>([])
  const [newVideoUrl, setNewVideoUrl] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [newAvailability, setNewAvailability] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingImages, setIsProcessingImages] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Debug logging
  useEffect(() => {
    console.log("🎭 FormPreviewModal mounted for character:", characterName)
    console.log("⚙️ Form settings:", formSettings)
  }, [])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    console.log("📸 FormPreviewModal: Processing", files.length, "image files")
    setIsProcessingImages(true)

    try {
      const validFiles: File[] = []
      const newPreviews: string[] = []
      const newProcessedImages: string[] = []

      for (const file of files) {
        // Validate file
        const validation = validateImageFile(file)
        if (!validation.isValid) {
          console.warn("❌ Invalid file:", file.name, validation.error)
          setErrors((prev) => [...prev, `${file.name}: ${validation.error}`])
          continue
        }

        validFiles.push(file)

        // Create preview URL for immediate display
        const previewUrl = URL.createObjectURL(file)
        newPreviews.push(previewUrl)

        try {
          // Process and optimize the image
          const processedResult = await processImage(file, {
            maxWidth: 800,
            maxHeight: 1000,
            quality: 0.85,
            format: "jpeg",
          })

          newProcessedImages.push(processedResult.dataUrl)
          console.log("✅ Processed image:", file.name, "Compression:", processedResult.compressionRatio + "%")
        } catch (error) {
          console.error("❌ Failed to process image:", file.name, error)
          // Fallback to original file as data URL
          const reader = new FileReader()
          reader.onload = (e) => {
            newProcessedImages.push(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        }
      }

      // Update state with new files
      setPhotos((prev) => [...prev, ...validFiles])
      setPhotoPreviews((prev) => [...prev, ...newPreviews])
      setProcessedPhotos((prev) => [...prev, ...newProcessedImages])

      console.log("✅ FormPreviewModal: Added", validFiles.length, "images")
    } catch (error) {
      console.error("❌ Error processing images:", error)
      setErrors((prev) => [...prev, "Failed to process some images. Please try again."])
    } finally {
      setIsProcessingImages(false)
    }
  }

  const handleRemovePhoto = (index: number) => {
    // Clean up preview URL to prevent memory leaks
    const previewUrl = photoPreviews[index]
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }

    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
    setProcessedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const extractVideoId = (url: string): { platform: "youtube" | "vimeo"; id: string } | null => {
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ]

    const vimeoPatterns = [/vimeo\.com\/(\d+)/, /player\.vimeo\.com\/video\/(\d+)/]

    for (const pattern of youtubePatterns) {
      const match = url.match(pattern)
      if (match) {
        return { platform: "youtube", id: match[1] }
      }
    }

    for (const pattern of vimeoPatterns) {
      const match = url.match(pattern)
      if (match) {
        return { platform: "vimeo", id: match[1] }
      }
    }

    return null
  }

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return

    const videoInfo = extractVideoId(newVideoUrl)
    if (!videoInfo) {
      setErrors(["Please enter a valid YouTube or Vimeo URL"])
      return
    }

    const newVideo: VideoSubmission = {
      id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      platform: videoInfo.platform,
      url: newVideoUrl,
      title: `${videoInfo.platform.charAt(0).toUpperCase() + videoInfo.platform.slice(1)} Video`,
    }

    setVideos((prev) => [...prev, newVideo])
    setNewVideoUrl("")
    setErrors([])
  }

  const handleRemoveVideo = (videoId: string) => {
    setVideos((prev) => prev.filter((video) => video.id !== videoId))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }))
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const handleAddAvailability = () => {
    if (newAvailability.trim() && !formData.availability.includes(newAvailability.trim())) {
      setFormData((prev) => ({
        ...prev,
        availability: [...prev.availability, newAvailability.trim()],
      }))
      setNewAvailability("")
    }
  }

  const handleRemoveAvailability = (availToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.filter((avail) => avail !== availToRemove),
    }))
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []

    if (!formData.name.trim()) {
      newErrors.push("Name is required")
    }

    if (!formData.contactEmail.trim()) {
      newErrors.push("Email is required")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.push("Please enter a valid email address")
    }

    if (formSettings.collectPhotos && photos.length === 0) {
      newErrors.push("At least one photo is required")
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("📝 Form submission started")

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      console.log("❌ Validation errors:", validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log("💾 FormPreviewModal: Creating actor with", processedPhotos.length, "processed images")

      // Create actor data with all required fields
      const actorData = {
        id: `actor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        age: formData.age ? Number.parseInt(formData.age) : undefined,
        gender: formData.gender,
        ethnicity: formData.ethnicity,
        location: formData.location,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        agent: formData.agent,
        playingAge: formData.playingAge,
        skills: formData.skills,
        availability: formData.availability,
        experience: formData.experience,
        notes: formData.notes
          ? [
              {
                id: `note_${Date.now()}`,
                content: formData.notes,
                userId: "preview_user",
                userName: "Form Submission",
                timestamp: Date.now(),
                isPrivate: false,
              },
            ]
          : [],
        // Use processed images instead of previews
        headshots: processedPhotos.length > 0 ? processedPhotos : photoPreviews,
        submissionVideos: videos.map((video) => ({
          id: video.id,
          platform: video.platform,
          url: video.url,
          title: video.title,
          embedUrl:
            video.platform === "youtube"
              ? `https://www.youtube.com/embed/${extractVideoId(video.url)?.id}`
              : `https://player.vimeo.com/video/${extractVideoId(video.url)?.id}`,
        })),
        // Required fields for actor integration
        userVotes: {},
        statuses: [],
        consensusAction: null,
        isSoftRejected: false,
        isGreenlit: false,
        isCast: false,
        currentListKey: "longList",
        submissionId: `preview_submission_${Date.now()}`,
        submissionDate: Date.now(),
        submissionSource: "form_preview",
        createdAt: Date.now(),
      }

      console.log("✅ FormPreviewModal: Created actor data:", {
        name: actorData.name,
        headshotsCount: actorData.headshots.length,
        firstHeadshotType: actorData.headshots[0]?.substring(0, 20) + "...",
      })

      // Show success notification
      setShowSuccessNotification(true)

      // Auto-hide notification and complete submission after 2 seconds
      setTimeout(() => {
        setShowSuccessNotification(false)

        // Clean up preview URLs
        photoPreviews.forEach((url) => {
          if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url)
          }
        })

        onSubmissionComplete(actorData)
      }, 2000)
    } catch (error) {
      console.error("❌ Preview submission failed:", error)
      setErrors(["Failed to submit form. Please try again."])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Clean up preview URLs
    photoPreviews.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url)
      }
    })

    console.log("🔒 FormPreviewModal closing")
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10000] p-4"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview Badge */}
        <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          Preview Mode
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          type="button"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Success Notification */}
        {showSuccessNotification && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Successful Application!</h3>
              <p className="text-gray-600 mb-4">
                Preview submission completed successfully. The actor will be added to the {characterName} long list.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-800">
                  <strong>Preview Complete:</strong> This was a simulation. In the real form, the actor would be
                  automatically added to your casting list.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[95vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-blue-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{formSettings.title || `${characterName} Submission Form`}</h1>
            <p className="text-emerald-100">
              {formSettings.description || "Submit your information for casting consideration"}
            </p>
            {formSettings.deadline && (
              <div className="mt-4 bg-white/20 rounded-lg p-3">
                <p className="text-sm">
                  <strong>Deadline:</strong> {formSettings.deadline}
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Error Display */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">Please fix the following errors:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your full name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g. 25"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Playing Age</label>
                  <input
                    type="text"
                    value={formData.playingAge}
                    onChange={(e) => handleInputChange("playingAge", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g. 20-30"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <input
                    type="text"
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g. Male, Female, Non-binary"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
                  <input
                    type="text"
                    value={formData.ethnicity}
                    onChange={(e) => handleInputChange("ethnicity", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g. Caucasian, Hispanic, Asian"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g. Los Angeles, CA"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="your.email@example.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="(555) 123-4567"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent/Representative</label>
                  <input
                    type="text"
                    value={formData.agent}
                    onChange={(e) => handleInputChange("agent", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g. CAA, WME, or independent agent name"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            {formSettings.collectPhotos && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Photos <span className="text-red-500">*</span>
                </h2>

                <div
                  className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors ${
                    isSubmitting || isProcessingImages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-emerald-400 cursor-pointer"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload-preview"
                    disabled={isSubmitting || isProcessingImages}
                  />
                  <label
                    htmlFor="photo-upload-preview"
                    className={isSubmitting || isProcessingImages ? "cursor-not-allowed" : "cursor-pointer"}
                  >
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {isProcessingImages ? "Processing images..." : "Upload Your Photos"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Click to select headshots and other professional photos (PNG, JPG up to 10MB each)
                    </p>
                  </label>
                </div>

                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        {preview ? (
                          <img
                            src={preview}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-full h-32 rounded-lg border border-gray-200 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                            No image
                          </div>
                        )}
                        {!isSubmitting && !isProcessingImages && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {/* Processing indicator */}
                        {isProcessingImages && index >= processedPhotos.length && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                            <div className="text-white text-xs">Processing...</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Videos */}
            {formSettings.collectVideos && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Video Content (Optional)
                </h2>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Paste YouTube or Vimeo URL"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleAddVideo}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Video
                  </button>
                </div>

                {videos.length > 0 && (
                  <div className="space-y-4">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Video className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900">{video.title}</p>
                            <p className="text-sm text-gray-500 capitalize">{video.platform} video</p>
                          </div>
                        </div>
                        {!isSubmitting && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(video.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Skills */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Skills</h2>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Add a skill (e.g. Piano, Martial Arts, Dancing)"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                    >
                      {skill}
                      {!isSubmitting && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-emerald-600 hover:text-emerald-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Availability</h2>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newAvailability}
                  onChange={(e) => setNewAvailability(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAvailability())}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Add availability (e.g. Weekends, March 2024, Flexible)"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAddAvailability}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {formData.availability.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.availability.map((avail, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {avail}
                      {!isSubmitting && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAvailability(avail)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Additional Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience & Background</label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => handleInputChange("experience", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Tell us about your acting experience, training, notable roles, etc."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Any additional information you'd like to share..."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || isProcessingImages}
                className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Preview Submission...</span>
                  </>
                ) : isProcessingImages ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Images...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Submit Application (Preview)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
