"use client"

import { User, Mail, Phone, MoreHorizontal } from "lucide-react"
import { Actor } from "@/types/actor-list"

interface ActorCardProps {
  actor: Actor
}

export default function ActorCard({ actor }: ActorCardProps) {
  return (
    <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-full bg-sky-500/20 flex items-center justify-center overflow-hidden">
          {actor.headshotUrl ? (
            <img src={actor.headshotUrl} alt={actor.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-7 h-7 text-sky-400" />
          )}
        </div>
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-white mb-2">{actor.name}</h3>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/60">
          Age: {actor.age}
        </span>
        <span className="px-2 py-0.5 bg-sky-500/20 rounded text-xs text-sky-400">
          Playing: {actor.playingAge}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 mb-3">
        {actor.email && (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">{actor.email}</span>
          </div>
        )}
        {actor.phone && (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Phone className="w-3.5 h-3.5" />
            <span>{actor.phone}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {actor.notes && (
        <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">
          {actor.notes}
        </p>
      )}
    </div>
  )
}
