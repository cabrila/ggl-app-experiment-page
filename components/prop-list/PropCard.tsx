"use client"

import { useState } from "react"
import { Package, Pencil, Trash2, X, Save, Plus, ExternalLink, Images } from "lucide-react"
import { Prop, PropCategory } from "@/types/prop-list"
import CardMore from "@/components/ui/CardMore"
import ImageUploadField from "@/components/ui/ImageUploadField"
import ImageCarouselModal from "@/components/ui/ImageCarouselModal"

const CATEGORIES: PropCategory[] = [
  "weapon",
  "container",
  "surveillance_device",
  "tool",
  "currency",
  "contraband",
  "equipment",
  "food_or_drink",
  "vehicle",
  "wardrobe",
  "document",
  "other",
]

const CATEGORY_LABELS: Record<PropCategory, string> = {
  weapon: "Weapon",
  container: "Container",
  surveillance_device: "Surveillance Device",
  tool: "Tool",
  currency: "Currency",
  contraband: "Contraband",
  equipment: "Equipment",
  food_or_drink: "Food / Drink",
  vehicle: "Vehicle",
  wardrobe: "Wardrobe",
  document: "Document",
  other: "Other",
}

interface PropCardProps {
  prop: Prop
  onUpdate: (prop: Prop) => void
  onDelete: () => void
  /** When true, collapsible sections are rendered fully expanded (used inside the detail modal). */
  forceExpanded?: boolean
  /** When provided (and not forceExpanded), clicking the prop name opens the detail modal. */
  onNameClick?: () => void
  /** When provided (and not forceExpanded), clicking the edit button opens the detail modal in edit mode. */
  onEditClick?: () => void
  /** When true, the card mounts directly in edit mode (used by the modal's edit flow). */
  startInEdit?: boolean
}

export default function PropCard({
  prop,
  onUpdate,
  onDelete,
  forceExpanded = false,
  onNameClick,
  onEditClick,
  startInEdit = false,
}: PropCardProps) {
  const [isEditing, setIsEditing] = useState(startInEdit)
  const [editData, setEditData] = useState<Prop>(prop)
  const [carouselOpen, setCarouselOpen] = useState(false)
  const [carouselStart, setCarouselStart] = useState(0)

  const referenceImages = prop.referenceImages ?? []

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }
  const handleCancel = () => {
    setEditData(prop)
    setIsEditing(false)
  }

  const updateAppearance = (idx: number, field: "sceneHeading" | "handledBy" | "citation", value: string) => {
    const updated = [...editData.sceneAppearances]
    updated[idx] = { ...updated[idx], [field]: value }
    setEditData({ ...editData, sceneAppearances: updated })
  }

  const removeAppearance = (idx: number) => {
    const updated = editData.sceneAppearances.filter((_, i) => i !== idx)
    setEditData({ ...editData, sceneAppearances: updated })
  }

  const addAppearance = () => {
    setEditData({
      ...editData,
      sceneAppearances: [
        ...editData.sceneAppearances,
        { id: crypto.randomUUID(), sceneHeading: "", handledBy: "", citation: "" },
      ],
    })
  }

  if (isEditing) {
    return (
      <div className="p-5 rounded-xl border border-rose-500/50 bg-[#1a2e23]">
        <label className="block text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
          Prop Name
        </label>
        <input
          type="text"
          autoComplete="off"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-rose-500/50 focus:outline-none"
        />

        <div className="mb-4">
          <label className="block text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
            Category
          </label>
          <select
            value={editData.category}
            onChange={(e) => setEditData({ ...editData, category: e.target.value as PropCategory })}
            className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans border border-white/10 focus:border-rose-500/50 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0f1f17] text-white">
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <label className="block text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
          Description
        </label>
        <textarea
          autoComplete="off"
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-rose-500/50 focus:outline-none resize-none"
        />

        <label className="block text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
          Notes
        </label>
        <textarea
          autoComplete="off"
          value={editData.notes || ""}
          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-rose-500/50 focus:outline-none resize-none"
        />

        {/* Prop Image and Sources */}
        <div className="p-4 bg-[#0f1f17] rounded-lg mb-4 border border-white/10">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3">
            Prop Image and Sources
          </p>

          <label className="block text-xs text-white/60 mb-2 font-sans">Prop Images</label>
          <ImageUploadField
            value={editData.referenceImages ?? []}
            onChange={(imgs) => setEditData({ ...editData, referenceImages: imgs })}
            multiple
            accent="rose"
            placeholder="Add image"
          />

          <label className="block text-xs text-white/60 mt-3 mb-2 font-sans">
            References Link (opens in new tab)
          </label>
          <input
            type="url"
            autoComplete="off"
            value={editData.referenceLink || ""}
            onChange={(e) => setEditData({ ...editData, referenceLink: e.target.value })}
            placeholder="https://example.com/prop-reference"
            className="w-full px-3 py-2 bg-[#1a2e23] rounded-lg text-white font-sans text-sm border border-white/10 focus:border-rose-500/50 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Scene Appearances
            </span>
            <button
              type="button"
              onClick={addAppearance}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
          <div className="space-y-3">
            {editData.sceneAppearances.map((app, idx) => (
              <div key={app.id} className="p-3 bg-[#0f1f17] rounded-lg border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 font-sans">Appearance {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeAppearance(idx)}
                    className="text-red-400/70 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  autoComplete="off"
                  value={app.sceneHeading}
                  onChange={(e) => updateAppearance(idx, "sceneHeading", e.target.value)}
                  placeholder="Scene heading"
                  className="w-full px-3 py-2 bg-[#1a2e23] rounded text-white text-sm font-sans mb-2 border border-white/10 focus:border-rose-500/50 focus:outline-none"
                />
                <input
                  autoComplete="off"
                  value={app.handledBy}
                  onChange={(e) => updateAppearance(idx, "handledBy", e.target.value)}
                  placeholder="Handled by"
                  className="w-full px-3 py-2 bg-[#1a2e23] rounded text-white text-sm font-sans mb-2 border border-white/10 focus:border-rose-500/50 focus:outline-none"
                />
                <textarea
                  autoComplete="off"
                  value={app.citation}
                  onChange={(e) => updateAppearance(idx, "citation", e.target.value)}
                  placeholder="Citation"
                  rows={2}
                  className="w-full px-3 py-2 bg-[#1a2e23] rounded text-white text-sm font-sans border border-white/10 focus:border-rose-500/50 focus:outline-none resize-none"
                />
              </div>
            ))}
          </div>
        </div>

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
          onClick={() => (onEditClick && !forceExpanded ? onEditClick() : setIsEditing(true))}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
          title="Edit prop"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          title="Delete prop"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-rose-400" />
        </div>
        <div className="flex-1 min-w-0 pr-16">
          {onNameClick && !forceExpanded ? (
            <button onClick={onNameClick} className="text-left max-w-full" title="View full prop details">
              <h3 className="text-lg font-bold text-white font-sans leading-tight hover:text-rose-300 transition-colors cursor-pointer">
                {prop.name}
              </h3>
            </button>
          ) : (
            <h3 className="text-lg font-bold text-white font-sans leading-tight">{prop.name}</h3>
          )}
          <span className="text-xs text-rose-400 font-sans uppercase tracking-wide mt-1 block">
            {CATEGORY_LABELS[prop.category]}
          </span>
        </div>
      </div>

      {prop.description && (
        <p className={`text-sm text-white/70 font-sans leading-relaxed mb-3 ${forceExpanded ? "" : "line-clamp-2"}`}>
          {prop.description}
        </p>
      )}

      {prop.notes && (
        <div className="p-3 bg-[#0f1f17] rounded-lg mb-3">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">Notes</p>
          <p className={`text-sm text-white/60 font-sans leading-relaxed ${forceExpanded ? "" : "line-clamp-2"}`}>
            {prop.notes}
          </p>
        </div>
      )}

      {(referenceImages.length > 0 || prop.referenceLink) && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
            Prop Image and Sources
          </p>
          {referenceImages.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {(forceExpanded ? referenceImages : referenceImages.slice(0, 3)).map((img, idx) => {
                  const isLastVisible = !forceExpanded && idx === 2 && referenceImages.length > 3
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCarouselStart(idx)
                        setCarouselOpen(true)
                      }}
                      className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#0f1f17] cursor-zoom-in"
                      title="View images"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`${prop.name} reference ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isLastVisible && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-sans text-sm font-semibold">
                          +{referenceImages.length - 3}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => {
                  setCarouselStart(0)
                  setCarouselOpen(true)
                }}
                className="inline-flex items-center gap-2 px-3 py-2 mb-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 text-sm transition-colors"
              >
                <Images className="w-4 h-4" />
                <span className="font-sans">View Images ({referenceImages.length})</span>
              </button>
            </>
          )}
          {prop.referenceLink && (
            <a
              href={prop.referenceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="font-sans">References Link</span>
            </a>
          )}

          <ImageCarouselModal
            isOpen={carouselOpen}
            onClose={() => setCarouselOpen(false)}
            images={referenceImages}
            startIndex={carouselStart}
            title={`${prop.name} — Images`}
          />
        </div>
      )}

      {prop.sceneAppearances.length > 0 && (
        <div className="mt-3">
          {forceExpanded ? (
            <>
              <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
                {prop.sceneAppearances.length} Scene Appearance
                {prop.sceneAppearances.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {prop.sceneAppearances.map((app) => (
                  <div key={app.id} className="p-3 bg-[#0f1f17] rounded-lg">
                    <p className="text-xs font-semibold text-rose-400 font-mono uppercase tracking-wide mb-1">
                      {app.sceneHeading}
                    </p>
                    {app.handledBy && (
                      <p className="text-xs text-white/50 font-sans mb-1">Handled by: {app.handledBy}</p>
                    )}
                    {app.citation && (
                      <p className="text-xs text-white/60 font-sans italic leading-relaxed">
                        &ldquo;{app.citation}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Grid snapshot: show the first appearance heading with a [...] hint
            // so cards stay uniform; full list lives in the detail modal.
            <div className="p-3 bg-[#0f1f17] rounded-lg">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                  Scene Appearances ({prop.sceneAppearances.length})
                </span>
                <CardMore accent="rose" onClick={onNameClick} label="View all" />
              </div>
              <p className="text-xs font-mono text-white/60 uppercase tracking-wide truncate">
                {prop.sceneAppearances[0].sceneHeading}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
