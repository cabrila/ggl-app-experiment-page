"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X, Upload, Link, FileText, Users, Copy, Check } from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"

interface UploadActorsMenuModalProps {
  onClose: () => void
  characterId: string
}

export default function UploadActorsMenuModal({ onClose, characterId }: UploadActorsMenuModalProps) {
  const { state } = useCasting()
  const [copiedLink, setCopiedLink] = useState(false)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)

  if (!currentCharacter) {
    onClose()
    return null
  }

  const handleUploadFromFile = () => {
    onClose()
    openModal("uploadCSV", { characterId })
  }

  const handleCreateForm = () => {
    onClose()
    openModal("createActorForm", { characterId })
  }

  const generateFormLink = () => {
    const baseUrl = window.location.origin
    const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return `${baseUrl}/actor-submission/${formId}?character=${characterId}&project=${currentProject?.id}`
  }

  const handleCopyLink = async () => {
    const link = generateFormLink()
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-bold">Upload {state.terminology.actor.plural}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="text-sm text-gray-600 mb-6">
          Choose how you'd like to add {state.terminology.actor.plural.toLowerCase()} to{" "}
          <span className="font-medium">{currentCharacter.name}</span>
        </div>

        {/* Upload from File Option */}
        <button
          onClick={handleUploadFromFile}
          className="w-full flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 group"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700">Upload from File</h3>
            <p className="text-sm text-gray-600">
              Import {state.terminology.actor.plural.toLowerCase()} from CSV or Excel files
            </p>
          </div>
          <FileText className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
        </button>

        {/* Upload from Form Option */}
        <button
          onClick={handleCreateForm}
          className="w-full flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <Link className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Upload from Form</h3>
            <p className="text-sm text-gray-600">
              Create a shareable form for {state.terminology.actor.plural.toLowerCase()} to submit themselves
            </p>
          </div>
          <Users className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
        </button>

        {/* Quick Link Generation */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Quick Link Generation</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Copy Link</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Generate and copy a submission form link instantly without additional setup
          </p>
        </div>
      </div>

      <div className="flex justify-end p-6 border-t bg-gray-50">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  )
}
