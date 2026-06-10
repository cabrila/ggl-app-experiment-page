"use client"

import { useMemo, useRef, useState } from "react"
import { Plus, Megaphone, Calendar, Users, Trash2, Link, Eye, FileEdit, FolderEdit, QrCode, Search, SlidersHorizontal, ChevronDown, Filter, FolderPlus, ChevronRight, ImageIcon, X } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"
import { CastingCall, PublicCastingProject } from "@/types/public-casting"
import CastingCallPreviewModal from "./CastingCallPreviewModal"
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal"
import EditProjectWithThumbnailModal from "@/components/ui/EditProjectWithThumbnailModal"
import QRCodeModal from "./QRCodeModal"

interface CastingCallsListProps {
  onNewCastingCall: () => void
  onViewSubmissions: (formFilter?: string) => void
  onEditCastingCall: (castingCall: CastingCall, project: PublicCastingProject) => void
}

type CastingSortOption = "newest" | "oldest" | "alphabetical" | "most-submissions"
type CastingStatusFilter = "all" | "with-submissions" | "no-submissions"

interface CastingGroup {
  id: string
  name: string
  projectIds: string[]
  headerImageUrl?: string
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

  // Search / sort / filter controls
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<CastingSortOption>("newest")
  const [filterByStatus, setFilterByStatus] = useState<CastingStatusFilter>("all")
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Selection + Casting Groups
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [groups, setGroups] = useState<CastingGroup[]>([])
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<string[]>([])
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState("")
  const groupImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const toggleSelectProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    )
  }

  const handleCreateGroups = () => {
    if (selectedProjectIds.length === 0) return

    const selectedProjects = state.projects.filter((p) => selectedProjectIds.includes(p.id))

    // Group selected projects by their casting call's projectName (falls back to project name)
    const buckets = new Map<string, { name: string; projectIds: string[] }>()
    selectedProjects.forEach((project) => {
      const groupName = project.castingCalls[0]?.projectName?.trim() || project.name
      const key = groupName.toLowerCase()
      const existing = buckets.get(key)
      if (existing) {
        existing.projectIds.push(project.id)
      } else {
        buckets.set(key, { name: groupName, projectIds: [project.id] })
      }
    })

    const newGroups: CastingGroup[] = Array.from(buckets.values()).map((bucket, i) => ({
      id: `group-${Date.now()}-${i}`,
      name: bucket.name,
      projectIds: bucket.projectIds,
    }))

    setGroups((prev) => [...prev, ...newGroups])
    setSelectedProjectIds([])
  }

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    )
  }

  const startRenameGroup = (group: CastingGroup) => {
    setEditingGroupId(group.id)
    setEditingGroupName(group.name)
  }

  const commitRenameGroup = () => {
    if (editingGroupId) {
      const name = editingGroupName.trim()
      if (name) {
        setGroups((prev) => prev.map((g) => (g.id === editingGroupId ? { ...g, name } : g)))
      }
    }
    setEditingGroupId(null)
    setEditingGroupName("")
  }

  const deleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
    setCollapsedGroupIds((prev) => prev.filter((id) => id !== groupId))
  }

  const setGroupImageFromFile = (groupId: string, file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, headerImageUrl: url } : g)))
    }
    reader.readAsDataURL(file)
  }

  const sortOptions: { value: CastingSortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "alphabetical", label: "A-Z by Name" },
    { value: "most-submissions", label: "Most Submissions" },
  ]

  const visibleProjects = useMemo(() => {
    let result = [...state.projects]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.castingCalls.some((cc) => cc.title.toLowerCase().includes(q))
      )
    }

    if (filterByStatus !== "all") {
      result = result.filter((p) =>
        filterByStatus === "with-submissions"
          ? p.submissions.length > 0
          : p.submissions.length === 0
      )
    }

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
      case "oldest":
        result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        break
      case "alphabetical":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "most-submissions":
        result.sort((a, b) => b.submissions.length - a.submissions.length)
        break
    }

    return result
  }, [state.projects, searchQuery, filterByStatus, sortBy])

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
          onClick={() => onViewSubmissions()}
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

        {/* Selection Actions - Create Group + Clear (to the right of Submissions) */}
        {selectedProjectIds.length > 0 && (
          <>
            <button
              onClick={handleCreateGroups}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 transition-colors font-sans"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Casting Groups</span>
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                {selectedProjectIds.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedProjectIds([])}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors font-sans"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </>
        )}
      </div>

      {/* Search / Sort / Filter Controls */}
      {state.projects.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search casting calls..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#13261c] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterByStatus}
              onChange={(e) => setFilterByStatus(e.target.value as CastingStatusFilter)}
              className="appearance-none pl-10 pr-10 py-2.5 bg-[#13261c] border border-white/10 rounded-xl text-white text-sm focus:border-violet-500/50 focus:outline-none font-sans min-w-[170px] cursor-pointer"
            >
              <option value="all">All Casting Calls</option>
              <option value="with-submissions">With Submissions</option>
              <option value="no-submissions">No Submissions</option>
            </select>
            <Filter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#13261c] border border-white/10 rounded-xl text-white text-sm hover:border-white/20 transition-colors font-sans min-w-[170px]"
            >
              <SlidersHorizontal className="w-4 h-4 text-white/60" />
              <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
              <ChevronDown className="w-4 h-4 text-white/40 ml-auto" />
            </button>

            {showSortDropdown && (
              <div className="absolute top-full mt-1 right-0 w-full bg-[#13261c] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setShowSortDropdown(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-sans transition-colors ${
                      sortBy === option.value
                        ? "bg-violet-500/20 text-violet-300"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {state.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white/70 mb-2 font-sans">No casting calls yet</h3>
          <p className="text-white/40 text-sm font-sans mb-4">Create your first casting call to start receiving submissions.</p>
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white/70 mb-2 font-sans">No casting calls match your filters</h3>
          <p className="text-white/40 text-sm font-sans mb-4">Try adjusting your search or filter options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProjects.map((project) => {
            const castingCall = project.castingCalls[0]
            const hasCastingCall = !!castingCall
            
            return (
              <div
                key={project.id}
                className={`group relative flex rounded-xl border bg-[#1a2e23] transition-colors overflow-hidden ${
                  selectedProjectIds.includes(project.id)
                    ? "border-amber-500/50 ring-2 ring-amber-500/20"
                    : "border-white/10 hover:border-violet-500/30"
                }`}
                onMouseEnter={() => setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
              >
                {/* Selection checkbox - Upper Left Corner */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelectProject(project.id)
                  }}
                  className={`absolute top-3 left-3 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedProjectIds.includes(project.id)
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "border-white/40 hover:border-amber-400 bg-[#0f1f17]/80"
                  }`}
                  title={selectedProjectIds.includes(project.id) ? "Deselect" : "Select"}
                >
                  {selectedProjectIds.includes(project.id) && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

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
                <div className="flex-1 flex flex-col p-5">
                  {/* Reserved header strip for hover action icons (keeps content below them) */}
                  <div className="relative h-9 mb-1 flex-shrink-0">
                    {hoveredProjectId === project.id && (
                      <div className="absolute top-0 right-0 flex items-center gap-1.5">
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
                  </div>

                  {/* Project Name */}
                  <h3 className="text-sm font-semibold text-white mb-0.5 font-sans line-clamp-1">
                    {project.name}
                  </h3>

                  {/* Casting Call Title (if exists) */}
                  {hasCastingCall && castingCall.title && (
                    <p className="text-xs text-white/50 mb-2 font-sans truncate">
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewSubmissions(hasCastingCall ? castingCall.title : undefined)
                        }}
                        className="underline underline-offset-2 hover:text-violet-200 transition-colors font-sans"
                        title={`View submissions${hasCastingCall ? ` for ${castingCall.title}` : ""}`}
                      >
                        {project.submissions.length} submissions
                      </button>
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

      {/* Casting Groups - Collapsable Folders */}
      {groups.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4 font-sans">Casting Groups</h2>
          <div className="flex flex-col gap-4">
            {groups.map((group) => {
              const isCollapsed = collapsedGroupIds.includes(group.id)
              const groupProjects = state.projects.filter((p) => group.projectIds.includes(p.id))

              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-white/10 bg-[#1a2e23] overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="relative">
                    {/* Header image / upload zone */}
                    <div
                      onClick={() => groupImageInputRefs.current[group.id]?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        setGroupImageFromFile(group.id, e.dataTransfer.files?.[0])
                      }}
                      className="relative h-28 w-full cursor-pointer bg-[#0f1f17] group/header"
                      title="Click or drag an image to set the group header"
                    >
                      {group.headerImageUrl ? (
                        <img
                          src={group.headerImageUrl || "/placeholder.svg"}
                          alt={`${group.name} header`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-1">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-xs font-sans">Click or drag to upload header image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover/header:bg-black/20 transition-colors" />
                      <input
                        ref={(el) => {
                          groupImageInputRefs.current[group.id] = el
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setGroupImageFromFile(group.id, e.target.files?.[0])}
                      />
                    </div>

                    {/* Title row */}
                    <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10">
                      <button
                        onClick={() => toggleGroupCollapse(group.id)}
                        className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        title={isCollapsed ? "Expand" : "Collapse"}
                      >
                        <ChevronRight
                          className={`w-5 h-5 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                        />
                      </button>

                      {editingGroupId === group.id ? (
                        <input
                          autoFocus
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          onBlur={commitRenameGroup}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRenameGroup()
                            if (e.key === "Escape") {
                              setEditingGroupId(null)
                              setEditingGroupName("")
                            }
                          }}
                          className="flex-1 px-2 py-1 bg-[#0f1f17] border border-amber-500/40 rounded-lg text-white text-sm focus:outline-none font-sans"
                        />
                      ) : (
                        <button
                          onClick={() => startRenameGroup(group)}
                          className="flex-1 text-left text-base font-semibold text-white hover:text-amber-300 transition-colors font-sans"
                          title="Click to rename"
                        >
                          {group.name}
                        </button>
                      )}

                      <span className="text-xs text-white/50 font-sans">
                        {groupProjects.length} {groupProjects.length === 1 ? "casting" : "castings"}
                      </span>
                      <button
                        onClick={() => startRenameGroup(group)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                        title="Rename group"
                      >
                        <FolderEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                        title="Remove group"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Group Contents */}
                  {!isCollapsed && (
                    <div className="px-4 pb-4 flex flex-col gap-2">
                      {groupProjects.map((project) => {
                        const cc = project.castingCalls[0]
                        return (
                          <div
                            key={project.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1f17] border border-white/10"
                          >
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {project.thumbnailUrl ? (
                                <img
                                  src={project.thumbnailUrl || "/placeholder.svg"}
                                  alt={project.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Megaphone className="w-5 h-5 text-violet-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white truncate font-sans">{project.name}</p>
                              {cc?.title && (
                                <p className="text-xs text-white/50 truncate font-sans">{cc.title}</p>
                              )}
                            </div>
                            <span className="text-xs text-white/40 font-sans flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {project.submissions.length}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
        title="Delete Casting Calls"
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
        title="Edit Casting Call"
        label="Casting Call"
        accentColor="violet"
      />
      </div>
    </div>
  )
}
