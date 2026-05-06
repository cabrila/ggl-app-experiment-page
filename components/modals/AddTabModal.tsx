"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"

interface AddTabModalProps {
  onClose: () => void
}

export default function AddTabModal({ onClose }: AddTabModalProps) {
  const { dispatch } = useCasting()
  const [tabName, setTabName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!tabName.trim()) {
      setError("Tab name is required")
      return
    }

    // Generate a key from the name (lowercase, no spaces)
    const tabKey =
      tabName
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "") || `custom-${Date.now()}`

    dispatch({
      type: "ADD_TAB",
      payload: {
        tabKey: tabKey,
        tabName: tabName.trim(),
      },
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Add New Tab</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="tabName" className="block text-sm font-medium text-gray-700 mb-1">
              Tab Name
            </label>
            <input
              type="text"
              id="tabName"
              value={tabName}
              onChange={(e) => {
                setTabName(e.target.value)
                setError("")
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter tab name"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
            >
              Add Tab
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
