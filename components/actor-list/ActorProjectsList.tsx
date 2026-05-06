"use client"

import { useState } from "react"
import { Plus, Users, Calendar, Pencil, Trash2 } from "lucide-react"
import { useActorList } from "./ActorListContext"
import { ActorListProject } from "@/types/actor-list"
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal"
import EditProjectWithThumbnailModal from "@/components/ui/EditProjectWithThumbnailModal"

export default function ActorProjectsList() {
  const { projects, selectProject, deleteProject, updateProject, setView } = useActorList()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ActorListProject | null>(null)
  const [editTarget, setEditTarget] = useState<ActorListProject | null>(null)

  const handleDeleteProject = (e: React.MouseEvent, project: ActorListProject) => {
    e.stopPropagation()
    setDeleteTarget(project)
  }

  const handleEditProject = (e: React.MouseEvent, project: ActorListProject) => {
    e.stopPropagation()
    setEditTarget(project)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteProject(deleteTarget.id)
    }
  }

  const handleSaveEdit = (newName: string, thumbnailUrl?: string) => {
    if (editTarget) {
      updateProject(editTarget.id, { name: newName, thumbnailUrl })
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
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-sans">My Actors</h1>
        <p className="text-white/60 text-base font-sans">
          Import and manage actor profiles for your productions.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Existing Projects */}
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative flex rounded-xl border border-white/10 bg-[#1a2e23] hover:border-emerald-500/50 transition-all overflow-hidden"
            onMouseEnter={() => setHoveredId(project.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Thumbnail Section - 1/3 width */}
            <div className="w-1/3 min-h-[140px] bg-[#0f1f17] border-r border-white/10 flex-shrink-0">
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Users className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Content Section - 2/3 width */}
            <button
              onClick={() => selectProject(project.id)}
              className="flex-1 flex flex-col justify-center p-5 text-left cursor-pointer"
            >
              {/* Hover Actions */}
              {hoveredId === project.id && (
                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                  <button
                    onClick={(e) => handleEditProject(e, project)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                    title="Rename"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(e, project)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Project Name */}
              <h3 className="text-base font-semibold text-white mb-2 font-sans pr-16 line-clamp-1">
                {project.name}
              </h3>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{project.actors.length} actors</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </div>
            </button>
          </div>
        ))}

        {/* New Actor List Card */}
        <button
          onClick={() => setView("upload")}
          className="p-5 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 bg-transparent hover:bg-white/5 transition-all flex flex-col items-center justify-center min-h-[180px] group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 group-hover:border-white/50 flex items-center justify-center mb-4 transition-colors">
            <Plus className="w-6 h-6 text-white/40 group-hover:text-white/60" />
          </div>
          <span className="text-white/40 group-hover:text-white/60 font-sans text-sm transition-colors">
            New Actor List
          </span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Actor List"
        itemName={deleteTarget?.name || ""}
        description="This will permanently delete this actor list and all its actor profiles. This action cannot be undone."
      />

      {/* Edit Project Modal */}
      <EditProjectWithThumbnailModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        currentName={editTarget?.name || ""}
        currentThumbnail={editTarget?.thumbnailUrl}
        title="Edit Actor List"
        label="Actor List Name"
        accentColor="emerald"
      />
      </div>
    </div>
  )
}
