"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"

interface CreateGroupModalProps {
  selectedActorIds: string[]
  onCreateGroup: (name: string, color: string) => void
  onClose: () => void
}

const GROUP_COLORS = [
  { name: "Blue", value: "blue" },
  { name: "Green", value: "green" },
  { name: "Purple", value: "purple" },
  { name: "Red", value: "red" },
  { name: "Yellow", value: "yellow" },
  { name: "Pink", value: "pink" },
  { name: "Indigo", value: "indigo" },
  { name: "Orange", value: "orange" },
]

export default function CreateGroupModal({ selectedActorIds, onCreateGroup, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("")
  const [selectedColor, setSelectedColor] = useState("blue")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (groupName.trim()) {
      onCreateGroup(groupName.trim(), selectedColor)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-90vw">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Create Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Creating a group with {selectedActorIds.length} selected actor{selectedActorIds.length !== 1 ? "s" : ""}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter group name..."
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Color</label>
            <div className="grid grid-cols-4 gap-2">
              {GROUP_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedColor === color.value
                      ? `border-${color.value}-500 bg-${color.value}-100`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-6 h-6 bg-${color.value}-500 rounded-full mx-auto`} />
                  <div className="text-xs mt-1">{color.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim()}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
