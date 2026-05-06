"use client"

import type React from "react"

import { useCasting } from "@/components/casting/CastingContext"
import { useState, useEffect, useCallback } from "react"
import { X, Plus, Trash2, Camera, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { extractVideoId, getVideoPlatform } from "@/utils/videoUtils"
import VideoEmbed from "@/components/video/VideoEmbed"
import type { VideoEmbed as VideoEmbedType } from "@/types"
import { validateImageFile, processImage } from "@/utils/imageProcessing"
import VideoMarkerTimeline from "@/components/video/VideoMarkerTimeline"

interface AddActorModalProps {
  onClose: () => void
  characterId: string
}

export default function AddActorModal({ onClose, characterId }: AddActorModalProps) {
  const { state, dispatch } = useCasting()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    playingAge: "",
    location: "",
    agent: "",
    imdbUrl: "",
    gender: "",
    ethnicity: "",
    contactPhone: "",
    contactEmail: "",
    skills: [] as string[],
    availability: [] as string[],
    mediaMaterials: [] as Array<{ name: string; url: string; taggedActorNames: string[] }>,
    showreels: [] as Array<{ name: string; url: string; taggedActorNames: string[] }>,
    auditionTapes: [] as Array<{ name: string; url: string; taggedActorNames: string[] }>,
    vimeoVideos: [] as Array<VideoEmbedType & { videoPassword?: string }>, // Added videoPassword
    // New optional fields
    language: "",
    height: "",
    bodyType: "",
    shoeSize: "",
    hairColor: "",
    eyeColor: "",
    nakednessLevel: "",
    pastProductions: [] as string[],
    salaryEstimate: "", // Added salaryEstimate
  })

  const [newSkill, setNewSkill] = useState("")
  const [newAvailability, setNewAvailability] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [headshots, setHeadshots] = useState<File[]>([])
  const [headshotPreviews, setHeadshotPreviews] = useState<string[]>([])
  const [processedHeadshots, setProcessedHeadshots] = useState<string[]>([]) // Store processed images
  const [newVimeoUrl, setNewVimeoUrl] = useState("")
  const [vimeoError, setVimeoError] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [currentVideoTags, setCurrentVideoTags] = useState<Record<string, string>>({}) // videoId -> current tag input
  const [showTaggingFor, setShowTaggingFor] = useState<string | null>(null) // which video is being tagged
  const [currentVideoTitles, setCurrentVideoTitles] = useState<Record<string, string>>({}) // videoId -> current title input
  const [editingVideoTitle, setEditingVideoTitle] = useState<string | null>(null) // which video title is being edited
  const [isProcessingImages, setIsProcessingImages] = useState(false)
  const [visibleOptionalFields, setVisibleOptionalFields] = useState<Set<string>>(new Set())
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null)
  const [newPastProduction, setNewPastProduction] = useState("")

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)

  // Memoize onClose to prevent unnecessary effects
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // Handle missing character with useEffect to avoid state update during render
  useEffect(() => {
    if (!currentCharacter) {
      handleClose()
    }
  }, [currentCharacter, handleClose])

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (showContextMenu && !(event.target as Element).closest(".relative")) {
        setShowContextMenu(null)
      }
    },
    [showContextMenu],
  )

  // Add useEffect to handle clicking outside context menu
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [handleClickOutside])

  if (!currentCharacter) {
    return null
  }

  const steps = [
    {
      number: 1,
      title: "Basic Information",
      description: `${state.terminology.actor.singular} details and contact info`,
    },
    { number: 2, title: "Casting Details", description: "Status, skills, and availability" },
    { number: 3, title: "Media & Materials", description: "Headshots and video content" },
  ]

  const validateStep = (step: number): string[] => {
    const errors: string[] = []

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          errors.push(`${state.terminology.actor.singular} name is required`)
        }
        if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
          errors.push("Please enter a valid email address")
        }
        if (formData.imdbUrl && !formData.imdbUrl.includes("imdb.com")) {
          errors.push("Please enter a valid IMDb URL")
        }
        break
      case 2:
        // No required fields in step 2
        break
      case 3:
        // Check if all videos are tagged
        const untaggedVideos = formData.vimeoVideos.filter((video) => !video.isTagged)
        if (untaggedVideos.length > 0) {
          errors.push(
            `${untaggedVideos.length} video(s) need to be tagged with ${state.terminology.actor.plural.toLowerCase()} before proceeding`,
          )
        }
        break
    }

    return errors
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const handleNextStep = () => {
    const errors = validateStep(currentStep)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors([])
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    setValidationErrors([])
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
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

  const handleRemoveAvailability = (availabilityToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.filter((avail) => avail !== availabilityToRemove),
    }))
  }

  const handleStatusToggle = (statusId: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusId) ? prev.filter((id) => id !== statusId) : [...prev, statusId],
    )
  }

  const handleHeadshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    console.log("📸 AddActorModal: Processing", files.length, "image files")
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
      setHeadshots((prev) => [...prev, ...validFiles])
      setHeadshotPreviews((prev) => [...prev, ...newPreviews])
      setProcessedHeadshots((prev) => [...prev, ...newProcessedImages])

      console.log("✅ AddActorModal: Added", validFiles.length, "images")
    } catch (error) {
      console.error("❌ Error processing images:", error)
      setValidationErrors(["Failed to process some images. Please try again."])
    } finally {
      setIsProcessingImages(false)
    }
  }

  const handleRemoveHeadshot = (index: number) => {
    // Clean up preview URL to prevent memory leaks
    const previewUrl = headshotPreviews[index]
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }

    setHeadshots((prev) => prev.filter((_, i) => i !== index))
    setHeadshotPreviews((prev) => prev.filter((_, i) => i !== index))
    setProcessedHeadshots((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddVideo = () => {
    if (!newVimeoUrl.trim()) {
      setVimeoError("Please enter a Vimeo URL or video ID")
      return
    }

    const videoId = extractVideoId(newVimeoUrl)
    const platform = getVideoPlatform(newVimeoUrl)

    if (!videoId || !platform) {
      setVimeoError("Could not extract video ID from URL")
      return
    }

    const newVideo: VideoEmbedType & { videoPassword?: string } = {
      id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: newVimeoUrl,
      videoId: videoId,
      platform: platform,
      title: `Video ${formData.vimeoVideos.length + 1}`, // Default title that can be customized
      taggedActorNames: [],
      isTagged: false,
    }

    setFormData((prev) => ({
      ...prev,
      vimeoVideos: [...prev.vimeoVideos, newVideo],
    }))

    setNewVimeoUrl("")
    setVimeoError("")
    // Automatically show tagging interface for the new video
    setShowTaggingFor(newVideo.id)
  }

  const handleRemoveVimeoVideo = (videoId: string) => {
    setFormData((prev) => ({
      ...prev,
      vimeoVideos: prev.vimeoVideos.filter((video) => video.id !== videoId),
    }))
  }

  const handleAddActorTag = (videoId: string) => {
    const tagInput = currentVideoTags[videoId]
    if (!tagInput?.trim()) return

    setFormData((prev) => ({
      ...prev,
      vimeoVideos: prev.vimeoVideos.map((video) =>
        video.id === videoId
          ? {
              ...video,
              taggedActorNames: [...video.taggedActorNames, tagInput.trim()],
              isTagged: true,
            }
          : video,
      ),
    }))

    setCurrentVideoTags((prev) => ({ ...prev, [videoId]: "" }))
  }

  const handleRemoveActorTag = (videoId: string, tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      vimeoVideos: prev.vimeoVideos.map((video) =>
        video.id === videoId
          ? {
              ...video,
              taggedActorNames: video.taggedActorNames.filter((tag) => tag !== tagToRemove),
              isTagged: video.taggedActorNames.filter((tag) => tag !== tagToRemove).length > 0,
            }
          : video,
      ),
    }))
  }

  const handleFinishTagging = (videoId: string) => {
    const video = formData.vimeoVideos.find((v) => v.id === videoId)
    if (video && video.taggedActorNames.length > 0) {
      setShowTaggingFor(null)
    }
  }

  const handleUpdateVideoTitle = (videoId: string) => {
    const newTitle = currentVideoTitles[videoId]?.trim()
    if (!newTitle) return

    setFormData((prev) => ({
      ...prev,
      vimeoVideos: prev.vimeoVideos.map((video) => (video.id === videoId ? { ...video, title: newTitle } : video)),
    }))

    setEditingVideoTitle(null)
    setCurrentVideoTitles((prev) => ({ ...prev, [videoId]: "" }))
  }

  const optionalFields = [
    { key: "imdbUrl", label: "IMDB URL", type: "url", placeholder: "https://www.imdb.com/name/..." },
    { key: "language", label: "Language", type: "text", placeholder: "e.g. English, Spanish, French" },
    { key: "height", label: "Height", type: "text", placeholder: "e.g. 5'8\", 173cm" },
    { key: "bodyType", label: "Body Type", type: "text", placeholder: "e.g. Athletic, Slim, Average" },
    { key: "shoeSize", label: "Shoe Size", type: "text", placeholder: "e.g. US 9, EU 42" },
    { key: "hairColor", label: "Hair Color", type: "text", placeholder: "e.g. Brown, Blonde, Black" },
    { key: "eyeColor", label: "Eye Color", type: "text", placeholder: "e.g. Blue, Brown, Green" },
    {
      key: "nakednessLevel",
      label: "Nakedness Level",
      type: "select",
      options: ["No nudity", "Partial nudity", "Full nudity", "Simulated intimacy"],
    },
    { key: "pastProductions", label: "Past Productions", type: "array", placeholder: "Add production name" },
    { key: "salaryEstimate", label: "Salary Estimate", type: "text", placeholder: "e.g. $50,000 - $75,000" },
  ]

  const handleAddOptionalField = (fieldKey: string) => {
    setVisibleOptionalFields((prev) => new Set([...prev, fieldKey]))
    setShowContextMenu(null)
  }

  const handleRemoveOptionalField = (fieldKey: string) => {
    setVisibleOptionalFields((prev) => {
      const newSet = new Set(prev)
      newSet.delete(fieldKey)
      return newSet
    })
    // Clear the field value
    if (fieldKey === "pastProductions") {
      setFormData((prev) => ({ ...prev, [fieldKey]: [] }))
    } else {
      setFormData((prev) => ({ ...prev, [fieldKey]: "" }))
    }
  }

  const handleAddPastProduction = () => {
    if (newPastProduction.trim() && !formData.pastProductions.includes(newPastProduction.trim())) {
      setFormData((prev) => ({
        ...prev,
        pastProductions: [...prev.pastProductions, newPastProduction.trim()],
      }))
      setNewPastProduction("")
    }
  }

  const handleRemovePastProduction = (productionToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      pastProductions: prev.pastProductions.filter((prod) => prod !== productionToRemove),
    }))
  }

  const handleSave = () => {
    const errors = validateStep(3)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    console.log("💾 AddActorModal: Saving actor with", processedHeadshots.length, "processed images")

    const newActor = {
      id: `actor_${Date.now()}`,
      name: formData.name,
      age: formData.age,
      playingAge: formData.playingAge,
      location: formData.location,
      agent: formData.agent,
      imdbUrl: formData.imdbUrl,
      gender: formData.gender,
      ethnicity: formData.ethnicity,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      skills: formData.skills,
      availability: formData.availability,
      // Use processed images instead of previews
      headshots: processedHeadshots.length > 0 ? processedHeadshots : headshotPreviews,
      mediaMaterials: formData.mediaMaterials,
      showreels: formData.showreels,
      auditionTapes: formData.auditionTapes,
      vimeoVideos: formData.vimeoVideos,
      statuses: state.predefinedStatuses.filter((status) => selectedStatuses.includes(status.id)),
      userVotes: {},
      notes: [],
      currentListKey: "longList",
      dateAdded: Date.now(),
      sortOrder: 0,
      // New optional fields
      language: formData.language,
      height: formData.height,
      bodyType: formData.bodyType,
      shoeSize: formData.shoeSize,
      hairColor: formData.hairColor,
      eyeColor: formData.eyeColor,
      nakednessLevel: formData.nakednessLevel,
      pastProductions: formData.pastProductions,
      salaryEstimate: formData.salaryEstimate, // Added salaryEstimate
    }

    console.log("✅ AddActorModal: Created actor data:", {
      name: newActor.name,
      headshotsCount: newActor.headshots.length,
      firstHeadshotType: newActor.headshots[0]?.substring(0, 20) + "...",
    })

    dispatch({
      type: "ADD_ACTOR",
      payload: {
        characterId,
        actor: newActor,
      },
    })

    // Clean up preview URLs
    headshotPreviews.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url)
      }
    })

    handleClose()
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Core Actor Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Core Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Actor Name - Required, not deletable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {state.terminology.actor.singular} Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* Age - Required, not deletable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 25"
                  />
                </div>

                {/* Gender - Required, not deletable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Contact Phone - Required, not deletable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Contact Email - Required, not deletable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="actor@example.com"
                  />
                </div>
              </div>

              {/* Deletable Core Fields Section */}
              {(visibleOptionalFields.has("playingAge") ||
                visibleOptionalFields.has("ethnicity") ||
                visibleOptionalFields.has("location") ||
                visibleOptionalFields.has("agent")) && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Additional Core Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Playing Age - Deletable */}
                    {visibleOptionalFields.has("playingAge") && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">Playing Age</label>
                          <button
                            onClick={() => handleRemoveOptionalField("playingAge")}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                            title="Remove field"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.playingAge}
                          onChange={(e) => handleInputChange("playingAge", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. 20-30"
                        />
                      </div>
                    )}

                    {/* Ethnicity - Deletable */}
                    {visibleOptionalFields.has("ethnicity") && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">Ethnicity</label>
                          <button
                            onClick={() => handleRemoveOptionalField("ethnicity")}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                            title="Remove field"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.ethnicity}
                          onChange={(e) => handleInputChange("ethnicity", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. Caucasian, Hispanic, Asian"
                        />
                      </div>
                    )}

                    {/* Location - Deletable */}
                    {visibleOptionalFields.has("location") && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">Location</label>
                          <button
                            onClick={() => handleRemoveOptionalField("location")}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                            title="Remove field"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. Los Angeles, CA"
                        />
                      </div>
                    )}

                    {/* Agent/Representative - Deletable */}
                    {visibleOptionalFields.has("agent") && (
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">Agent/Representative</label>
                          <button
                            onClick={() => handleRemoveOptionalField("agent")}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                            title="Remove field"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.agent}
                          onChange={(e) => handleInputChange("agent", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. CAA, WME, or agent name"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add Additional Fields Button */}
              <div className="mt-6 flex justify-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowContextMenu(showContextMenu === "addFields" ? null : "addFields")}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-emerald-300 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    title="Add additional fields"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Additional Fields
                  </button>

                  {showContextMenu === "addFields" && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                          Additional Information
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {[
                            { key: "playingAge", label: "Playing Age" },
                            { key: "ethnicity", label: "Ethnicity" },
                            { key: "location", label: "Location" },
                            { key: "agent", label: "Agent/Representative" },
                            ...optionalFields,
                          ]
                            .filter((field) => !visibleOptionalFields.has(field.key))
                            .map((field) => (
                              <button
                                key={field.key}
                                onClick={() => handleAddOptionalField(field.key)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center"
                              >
                                <Plus className="w-3 h-3 mr-2 text-emerald-500" />
                                {field.label}
                              </button>
                            ))}
                          {[
                            { key: "playingAge", label: "Playing Age" },
                            { key: "ethnicity", label: "Ethnicity" },
                            { key: "location", label: "Location" },
                            { key: "agent", label: "Agent/Representative" },
                            ...optionalFields,
                          ].filter((field) => !visibleOptionalFields.has(field.key)).length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              All additional fields have been added
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Fields Section */}
            {visibleOptionalFields.size > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
                  <span className="text-sm text-gray-500">
                    {visibleOptionalFields.size} field{visibleOptionalFields.size !== 1 ? "s" : ""} added
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from(visibleOptionalFields).map((fieldKey) => {
                    const field = optionalFields.find((f) => f.key === fieldKey)
                    if (!field) return null

                    if (field.type === "array" && fieldKey === "pastProductions") {
                      return (
                        <div key={fieldKey} className="md:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                            <button
                              onClick={() => handleRemoveOptionalField(fieldKey)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                              title="Remove field"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={newPastProduction}
                                onChange={(e) => setNewPastProduction(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleAddPastProduction()}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder={field.placeholder}
                              />
                              <button
                                onClick={handleAddPastProduction}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            {formData.pastProductions.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {formData.pastProductions.map((production, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                  >
                                    {production}
                                    <button
                                      onClick={() => handleRemovePastProduction(production)}
                                      className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={fieldKey}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                          <button
                            onClick={() => handleRemoveOptionalField(fieldKey)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                            title="Remove field"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {field.type === "select" ? (
                          <select
                            value={formData[fieldKey as keyof typeof formData] as string}
                            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">Select {field.label.toLowerCase()}</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={formData[fieldKey as keyof typeof formData] as string}
                            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {state.predefinedStatuses.map((status) => (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => handleStatusToggle(status.id)}
                    className={`p-3 text-sm rounded-md border transition-all duration-200 flex items-center justify-center min-h-[44px] ${
                      selectedStatuses.includes(status.id)
                        ? `${status.bgColor} ${status.textColor} border-current shadow-sm`
                        : `bg-white ${status.textColor} border-gray-300 hover:${status.bgColor} hover:border-current`
                    }`}
                  >
                    <span className="font-medium">{status.label}</span>
                  </button>
                ))}
              </div>
              {selectedStatuses.length > 0 && (
                <div className="mt-3 p-2 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-600 mb-2">Selected statuses:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedStatuses.map((statusId) => {
                      const status = state.predefinedStatuses.find((s) => s.id === statusId)
                      if (!status) return null
                      return (
                        <span
                          key={statusId}
                          className={`inline-flex items-center px-2 py-1 text-xs rounded ${status.bgColor} ${status.textColor}`}
                        >
                          {status.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Add a skill (e.g. Piano, Martial Arts)"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newAvailability}
                  onChange={(e) => setNewAvailability(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddAvailability()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Add availability (e.g. Weekends, March 2024)"
                />
                <button
                  onClick={handleAddAvailability}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.availability.map((avail, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {avail}
                    <button
                      onClick={() => handleRemoveAvailability(avail)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {/* Headshots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Headshots</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleHeadshotUpload}
                  className="hidden"
                  id="headshot-upload"
                  disabled={isProcessingImages}
                />
                <label htmlFor="headshot-upload" className="cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {isProcessingImages ? "Processing images..." : "Click to upload headshots"}
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 10MB each</p>
                </label>
              </div>
              {headshotPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {headshotPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      {preview ? (
                        <img
                          src={preview}
                          alt={`Headshot ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                          No image
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveHeadshot(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        disabled={isProcessingImages}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* Processing indicator */}
                      {isProcessingImages && index >= processedHeadshots.length && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <div className="text-white text-xs">Processing...</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video Content</label>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newVimeoUrl}
                  onChange={(e) => {
                    setNewVimeoUrl(e.target.value)
                    setVimeoError("")
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Paste Vimeo or YouTube URL"
                />
                <button
                  onClick={handleAddVideo}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
                >
                  Add Video
                </button>
              </div>
              {vimeoError && <p className="text-red-500 text-sm mb-2">{vimeoError}</p>}

              {/* Video List */}
              <div className="space-y-4">
                {formData.vimeoVideos.map((video) => (
                  <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex justify-between items-start p-4 bg-gray-50">
                      <div className="flex-1">
                        {editingVideoTitle === video.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={currentVideoTitles[video.id] || video.title}
                              onChange={(e) =>
                                setCurrentVideoTitles((prev) => ({ ...prev, [video.id]: e.target.value }))
                              }
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              onKeyPress={(e) => e.key === "Enter" && handleUpdateVideoTitle(video.id)}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateVideoTitle(video.id)}
                              className="text-emerald-600 hover:text-emerald-800"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <h4
                              className="font-medium text-gray-900 cursor-pointer hover:text-emerald-600"
                              onClick={() => {
                                setEditingVideoTitle(video.id)
                                setCurrentVideoTitles((prev) => ({ ...prev, [video.id]: video.title }))
                              }}
                            >
                              {video.title}
                            </h4>
                            <button
                              onClick={() => {
                                setEditingVideoTitle(video.id)
                                setCurrentVideoTitles((prev) => ({ ...prev, [video.id]: video.title }))
                              }}
                              className="text-gray-400 hover:text-gray-600"
                              title="Edit video title"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          {video.platform} • {video.videoId}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveVimeoVideo(video.id)}
                        className="text-red-500 hover:text-red-700 ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Enhanced Video Preview */}
                    <div className="bg-white">
                      <VideoEmbed
                        url={video.url}
                        title={video.title}
                        autoplay={false}
                        loop={false}
                        controls={true}
                        muted={true}
                        thumbnailOnly={false}
                        className="w-full"
                        markIn={video.markIn}
                        markOut={video.markOut}
                        onError={(error) => console.warn("Video preview error:", error)}
                      />
                    </div>

                    {/* Video Timeline */}
                    <div className="p-4 bg-gray-50 border-t">
                      <VideoMarkerTimeline
                        videoId={video.videoId}
                        duration={video.duration || 300}
                        markIn={video.markIn}
                        markOut={video.markOut}
                        onMarkersChange={(markIn, markOut) => {
                          setFormData((prev) => ({
                            ...prev,
                            vimeoVideos: prev.vimeoVideos.map((v) =>
                              v.id === video.id ? { ...v, markIn, markOut } : v,
                            ),
                          }))
                        }}
                        className="mb-3"
                      />

                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Password (optional)
                        </label>
                        <input
                          type="text"
                          value={video.videoPassword || ""}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              vimeoVideos: prev.vimeoVideos.map((v) =>
                                v.id === video.id ? { ...v, videoPassword: e.target.value } : v,
                              ),
                            }))
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          placeholder="Enter password for password-protected video"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          If this video is password-protected, add the password here so viewers can access it easily
                        </p>
                      </div>

                      {/* Actor Tags Display */}
                      {video.taggedActorNames && video.taggedActorNames.length > 0 && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tagged Actors:</label>
                          <div className="flex flex-wrap gap-1">
                            {video.taggedActorNames.map((actorName, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800"
                              >
                                {actorName}
                                <button
                                  onClick={() => handleRemoveActorTag(video.id, actorName)}
                                  className="ml-1 text-emerald-600 hover:text-emerald-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tagging Interface */}
                      {showTaggingFor === video.id ? (
                        <div className="space-y-3 p-3 bg-white rounded-md border">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-700">Tag actors in this video:</label>
                            <button
                              onClick={() => handleFinishTagging(video.id)}
                              disabled={!video.taggedActorNames || video.taggedActorNames.length === 0}
                              className={`text-xs px-2 py-1 rounded ${
                                video.taggedActorNames && video.taggedActorNames.length > 0
                                  ? "text-emerald-600 hover:text-emerald-800 cursor-pointer"
                                  : "text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              Done Tagging
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={currentVideoTags[video.id] || ""}
                              onChange={(e) => setCurrentVideoTags((prev) => ({ ...prev, [video.id]: e.target.value }))}
                              onKeyPress={(e) => e.key === "Enter" && handleAddActorTag(video.id)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="Enter actor name and press Enter"
                            />
                            <button
                              onClick={() => handleAddActorTag(video.id)}
                              disabled={!currentVideoTags[video.id]?.trim()}
                              className={`px-3 py-1 text-sm rounded ${
                                currentVideoTags[video.id]?.trim()
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Add all actors that appear in this video. You must tag at least one actor.
                          </p>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          {!video.isTagged && (
                            <p className="text-xs text-orange-600 font-medium">
                              This video needs to be tagged before it can be saved.
                            </p>
                          )}
                          <button
                            onClick={() => setShowTaggingFor(video.id)}
                            className={`text-xs px-3 py-1 rounded border ${
                              video.isTagged
                                ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                : "border-orange-200 text-orange-700 hover:bg-orange-50"
                            }`}
                          >
                            {video.isTagged ? "Edit Tags" : "Tag Actors"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h2 className="text-xl font-bold">Add New {state.terminology.actor.singular}</h2>
          <p className="text-sm text-gray-600">to {currentCharacter.name}</p>
        </div>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.number ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {step.number}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${currentStep >= step.number ? "text-emerald-600" : "text-gray-500"}`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-400">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-px mx-4 ${currentStep > step.number ? "bg-emerald-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-600">
            <p className="font-medium mb-1">Please fix the following errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">{renderStepContent()}</div>

      {/* Footer */}
      <div className="flex justify-between items-center p-6 border-t bg-gray-50">
        <button
          onClick={handlePreviousStep}
          disabled={currentStep === 1}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            currentStep === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex space-x-2">
          <button onClick={handleClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          {currentStep < 3 ? (
            <button
              onClick={handleNextStep}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isProcessingImages}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingImages ? "Processing..." : `Add ${state.terminology.actor.singular}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
