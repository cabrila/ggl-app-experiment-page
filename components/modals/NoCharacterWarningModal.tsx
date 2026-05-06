"use client"

import { X, Users, Plus } from "lucide-react"
import { openModal } from "./ModalManager"

interface NoCharacterWarningModalProps {
  onClose: () => void
  actionType: "addActor" | "uploadFile"
}

export default function NoCharacterWarningModal({ onClose, actionType }: NoCharacterWarningModalProps) {
  const handleCreateCharacter = () => {
    onClose()
    // Open the Create Character modal
    openModal("addCharacter")
  }

  const actionText = actionType === "addActor" ? "add actors" : "import actors from a file"

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">No Characters Found</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-amber-600 mt-0.5">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-800 mb-1">Character Required</h3>
                <p className="text-sm text-amber-700">
                  You need to create at least one character before you can {actionText}.
                </p>
              </div>
            </div>
          </div>

          <div className="text-gray-600 space-y-3">
            <p>
              Characters represent the roles you're casting for in your project. Each character can have their own list
              of actors, shortlists, and casting progress.
            </p>
            <p className="text-sm">
              <strong>To get started:</strong>
            </p>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Create a character for the role you want to cast</li>
              <li>Add actors to that character's casting lists</li>
              <li>Begin your casting process</li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCreateCharacter}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Character
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
