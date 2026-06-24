"use client"

import { useState } from "react"
import { MapPin, Pencil, Trash2, X, Save, Map, ExternalLink } from "lucide-react"
import { Location } from "@/types/location-scouting"
import GoogleMapsModal from "@/components/ui/GoogleMapsModal"
import CardMore from "@/components/ui/CardMore"

interface LocationCardProps {
  location: Location
  onUpdate: (location: Location) => void
  onDelete: () => void
  /** When true, the card is rendered inside the detail modal. */
  forceExpanded?: boolean
  /** When provided (and not forceExpanded), clicking the location name opens the detail modal. */
  onNameClick?: () => void
  /** When provided (and not forceExpanded), clicking the edit button opens the detail modal in edit mode. */
  onEditClick?: () => void
  /** When true, the card mounts directly in edit mode (used by the modal's edit flow). */
  startInEdit?: boolean
}

export default function LocationCard({
  location,
  onUpdate,
  onDelete,
  forceExpanded = false,
  onNameClick,
  onEditClick,
  startInEdit = false,
}: LocationCardProps) {
  const [isEditing, setIsEditing] = useState(startInEdit)
  const [editData, setEditData] = useState<Location>(location)
  const [showMapModal, setShowMapModal] = useState(false)

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(location)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-5 rounded-xl border border-amber-500/50 bg-[#1a2e23]">
        {/* Location Name Label */}
        <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Location Name
        </label>
        <input
          type="text"
          autoComplete="off"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-amber-500/50 focus:outline-none"
        />

        {/* Type and Time of Day */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Type
            </label>
            <select
              value={editData.type}
              onChange={(e) => setEditData({ ...editData, type: e.target.value as Location["type"] })}
              className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans border border-white/10 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="INT" className="bg-[#0f1f17] text-white">INT.</option>
              <option value="EXT" className="bg-[#0f1f17] text-white">EXT.</option>
              <option value="INT/EXT" className="bg-[#0f1f17] text-white">INT/EXT.</option>
              <option value="Not specified" className="bg-[#0f1f17] text-white">Not specified</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Time of Day
            </label>
            {/* AI: free text — a merged location can span multiple times
                (e.g. "DAY, NIGHT"), which a fixed dropdown can't represent. */}
            <input
              type="text"
              autoComplete="off"
              value={editData.timeOfDay}
              onChange={(e) => setEditData({ ...editData, timeOfDay: e.target.value })}
              placeholder="e.g. DAY, NIGHT"
              className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans border border-white/10 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Description
        </label>
        <textarea
          autoComplete="off"
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-amber-500/50 focus:outline-none resize-none"
        />

        {/* Scouting Notes */}
        <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Scouting Notes
        </label>
        <textarea
          autoComplete="off"
          value={editData.scoutingNotes}
          onChange={(e) => setEditData({ ...editData, scoutingNotes: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-amber-500/50 focus:outline-none resize-none"
        />

        {/* Location Idea Section */}
        <div className="p-4 bg-[#0f1f17] rounded-lg mb-4 border border-white/10">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
            Location Idea
          </p>
          
          {/* Google Maps Link */}
          <label className="block text-xs text-white/60 mb-2 font-sans">
            Google Maps URL (opens in modal)
          </label>
          <input
            type="url"
            autoComplete="off"
            value={editData.locationIdeaMapUrl || ""}
            onChange={(e) => setEditData({ ...editData, locationIdeaMapUrl: e.target.value })}
            placeholder="https://maps.google.com/..."
            className="w-full px-3 py-2 bg-[#1a2e23] rounded-lg text-white font-sans text-sm mb-3 border border-white/10 focus:border-amber-500/50 focus:outline-none"
          />
          
          {/* External Reference Link */}
          <label className="block text-xs text-white/60 mb-2 font-sans">
            Reference Link (opens in new tab)
          </label>
          <input
            type="url"
            autoComplete="off"
            value={editData.locationIdeaLink || ""}
            onChange={(e) => setEditData({ ...editData, locationIdeaLink: e.target.value })}
            placeholder="https://example.com/location-reference"
            className="w-full px-3 py-2 bg-[#1a2e23] rounded-lg text-white font-sans text-sm border border-white/10 focus:border-amber-500/50 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 transition-colors font-sans text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-black font-semibold font-sans text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
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
          onClick={() => (onEditClick && !forceExpanded ? onEditClick() : setIsEditing(true))}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
          title="Edit location"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          title="Delete location"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Header with Icon and Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0 pr-16">
          {onNameClick && !forceExpanded ? (
            <button onClick={onNameClick} className="text-left max-w-full" title="View full location details">
              <h3 className="text-lg font-bold text-white font-sans uppercase tracking-wide leading-tight hover:text-amber-300 transition-colors cursor-pointer">
                {location.name}
              </h3>
            </button>
          ) : (
            <h3 className="text-lg font-bold text-white font-sans uppercase tracking-wide leading-tight">
              {location.name}
            </h3>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/60 font-sans">
              {location.type === "Not specified" ? location.type : `${location.type}.`}
            </span>
            <span className="text-xs text-white/40">•</span>
            <span className={`text-xs font-sans ${
              location.timeOfDay.toUpperCase().includes("NIGHT") ? "text-indigo-400" : "text-amber-400"
            }`}>
              {location.timeOfDay}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm text-white/70 font-sans leading-relaxed mb-4 ${forceExpanded ? "" : "line-clamp-2"}`}>
        {location.description}
      </p>

      {/* Location Idea Links */}
      {(location.locationIdeaMapUrl || location.locationIdeaLink) && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Location Idea
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {location.locationIdeaMapUrl && (
              <button
                onClick={() => setShowMapModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-amber-400 hover:text-amber-300 text-sm transition-colors"
              >
                <Map className="w-4 h-4" />
                <span className="font-sans">View Map</span>
              </button>
            )}
            {location.locationIdeaLink && (
              <a
                href={location.locationIdeaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="font-sans">Reference Link</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Scouting Notes */}
      {location.scoutingNotes && (
        <div className="p-3 bg-[#0f1f17] rounded-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Scouting Notes
            </span>
            {!forceExpanded && <CardMore accent="amber" onClick={onNameClick} label="View full" />}
          </div>
          <p className={`text-sm text-white/60 font-sans leading-relaxed ${forceExpanded ? "" : "line-clamp-3"}`}>
            {location.scoutingNotes}
          </p>
        </div>
      )}

      {/* Google Maps Modal */}
      <GoogleMapsModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        url={location.locationIdeaMapUrl || ""}
        title={location.name}
      />
    </div>
  )
}
