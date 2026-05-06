"use client"

import { useState } from "react"
import { FileText, Users, Calendar, Plus, Pencil, Trash2 } from "lucide-react"
import { useCharacterBible } from "./CharacterBibleContext"
import { CharacterBible } from "@/types/character-bible"
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal"
import EditProjectWithThumbnailModal from "@/components/ui/EditProjectWithThumbnailModal"

export default function ProjectsList() {
  const { bibles, setView, setCurrentBible, deleteBible, updateBible } = useCharacterBible()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CharacterBible | null>(null)
  const [editTarget, setEditTarget] = useState<CharacterBible | null>(null)

  const handleOpenBible = (bible: CharacterBible) => {
    setCurrentBible(bible)
    setView("results")
  }

  const handleNewBible = () => {
    setView("upload")
  }

  const handleDelete = (e: React.MouseEvent, bible: CharacterBible) => {
    e.stopPropagation()
    setDeleteTarget(bible)
  }

  const handleEdit = (e: React.MouseEvent, bible: CharacterBible) => {
    e.stopPropagation()
    setEditTarget(bible)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteBible(deleteTarget.id)
    }
  }

  const handleSaveEdit = (newName: string, thumbnailUrl?: string) => {
    if (editTarget) {
      updateBible(editTarget.id, { name: newName, thumbnailUrl })
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-sans">
          My Characters
        </h1>
        <p className="text-white/60 text-base font-sans">
          Create and manage character bibles extracted from your scripts.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Existing Projects */}
        {bibles.map((bible) => (
          <div
            key={bible.id}
            onMouseEnter={() => setHoveredId(bible.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative flex rounded-xl border text-left transition-all duration-200 overflow-hidden ${
              hoveredId === bible.id
                ? "bg-white/[0.07] border-emerald-500/50"
                : "bg-white/[0.03] border-white/10 hover:border-white/20"
            }`}
          >
            {/* Thumbnail Section - 1/3 width */}
            <div className="w-1/3 min-h-[140px] bg-[#0f1f17] border-r border-white/10 flex-shrink-0">
              {bible.thumbnailUrl ? (
                <img
                  src={bible.thumbnailUrl}
                  alt={bible.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-xl bg-sky-500/20 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-sky-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Content Section - 2/3 width */}
            <button
              onClick={() => handleOpenBible(bible)}
              className="flex-1 flex flex-col justify-center p-5 text-left"
            >
              {/* Action buttons on hover */}
              {hoveredId === bible.id && (
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    onClick={(e) => handleEdit(e, bible)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Rename"
                  >
                    <Pencil className="w-4 h-4 text-white/70" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, bible)}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              )}

              {/* Project Name */}
              <h3 className="text-base font-semibold text-white mb-2 font-sans pr-16 line-clamp-1">
                {bible.name}
              </h3>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {bible.characters.length} characters
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(bible.createdAt)}
                </span>
              </div>
            </button>
          </div>
        ))}

        {/* New Character Bible Card */}
        <button
          onClick={handleNewBible}
          className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/[0.02] text-left transition-all duration-200 min-h-[180px]"
        >
          <Plus className="w-8 h-8 text-white/40 mb-3" />
          <span className="text-white/50 font-medium font-sans">
            New Character Bible
          </span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Character Bible"
        itemName={deleteTarget?.name || ""}
        description="This will permanently delete this character bible and all its characters. This action cannot be undone."
      />

      {/* Edit Project Modal */}
      <EditProjectWithThumbnailModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        currentName={editTarget?.name || ""}
        currentThumbnail={editTarget?.thumbnailUrl}
        title="Edit Character Bible"
        label="Character Bible Name"
        accentColor="sky"
      />
      </div>
    </div>
  )
}
