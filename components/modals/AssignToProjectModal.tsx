"use client"

import type React from "react"
import { useState } from "react"
import { X, FolderOpen, User, Plus, Check, Layers } from 'lucide-react'
import { useCasting } from "@/components/casting/CastingContext"
import type { Actor } from "@/types/casting"

interface AssignToProjectModalProps {
  onClose: () => void
  actor?: Actor
  actors?: Actor[]
  sourceCharacterId?: string
}

export default function AssignToProjectModal({
  onClose,
  actor,
  actors,
  sourceCharacterId,
}: AssignToProjectModalProps) {
  const { state, dispatch } = useCasting()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("")
  const [addToCanvas, setAddToCanvas] = useState(false)

  // Support both single and batch assignment
  const actorsToAssign = actors || (actor ? [actor] : [])
  const isBatchMode = actorsToAssign.length > 1

  const selectedProject = state.projects.find((p) => p.id === selectedProjectId)

  const handleAssign = () => {
    if (!selectedProjectId || !selectedCharacterId) {
      alert("Please select both a project and character")
      return
    }

    const project = state.projects.find((p) => p.id === selectedProjectId)
    const character = project?.characters.find((c) => c.id === selectedCharacterId)

    if (!project || !character) return

    let assignedCount = 0
    let skippedCount = 0

    // Process each actor
    actorsToAssign.forEach((actorToAssign) => {
      // Check if already assigned
      const alreadyAssigned = actorToAssign.projectAssignments?.some(
        (a) => a.projectId === selectedProjectId && a.characterId === selectedCharacterId,
      )

      if (alreadyAssigned && !addToCanvas) {
        skippedCount++
        return
      }

      if (!alreadyAssigned) {
        // Assign actor to project-character
        dispatch({
          type: "ASSIGN_ACTOR_TO_PROJECT_CHARACTER",
          payload: {
            actorId: actorToAssign.id,
            projectId: selectedProjectId,
            projectName: project.name,
            characterId: selectedCharacterId,
            characterName: character.name,
          },
        })
        assignedCount++
      }

      // If addToCanvas is checked and actor is already assigned, just add to canvas
      if (addToCanvas) {
        const canvasActors = project.canvasActors || []
        const alreadyOnCanvas = canvasActors.some((ca) => ca.actorId === actorToAssign.id)

        if (!alreadyOnCanvas) {
          // Calculate stacked position
          const baseX = 50
          const baseY = 50
          const stackOffset = canvasActors.length * 20

          const newCanvasActor = {
            id: `canvas_${Date.now()}_${actorToAssign.id}`,
            actorId: actorToAssign.id,
            x: baseX + stackOffset,
            y: baseY + stackOffset,
            characterName: character.name,
            actor: actorToAssign,
          }

          dispatch({
            type: "ADD_CANVAS_ACTOR",
            payload: {
              projectId: selectedProjectId,
              canvasActor: newCanvasActor,
            },
          })
        }
      }
    })

    // Show success notification
    const message = isBatchMode
      ? `${assignedCount} actor(s) assigned to ${project.name} > ${character.name}${addToCanvas ? " and added to canvas" : ""}${skippedCount > 0 ? ` (${skippedCount} skipped - already assigned)` : ""}`
      : `${actorsToAssign[0].name} assigned to ${project.name} > ${character.name}${addToCanvas ? " and added to canvas" : ""}`

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `assign-${Date.now()}`,
        type: "system" as const,
        title: "Actor Assignment",
        message,
        timestamp: Date.now(),
        read: false,
        priority: "medium" as const,
      },
    })

    onClose()
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
      {/* Header - Mirroring splash screen style */}
      <div className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              {isBatchMode ? (
                <Layers className="w-6 h-6 text-white" />
              ) : (
                <FolderOpen className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Assign to Project</h2>
              <p className="text-emerald-100 text-sm mt-1">
                {isBatchMode
                  ? `Assign ${actorsToAssign.length} actors to a project`
                  : `Assign ${actorsToAssign[0]?.name} to a project`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Batch Mode Indicator */}
        {isBatchMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Layers className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Batch Assignment Mode</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You're assigning {actorsToAssign.length} actors at once. All actors will be assigned to the same
                  project and character.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Project Selection - Card style like splash screen */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Select Project</label>
          <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
            {state.projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProjectId(project.id)
                  setSelectedCharacterId("") // Reset character selection
                }}
                className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedProjectId === project.id
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg"
                    : "bg-white hover:shadow-md border-2 border-slate-200 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        selectedProjectId === project.id
                          ? "bg-white/20 backdrop-blur-sm"
                          : "bg-slate-100 group-hover:bg-emerald-100"
                      }`}
                    >
                      <FolderOpen
                        className={`w-5 h-5 ${selectedProjectId === project.id ? "text-white" : "text-slate-600 group-hover:text-emerald-600"}`}
                      />
                    </div>
                    <div className="text-left">
                      <span
                        className={`font-semibold ${selectedProjectId === project.id ? "text-white" : "text-slate-900"}`}
                      >
                        {project.name}
                      </span>
                      <div
                        className={`text-sm ${selectedProjectId === project.id ? "text-emerald-100" : "text-slate-500"}`}
                      >
                        {project.characters.length} character(s)
                      </div>
                    </div>
                  </div>
                  {selectedProjectId === project.id && (
                    <div className="p-1 bg-white/20 rounded-full backdrop-blur-sm">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Character Selection - Card style */}
        {selectedProject && (
          <div className="animate-in slide-in-from-top duration-300">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Select Character</label>
            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
              {selectedProject.characters.map((character) => {
                const assignedActors = actorsToAssign.filter((a) =>
                  a.projectAssignments?.some(
                    (pa) => pa.projectId === selectedProjectId && pa.characterId === character.id,
                  ),
                )
                const allAssigned = isBatchMode && assignedActors.length === actorsToAssign.length
                const someAssigned = assignedActors.length > 0 && assignedActors.length < actorsToAssign.length

                return (
                  <button
                    key={character.id}
                    onClick={() => setSelectedCharacterId(character.id)}
                    className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 transform hover:scale-[1.02] ${
                      selectedCharacterId === character.id
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg"
                        : "bg-white hover:shadow-md border-2 border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            selectedCharacterId === character.id
                              ? "bg-white/20 backdrop-blur-sm"
                              : "bg-slate-100 group-hover:bg-emerald-100"
                          }`}
                        >
                          <User
                            className={`w-5 h-5 ${selectedCharacterId === character.id ? "text-white" : "text-slate-600 group-hover:text-emerald-600"}`}
                          />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${selectedCharacterId === character.id ? "text-white" : "text-slate-900"}`}
                            >
                              {character.name}
                            </span>
                            {allAssigned && !isBatchMode && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                Already Assigned
                              </span>
                            )}
                            {allAssigned && isBatchMode && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                All Assigned
                              </span>
                            )}
                            {someAssigned && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                {assignedActors.length}/{actorsToAssign.length} Assigned
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-sm ${selectedCharacterId === character.id ? "text-emerald-100" : "text-slate-500"}`}
                          >
                            {character.description || "No description"}
                          </div>
                        </div>
                      </div>
                      {selectedCharacterId === character.id && (
                        <div className="p-1 bg-white/20 rounded-full backdrop-blur-sm">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Add to Canvas Option - Enhanced design */}
        {selectedProjectId && selectedCharacterId && (
          <div className="animate-in slide-in-from-bottom duration-300">
            <label className="relative flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl cursor-pointer hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-emerald-300 group">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  checked={addToCanvas}
                  onChange={(e) => setAddToCanvas(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900">Add to Canvas</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Also add {isBatchMode ? "these actors" : "this actor"} to the project's canvas for visual management.
                  Actors will be positioned in a stacked layout.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Footer - Matching splash screen button style */}
      <div className="flex items-center justify-end gap-3 p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-t border-slate-200">
        <button
          onClick={onClose}
          className="px-6 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleAssign}
          disabled={!selectedProjectId || !selectedCharacterId}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105 flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>{isBatchMode ? `Assign ${actorsToAssign.length} Actors` : "Assign Actor"}</span>
        </button>
      </div>
    </div>
  )
}
