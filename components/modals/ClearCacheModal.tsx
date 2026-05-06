"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { getStorageSize } from "@/utils/localStorage"

interface ClearCacheModalProps {
  onClose: () => void
}

export default function ClearCacheModal({ onClose }: ClearCacheModalProps) {
  const { dispatch } = useCasting()
  const [isConfirming, setIsConfirming] = useState(false)
  const [storageSize] = useState(getStorageSize())

  const handleClearCache = () => {
    // Flag so splash screen shows on next load
    if (typeof window !== "undefined") {
      localStorage.setItem("gogreenlight-cache-cleared", "true")
    }

    // Initial (blank) data – import or customise as needed
    const initialData = {
      projects: [],
      users: [
        { id: "1", name: "John Doe", initials: "JD" },
        { id: "2", name: "Jane Smith", initials: "JS" },
        { id: "3", name: "Mike Johnson", initials: "MJ" },
      ],
      notifications: [],
      tabDefinitions: [
        { key: "longList", name: "Long List" },
        { key: "audition", name: "Audition" },
        { key: "approval", name: "Approval" },
      ],
      currentFocus: {
        currentProjectId: null,
        characterId: null,
        activeTabKey: "longList",
        cardDisplayMode: "detailed",
        currentSortOption: "name",
        searchTerm: "",
        playerView: {
          isOpen: false,
          currentIndex: 0,
          currentHeadshotIndex: 0,
        },
      },
    }

    // Reset Redux / Context state
    dispatch({ type: "CLEAR_CACHE", payload: initialData })

    // Hard-reload so localStorage reset takes effect
    window.location.reload()
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-red-100 bg-red-50">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Clear Cache</h2>
        </div>
        <button onClick={onClose} className="text-red-400 hover:text-red-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This action permanently deletes all cached data, including:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                <li>All projects and characters</li>
                <li>Actor profiles and notes</li>
                <li>Voting history and decisions</li>
                <li>User preferences and settings</li>
                <li>Notification history</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 flex justify-between">
          <span className="text-sm text-gray-600">Current cache size:</span>
          <span className="text-sm font-medium text-gray-900">{storageSize}</span>
        </div>

        {!isConfirming ? (
          <>
            <p className="text-sm text-gray-600">
              This will reset the application to its initial state. All your work will be lost and cannot be recovered.
            </p>
            <p className="mt-2 text-sm font-medium">Are you sure you want to continue?</p>
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Click "Confirm Clear Cache" to proceed</span>
            </div>
            <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        {!isConfirming ? (
          <button
            onClick={() => setIsConfirming(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Cache
          </button>
        ) : (
          <button
            onClick={handleClearCache}
            className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Confirm Clear Cache</span>
          </button>
        )}
      </div>
    </div>
  )
}
