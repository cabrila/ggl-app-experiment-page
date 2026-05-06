"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X, Link, Copy, Check, Eye, Share2, Globe, Calendar, Users } from "lucide-react"
import FormPreviewModal from "./FormPreviewModal"

interface CreateActorFormModalProps {
  onClose: () => void
  characterId: string
}

export default function CreateActorFormModal({ onClose, characterId }: CreateActorFormModalProps) {
  const { state, dispatch } = useCasting()
  const [formSettings, setFormSettings] = useState({
    title: "",
    description: "",
    deadline: "",
    isPublic: true,
    requireApproval: false,
    allowMultipleSubmissions: false,
    collectPhotos: true,
    collectVideos: true,
    customFields: [] as Array<{ name: string; type: string; required: boolean }>,
  })
  const [generatedLink, setGeneratedLink] = useState("")
  const [copiedLink, setCopiedLink] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)

  useEffect(() => {
    if (!currentCharacter) {
      onClose()
    }
  }, [currentCharacter, onClose])

  // Debug logging
  useEffect(() => {
    console.log("🔍 CreateActorFormModal: showPreviewModal state changed:", showPreviewModal)
  }, [showPreviewModal])

  if (!currentCharacter) {
    return null
  }

  const handleInputChange = (field: string, value: any) => {
    setFormSettings((prev) => ({ ...prev, [field]: value }))
  }

  const generateFormLink = () => {
    const baseUrl = window.location.origin
    const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return `${baseUrl}/actor-submission/${formId}?character=${characterId}&project=${currentProject?.id}`
  }

  const handleCreateForm = async () => {
    setIsCreating(true)

    try {
      // Simulate form creation process
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const link = generateFormLink()
      setGeneratedLink(link)

      // Create form record in state
      const newForm = {
        id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: formSettings.title || `${currentCharacter.name} Submission Form`,
        description: formSettings.description,
        characterId,
        projectId: currentProject?.id,
        link,
        settings: formSettings,
        createdAt: Date.now(),
        submissions: [],
        isActive: true,
      }

      // Add notification
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: "Submission Form Created",
          message: `Created submission form for ${currentCharacter.name}. Share the link to start receiving submissions.`,
          timestamp: Date.now(),
          isRead: false,
          priority: "medium",
          metadata: {
            formId: newForm.id,
            characterId,
            projectId: currentProject?.id,
            source: "form_creation",
          },
        },
      })
    } catch (error) {
      console.error("Error creating form:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const handlePreviewForm = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log("🚀 Preview Form button clicked")
    console.log("📋 Form settings:", formSettings)
    console.log("🎭 Character:", currentCharacter.name)

    // Force state update
    setShowPreviewModal(true)
    console.log("✅ Preview modal state set to true")
  }

  const handleClosePreview = () => {
    console.log("🔒 Closing preview modal")
    setShowPreviewModal(false)
  }

  const handleSubmissionComplete = (actorData: any) => {
    console.log("🎯 Form submission completed with data:", actorData)

    // Add the actor to the casting context
    dispatch({
      type: "ADD_ACTOR",
      payload: {
        characterId: characterId,
        actor: {
          ...actorData,
          submissionSource: "form_preview",
          currentListKey: "longList",
          createdAt: Date.now(),
          userVotes: {},
          consensusAction: null,
          isSoftRejected: false,
          isGreenlit: false,
          isCast: false,
          statuses: actorData.statuses || [],
        },
      },
    })

    // Add success notification
    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `preview-actor-added-${Date.now()}`,
        type: "system",
        title: "Actor Added from Form Preview",
        message: `${actorData.name} has been successfully added to ${currentCharacter.name} Long List`,
        timestamp: Date.now(),
        read: false,
        priority: "medium",
        actorId: actorData.id,
        characterId: characterId,
      },
    })

    // Close preview modal
    setShowPreviewModal(false)
    console.log("✅ Actor added and preview modal closed")
  }

  if (generatedLink) {
    return (
      <>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold">Form Created Successfully!</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {formSettings.title || `${currentCharacter.name} Submission Form`}
              </h3>
              <p className="text-gray-600">
                Your submission form is ready! Share the link below to start receiving{" "}
                {state.terminology.actor.singular.toLowerCase()} submissions.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Shareable Link</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Public Access</span>
                </div>
                <p className="text-sm text-blue-700">
                  {formSettings.isPublic ? "Anyone with the link can submit" : "Restricted access only"}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Submissions</span>
                </div>
                <p className="text-sm text-purple-700">
                  {formSettings.allowMultipleSubmissions ? "Multiple submissions allowed" : "One submission per person"}
                </p>
              </div>
            </div>

            {formSettings.deadline && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900">Deadline: {formSettings.deadline}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <button
              onClick={handlePreviewForm}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              type="button"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Form</span>
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => setGeneratedLink("")}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                type="button"
              >
                Create Another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>

        {/* Preview Modal - Rendered as a separate portal */}
        {showPreviewModal && (
          <FormPreviewModal
            formSettings={formSettings}
            characterId={characterId}
            projectId={currentProject?.id || ""}
            characterName={currentCharacter.name}
            onClose={handleClosePreview}
            onSubmissionComplete={handleSubmissionComplete}
          />
        )}
      </>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-bold">Create Submission Form</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Creating form for: {currentCharacter.name}</span>
          </div>
          <p className="text-sm text-blue-700">
            This form will allow {state.terminology.actor.plural.toLowerCase()} to submit their information directly for
            this character.
          </p>
        </div>

        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
            <input
              type="text"
              value={formSettings.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder={`${currentCharacter.name} Submission Form`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formSettings.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Provide instructions or details about the submission process..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submission Deadline (Optional)</label>
            <input
              type="date"
              value={formSettings.deadline}
              onChange={(e) => handleInputChange("deadline", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Form Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Form Settings</h3>

          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formSettings.isPublic}
                onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                className="form-checkbox h-4 w-4 text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Public Access</span>
                <p className="text-xs text-gray-500">Anyone with the link can submit</p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formSettings.requireApproval}
                onChange={(e) => handleInputChange("requireApproval", e.target.checked)}
                className="form-checkbox h-4 w-4 text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Require Approval</span>
                <p className="text-xs text-gray-500">Submissions need manual approval before being added</p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formSettings.allowMultipleSubmissions}
                onChange={(e) => handleInputChange("allowMultipleSubmissions", e.target.checked)}
                className="form-checkbox h-4 w-4 text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Allow Multiple Submissions</span>
                <p className="text-xs text-gray-500">Same person can submit multiple times</p>
              </div>
            </label>
          </div>
        </div>

        {/* Media Collection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Media Collection</h3>

          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formSettings.collectPhotos}
                onChange={(e) => handleInputChange("collectPhotos", e.target.checked)}
                className="form-checkbox h-4 w-4 text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Collect Photos</span>
                <p className="text-xs text-gray-500">Allow headshot and photo uploads</p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formSettings.collectVideos}
                onChange={(e) => handleInputChange("collectVideos", e.target.checked)}
                className="form-checkbox h-4 w-4 text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Collect Videos</span>
                <p className="text-xs text-gray-500">Allow YouTube and Vimeo video submissions</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center p-6 border-t bg-gray-50">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          Cancel
        </button>
        <button
          onClick={handleCreateForm}
          disabled={isCreating}
          className="flex items-center space-x-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Link className="w-4 h-4" />
              <span>Create Form</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
