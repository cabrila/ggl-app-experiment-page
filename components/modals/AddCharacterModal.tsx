"use client"

import type React from "react"

import { useState } from "react"
import { useCasting, getCurrentTerminology } from "@/components/casting/CastingContext"
import { X, Upload } from "lucide-react"
import { openModal } from "./ModalManager"
import type { Character } from "@/types/casting"
import TerminologyContextMenu from "@/components/ui/TerminologyContextMenu"

interface AddCharacterModalProps {
  onClose: () => void
}

export default function AddCharacterModal({ onClose }: AddCharacterModalProps) {
  const { state, dispatch } = useCasting()
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    ethnicity: "",
    description: "",
    castingNotes: "",
  })

  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    type: "actor" | "character"
    form: "singular" | "plural"
    currentValue: string
  } | null>(null)

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

    const newCharacter: Character = {
      id: `char_${Date.now()}`,
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
      ethnicity: formData.ethnicity,
      description: formData.description,
      castingNotes: formData.castingNotes,
      actors: {
        longList: [],
        shortLists: [],
        audition: [],
        approval: [],
      },
    }

    dispatch({
      type: "ADD_CHARACTER",
      payload: {
        projectId: currentProject.id,
        character: newCharacter,
      },
    })

    onClose()
  }

  const handleUploadFromFile = () => {
    openModal("uploadCharacters")
  }

  const handleContextMenu = (e: React.MouseEvent, type: "actor" | "character", form: "singular" | "plural") => {
    // Prevent the default browser context menu
    e.preventDefault()
    e.stopPropagation()

    // Get current project's terminology using the helper function
    const terminology = getCurrentTerminology(state)

    // Set the context menu state with the correct position and data
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      form,
      currentValue: terminology[type][form],
    })

    // Return false to prevent any other handlers
    return false
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
      <div className="flex justify-between items-center p-6 border-b">
        <h2
          className="text-xl font-bold cursor-context-menu"
          onContextMenu={(e) => handleContextMenu(e, "character", "singular")}
        >
          Create New {getCurrentTerminology(state).character.singular}
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleUploadFromFile}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
            title={`Import multiple ${getCurrentTerminology(state).character.plural.toLowerCase()} from CSV or Excel file`}
          >
            <Upload className="w-4 h-4" />
            <span onContextMenu={(e) => handleContextMenu(e, "character", "plural")} className="cursor-context-menu">
              Add {getCurrentTerminology(state).character.plural} from File
            </span>
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1 cursor-context-menu"
              onContextMenu={(e) => handleContextMenu(e, "character", "singular")}
            >
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
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 cursor-context-menu"
          onContextMenu={(e) => handleContextMenu(e, "character", "singular")}
        >
          Create {getCurrentTerminology(state).character.singular}
        </button>
      </div>
      {/* Terminology Context Menu */}
      {contextMenu && (
        <TerminologyContextMenu
          show={contextMenu.show}
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          form={contextMenu.form}
          currentValue={contextMenu.currentValue}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
