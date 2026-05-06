"use client"

import { useState } from "react"
import { MapPin, Calendar, Plus, Pencil, Trash2 } from "lucide-react"
import { useLocationScouting } from "./LocationScoutingContext"
import { LocationProject } from "@/types/location-scouting"
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal"
import EditProjectWithThumbnailModal from "@/components/ui/EditProjectWithThumbnailModal"

export default function LocationProjectsList() {
  const { projects, setView, setCurrentProject, deleteProject, updateProject } = useLocationScouting()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LocationProject | null>(null)
  const [editTarget, setEditTarget] = useState<LocationProject | null>(null)

  const handleProjectClick = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      setView("results")
    }
  }

  const handleDeleteProject = (e: React.MouseEvent, project: LocationProject) => {
    e.stopPropagation()
    setDeleteTarget(project)
  }

  const handleEditProject = (e: React.MouseEvent, project: LocationProject) => {
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
      updateProject({ ...editTarget, name: newName, thumbnailUrl, updatedAt: new Date() })
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white font-sans mb-2">My Locations</h1>
        <p className="text-white/60 text-base font-sans">
          Scout and manage location lists generated from your scripts.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Existing Projects */}
        {projects.map((project) => (
          <div
            key={project.id}
            onMouseEnter={() => setHoveredId(project.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group relative flex rounded-xl border border-white/10 bg-[#1a2e23] hover:border-amber-500/50 transition-all overflow-hidden"
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
                  <div className="w-16 h-16 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Content Section - 2/3 width */}
            <button
              onClick={() => handleProjectClick(project.id)}
              className="flex-1 flex flex-col justify-center p-5 text-left"
            >
              {/* Hover Actions */}
              {hoveredId === project.id && (
                <div className="absolute top-3 right-3 flex items-center gap-1">
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
              <h3 className="text-base font-bold text-white font-sans mb-2 pr-16 line-clamp-1">
                {project.name}
              </h3>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{project.locations.length} locations</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {project.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </button>
          </div>
        ))}

        {/* New Location List Card */}
        <button
          onClick={() => setView("upload")}
          className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 bg-transparent hover:bg-white/[0.02] transition-all min-h-[200px]"
        >
          <Plus className="w-8 h-8 text-white/40 mb-3" />
          <span className="text-white/50 font-sans font-medium">New Location List</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Location List"
        itemName={deleteTarget?.name || ""}
        description="This will permanently delete this location list and all its locations. This action cannot be undone."
      />

      {/* Edit Project Modal */}
      <EditProjectWithThumbnailModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        currentName={editTarget?.name || ""}
        currentThumbnail={editTarget?.thumbnailUrl}
        title="Edit Location List"
        label="Location List Name"
        accentColor="amber"
      />
      </div>
    </div>
  )
}
