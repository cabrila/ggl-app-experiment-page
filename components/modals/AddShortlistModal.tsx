"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X } from "lucide-react"
import type { Shortlist } from "@/types/casting"

interface AddShortlistModalProps {
  onClose: () => void
  characterId: string
}

export default function AddShortlistModal({ onClose, characterId }: AddShortlistModalProps) {
  const { dispatch } = useCasting()
  const [name, setName] = useState("")

  const handleSave = () => {
    if (!name.trim()) {
      alert("Shortlist name is required.")
      return
    }

    const newShortlist: Shortlist = {
      id: `sl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      actors: [],
    }

    dispatch({
      type: "ADD_SHORTLIST",
      payload: {
        shortlist: newShortlist,
        characterId,
      },
    })

    onClose()
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-bold">Add New Shortlist</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Main Shortlist"
          autoFocus
        />
      </div>

      <div className="flex justify-end space-x-2 p-6 border-t">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
          Cancel
        </button>
        <button onClick={handleSave} className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600">
          Save
        </button>
      </div>
    </div>
  )
}
