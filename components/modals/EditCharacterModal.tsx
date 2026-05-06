"use client"

import { useState } from "react"
import { useCasting, getCurrentTerminology } from "@/components/casting/CastingContext"
import { X, Save } from "lucide-react"
import type { Character } from "@/types/casting"

interface EditCharacterModalProps {
  onClose: () => void
  character: Character
}

export default function EditCharacterModal({ onClose, character }: EditCharacterModalProps) {
  const { state, dispatch } = useCasting()
  const [formData, setFormData] = useState({
    name: character.name,
    age: character.age || "",
    gender: character.gender || "",
    ethnicity: character.ethnicity || "",
    description: character.description || "",
    castingNotes: character.castingNotes || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert(`${getCurrentTerminology(state).character.singular} name is required.`)
      return
    }

    const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
    if (!currentProject) {
      alert("No project selected.")
      return
    }

    // Update character data
    const updatedCharacter: Character = {
      ...character,
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
      ethnicity: formData.ethnicity,
      description: formData.description,
      castingNotes: formData.castingNotes,
    }

    // Dispatch update action
    dispatch({
      type: "UPDATE_CHARACTER",
      payload: {
        projectId: currentProject.id,
        character: updatedCharacter,
      },
    })

    // Add notification
    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: "Character Updated",
        message: `Character "${formData.name}" has been updated`,
        timestamp: Date.now(),
        isRead: false,
        priority: "low",
        metadata: {
          characterId: character.id,
          projectId: currentProject.id,
          source: "character_edit",
        },
      },
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Edit {getCurrentTerminology(state).character.singular}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {getCurrentTerminology(state).character.singular} Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="text"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 30s, 45-55"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <input
                type="text"
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Male, Female, Non-binary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
              <input
                type="text"
                value={formData.ethnicity}
                onChange={(e) => handleInputChange("ethnicity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Caucasian"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={4}
              placeholder={`${getCurrentTerminology(state).character.singular} traits, backstory, etc.`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Casting Notes</label>
            <textarea
              value={formData.castingNotes}
              onChange={(e) => handleInputChange("castingNotes", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder={`Specific qualities, ${getCurrentTerminology(state).actor.singular.toLowerCase()} types, etc.`}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-6 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  )
}
