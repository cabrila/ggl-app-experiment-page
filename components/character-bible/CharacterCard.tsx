"use client"

import { useState } from "react"
import { Trash2, X, Save, Pencil } from "lucide-react"
import { Character } from "@/types/character-bible"

interface CharacterCardProps {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
  onDelete: () => void
}

export default function CharacterCard({ character, onUpdate, onDelete }: CharacterCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editState, setEditState] = useState<Character>(character)

  const handleSave = () => {
    onUpdate(editState)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditState(character)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-5 rounded-xl border border-emerald-500/50 bg-[#1a2e23]">
        {/* Character Name */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Character Name
          </label>
          <input
            type="text"
            value={editState.name}
            onChange={(e) => setEditState({ ...editState, name: e.target.value })}
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Age & Gender Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Age
            </label>
            <input
              type="text"
              value={editState.age}
              onChange={(e) => setEditState({ ...editState, age: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Gender
            </label>
            <input
              type="text"
              value={editState.gender}
              onChange={(e) => setEditState({ ...editState, gender: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Ethnicity & Scenes Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Ethnicity
            </label>
            <input
              type="text"
              value={editState.ethnicity}
              onChange={(e) => setEditState({ ...editState, ethnicity: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Scenes
            </label>
            <input
              type="number"
              value={editState.scenes}
              onChange={(e) => setEditState({ ...editState, scenes: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Casting Notes */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            Casting Notes
          </label>
          <textarea
            value={editState.castingNotes}
            onChange={(e) => setEditState({ ...editState, castingNotes: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans resize-none focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-sans">Delete</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-sans">Cancel</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-sans">Save</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // View Mode
  return (
    <div className="group relative p-5 rounded-xl border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors">
      {/* Hover Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
          title="Edit character"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          title="Delete character"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Character Name */}
      <h3 className="text-xl font-bold text-white mb-4 font-sans uppercase tracking-wide pr-20">
        {character.name}
      </h3>

      {/* Attributes Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-[#0f1f17] rounded-lg">
        <div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Age
          </p>
          <p className="text-sm text-white font-sans truncate" title={character.age}>
            {character.age}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Gender
          </p>
          <p className="text-sm text-white font-sans truncate" title={character.gender}>
            {character.gender}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Ethnicity
          </p>
          <p className="text-sm text-white font-sans truncate" title={character.ethnicity}>
            {character.ethnicity}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Scenes
          </p>
          <p className="text-sm text-white font-sans">
            {character.scenes}
          </p>
        </div>
      </div>

      {/* Casting Notes */}
      <div className="p-3 bg-[#0f1f17] rounded-lg">
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          Casting Notes & Character Traits
        </p>
        <p className="text-sm text-white/80 font-sans leading-relaxed">
          {character.castingNotes}
        </p>
      </div>
    </div>
  )
}
