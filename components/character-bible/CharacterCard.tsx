"use client"

import { useState } from "react"
import { Trash2, X, Save, Pencil, ChevronDown, ChevronUp } from "lucide-react"
import { Character } from "@/types/character-bible"
import { CitedValue } from "@/components/ui/CitationTooltip"

interface CharacterCardProps {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
  onDelete: () => void
}

export default function CharacterCard({ character, onUpdate, onDelete }: CharacterCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [editState, setEditState] = useState({
    name: character.name,
    alternateNames: character.alternateNames?.join(", ") || "",
    gender: character.profile?.gender?.gender || "",
    genderPronoun: character.profile?.gender?.genderPronoun || "",
    playingAge: character.profile?.castingProfile?.ageRange?.playingAge || "",
    ethnicity: character.profile?.ethnicity || "",
    background: character.profile?.background || "",
    castingNotes: character.profile?.castingNotes || "",
  })

  const handleSave = () => {
    const updates: Partial<Character> = {
      name: editState.name,
      alternateNames: editState.alternateNames ? editState.alternateNames.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      profile: {
        ...character.profile,
        gender: {
          ...character.profile?.gender,
          gender: editState.gender || undefined,
          genderPronoun: editState.genderPronoun || undefined,
        },
        castingProfile: {
          ...character.profile?.castingProfile,
          ageRange: editState.playingAge ? { playingAge: editState.playingAge } : undefined,
        },
        ethnicity: editState.ethnicity || undefined,
        background: editState.background || undefined,
        castingNotes: editState.castingNotes || undefined,
      },
    }
    onUpdate(updates)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditState({
      name: character.name,
      alternateNames: character.alternateNames?.join(", ") || "",
      gender: character.profile?.gender?.gender || "",
      genderPronoun: character.profile?.gender?.genderPronoun || "",
      playingAge: character.profile?.castingProfile?.ageRange?.playingAge || "",
      ethnicity: character.profile?.ethnicity || "",
      background: character.profile?.background || "",
      castingNotes: character.profile?.castingNotes || "",
    })
    setIsEditing(false)
  }

  // Helper to get physical characteristics that are populated
  const physicalChars = character.profile?.physicalCharacteristics
  const hasPhysicalChars = physicalChars && Object.entries(physicalChars)
    .some(([, value]) => value)

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

        {/* Alternate Names */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            Alternate Names (comma-separated)
          </label>
          <input
            type="text"
            value={editState.alternateNames}
            onChange={(e) => setEditState({ ...editState, alternateNames: e.target.value })}
            placeholder="e.g. BOB, ROBERTO"
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Age & Gender Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Playing Age
            </label>
            <input
              type="text"
              value={editState.playingAge}
              onChange={(e) => setEditState({ ...editState, playingAge: e.target.value })}
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
              value={editState.gender}
              onChange={(e) => setEditState({ ...editState, gender: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Pronoun & Ethnicity Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Pronouns
            </label>
            <input
              type="text"
              value={editState.genderPronoun}
              onChange={(e) => setEditState({ ...editState, genderPronoun: e.target.value })}
              placeholder="e.g. she/her, he/him"
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
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
        </div>

        {/* Background */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            Background
          </label>
          <textarea
            value={editState.background}
            onChange={(e) => setEditState({ ...editState, background: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans resize-none focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Casting Notes */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            Casting Notes
          </label>
          <textarea
            value={editState.castingNotes}
            onChange={(e) => setEditState({ ...editState, castingNotes: e.target.value })}
            rows={3}
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

      {/* Character Name with Citation */}
      <div className="mb-2 pr-20">
        <h3 className="text-xl font-bold text-white font-sans uppercase tracking-wide inline-flex items-center">
          <CitedValue 
            value={character.name} 
            character={character}
            fieldPath="name"
          />
        </h3>
      </div>

      {/* Alternate Names */}
      {character.alternateNames && character.alternateNames.length > 0 && (
        <p className="text-sm text-white/50 mb-3 font-sans">
          also: {character.alternateNames.join(", ")}
        </p>
      )}

      {/* Attributes Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[#0f1f17] rounded-lg">
        {/* Age/Playing Age */}
        {character.profile?.castingProfile?.ageRange?.playingAge && (
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Age
            </p>
            <p className="text-sm text-white font-sans truncate">
              <CitedValue
                value={character.profile.castingProfile.ageRange.playingAge}
                character={character}
                fieldPath="profile.castingProfile.ageRange.playingAge"
              />
            </p>
          </div>
        )}

        {/* Gender with Pronoun */}
        {character.profile?.gender?.gender && (
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Gender
            </p>
            <p className="text-sm text-white font-sans truncate">
              <CitedValue
                value={character.profile.gender.gender}
                character={character}
                fieldPath="profile.gender.gender"
              />
              {character.profile.gender.genderPronoun && (
                <span className="text-white/50">
                  {" "}· <CitedValue
                    value={character.profile.gender.genderPronoun}
                    character={character}
                    fieldPath="profile.gender.genderPronoun"
                  />
                </span>
              )}
            </p>
          </div>
        )}

        {/* Ethnicity */}
        {character.profile?.ethnicity && (
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Ethnicity
            </p>
            <p className="text-sm text-white font-sans truncate">
              <CitedValue
                value={character.profile.ethnicity}
                character={character}
                fieldPath="profile.ethnicity"
              />
            </p>
          </div>
        )}
      </div>

      {/* Background (replaces old description) */}
      {character.profile?.background && (
        <div className="p-3 bg-[#0f1f17] rounded-lg mb-3">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Background
          </p>
          <p className="text-sm text-white/80 font-sans leading-relaxed">
            <CitedValue
              value={character.profile.background}
              character={character}
              fieldPath="profile.background"
            />
          </p>
        </div>
      )}

      {/* Casting Notes */}
      {character.profile?.castingNotes && (
        <div className="p-3 bg-[#0f1f17] rounded-lg mb-3">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Casting Notes
          </p>
          <p className="text-sm text-white/80 font-sans leading-relaxed">
            <CitedValue
              value={character.profile.castingNotes}
              character={character}
              fieldPath="profile.castingNotes"
            />
          </p>
        </div>
      )}

      {/* Expandable Physical Characteristics */}
      {hasPhysicalChars && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors w-full"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="font-sans">Physical Characteristics</span>
          </button>

          {isExpanded && (
            <div className="mt-3 p-3 bg-[#0f1f17] rounded-lg space-y-2">
              {physicalChars?.species && (
                <div className="flex justify-between">
                  <span className="text-xs text-white/50 uppercase">Species</span>
                  <span className="text-sm text-white">
                    <CitedValue value={physicalChars.species} character={character} fieldPath="profile.physicalCharacteristics.species" />
                  </span>
                </div>
              )}
              {physicalChars?.hairColor && (
                <div className="flex justify-between">
                  <span className="text-xs text-white/50 uppercase">Hair Color</span>
                  <span className="text-sm text-white">
                    <CitedValue value={physicalChars.hairColor} character={character} fieldPath="profile.physicalCharacteristics.hairColor" />
                  </span>
                </div>
              )}
              {physicalChars?.hairLength && (
                <div className="flex justify-between">
                  <span className="text-xs text-white/50 uppercase">Hair Length</span>
                  <span className="text-sm text-white">
                    <CitedValue value={physicalChars.hairLength} character={character} fieldPath="profile.physicalCharacteristics.hairLength" />
                  </span>
                </div>
              )}
              {physicalChars?.eyeColor && (
                <div className="flex justify-between">
                  <span className="text-xs text-white/50 uppercase">Eye Color</span>
                  <span className="text-sm text-white">
                    <CitedValue value={physicalChars.eyeColor} character={character} fieldPath="profile.physicalCharacteristics.eyeColor" />
                  </span>
                </div>
              )}
              {physicalChars?.height && (
                <div className="flex justify-between">
                  <span className="text-xs text-white/50 uppercase">Height</span>
                  <span className="text-sm text-white">
                    <CitedValue value={physicalChars.height} character={character} fieldPath="profile.physicalCharacteristics.height" />
                  </span>
                </div>
              )}
              {physicalChars?.weight && (
                <div className="flex justify-between">
                  <span className="text-xs text-white/50 uppercase">Weight</span>
                  <span className="text-sm text-white">
                    <CitedValue value={physicalChars.weight} character={character} fieldPath="profile.physicalCharacteristics.weight" />
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Identifier (footer caption) */}
      {character.identifier?.identifierValue && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-xs text-white/30 font-mono truncate">
            {character.identifier.identifierValue}
          </p>
        </div>
      )}
    </div>
  )
}
