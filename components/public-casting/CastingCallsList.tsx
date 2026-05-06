"use client"

import { useState } from "react"
import { Plus, Megaphone, Calendar, Users, Trash2, Link, Eye, FileEdit, FolderEdit, QrCode } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"
import { CastingCall, PublicCastingProject } from "@/types/public-casting"
import CastingCallPreviewModal from "./CastingCallPreviewModal"
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal"
import EditProjectWithThumbnailModal from "@/components/ui/EditProjectWithThumbnailModal"
import QRCodeModal from "./QRCodeModal"

interface CastingCallsListProps {
  onNewCastingCall: () => void
  onViewSubmissions: () => void
  onEditCastingCall: (castingCall: CastingCall, project: PublicCastingProject) => void
}

export default function CastingCallsList({
  onNewCastingCall,
  onViewSubmissions,
  onEditCastingCall,
}: CastingCallsListProps) {
  const { state, deleteProject, updateProject, getNewSubmissionsCount, getTotalSubmissions } = usePublicCasting()
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [previewCastingCall, setPreviewCastingCall] = useState<CastingCall | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PublicCastingProject | null>(null)
  const [editTarget, setEditTarget] = useState<PublicCastingProject | null>(null)
  const [qrCodeCastingCall, setQrCodeCastingCall] = useState<CastingCall | null>(null)

  const newCount = getNewSubmissionsCount()
  const totalSubmissions = getTotalSubmissions()

  const handleDeleteProject = (e: React.MouseEvent, project: PublicCastingProject) => {
    e.stopPropagation()
    setDeleteTarget(project)
  }

  const handleEditProject = (e: React.MouseEvent, project: PublicCastingProject) => {
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

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-sans">My Casting Calls</h1>
        <p className="text-white/60 text-base font-sans">
          Create shareable casting forms and manage actor submissions.
        </p>
      </div>

      {/* Action Bar - New Casting Call + Submissions grouped together */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onNewCastingCall}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold transition-colors font-sans"
        >
          <Plus className="w-4 h-4" />
          New Casting Call
        </button>

        {/* Submissions Button */}
        <button
          onClick={onViewSubmissions}
          className="relative flex items-center gap-2 px-4 py-2.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-violet-300 transition-colors font-sans"
        >
          <Users className="w-4 h-4" />
          <span>Submissions</span>
          {totalSubmissions > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-violet-500 text-white text-xs font-bold rounded-full">
              {totalSubmissions}
            </span>
          )}
          {newCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Projects Grid */}
      {state.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white/70 mb-2 font-sans">No casting calls yet</h3>
          <p className="text-white/40 text-sm font-sans mb-4">Create your first casting call to start receiving submissions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.projects.map((project) => {
            const castingCall = project.castingCalls[0]
            const hasCastingCall = !!castingCall
            
            return (
              <div
                key={project.id}
                className="group relative flex rounded-xl border border-white/10 bg-[#1a2e23] hover:border-violet-500/30 transition-colors overflow-hidden"
                onMouseEnter={() => setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
              >
                {/* Thumbnail Section - 1/3 width */}
                <div className="w-1/3 min-h-[180px] bg-[#0f1f17] border-r border-white/10 flex-shrink-0">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <Megaphone className="w-8 h-8 text-violet-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Section - 2/3 width */}
                <div className="flex-1 flex flex-col p-4">
                  {/* Top-right Quick Actions (always visible on hover) */}
                  {hoveredProjectId === project.id && (
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      {hasCastingCall && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setQrCodeCastingCall(castingCall)
                          }}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                          title="Generate QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleEditProject(e, project)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                        title="Rename"
                      >
                        <FolderEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(e, project)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Project Name */}
                  <h3 className="text-sm font-semibold text-white mb-0.5 font-sans pr-16 line-clamp-1">
                    {project.name}
                  </h3>

                  {/* Casting Call Title (if exists) */}
                  {hasCastingCall && castingCall.title && (
                    <p className="text-xs text-white/50 mb-2 font-sans truncate pr-16">
                      {castingCall.title}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/50 mb-2">
                    <div className="flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      <span>{project.castingCalls.length} forms</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{project.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Submissions count */}
                  {project.submissions.length > 0 && (
                    <div className="mb-2 flex items-center gap-1 text-xs text-violet-300">
                      <Users className="w-3 h-3" />
                      <span>{project.submissions.length} submissions</span>
                      {project.submissions.some((s) => s.isNew) && (
                        <span className="ml-1 px-1 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded">
                          {project.submissions.filter((s) => s.isNew).length} new
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons for Casting Call */}
                  {hasCastingCall && (
                    <div className="flex items-center gap-2 pt-2 mt-auto border-t border-white/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewCastingCall(castingCall)
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-colors font-sans"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditCastingCall(castingCall, project)
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-violet-300 hover:text-violet-200 text-xs transition-colors font-sans"
                        title={`Edit form: ${castingCall.title}`}
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewCastingCall && (
        <CastingCallPreviewModal
          castingCall={previewCastingCall}
          project={state.projects.find(p => p.castingCalls.some(cc => cc.id === previewCastingCall.id))}
          onClose={() => setPreviewCastingCall(null)}
        />
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={!!qrCodeCastingCall}
        onClose={() => setQrCodeCastingCall(null)}
        url={qrCodeCastingCall?.shareableLink || ""}
        title={qrCodeCastingCall?.title || "Casting Call"}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Casting Project"
        itemName={deleteTarget?.name || ""}
        description="This will permanently delete this project, all its casting calls, and submissions. This action cannot be undone."
      />

      {/* Edit Project Modal */}
      <EditProjectWithThumbnailModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        currentName={editTarget?.name || ""}
        currentThumbnail={editTarget?.thumbnailUrl}
        title="Edit Casting Project"
        label="Project Name"
        accentColor="violet"
      />
      </div>
    </div>
  )
}
