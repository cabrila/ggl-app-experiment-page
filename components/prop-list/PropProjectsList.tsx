"use client"

import { useState } from "react"
import { Package, Calendar, Plus, Pencil, Trash2, Share2 } from "lucide-react"
import { usePropList } from "./PropListContext"
import { PropProject } from "@/types/prop-list"
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal"
import EditProjectWithThumbnailModal from "@/components/ui/EditProjectWithThumbnailModal"
import { trackListCreated, trackDelete } from "@/lib/analytics"
import { Badge } from "@/components/ui/badge"
import ShareModal from "@/components/modals/ShareModal"

export default function PropProjectsList() {
  const { projects, setView, setCurrentProject, deleteProject, updateProject } = usePropList()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PropProject | null>(null)
  const [editTarget, setEditTarget] = useState<PropProject | null>(null)
  const [shareTarget, setShareTarget] = useState<PropProject | null>(null)

  const handleProjectClick = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      setView("results")
    }
  }

  const handleDeleteProject = (e: React.MouseEvent, project: PropProject) => {
    e.stopPropagation()
    setDeleteTarget(project)
  }

  const handleEditProject = (e: React.MouseEvent, project: PropProject) => {
    e.stopPropagation()
    setEditTarget(project)
  }

  const handleShareProject = (e: React.MouseEvent, project: PropProject) => {
    e.stopPropagation()
    setShareTarget(project)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      trackDelete("prop-list", "list")
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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-sans mb-2">My Props</h1>
          <p className="text-white/60 text-base font-sans">
            Track props referenced in your scripts and how they appear across scenes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative flex rounded-xl border border-white/10 bg-[#1a2e23] hover:border-rose-500/50 transition-all overflow-hidden"
            >
              <div className="w-1/3 min-h-[140px] bg-[#0f1f17] border-r border-white/10 flex-shrink-0">
                {project.thumbnailUrl ? (
                  <img src={project.thumbnailUrl} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-xl bg-rose-500/20 flex items-center justify-center">
                      <Package className="w-8 h-8 text-rose-400" />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleProjectClick(project.id)}
                className="flex-1 flex flex-col justify-center p-5 text-left"
              >
                {hoveredId === project.id && (
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button
                      onClick={(e) => handleShareProject(e, project)}
                      className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
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

                <div className="flex items-center gap-2 mb-2 pr-16">
                  <h3 className="text-base font-bold text-white font-sans line-clamp-1">{project.name}</h3>
                  {project.isDemo && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                      Demo
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    <span>{project.props.length} props</span>
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

          <button
            onClick={() => {
              trackListCreated("prop-list")
              setView("upload")
            }}
            className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 bg-transparent hover:bg-white/[0.02] transition-all min-h-[200px]"
          >
            <Plus className="w-8 h-8 text-white/40 mb-3" />
            <span className="text-white/50 font-sans font-medium">New Prop List</span>
          </button>
        </div>

        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Prop List"
          itemName={deleteTarget?.name || ""}
          description="This will permanently delete this prop list and all its props. This action cannot be undone."
        />

        <EditProjectWithThumbnailModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
          currentName={editTarget?.name || ""}
          currentThumbnail={editTarget?.thumbnailUrl}
          title="Edit Prop List"
          label="Prop List Name"
          accentColor="rose"
        />

        {/* Share Modal */}
        {shareTarget && (
          <ShareModal
            onClose={() => setShareTarget(null)}
            toolType="prop-list"
            projectName={shareTarget.name}
            data={shareTarget.props}
          />
        )}
      </div>
    </div>
  )
}
