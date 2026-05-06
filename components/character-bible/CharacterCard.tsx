"use client"

import { User, Film, MoreHorizontal } from "lucide-react"
import { Character } from "@/types/character-bible"

interface CharacterCardProps {
  character: Character
}

export default function CharacterCard({ character }: CharacterCardProps) {
  return (
    <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <User className="w-6 h-6 text-emerald-400" />
        </div>
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-white mb-2">{character.name}</h3>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 mb-3">
        {character.age && (
          <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/60">
            {character.age}
          </span>
        )}
        {character.gender && (
          <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/60">
            {character.gender}
          </span>
        )}
        <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400 flex items-center gap-1">
          <Film className="w-3 h-3" />
          {character.scenes} scenes
        </span>
      </div>

      {/* Casting Notes */}
      {character.castingNotes && (
        <p className="text-sm text-white/50 line-clamp-3 leading-relaxed">
          {character.castingNotes}
        </p>
      )}
    </div>
  )
}
