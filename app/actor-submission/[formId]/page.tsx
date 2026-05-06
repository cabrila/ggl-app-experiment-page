"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Camera, Upload, X, Plus, Check, AlertCircle, Video } from "lucide-react"
import { submissionProcessor, type SubmissionData } from "@/utils/submissionProcessor"

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

export default function ActorSubmissionForm() {
  const params = useParams()
  const searchParams = useSearchParams()
  const formId = params.formId as string
  const characterId = searchParams.get("character")
  const projectId = searchParams.get("project")

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
  const [videos, setVideos] = useState<VideoSubmission[]>([])
  const [newVideoUrl, setNewVideoUrl] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [newAvailability, setNewAvailability] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [processingStatus, setProcessingStatus] = useState<string>("")

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/")
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    setPhotos((prev) => [...prev, ...validFiles])

    // Create preview URLs
    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const extractVideoId = (url: string): { platform: "youtube" | "vimeo"; id: string } | null => {
    // YouTube patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ]

    // Vimeo patterns
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

    if (photos.length === 0) {
      newErrors.push("At least one photo is required")
    }

    if (!characterId || !projectId) {
      newErrors.push("Invalid form configuration - missing character or project information")
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setProcessingStatus("Submitting your information...")

    try {
      // Create submission data
      const submissionData: SubmissionData = {
        formId,
        characterId: characterId!,
        projectId: projectId!,
        submissionId: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        formData,
        photos: photos.map((file, index) => ({
          id: `photo_${index}_${Date.now()}`,
          file,
          preview: photoPreviews[index],
          processed: false,
        })),
        videos: videos.map((video) => ({
          id: video.id,
          platform: video.platform,
          url: video.url,
          title: video.title,
        })),
      }

      console.log("📤 ActorSubmissionForm: Submitting data:", submissionData)

      // Process the submission
      setProcessingStatus("Processing your photos and videos...")
      submissionProcessor.addSubmission(submissionData)

      // Wait a moment for processing to start
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setProcessingStatus("Adding you to the casting list...")
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSubmitted(true)
      setProcessingStatus("")
    } catch (error) {
      console.error("❌ ActorSubmissionForm: Submission failed:", error)
      setErrors(["Failed to submit form. Please try again."])
      setProcessingStatus("")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Submission Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your submission. Your information has been automatically added to the casting list and our
            team will review it shortly.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-emerald-800">
              <strong>Automatic Processing:</strong> Your photos and videos have been processed and you've been added to
              the character's casting list.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>What's next?</strong> Our casting team will review your submission and contact you if you're
              selected for the next stage.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-blue-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Actor Submission Form</h1>
            <p className="text-emerald-100">Submit your information for casting consideration</p>
            {processingStatus && (
              <div className="mt-4 bg-white/20 rounded-lg p-3 flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{processingStatus}</span>
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
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Photos <span className="text-red-500">*</span>
              </h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Upload Your Photos</p>
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
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Videos */}
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
                />
                <button
                  type="button"
                  onClick={handleAddVideo}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
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
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(video.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
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
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-emerald-600 hover:text-emerald-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
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
                />
                <button
                  type="button"
                  onClick={handleAddAvailability}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
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
                      <button
                        type="button"
                        onClick={() => handleRemoveAvailability(avail)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
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
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Submit Application</span>
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
