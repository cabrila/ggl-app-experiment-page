"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown, FileJson, FileSpreadsheet, Download, ListPlus, Plus, X, Phone, Mail, Star } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"
import SubmissionCard from "./SubmissionCard"
import { CastingSubmission } from "@/types/public-casting"
import { exportSubmissionsAsJSON, exportSubmissionsAsPDF, exportSubmissionsAsExcel } from "@/lib/submission-export"
import { useActorListSafe } from "@/components/actor-list/ActorListContext"
import { Actor, ActorGender } from "@/types/actor-list"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"

const ACTOR_GENDERS: ActorGender[] = ["Male", "Female", "Other", "Not-specified"]

// Map a free-text submission gender onto the Actor gender enum.
function coerceGender(value?: string): ActorGender | undefined {
  if (!value) return undefined
  const v = value.toLowerCase().trim()
  if (v.includes("female") || v.includes("woman")) return "Female"
  if (v.includes("male") || v.includes("man")) return "Male"
  const match = ACTOR_GENDERS.find((g) => g.toLowerCase() === v)
  return match ?? "Other"
}

// Map a casting submission into the Actor shape used by actor lists.
function submissionToActor(submission: CastingSubmission): Actor {
  return {
    id: crypto.randomUUID(),
    name: submission.name,
    age: parseInt(submission.age || "", 10) || 0,
    gender: coerceGender(submission.data?.gender || submission.data?.Gender),
    playingAge: submission.playingAge || "",
    phone: submission.phone || "",
    email: submission.email,
    headshotUrl: submission.headshot || "",
    notes: submission.notes || "",
  }
}

interface SubmissionsListProps {
  onBack: () => void
  initialFormFilter?: string
}

type SortOption = "newest" | "oldest" | "alphabetical" | "form" | "grade-high" | "grade-low"
type GradeFilter = "all" | "graded" | "ungraded" | "high" | "medium" | "low"

export default function SubmissionsList({ onBack, initialFormFilter }: SubmissionsListProps) {
  const { state, markSubmissionsAsRead, updateSubmission, deleteSubmission } = usePublicCasting()
  const actorCtx = useActorListSafe()
  const actorProjects = actorCtx?.projects ?? []
  const createActorProject = actorCtx?.createProject
  const updateActorProject = actorCtx?.updateProject
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [filterByForm, setFilterByForm] = useState<string>(initialFormFilter ?? "all")
  const [filterByGrade, setFilterByGrade] = useState<GradeFilter>("all")
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("full")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [newListName, setNewListName] = useState("")

  // Get all submissions across all projects
  const allSubmissions = useMemo(() => {
    return state.projects.flatMap((p) => p.submissions)
  }, [state.projects])

  // Get unique form names for filter
  const formNames = useMemo(() => {
    const names = new Set(allSubmissions.map((s) => s.castingCallTitle))
    return Array.from(names)
  }, [allSubmissions])

  // Mark submissions as read when viewing
  useEffect(() => {
    state.projects.forEach((p) => {
      if (p.submissions.some((s) => s.isNew)) {
        markSubmissionsAsRead(p.id)
      }
    })
  }, [state.projects, markSubmissionsAsRead])

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...allSubmissions]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.castingCallTitle.toLowerCase().includes(query)
      )
    }

    // Filter by form
    if (filterByForm !== "all") {
      result = result.filter((s) => s.castingCallTitle === filterByForm)
    }

    // Filter by grade
    if (filterByGrade !== "all") {
      switch (filterByGrade) {
        case "graded":
          result = result.filter((s) => s.grade !== undefined && s.grade > 0)
          break
        case "ungraded":
          result = result.filter((s) => !s.grade || s.grade === 0)
          break
        case "high":
          result = result.filter((s) => s.grade !== undefined && s.grade >= 8)
          break
        case "medium":
          result = result.filter((s) => s.grade !== undefined && s.grade >= 5 && s.grade < 8)
          break
        case "low":
          result = result.filter((s) => s.grade !== undefined && s.grade > 0 && s.grade < 5)
          break
      }
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        break
      case "oldest":
        result.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
        break
      case "alphabetical":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "form":
        result.sort((a, b) => a.castingCallTitle.localeCompare(b.castingCallTitle))
        break
      case "grade-high":
        result.sort((a, b) => (b.grade || 0) - (a.grade || 0))
        break
      case "grade-low":
        result.sort((a, b) => (a.grade || 0) - (b.grade || 0))
        break
    }

    return result
  }, [allSubmissions, searchQuery, filterByForm, filterByGrade, sortBy])

  const handleUpdateSubmission = (submissionId: string, updates: Partial<CastingSubmission>) => {
    updateSubmission(submissionId, updates)
  }

  const handleDeleteSubmission = (submissionId: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      deleteSubmission(submissionId)
    }
  }

  // --- Multi-select + add to actor lists --------------------------------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const selectAll = () => setSelectedIds(new Set(filteredSubmissions.map((s) => s.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const selectedSubmissions = filteredSubmissions.filter((s) => selectedIds.has(s.id))

  const handleAddToExistingList = async (projectId: string) => {
    if (!updateActorProject) return
    const project = actorProjects.find((p) => p.id === projectId)
    if (!project) return
    const actors = selectedSubmissions.map(submissionToActor)
    await updateActorProject(projectId, { actors: [...project.actors, ...actors] })
    setShowAddModal(false)
    clearSelection()
  }

  const handleCreateNewList = async () => {
    if (!newListName.trim() || !createActorProject) return
    const actors = selectedSubmissions.map(submissionToActor)
    await createActorProject(newListName.trim(), actors)
    setNewListName("")
    setShowAddModal(false)
    clearSelection()
  }

  const handleExportJSON = () => {
    exportSubmissionsAsJSON(filteredSubmissions, "casting_submissions")
  }

  const handleExportPDF = () => {
    exportSubmissionsAsPDF(filteredSubmissions, "casting_submissions")
  }

  const handleExportExcel = () => {
    exportSubmissionsAsExcel(filteredSubmissions, "casting_submissions")
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "alphabetical", label: "A-Z by Name" },
    { value: "form", label: "By Form" },
    { value: "grade-high", label: "Highest Grade" },
    { value: "grade-low", label: "Lowest Grade" },
  ]

  const gradeOptions: { value: GradeFilter; label: string }[] = [
    { value: "all", label: "All Grades" },
    { value: "graded", label: "Graded Only" },
    { value: "ungraded", label: "Ungraded" },
    { value: "high", label: "High (8-10)" },
    { value: "medium", label: "Medium (5-7)" },
    { value: "low", label: "Low (1-4)" },
  ]

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a4a2a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 py-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Casting Calls</span>
          </button>

          {/* Title & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white font-sans">Submissions</h1>
                {selectedIds.size > 0 && (
                  <span className="text-violet-300 text-sm font-sans">({selectedIds.size} selected)</span>
                )}
              </div>
              <p className="text-white/50 text-sm font-sans">
                {filteredSubmissions.length} total submissions
              </p>
            </div>

            {/* Export + selection actions */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.size > 0 && actorCtx && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-400 rounded-lg text-white transition-colors"
                  title="Add selected to an actor list"
                >
                  <ListPlus className="w-4 h-4" />
                  <span className="font-sans text-sm hidden sm:inline">Add to List</span>
                </button>
              )}
              {filteredSubmissions.length > 0 && (
                <button
                  onClick={selectedIds.size === filteredSubmissions.length ? clearSelection : selectAll}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                >
                  <span className="font-sans text-sm">
                    {selectedIds.size === filteredSubmissions.length ? "Deselect All" : "Select All"}
                  </span>
                </button>
              )}
              <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
              <button
                onClick={handleExportJSON}
                disabled={filteredSubmissions.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as JSON"
              >
                <FileJson className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">JSON</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={filteredSubmissions.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={filteredSubmissions.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-violet-500 hover:bg-violet-400 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as PDF"
              >
                <Download className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or form..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans text-sm"
              />
            </div>

            {/* Form Filter */}
            <select
              value={filterByForm}
              onChange={(e) => setFilterByForm(e.target.value)}
              className="px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none font-sans min-w-[140px]"
            >
              <option value="all">All Forms</option>
              {formNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Grade Filter */}
            <select
              value={filterByGrade}
              onChange={(e) => setFilterByGrade(e.target.value as GradeFilter)}
              className="px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none font-sans min-w-[130px]"
            >
              {gradeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm hover:border-white/20 transition-colors font-sans min-w-[150px]"
              >
                <SlidersHorizontal className="w-4 h-4 text-white/60" />
                <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                <ChevronDown className="w-4 h-4 text-white/40 ml-auto" />
              </button>

              {showSortDropdown && (
                <div className="absolute top-full mt-1 right-0 w-full bg-[#1a2e23] border border-white/10 rounded-lg overflow-hidden shadow-xl z-20">
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
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="p-6">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 font-sans">
              {searchQuery || filterByForm !== "all" || filterByGrade !== "all"
                ? "No submissions match your filters"
                : "No submissions yet"}
            </p>
          </div>
        ) : viewMode === "full" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onUpdate={(updates) => handleUpdateSubmission(submission.id, updates)}
                onDelete={() => handleDeleteSubmission(submission.id)}
                isSelected={selectedIds.has(submission.id)}
                onToggleSelect={() => toggleSelect(submission.id)}
              />
            ))}
          </div>
        ) : viewMode === "minimal" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`group relative p-3 rounded-lg border bg-[#1a2e23] transition-colors ${
                  selectedIds.has(submission.id) ? "border-violet-500/50 ring-1 ring-violet-500/20" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <SubmissionCheckbox checked={selectedIds.has(submission.id)} onClick={() => toggleSelect(submission.id)} />
                  <SubmissionAvatar submission={submission} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{submission.name}</h3>
                    <p className="text-xs text-white/50 truncate">{submission.castingCallTitle}</p>
                  </div>
                  {submission.grade && submission.grade > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs text-amber-400 flex-shrink-0">
                      <Star className="w-3 h-3 fill-current" />
                      {submission.grade}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List view - grouped by casting call */
          <div className="space-y-6">
            {Array.from(new Set(filteredSubmissions.map((s) => s.castingCallTitle))).map((form) => {
              const group = filteredSubmissions.filter((s) => s.castingCallTitle === form)
              if (group.length === 0) return null
              return (
                <div key={form} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                      {form} ({group.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {group.map((submission) => (
                      <div
                        key={submission.id}
                        className={`flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors ${
                          selectedIds.has(submission.id) ? "bg-violet-500/10" : ""
                        }`}
                      >
                        <SubmissionCheckbox checked={selectedIds.has(submission.id)} onClick={() => toggleSelect(submission.id)} />
                        <SubmissionAvatar submission={submission} />
                        <div className="w-40 sm:w-48 md:w-56 min-w-0 flex-shrink-0">
                          <h4 className="text-sm font-semibold text-white truncate">{submission.name}</h4>
                          <p className="text-xs text-white/50 truncate">
                            {submission.age && `Age: ${submission.age}`}
                            {(submission.data?.gender || submission.data?.Gender) && ` • ${submission.data?.gender || submission.data?.Gender}`}
                          </p>
                        </div>
                        <div className="hidden md:flex flex-1 items-center gap-6 text-xs text-white/60 justify-start">
                          {submission.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3" />
                              {submission.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {submission.email}
                          </span>
                        </div>
                        {submission.grade && submission.grade > 0 ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/20 text-amber-400 text-xs flex-shrink-0">
                            <Star className="w-3 h-3 fill-current" />
                            {submission.grade}/10
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add selected submissions to an actor list */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#1a2e23] border border-white/10 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white font-sans">Add to Actor List</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-white/60 text-sm mb-4 font-sans">
                Add {selectedIds.size} selected submission{selectedIds.size !== 1 ? "s" : ""} to a list under My Actors:
              </p>

              {actorProjects.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 font-sans">Existing Lists</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {actorProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleAddToExistingList(project.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/30 rounded-xl text-left transition-all group"
                      >
                        <div>
                          <p className="text-white font-medium font-sans text-sm">{project.name}</p>
                          <p className="text-white/40 text-xs font-sans">
                            {project.actors.length} actor{project.actors.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-white/30 group-hover:text-sky-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 font-sans">Create New List</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateNewList() }}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-sky-500/50 focus:outline-none font-sans text-sm"
                  />
                  <button
                    onClick={handleCreateNewList}
                    disabled={!newListName.trim()}
                    className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/30 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors font-sans"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SubmissionCheckbox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        checked ? "bg-violet-500 border-violet-500 text-white" : "border-white/30 hover:border-violet-400"
      }`}
    >
      {checked && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

function SubmissionAvatar({ submission }: { submission: CastingSubmission }) {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-violet-500/20 flex-shrink-0">
      {submission.headshot ? (
        <Image src={submission.headshot} alt={submission.name} width={40} height={40} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-violet-400 text-sm font-bold">
          {submission.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}
