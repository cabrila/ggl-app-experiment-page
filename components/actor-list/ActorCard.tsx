"use client"

import { useState } from "react"
import { Pencil, Trash2, Phone, Mail, X, Save, Plus, Video, ExternalLink } from "lucide-react"
import { Actor, CustomField } from "@/types/actor-list"
import ImageModal from "@/components/ui/ImageModal"
import MediaModal from "@/components/ui/MediaModal"

interface ActorCardProps {
  actor: Actor
  onUpdate: (actor: Actor) => void
  onDelete: () => void
}

// Helper to detect media platform from URL
function getMediaPlatform(url: string): { name: string; icon: "youtube" | "vimeo" | "drive" | "link" } | null {
  if (!url) return null
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return { name: "YouTube", icon: "youtube" }
  }
  if (lowerUrl.includes("vimeo.com")) {
    return { name: "Vimeo", icon: "vimeo" }
  }
  if (lowerUrl.includes("drive.google.com")) {
    return { name: "Google Drive", icon: "drive" }
  }
  return { name: "Media Link", icon: "link" }
}

export default function ActorCard({ actor, onUpdate, onDelete }: ActorCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedActor, setEditedActor] = useState(actor)
  const [newFieldName, setNewFieldName] = useState("")
  const [showImageModal, setShowImageModal] = useState(false)
  const [showMediaModal, setShowMediaModal] = useState(false)

  const handleSave = () => {
    onUpdate(editedActor)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedActor(actor)
    setIsEditing(false)
    setNewFieldName("")
  }

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return
    const newField: CustomField = {
      id: crypto.randomUUID(),
      name: newFieldName.trim(),
      value: "",
    }
    setEditedActor({
      ...editedActor,
      customFields: [...(editedActor.customFields || []), newField],
    })
    setNewFieldName("")
  }

  const handleUpdateCustomField = (fieldId: string, value: string) => {
    setEditedActor({
      ...editedActor,
      customFields: (editedActor.customFields || []).map((f) =>
        f.id === fieldId ? { ...f, value } : f
      ),
    })
  }

  const handleRemoveCustomField = (fieldId: string) => {
    setEditedActor({
      ...editedActor,
      customFields: (editedActor.customFields || []).filter((f) => f.id !== fieldId),
    })
  }

  const mediaPlatform = getMediaPlatform(actor.mediaMaterial || "")

  // Edit Mode
  if (isEditing) {
    return (
      <div className="p-5 rounded-xl border border-emerald-500/50 bg-[#1a2e23]">
        {/* Actor Name */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Actor Name
          </label>
          <input
            type="text"
            value={editedActor.name}
            onChange={(e) => setEditedActor({ ...editedActor, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Age and Playing Age */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Age
            </label>
            <input
              type="number"
              value={editedActor.age}
              onChange={(e) => setEditedActor({ ...editedActor, age: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Playing Age
            </label>
            <input
              type="text"
              value={editedActor.playingAge}
              onChange={(e) => setEditedActor({ ...editedActor, playingAge: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={editedActor.phone}
            onChange={(e) => setEditedActor({ ...editedActor, phone: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            type="email"
            value={editedActor.email}
            onChange={(e) => setEditedActor({ ...editedActor, email: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Headshot URL */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Headshot (URL)
          </label>
          <input
            type="url"
            value={editedActor.headshotUrl}
            onChange={(e) => setEditedActor({ ...editedActor, headshotUrl: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50 text-sm"
          />
        </div>

        {/* Media Material URL */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Media Material (YouTube, Vimeo, Google Drive)
          </label>
          <div className="relative">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="url"
              value={editedActor.mediaMaterial || ""}
              onChange={(e) => setEditedActor({ ...editedActor, mediaMaterial: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50 text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Notes
          </label>
          <textarea
            value={editedActor.notes}
            onChange={(e) => setEditedActor({ ...editedActor, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        {/* Custom Fields */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Custom Fields
          </label>
          
          {/* Existing Custom Fields */}
          {(editedActor.customFields || []).map((field) => (
            <div key={field.id} className="flex items-center gap-2 mb-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white/60 text-sm truncate">
                  {field.name}
                </div>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleUpdateCustomField(field.id, e.target.value)}
                  placeholder="Enter value..."
                  className="px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>
              <button
                onClick={() => handleRemoveCustomField(field.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove field"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add New Custom Field */}
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="Field name..."
              className="flex-1 px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddCustomField()
                }
              }}
            />
            <button
              onClick={handleAddCustomField}
              disabled={!newFieldName.trim()}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
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
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
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
          title="Edit actor"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          title="Delete actor"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Header with Headshot and Name */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => actor.headshotUrl && setShowImageModal(true)}
          className={`w-16 h-16 rounded-full overflow-hidden bg-white/10 shrink-0 transition-all ${
            actor.headshotUrl ? "cursor-pointer hover:ring-2 hover:ring-emerald-500/50 hover:ring-offset-2 hover:ring-offset-[#1a2e23]" : "cursor-default"
          }`}
          disabled={!actor.headshotUrl}
          title={actor.headshotUrl ? "Click to view full image" : undefined}
        >
          {actor.headshotUrl ? (
            <img
              src={actor.headshotUrl}
              alt={actor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-xl font-bold">
              {actor.name.charAt(0)}
            </div>
          )}
        </button>
        <div className="min-w-0 pr-16">
          <h3 className="text-lg font-bold text-white uppercase tracking-wide font-sans truncate">
            {actor.name}
          </h3>
          <p className="text-sm font-sans">
            <span className="text-white/60">AGE</span>{" "}
            <span className="text-white">{actor.age}</span>{" "}
            <span className="text-white/60 ml-2">PLAYS</span>{" "}
            <span className="text-emerald-400">{actor.playingAge}</span>
          </p>
        </div>
      </div>

      {/* Contact Details */}
      <div className="p-3 bg-[#0f1f17] rounded-lg mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          Contact Details
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-white/40" />
            <span className="text-white/80 font-sans">{actor.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-white/40" />
            <span className="text-white/80 font-sans">{actor.email}</span>
          </div>
        </div>
      </div>

      {/* Media Material */}
      {actor.mediaMaterial && mediaPlatform && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Media Material
          </p>
          <button
            onClick={() => setShowMediaModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg text-sky-400 hover:text-sky-300 text-sm transition-colors group/link"
            title="Click to play video"
          >
            <Video className="w-4 h-4" />
            <span className="font-sans">{mediaPlatform.name}</span>
            <ExternalLink className="w-3 h-3 opacity-60 group-hover/link:opacity-100 transition-opacity" />
          </button>
        </div>
      )}

      {/* Custom Fields */}
      {actor.customFields && actor.customFields.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Additional Info
          </p>
          <div className="space-y-1.5">
            {actor.customFields.map((field) => (
              <div key={field.id} className="flex items-start gap-2 text-sm">
                <span className="text-white/50 font-sans shrink-0">{field.name}:</span>
                <span className="text-white/80 font-sans">{field.value || "-"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {actor.notes && (
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Notes
          </p>
          <p className="text-sm text-white/70 font-sans leading-relaxed">
            {actor.notes}
          </p>
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        src={actor.headshotUrl}
        alt={actor.name}
      />

      {/* Media Modal */}
      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        url={actor.mediaMaterial || ""}
        title={`${actor.name} - Media Material`}
      />
    </div>
  )
}
