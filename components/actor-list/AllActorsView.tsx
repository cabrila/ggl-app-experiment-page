"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  Plus,
  Users,
  Trash2,
  Pencil,
  Phone,
  Mail,
  X,
  Filter,
  AlertTriangle,
  ListPlus,
} from "lucide-react"
import { useActorList } from "./ActorListContext"
import { Actor, ActorGender, AggregatedActor } from "@/types/actor-list"
import SearchBar from "@/components/ui/SearchBar"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"
import ImageModal from "@/components/ui/ImageModal"

const GENDER_GROUPS: ActorGender[] = ["Male", "Female", "Other", "Not-specified"]

export default function AllActorsView() {
  const {
    allActors,
    projects,
    goBack,
    addActorToList,
    createProject,
    addStandaloneActor,
    updateActorGlobally,
    deleteActorGlobally,
    dismissDuplicate,
  } = useActorList()

  const [viewMode, setViewMode] = useState<ViewMode>("full")
  const [searchQuery, setSearchQuery] = useState("")
  const [genderFilter, setGenderFilter] = useState<"all" | ActorGender>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [ageMin, setAgeMin] = useState("")
  const [ageMax, setAgeMax] = useState("")
  const [duplicatesOnly, setDuplicatesOnly] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [editActor, setEditActor] = useState<Actor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AggregatedActor | null>(null)
  const [fullScreenHeadshot, setFullScreenHeadshot] = useState<{ src: string; alt: string } | null>(null)

  const filteredActors = allActors.filter((actor) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      actor.name.toLowerCase().includes(q) ||
      actor.email.toLowerCase().includes(q) ||
      actor.notes.toLowerCase().includes(q) ||
      actor.sourceListNames.some((n) => n.toLowerCase().includes(q))
    const matchesGender = genderFilter === "all" || (actor.gender || "Not-specified") === genderFilter
    const matchesMin = !ageMin || actor.age >= parseInt(ageMin, 10)
    const matchesMax = !ageMax || actor.age <= parseInt(ageMax, 10)
    const matchesDup = !duplicatesOnly || actor.isDuplicate
    return matchesSearch && matchesGender && matchesMin && matchesMax && matchesDup
  })

  const selectedActors = filteredActors.filter((a) => selectedIds.has(a.id))

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const selectAll = () => setSelectedIds(new Set(filteredActors.map((a) => a.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const handleAddToExisting = async (projectId: string) => {
    await Promise.all(selectedActors.map((a) => addActorToList(a.id, projectId)))
    setShowAddModal(false)
    clearSelection()
  }

  const handleCreateNewList = async () => {
    if (!newListName.trim()) return
    await createProject(
      newListName.trim(),
      selectedActors.map((a) => stripAggregate(a))
    )
    setNewListName("")
    setShowAddModal(false)
    clearSelection()
  }

  const handleAddActor = async () => {
    const newActor: Actor = {
      id: crypto.randomUUID(),
      name: "New Actor",
      age: 30,
      gender: "Not-specified",
      playingAge: "25-35",
      phone: "",
      email: "",
      headshotUrl: "",
      notes: "",
    }
    await addStandaloneActor(newActor)
    setEditActor(newActor)
  }

  const handleDelete = (actor: AggregatedActor) => {
    setDeleteTarget(actor)
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteActorGlobally(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const stats = `${allActors.length} actors across ${projects.length} lists`

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10">
        <div className="px-6 py-3 border-b border-white/5">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-sans">Back to My Actors</span>
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white font-sans">All Actors</h1>
              {selectedIds.size > 0 && (
                <span className="text-sky-300 text-sm font-sans">({selectedIds.size} selected)</span>
              )}
            </div>
            <p className="text-white/50 text-sm font-sans">{stats}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-400 rounded-lg text-white transition-colors"
                title="Add selected to a list"
              >
                <ListPlus className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">Add to List</span>
              </button>
            )}
            <button
              onClick={filteredActors.length && selectedIds.size === filteredActors.length ? clearSelection : selectAll}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
            >
              <span className="font-sans text-sm">
                {filteredActors.length && selectedIds.size === filteredActors.length ? "Deselect All" : "Select All"}
              </span>
            </button>
            <button
              onClick={handleAddActor}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Add Actor"
            >
              <Plus className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">Add Actor</span>
            </button>
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Search + Filters */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or list..." />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as "all" | ActorGender)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:border-sky-500/50 focus:outline-none font-sans"
          >
            <option value="all">All genders</option>
            {GENDER_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-sans transition-colors ${
              showFilters || ageMin || ageMax || duplicatesOnly
                ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                : "bg-white/5 border-white/10 text-white/70 hover:text-white"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="px-6 pb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50 font-sans">Age</span>
              <input
                type="number"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                placeholder="Min"
                className="w-20 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:border-sky-500/50 focus:outline-none font-sans"
              />
              <span className="text-white/30">–</span>
              <input
                type="number"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                placeholder="Max"
                className="w-20 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:border-sky-500/50 focus:outline-none font-sans"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-white/70 font-sans cursor-pointer">
              <input
                type="checkbox"
                checked={duplicatesOnly}
                onChange={(e) => setDuplicatesOnly(e.target.checked)}
                className="accent-sky-500"
              />
              Show duplicates only
            </label>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Full View */}
        {viewMode === "full" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredActors.map((actor) => (
              <ActorFullCard
                key={actor.id}
                actor={actor}
                selected={selectedIds.has(actor.id)}
                onToggle={() => toggleSelect(actor.id)}
                onEdit={() => setEditActor(stripAggregate(actor))}
                onDelete={() => handleDelete(actor)}
                onDismissDuplicate={() => dismissDuplicate(actor.name)}
                onViewHeadshot={() =>
                  actor.headshotUrl && setFullScreenHeadshot({ src: actor.headshotUrl, alt: actor.name })
                }
              />
            ))}
          </div>
        )}

        {/* Minimal View */}
        {viewMode === "minimal" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredActors.map((actor) => (
              <div
                key={actor.id}
                className={`group relative p-3 rounded-lg border bg-[#1a2e23] transition-colors ${
                  selectedIds.has(actor.id) ? "border-sky-500/50 ring-1 ring-sky-500/20" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditActor(stripAggregate(actor))} className="p-1 bg-white/10 hover:bg-white/20 rounded text-white/60 hover:text-white transition-colors" title="Edit">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(actor)} className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <Checkbox checked={selectedIds.has(actor.id)} onClick={() => toggleSelect(actor.id)} />
                  <Avatar
                    actor={actor}
                    onClick={() =>
                      actor.headshotUrl && setFullScreenHeadshot({ src: actor.headshotUrl, alt: actor.name })
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{actor.name}</h3>
                    <p className="text-xs text-white/50 truncate">
                      {actor.age ? `${actor.age}yo` : ""}
                      {actor.gender && actor.gender !== "Not-specified" ? ` • ${actor.gender}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View - grouped by gender */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {GENDER_GROUPS.map((gender) => {
              const group = filteredActors.filter((a) => (a.gender || "Not-specified") === gender)
              if (group.length === 0) return null
              return (
                <div key={gender} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                      {gender} ({group.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {group.map((actor) => (
                      <div
                        key={actor.id}
                        className={`flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors ${
                          selectedIds.has(actor.id) ? "bg-sky-500/10" : ""
                        }`}
                      >
                        <Checkbox checked={selectedIds.has(actor.id)} onClick={() => toggleSelect(actor.id)} />
                        <Avatar
                          actor={actor}
                          onClick={() =>
                            actor.headshotUrl && setFullScreenHeadshot({ src: actor.headshotUrl, alt: actor.name })
                          }
                        />
                        <div className="w-40 sm:w-48 md:w-56 min-w-0 flex-shrink-0">
                          <h4 className="text-sm font-semibold text-white truncate">{actor.name}</h4>
                          <p className="text-xs text-white/50 truncate">
                            {actor.age ? `Age: ${actor.age}` : ""}
                            {actor.playingAge ? ` • Plays: ${actor.playingAge}` : ""}
                          </p>
                        </div>
                        <div className="hidden md:flex flex-1 items-center gap-6 text-xs text-white/60 justify-start">
                          {actor.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3" />
                              {actor.phone}
                            </span>
                          )}
                          {actor.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3" />
                              {actor.email}
                            </span>
                          )}
                        </div>
                        {actor.sourceListNames.length > 0 && (
                          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                            {actor.sourceListNames.slice(0, 2).map((name, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-sky-500/20 rounded text-xs text-sky-300 truncate max-w-[120px]">
                                {name}
                              </span>
                            ))}
                            {actor.sourceListNames.length > 2 && (
                              <span className="text-xs text-white/40">+{actor.sourceListNames.length - 2}</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setEditActor(stripAggregate(actor))} className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(actor)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filteredActors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/40 font-sans">No actors match your filters.</p>
          </div>
        )}
      </div>

      {/* Add to List Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#1a2e23] border border-white/10 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white font-sans">Add to List</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-white/60 text-sm mb-4 font-sans">
                Add {selectedIds.size} selected actor{selectedIds.size !== 1 ? "s" : ""} to a list:
              </p>

              {projects.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 font-sans">Existing Lists</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleAddToExisting(project.id)}
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

      {/* Edit Actor Modal */}
      {editActor && (
        <EditActorModal
          actor={editActor}
          onClose={() => setEditActor(null)}
          onSave={(updated) => {
            updateActorGlobally(updated)
            setEditActor(null)
          }}
        />
      )}

      {/* Delete Warning Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-[#1a2e23] border border-white/10 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-bold text-white font-sans">Delete Actor</h2>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-white/80 text-sm font-sans leading-relaxed">
                Deleting <span className="font-semibold text-white">{deleteTarget.name}</span> here will delete this
                actor from <span className="font-semibold text-white">all lists</span> as well.
              </p>
              {deleteTarget.sourceListNames.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {deleteTarget.sourceListNames.map((name, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-red-500/15 border border-red-500/25 rounded text-[11px] text-red-300 truncate max-w-[160px]">
                      {name}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-white/50 text-xs font-sans">This action cannot be undone.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors font-sans">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-400 rounded-lg text-white text-sm transition-colors font-sans">
                <Trash2 className="w-4 h-4" />
                Delete from all lists
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Headshot Viewer */}
      <ImageModal
        isOpen={!!fullScreenHeadshot}
        onClose={() => setFullScreenHeadshot(null)}
        src={fullScreenHeadshot?.src || ""}
        alt={fullScreenHeadshot?.alt || ""}
      />
    </div>
  )
}

// Strip aggregation-only fields back to a plain Actor.
function stripAggregate(a: Actor): Actor {
  return {
    id: a.id,
    name: a.name,
    age: a.age,
    gender: a.gender,
    playingAge: a.playingAge,
    phone: a.phone,
    email: a.email,
    headshotUrl: a.headshotUrl,
    notes: a.notes,
    mediaMaterial: a.mediaMaterial,
    customFields: a.customFields,
  }
}

function Checkbox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        checked ? "bg-sky-500 border-sky-500 text-white" : "border-white/30 hover:border-sky-400"
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

function Avatar({ actor, onClick }: { actor: Actor; onClick?: () => void }) {
  const clickable = !!(onClick && actor.headshotUrl)
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      title={clickable ? "Click to view full image" : undefined}
      className={`w-10 h-10 rounded-full overflow-hidden bg-sky-500/20 flex-shrink-0 transition-all ${
        clickable ? "cursor-pointer hover:ring-2 hover:ring-sky-500/50" : "cursor-default"
      }`}
    >
      {actor.headshotUrl ? (
        <Image src={actor.headshotUrl} alt={actor.name} width={40} height={40} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sky-400 text-sm font-bold">
          {actor.name.charAt(0).toUpperCase()}
        </div>
      )}
    </button>
  )
}

function ActorFullCard({
  actor,
  selected,
  onToggle,
  onEdit,
  onDelete,
  onDismissDuplicate,
  onViewHeadshot,
}: {
  actor: AggregatedActor
  selected: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onDismissDuplicate: () => void
  onViewHeadshot: () => void
}) {
  return (
    <div
      className={`group relative p-5 rounded-xl border bg-[#1a2e23] transition-colors ${
        selected ? "border-sky-500/50 ring-2 ring-sky-500/20" : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/60 hover:text-white transition-colors" title="Edit">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {actor.isDuplicate && (
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg w-fit">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] text-amber-300 font-sans">Possible duplicate</span>
          <button onClick={onDismissDuplicate} className="ml-1 text-amber-400/60 hover:text-amber-300" title="Dismiss">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onClick={onToggle} />
        <Avatar actor={actor} onClick={onViewHeadshot} />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate font-sans">{actor.name}</h3>
          <p className="text-xs text-white/50 font-sans">
            {actor.age ? `${actor.age}yo` : ""}
            {actor.gender && actor.gender !== "Not-specified" ? ` • ${actor.gender}` : ""}
            {actor.playingAge ? ` • Plays ${actor.playingAge}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-white/60 font-sans">
        {actor.phone && (
          <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {actor.phone}</p>
        )}
        {actor.email && (
          <p className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3" /> {actor.email}</p>
        )}
      </div>

      {actor.sourceListNames.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Users className="w-3 h-3 text-white/30" />
          {actor.sourceListNames.map((name, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-sky-500/20 rounded text-[11px] text-sky-300 truncate max-w-[140px]">
              {name}
            </span>
          ))}
        </div>
      )}

      {actor.notes && (
        <p className="mt-3 text-xs text-white/40 line-clamp-2 font-sans">{actor.notes}</p>
      )}
    </div>
  )
}

function EditActorModal({
  actor,
  onClose,
  onSave,
}: {
  actor: Actor
  onClose: () => void
  onSave: (actor: Actor) => void
}) {
  const [draft, setDraft] = useState<Actor>(actor)
  const set = <K extends keyof Actor>(key: K, value: Actor[K]) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-[#1a2e23] border border-white/10 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white font-sans">Edit Actor</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Name" value={draft.name} onChange={(v) => set("name", v)} />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-white/50 mb-1 font-sans">Age</label>
              <input
                type="number"
                value={draft.age || ""}
                onChange={(e) => set("age", parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-sky-500/50 focus:outline-none font-sans"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-white/50 mb-1 font-sans">Gender</label>
              <select
                value={draft.gender || "Not-specified"}
                onChange={(e) => set("gender", e.target.value as ActorGender)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-sky-500/50 focus:outline-none font-sans"
              >
                {GENDER_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <Field label="Playing Age" value={draft.playingAge} onChange={(v) => set("playingAge", v)} />
          <Field label="Phone" value={draft.phone} onChange={(v) => set("phone", v)} />
          <Field label="Email" value={draft.email} onChange={(v) => set("email", v)} />
          <div>
            <label className="block text-xs text-white/50 mb-1 font-sans">Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-sky-500/50 focus:outline-none font-sans resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors font-sans">
            Cancel
          </button>
          <button onClick={() => onSave(draft)} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-lg text-white text-sm transition-colors font-sans">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1 font-sans">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-sky-500/50 focus:outline-none font-sans"
      />
    </div>
  )
}
