"use client"

import { useState } from "react"
import { Film, Pencil, Trash2, X, Save, ChevronDown, ChevronUp, MapPin, Clock } from "lucide-react"
import { Scene } from "@/types/scene-list"

interface SceneCardProps {
  scene: Scene
  onUpdate: (scene: Scene) => void
  onDelete: () => void
}

export default function SceneCard({ scene, onUpdate, onDelete }: SceneCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Scene>(scene)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }
  const handleCancel = () => {
    setEditData(scene)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-5 rounded-xl border border-teal-500/50 bg-[#1a2e23]">
        <div className="grid grid-cols-[80px_1fr] gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
              #
            </label>
            <input
              type="number"
              value={editData.sceneNumber}
              onChange={(e) => setEditData({ ...editData, sceneNumber: Number(e.target.value) })}
              className="w-full px-3 py-3 bg-[#0f1f17] rounded-lg text-white font-mono border border-white/10 focus:border-teal-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
              Scene Heading
            </label>
            <input
              type="text"
              value={editData.sceneHeading}
              onChange={(e) => setEditData({ ...editData, sceneHeading: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans border border-white/10 focus:border-teal-500/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
              Location
            </label>
            <input
              type="text"
              value={editData.location}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans border border-white/10 focus:border-teal-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
              Time of Day
            </label>
            <input
              type="text"
              value={editData.timeOfDay}
              onChange={(e) => setEditData({ ...editData, timeOfDay: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans border border-white/10 focus:border-teal-500/50 focus:outline-none"
            />
          </div>
        </div>

        <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
          Raw Text
        </label>
        <textarea
          value={editData.rawText}
          onChange={(e) => setEditData({ ...editData, rawText: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-teal-500/50 focus:outline-none resize-none"
        />

        <label className="block text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
          Notes
        </label>
        <textarea
          value={editData.notes || ""}
          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-teal-500/50 focus:outline-none resize-none"
        />

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

  return (
    <div className="group relative p-5 rounded-xl border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors">
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
          title="Edit scene"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          title="Delete scene"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-teal-500/20 shrink-0">
          <Film className="w-4 h-4 text-teal-400 mb-0.5" />
          <span className="text-xs font-mono text-teal-300 leading-none">{scene.sceneNumber}</span>
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <h3 className="text-base font-bold text-white font-mono uppercase leading-tight tracking-wide">
            {scene.sceneHeading}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/50">
            {scene.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {scene.location}
              </span>
            )}
            {scene.timeOfDay && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {scene.timeOfDay}
              </span>
            )}
          </div>
        </div>
      </div>

      {scene.notes && (
        <div className="p-3 bg-[#0f1f17] rounded-lg mb-3">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-white/60 font-sans leading-relaxed">{scene.notes}</p>
        </div>
      )}

      {scene.rawText && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors w-full"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="font-sans">{isExpanded ? "Hide raw text" : "Show raw text"}</span>
          </button>

          {isExpanded && (
            <div className="mt-3 p-3 bg-[#0f1f17] rounded-lg">
              <p className="text-sm text-white/70 font-sans leading-relaxed whitespace-pre-wrap">
                {scene.rawText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
