"use client"

import { useState } from "react"
import { Trash2, X, Save, Pencil, ChevronDown, ChevronUp } from "lucide-react"
import { Character } from "@/types/character-bible"

interface CharacterCardProps {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
  onDelete: () => void
  /** When true, collapsible sections are rendered fully expanded (used inside the detail modal). */
  forceExpanded?: boolean
  /** When provided (and not forceExpanded), clicking the character name opens the detail modal. */
  onNameClick?: () => void
  /** When provided (and not forceExpanded), clicking the edit button opens the detail modal in edit mode. */
  onEditClick?: () => void
  /** When true, the card mounts directly in edit mode (used by the modal's edit flow). */
  startInEdit?: boolean
}

// Treat unknown / empty as "no value" for display purposes.
function isMeaningful(value: string | undefined | null): boolean {
  if (!value) return false
  return value.trim().toLowerCase() !== "unknown"
}

export default function CharacterCard({
  character,
  onUpdate,
  onDelete,
  forceExpanded = false,
  onNameClick,
  onEditClick,
  startInEdit = false,
}: CharacterCardProps) {
  const [isEditing, setIsEditing] = useState(startInEdit)
  const [isAppearancesOpen, setIsAppearancesOpen] = useState(false)
  const [editState, setEditState] = useState({
    name: character.name,
    aliases: (character.aliases || []).join(", "),
    gender: character.gender || "",
    ageRange: character.ageRange || "",
    description: character.description || "",
  })

  const handleSave = () => {
    const updates: Partial<Character> = {
      name: editState.name,
      aliases: editState.aliases
        ? editState.aliases.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      gender: editState.gender || "unknown",
      ageRange: editState.ageRange || "unknown",
      description: editState.description || "",
    }
    onUpdate(updates)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditState({
      name: character.name,
      aliases: (character.aliases || []).join(", "),
      gender: character.gender || "",
      ageRange: character.ageRange || "",
      description: character.description || "",
    })
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
            autoComplete="off"
            value={editState.name}
            onChange={(e) => setEditState({ ...editState, name: e.target.value })}
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Aliases */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            Aliases (comma-separated)
          </label>
          <input
            type="text"
            autoComplete="off"
            value={editState.aliases}
            onChange={(e) => setEditState({ ...editState, aliases: e.target.value })}
            placeholder="e.g. BOB, ROBERTO"
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Age Range & Gender Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Age Range
            </label>
            <input
              type="text"
              autoComplete="off"
              value={editState.ageRange}
              onChange={(e) => setEditState({ ...editState, ageRange: e.target.value })}
              placeholder="e.g. 30s, 25-35"
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Gender
            </label>
            <input
              type="text"
              autoComplete="off"
              value={editState.gender}
              onChange={(e) => setEditState({ ...editState, gender: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            autoComplete="off"
            value={editState.description}
            onChange={(e) => setEditState({ ...editState, description: e.target.value })}
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
  const hasAliases = character.aliases && character.aliases.length > 0
  const hasAppearances = character.sceneAppearances && character.sceneAppearances.length > 0
  const showAge = isMeaningful(character.ageRange)
  const showGender = isMeaningful(character.gender)
  const appearanceCount = character.sceneAppearances?.length || 0

  return (
    <div className="group relative p-5 rounded-xl border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors">
      {/* Hover Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => (onEditClick && !forceExpanded ? onEditClick() : setIsEditing(true))}
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
      <div className="mb-2 pr-20">
        {onNameClick && !forceExpanded ? (
          <button onClick={onNameClick} className="text-left max-w-full" title="View full character details">
            <h3 className="text-xl font-bold text-white font-sans uppercase tracking-wide hover:text-emerald-300 transition-colors cursor-pointer">
              {character.name}
            </h3>
          </button>
        ) : (
          <h3 className="text-xl font-bold text-white font-sans uppercase tracking-wide">
            {character.name}
          </h3>
        )}
      </div>

      {/* Aliases */}
      {hasAliases && (
        <p className="text-sm text-white/50 mb-3 font-sans">
          also: {character.aliases.join(", ")}
        </p>
      )}

      {/* Attributes Grid */}
      {(showAge || showGender || hasAppearances) && (
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[#0f1f17] rounded-lg">
          {showAge && (
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                Age
              </p>
              <p className="text-sm text-white font-sans truncate">
                {character.ageRange}
              </p>
            </div>
          )}

          {showGender && (
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                Gender
              </p>
              <p className="text-sm text-white font-sans truncate">
                {character.gender}
              </p>
            </div>
          )}

          {hasAppearances && (
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                Scenes
              </p>
              <p className="text-sm text-white font-sans truncate">
                {appearanceCount}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {character.description && (
        <div className="p-3 bg-[#0f1f17] rounded-lg mb-3">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Description
          </p>
          <p className="text-sm text-white/80 font-sans leading-relaxed">
            {character.description}
          </p>
        </div>
      )}

      {/* Scene Appearances (collapsible) */}
      {hasAppearances && (
        <div className="mt-3">
          {!forceExpanded && (
            <button
              onClick={() => setIsAppearancesOpen(!isAppearancesOpen)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors w-full"
            >
              {isAppearancesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="font-sans">
                Scene Appearances ({appearanceCount})
              </span>
            </button>
          )}

          {(forceExpanded || isAppearancesOpen) && (
            <div className="mt-3 space-y-3">
              {character.sceneAppearances.map((sa, idx) => (
                <div
                  key={`${sa.sceneHeading}-${idx}`}
                  className="p-3 bg-[#0f1f17] rounded-lg border border-white/5"
                >
                  <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-1.5 font-sans">
                    {sa.sceneHeading}
                  </p>
                  <p className="text-xs text-white/70 font-mono whitespace-pre-wrap leading-relaxed">
                    {sa.citation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
