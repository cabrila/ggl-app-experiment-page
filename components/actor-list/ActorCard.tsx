"use client"

import { useState } from "react"
import { Pencil, Trash2, Phone, Mail, X, Save, Plus, Video, ExternalLink, Images } from "lucide-react"
import { Actor, CustomField } from "@/types/actor-list"
import ImageModal from "@/components/ui/ImageModal"
import MediaModal from "@/components/ui/MediaModal"
import ProfilePictureField from "@/components/ui/ProfilePictureField"
import ImageUploadField from "@/components/ui/ImageUploadField"
import ImageCarouselModal from "@/components/ui/ImageCarouselModal"
import { getVideoEmbed } from "@/utils/mediaEmbed"

interface ActorCardProps {
  actor: Actor
  onUpdate: (actor: Actor) => void
  onDelete: () => void
  /** When true, the "More Information" panel is rendered fully expanded (used inside the detail modal). */
  forceExpanded?: boolean
  /** When provided (and not forceExpanded), clicking the actor name opens the detail modal. */
  onNameClick?: () => void
  /** When provided (and not forceExpanded), clicking the edit button opens the detail modal in edit mode. */
  onEditClick?: () => void
  /** When true, the card mounts directly in edit mode (used by the modal's edit flow). */
  startInEdit?: boolean
  /**
   * Optional content rendered in the source-label field position (directly below the
   * header, above Contact Details) — mirrors the Submissions card's "Form Source Label".
   * Opt-in: consumers that don't pass it (e.g. My Actors → Actor cards) render unchanged.
   */
  sourceLabel?: React.ReactNode
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

export default function ActorCard({ actor, onUpdate, onDelete, forceExpanded = false, onNameClick, onEditClick, startInEdit = false, sourceLabel }: ActorCardProps) {
  const [isEditing, setIsEditing] = useState(startInEdit)
  const [editedActor, setEditedActor] = useState(actor)
  const [newFieldName, setNewFieldName] = useState("")
  const [showImageModal, setShowImageModal] = useState(false)
  const [activeImage, setActiveImage] = useState<string | undefined>(undefined)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [carouselOpen, setCarouselOpen] = useState(false)
  const [carouselStart, setCarouselStart] = useState(0)

  const handleSave = () => {
    const cleanedVideos = (editedActor.videos || []).map((v) => v.trim()).filter(Boolean)
    const cleanedPhotos = (editedActor.photos || []).map((p) => p.trim()).filter(Boolean)
    onUpdate({
      ...editedActor,
      videos: cleanedVideos.length > 0 ? cleanedVideos : undefined,
      photos: cleanedPhotos.length > 0 ? cleanedPhotos : undefined,
    })
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

  const handleUpdateVideo = (index: number, value: string) => {
    setEditedActor({
      ...editedActor,
      videos: (editedActor.videos || []).map((v, i) => (i === index ? value : v)),
    })
  }

  const handleRemoveVideo = (index: number) => {
    setEditedActor({
      ...editedActor,
      videos: (editedActor.videos || []).filter((_, i) => i !== index),
    })
  }

  const handleAddVideo = () => {
    setEditedActor({
      ...editedActor,
      videos: [...(editedActor.videos || []), ""],
    })
  }

  const mediaPlatform = getMediaPlatform(actor.mediaMaterial || "")

  // The "More Information" panel holds extra custom fields, the submitted
  // media link/video, embedded videos and uploaded photos carried over from
  // casting submissions.
  const actorVideos = actor.videos || []
  const actorPhotos = actor.photos || []
  const hasCustomFields = !!(actor.customFields && actor.customFields.length > 0)
  const hasMedia = !!(actor.mediaMaterial && mediaPlatform)
  const hasVideos = actorVideos.length > 0
  const hasPhotos = actorPhotos.length > 0
  const hasMoreInfo = hasCustomFields || hasMedia || hasVideos || hasPhotos

  // Compact summary of what lives inside "More Information" for the grid snapshot.
  const moreInfoSummary = [
    hasCustomFields ? `${actor.customFields!.length} field${actor.customFields!.length !== 1 ? "s" : ""}` : null,
    hasMedia ? "media" : null,
    hasVideos ? `${actorVideos.length} video${actorVideos.length !== 1 ? "s" : ""}` : null,
    hasPhotos ? `${actorPhotos.length} photo${actorPhotos.length !== 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

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
            autoComplete="off"
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
              autoComplete="off"
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
              autoComplete="off"
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
            autoComplete="off"
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
            autoComplete="off"
            value={editedActor.email}
            onChange={(e) => setEditedActor({ ...editedActor, email: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Profile Picture (Photo) */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Profile Picture
          </label>
          <ProfilePictureField
            value={editedActor.headshotUrl}
            onChange={(val) => setEditedActor({ ...editedActor, headshotUrl: val })}
            accent="emerald"
            placeholder="Click or drag to upload a profile picture"
          />
        </div>

        {/* Headshot URL */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Headshot (URL)
          </label>
          <input
            type="url"
            autoComplete="off"
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
              autoComplete="off"
              value={editedActor.mediaMaterial || ""}
              onChange={(e) => setEditedActor({ ...editedActor, mediaMaterial: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50 text-sm"
            />
          </div>
        </div>

        {/* Embedded Videos / Links */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Embedded Videos / Links
          </label>
          {(editedActor.videos || []).map((video, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="url"
                  autoComplete="off"
                  value={video}
                  onChange={(e) => handleUpdateVideo(index, e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>
              <button
                onClick={() => handleRemoveVideo(index)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddVideo}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm transition-colors mt-1"
          >
            <Plus className="w-4 h-4" />
            Add Video / Link
          </button>
        </div>

        {/* Photos - multi-image uploader (click or drag, like Scene Inspirations) */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Photos
          </label>
          <ImageUploadField
            value={editedActor.photos ?? []}
            onChange={(imgs) => setEditedActor({ ...editedActor, photos: imgs })}
            multiple
            accent="emerald"
            placeholder="Add image"
          />
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Notes
          </label>
          <textarea
            autoComplete="off"
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
                  autoComplete="off"
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
              autoComplete="off"
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
    <div className="group relative p-5 rounded-xl border bg-[#1a2e23] border-white/10 hover:border-white/20 transition-colors">
      {/* Action Icons - Upper Right Corner */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => (onEditClick && !forceExpanded ? onEditClick() : setIsEditing(true))}
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

      {/* Header with Avatar */}
      <div className="flex items-start gap-4 mb-4 pt-7">
        {/* Avatar - Clickable to open modal */}
        <button
          onClick={() => actor.headshotUrl && setShowImageModal(true)}
          className={`w-14 h-14 rounded-full overflow-hidden bg-emerald-500/20 flex-shrink-0 transition-all ${
            actor.headshotUrl
              ? "cursor-pointer hover:ring-2 hover:ring-emerald-500/50 hover:ring-offset-2 hover:ring-offset-[#1a2e23]"
              : "cursor-default"
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
            <div className="w-full h-full flex items-center justify-center text-emerald-400 text-xl font-bold">
              {actor.name.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* Name & Age */}
        <div className="flex-1 min-w-0 pt-1">
          {onNameClick && !forceExpanded ? (
            <button onClick={onNameClick} className="text-left max-w-full" title="View full actor details">
              <h3 className="text-lg font-bold text-white font-sans uppercase tracking-wide truncate pr-20 hover:text-emerald-300 transition-colors cursor-pointer">
                {actor.name}
              </h3>
            </button>
          ) : (
            <h3 className="text-lg font-bold text-white font-sans uppercase tracking-wide truncate pr-20">
              {actor.name}
            </h3>
          )}
          <div className="flex items-center gap-2 text-sm">
            {actor.age ? (
              <span className="text-white/60">
                AGE <span className="text-white">{actor.age}</span>
              </span>
            ) : null}
            {actor.playingAge ? (
              <span className="text-white/60">
                PLAYS <span className="text-emerald-400">{actor.playingAge}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Source Label - optional, opt-in slot (mirrors Submissions card's Form Source Label placement) */}
      {sourceLabel}

      {/* Contact Details */}
      <div className="p-3 bg-[#0f1f17] rounded-lg mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          Contact Details
        </p>
        <div className="space-y-2">
          {actor.phone && (
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Phone className="w-4 h-4 text-white/40" />
              <span>{actor.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Mail className="w-4 h-4 text-white/40" />
            <span className="truncate">{actor.email}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {actor.notes && (
        <div className="p-3 bg-[#0f1f17] rounded-lg">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Notes
          </p>
          <p className={`text-sm text-white/80 font-sans leading-relaxed ${forceExpanded ? "" : "line-clamp-3"}`}>
            {actor.notes}
          </p>
        </div>
      )}

      {/* More Information - extra submission fields + media material */}
      {hasMoreInfo && !forceExpanded && (
        // Grid snapshot: a compact summary with a [...] hint; full panel in modal.
        <button
          onClick={onNameClick}
          className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-white/10 bg-[#0f1f17] hover:bg-[#0f1f17]/70 transition-colors text-left"
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-white/60 uppercase tracking-wider">
              More Information
            </span>
            {moreInfoSummary && (
              <span className="block text-xs text-white/40 font-sans truncate mt-0.5">{moreInfoSummary}</span>
            )}
          </span>
          <span className="font-mono text-sm text-emerald-400 shrink-0" aria-hidden="true">[...]</span>
        </button>
      )}
      {hasMoreInfo && forceExpanded && (
        <div className="mt-3 rounded-lg border border-white/10 overflow-hidden">
          <div className="w-full flex items-center px-3 py-2.5 bg-[#0f1f17]">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              More Information
            </span>
          </div>
          {(
            <div className="px-3 py-3 bg-[#0f1f17] border-t border-white/10 space-y-3">
              {hasCustomFields && (
                <div className="space-y-2">
                  {actor.customFields!.map((field) => (
                    <div key={field.id} className="flex items-start gap-2 text-sm">
                      <span className="text-white/50 font-sans shrink-0">{field.name}:</span>
                      <span className="text-white/80 font-sans break-words">{field.value || "-"}</span>
                    </div>
                  ))}
                </div>
              )}
              {hasMedia && (
                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                    Media Material
                  </p>
                  <button
                    onClick={() => setShowMediaModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg text-sky-400 hover:text-sky-300 text-sm transition-colors group/link"
                    title="Click to play video"
                  >
                    <Video className="w-4 h-4" />
                    <span className="font-sans">{mediaPlatform!.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover/link:opacity-100 transition-opacity" />
                  </button>
                </div>
              )}
              {hasVideos && (
                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                    Videos
                  </p>
                  <div className="space-y-3">
                    {actorVideos.map((video, idx) => {
                      const embed = getVideoEmbed(video)
                      return embed ? (
                        <div key={idx} className="aspect-video w-full rounded-lg overflow-hidden border border-white/10">
                          <iframe
                            src={embed.embedUrl}
                            title={`${embed.platform} video ${idx + 1}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a
                          key={idx}
                          href={video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg text-sky-400 hover:text-sky-300 text-sm transition-colors group/link break-all"
                        >
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          <span className="font-sans">{video}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
              {hasPhotos && (
                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                    Photos
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {(forceExpanded ? actorPhotos : actorPhotos.slice(0, 3)).map((img, idx) => {
                      const isLastVisible = !forceExpanded && idx === 2 && actorPhotos.length > 3
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { setCarouselStart(idx); setCarouselOpen(true) }}
                          className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-[#0f1f17] cursor-zoom-in"
                          title="View images"
                        >
                          <img src={img || "/placeholder.svg"} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                          {isLastVisible && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-sans text-sm font-semibold">
                              +{actorPhotos.length - 3}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => { setCarouselStart(0); setCarouselOpen(true) }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                  >
                    <Images className="w-4 h-4" />
                    <span className="font-sans">View Images ({actorPhotos.length})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => { setShowImageModal(false); setActiveImage(undefined) }}
        src={activeImage || actor.headshotUrl}
        alt={actor.name}
      />

      {/* Media Modal */}
      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        url={actor.mediaMaterial || ""}
        title={`${actor.name} - Media Material`}
      />

      {/* Photos Carousel */}
      <ImageCarouselModal
        isOpen={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        images={actorPhotos}
        startIndex={carouselStart}
        title={`${actor.name} — Photos`}
      />
    </div>
  )
}
