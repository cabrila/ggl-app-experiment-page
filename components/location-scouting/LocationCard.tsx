"use client"

import { MapPin, Sun, Moon, MoreHorizontal } from "lucide-react"
import { Location } from "@/types/location-scouting"

interface LocationCardProps {
  location: Location
}

export default function LocationCard({ location }: LocationCardProps) {
  return (
    <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-amber-400" />
        </div>
        <button className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-white mb-2">{location.name}</h3>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-0.5 rounded text-xs ${
          location.type === "INT" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
        }`}>
          {location.type}
        </span>
        <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/60 flex items-center gap-1">
          {location.timeOfDay === "DAY" || location.timeOfDay === "DAWN" ? (
            <Sun className="w-3 h-3" />
          ) : (
            <Moon className="w-3 h-3" />
          )}
          {location.timeOfDay}
        </span>
      </div>

      {/* Description */}
      {location.description && (
        <p className="text-sm text-white/50 line-clamp-3 leading-relaxed">
          {location.description}
        </p>
      )}
    </div>
  )
}
