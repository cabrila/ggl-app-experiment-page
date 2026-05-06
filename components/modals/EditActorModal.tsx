"use client"

import type React from "react"

import { useCasting } from "@/components/casting/CastingContext"
import { useState, useEffect } from "react"
import { X, Upload, Plus, Trash2, Camera, Check } from 'lucide-react'
import VideoMarkerTimeline from "@/components/video/VideoMarkerTimeline"
import VideoEmbed from "@/components/video/VideoEmbed"
import { parseVideoUrl, type VideoEmbed as VideoEmbedType } from "@/utils/videoUtils"
import type { Actor } from "@/types"
import AvailabilityCalendarPicker from "@/components/ui/AvailabilityCalendarPicker"
import type { AvailabilityDate } from "@/types/schedule"

interface EditActorModalProps {
  onClose: () => void
  actor: Actor
  characterId: string
}

export default function EditActorModal({ onClose, actor, characterId }: EditActorModalProps) {
  const { state, dispatch } = useCasting()

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)

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
    availabilityDates: [] as AvailabilityDate[],
    mediaMaterials: [] as Array<{ name: string; url: string; taggedActorNames: string[] }>,
    showreels: [] as Array<{ name: string; url: string; taggedActorNames: string[] }>,
    auditionTapes: [] as Array<{ name: string; url: string; taggedActorNames: string[] }>,
    vimeoVideos: [] as VideoEmbedType[],
    // New optional fields
    language: "",
    height: "",
    bodyType: "",
    shoeSize: "",
    hairColor: "",
    eyeColor: "",
    nakednessLevel: "",
    pastProductions: [] as string[],
    salaryEstimate: "",
  })

  const [newSkill, setNewSkill] = useState("")
  const [newAvailability, setNewAvailability] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [headshots, setHeadshots] = useState<File[]>([])
  const [headshotPreviews, setHeadshotPreviews] = useState<string[]>([])
  const [newVimeoUrl, setNewVimeoUrl] = useState("")
  const [vimeoError, setVimeoError] = useState("")
  const [currentVideoTags, setCurrentVideoTags] = useState<Record<string, string>>({}) // videoId -> current tag input
  const [showTaggingFor, setShowTaggingFor] = useState<string | null>(null) // which video is being tagged
  const [currentVideoTitles, setCurrentVideoTitles] = useState<Record<string, string>>({}) // videoId -> current title input
  const [editingVideoTitle, setEditingVideoTitle] = useState<string | null>(null) // which video title is being edited
  const [visibleOptionalFields, setVisibleOptionalFields] = useState<Set<string>>(new Set())
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null)
  const [newPastProduction, setNewPastProduction] = useState("")

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

  useEffect(() => {
    if (actor) {
      setFormData({
        name: actor.name || "",
        age: actor.age || "",
        playingAge: actor.playingAge || "",
        location: actor.location || "",
        agent: actor.agent || "",
        imdbUrl: actor.imdbUrl || "",
        gender: actor.gender || "",
        ethnicity: actor.ethnicity || "",
        contactPhone: actor.contactPhone || "",
        contactEmail: actor.contactEmail || "",
        skills: actor.skills || [],
        availability: actor.availability || [],
        availabilityDates: actor.availabilityDates || [],
        mediaMaterials: actor.mediaMaterials || [],
        showreels: actor.showreels || [],
        auditionTapes: actor.auditionTapes || [],
        vimeoVideos: (actor.vimeoVideos || []).map((video) => ({
          ...video,
          taggedActorNames: video.taggedActorNames || [],
          isTagged: (video.taggedActorNames && video.taggedActorNames.length > 0) || false,
        })),
        // New optional fields
        language: actor.language || "",
        height: actor.height || "",
        bodyType: actor.bodyType || "",
        shoeSize: actor.shoeSize || "",
        hairColor: actor.hairColor || "",
        eyeColor: actor.eyeColor || "",
        nakednessLevel: actor.nakednessLevel || "",
        pastProductions: actor.pastProductions || [],
        salaryEstimate: actor.salaryEstimate || "",
      })
      setSelectedStatuses(actor.statuses?.map((s) => s.id) || [])
      setHeadshotPreviews(actor.headshots || [])

      // Determine which optional fields should be visible based on existing data
      const fieldsToShow = new Set<string>()
      if (actor.playingAge) fieldsToShow.add("playingAge")
      if (actor.ethnicity) fieldsToShow.add("ethnicity")
      if (actor.location) fieldsToShow.add("location")
      if (actor.agent) fieldsToShow.add("agent")
      if (actor.imdbUrl) fieldsToShow.add("imdbUrl")
      if (actor.language) fieldsToShow.add("language")
      if (actor.height) fieldsToShow.add("height")
      if (actor.bodyType) fieldsToShow.add("bodyType")
      if (actor.shoeSize) fieldsToShow.add("shoeSize")
      if (actor.hairColor) fieldsToShow.add("hairColor")
      if (actor.eyeColor) fieldsToShow.add("eyeColor")
      if (actor.nakednessLevel) fieldsToShow.add("nakednessLevel")
      if (actor.pastProductions && actor.pastProductions.length > 0) fieldsToShow.add("pastProductions")
      if (actor.salaryEstimate) fieldsToShow.add("salaryEstimate")

      setVisibleOptionalFields(fieldsToShow)
    }
  }, [actor])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContextMenu && !(event.target as Element).closest(".relative")) {
        setShowContextMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showContextMenu])

  useEffect(() => {
    if (!actor || !currentCharacter) {
      onClose()
    }
  }, [actor, currentCharacter, onClose])

  if (!actor || !currentCharacter) {
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

  const handleHeadshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setHeadshots((prev) => [...prev, ...files])

    // Create preview URLs
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setHeadshotPreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveHeadshot = (index: number) => {
    setHeadshots((prev) => prev.filter((_, i) => i !== index))
    setHeadshotPreviews((prev) => prev.filter((_, i) => i !== index))
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
              taggedActorNames: [...(video.taggedActorNames || []), tagInput.trim()],
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
              taggedActorNames: (video.taggedActorNames || []).filter((tag) => tag !== tagToRemove),
              isTagged: (video.taggedActorNames || []).filter((tag) => tag !== tagToRemove).length > 0,
            }
          : video,
      ),
    }))
  }

  const handleFinishTagging = (videoId: string) => {
    const video = formData.vimeoVideos.find((v) => v.id === videoId)
    if (video && video.taggedActorNames && video.taggedActorNames.length > 0) {
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
  }

  const handleAddVideo = () => {
    if (!newVimeoUrl.trim()) {
      setVimeoError("Please enter a video URL")
      return
    }

    const videoData = parseVideoUrl(newVimeoUrl)
    if (!videoData) {
      setVimeoError("Please enter a valid Vimeo or YouTube URL")
      return
    }

    const newVideo = {
      id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: newVimeoUrl,
      videoId: videoData.videoId,
      platform: videoData.platform,
      title: `Video ${formData.vimeoVideos.length + 1}`,
      taggedActorNames: [],
      isTagged: false,
    }

    setFormData((prev) => ({
      ...prev,
      vimeoVideos: [...prev.vimeoVideos, newVideo],
    }))

    setNewVimeoUrl("")
    setVimeoError("")
    setShowTaggingFor(newVideo.id)
  }

  const handleRemoveVimeoVideo = (videoId: string) => {
    setFormData((prev) => ({
      ...prev,
      vimeoVideos: prev.vimeoVideos.filter((video) => video.id !== videoId),
    }))
  }

  const handleAddMediaMaterial = (type: "mediaMaterials" | "showreels" | "auditionTapes") => {
    const name = prompt(`Enter name for ${type === "mediaMaterials" ? "media material" : type.slice(0, -1)}:`)
    const url = prompt("Enter URL:")

    if (name && url) {
      setFormData((prev) => ({
        ...prev,
        [type]: [...prev[type], { name, url, taggedActorNames: [] }],
      }))
    }
  }

  const handleRemoveMediaMaterial = (type: "mediaMaterials" | "showreels" | "auditionTapes", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Please enter the actor's name")
      return
    }

    // Check if all videos are tagged
    const untaggedVideos = formData.vimeoVideos.filter((video) => !video.isTagged && !video.taggedActorNames?.length)
    if (untaggedVideos.length > 0) {
      alert(`${untaggedVideos.length} video(s) need to be tagged with actors before saving`)
      return
    }

    const selectedStatusObjects = state.predefinedStatuses.filter((status) => selectedStatuses.includes(status.id))

    const updates = {
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
      availabilityDates: formData.availabilityDates,
      headshots: headshotPreviews,
      statuses: selectedStatusObjects,
      mediaMaterials: formData.mediaMaterials,
      showreels: formData.showreels,
      auditionTapes: formData.auditionTapes,
      vimeoVideos: formData.vimeoVideos,
      // New optional fields
      language: formData.language,
      height: formData.height,
      bodyType: formData.bodyType,
      shoeSize: formData.shoeSize,
      hairColor: formData.hairColor,
      eyeColor: formData.eyeColor,
      nakednessLevel: formData.nakednessLevel,
      pastProductions: formData.pastProductions,
      salaryEstimate: formData.salaryEstimate,
    }

    dispatch({
      type: "UPDATE_ACTOR",
      payload: {
        actorId: actor.id,
        characterId: characterId,
        updates,
      },
    })

    onClose()
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-2xl font-bold">Edit Actor - {actor.name}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Core Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Actor Name - Required, not deletable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter actor's name"
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
                  placeholder="e.g., 25"
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
                  placeholder="actor@email.com"
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
                        placeholder="e.g., 20-30"
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
                        placeholder="e.g., Caucasian, Hispanic, etc."
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
                        placeholder="e.g., Los Angeles, CA"
                      />
                    </div>
                  )}

                  {/* Agent - Deletable */}
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

        {/* Photo Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Headshots</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="headshot-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">Upload additional headshots</span>
                  <span className="mt-1 block text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</span>
                </label>
                <input
                  id="headshot-upload"
                  name="headshot-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  onChange={handleHeadshotUpload}
                />
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => document.getElementById("headshot-upload")?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add More Photos
                </button>
              </div>
            </div>

            {/* Photo Previews */}
            {headshotPreviews.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Current Photos ({headshotPreviews.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {headshotPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      {preview ? (
                        <img
                          src={preview}
                          alt={`Headshot ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-full h-24 rounded-lg border border-gray-200 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                          No image
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveHeadshot(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Videos Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Videos</label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newVimeoUrl}
                onChange={(e) => {
                  setNewVimeoUrl(e.target.value)
                  setVimeoError("")
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter Vimeo or YouTube URL (e.g., https://vimeo.com/123456789 or https://youtube.com/watch?v=abc123)"
              />
              <button
                onClick={handleAddVideo}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {vimeoError && <p className="text-sm text-red-600">{vimeoError}</p>}

            {formData.vimeoVideos.length > 0 && (
              <div className="space-y-4">
                {formData.vimeoVideos.map((video, index) => (
                  <div
                    key={video.id}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      video.isTagged ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <div className="flex items-start justify-between p-4 bg-white border-b">
                      <div className="flex-1 space-y-2">
                        {/* Video Title Section */}
                        <div className="flex items-center space-x-2">
                          {editingVideoTitle === video.id ? (
                            <div className="flex items-center space-x-2 flex-1">
                              <input
                                type="text"
                                value={currentVideoTitles[video.id] || video.title || ""}
                                onChange={(e) =>
                                  setCurrentVideoTitles((prev) => ({ ...prev, [video.id]: e.target.value }))
                                }
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdateVideoTitle(video.id)
                                  }
                                  if (e.key === "Escape") {
                                    setEditingVideoTitle(null)
                                    setCurrentVideoTitles((prev) => ({ ...prev, [video.id]: video.title || "" }))
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                placeholder="Enter video title"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateVideoTitle(video.id)}
                                className="text-emerald-600 hover:text-emerald-800"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingVideoTitle(null)
                                  setCurrentVideoTitles((prev) => ({ ...prev, [video.id]: video.title || "" }))
                                }}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 flex-1">
                              <span className="text-sm font-medium">{video.title || `Video ${index + 1}`}</span>
                              <button
                                onClick={() => {
                                  setEditingVideoTitle(video.id)
                                  setCurrentVideoTitles((prev) => ({ ...prev, [video.id]: video.title || "" }))
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
                        </div>

                        {/* Video ID and Status */}
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">ID: {video.videoId}</span>
                          {video.isTagged ? (
                            <div className="flex items-center space-x-1 text-emerald-600">
                              <Check className="w-4 h-4" />
                              <span className="text-xs font-medium">Tagged</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-orange-600">
                              <span className="w-4 h-4 rounded-full border-2 border-current"></span>
                              <span className="text-xs font-medium">Needs Tagging</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveVimeoVideo(video.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Enhanced Video Preview */}
                    <div className="bg-white">
                      <VideoEmbed
                        url={video.url}
                        title={video.title || `Video ${index + 1}`}
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

                    {/* Video Controls and Timeline */}
                    <div className="p-4 bg-gray-50 space-y-3">
                      {/* Video Marker Timeline */}
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

                      {/* CHANGE: Added optional video password field */}
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
            )}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Add a skill"
            />
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
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
          )}
        </div>

        {/* Availability - Replaced text input with calendar picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
          <AvailabilityCalendarPicker
            availabilityDates={formData.availabilityDates}
            onChange={(dates) => setFormData((prev) => ({ ...prev, availabilityDates: dates }))}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {state.predefinedStatuses.map((status) => (
              <button
                key={status.id}
                onClick={() => handleStatusToggle(status.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  selectedStatuses.includes(status.id)
                    ? `${status.bgColor} ${status.textColor} border-current`
                    : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Media Materials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Media Materials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Media Materials</label>
              <button
                onClick={() => handleAddMediaMaterial("mediaMaterials")}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.mediaMaterials.map((material, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                  <span className="truncate">{material.name}</span>
                  <button
                    onClick={() => handleRemoveMediaMaterial("mediaMaterials", index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Showreels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Showreels</label>
              <button
                onClick={() => handleAddMediaMaterial("showreels")}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.showreels.map((reel, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                  <span className="truncate">{reel.name}</span>
                  <button
                    onClick={() => handleRemoveMediaMaterial("showreels", index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Audition Tapes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Audition Tapes</label>
              <button
                onClick={() => handleAddMediaMaterial("auditionTapes")}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.auditionTapes.map((tape, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                  <span className="truncate">{tape.name}</span>
                  <button
                    onClick={() => handleRemoveMediaMaterial("auditionTapes", index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
          Save Changes
        </button>
      </div>
    </div>
  )
}
