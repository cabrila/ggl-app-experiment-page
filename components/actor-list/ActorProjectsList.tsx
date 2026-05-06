"use client"

import { Plus, Users, Trash2, MoreHorizontal } from "lucide-react"
import { useActorList } from "./ActorListContext"
import { useState } from "react"

export default function ActorProjectsList() {
  const { projects, selectProject, setView, deleteProject } = useActorList()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const handleProjectClick = (id: string) => {
    selectProject(id)
  }

  const handleNewProject = () => {
    setView("upload")
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(id)
    }
    setOpenMenuId(null)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Actor List</h1>
          <p className="text-white/50 text-sm">
            Create and manage actor lists for your productions
          </p>
        </div>
        <button
          onClick={handleNewProject}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 rounded-xl text-white font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New List
        </button>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white/70 mb-2">No actor lists yet</h3>
            <p className="text-white/40 text-sm mb-4">
              Create your first actor list to get started
            </p>
            <button
              onClick={handleNewProject}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg text-white font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first list
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="relative group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl p-5 cursor-pointer transition-all"
              >
                {/* Menu Button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === project.id ? null : project.id)
                    }}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {openMenuId === project.id && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-[#1a3a25] border border-white/15 rounded-lg shadow-xl overflow-hidden z-10">
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-sky-500/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-sky-400" />
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold text-white mb-1 truncate pr-8">
                  {project.name}
                </h3>
                <p className="text-sm text-white/50 mb-3">
                  {project.actors.length} actor{project.actors.length !== 1 ? "s" : ""}
                </p>

                {/* Date */}
                <p className="text-xs text-white/30">
                  Updated {formatDate(project.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
