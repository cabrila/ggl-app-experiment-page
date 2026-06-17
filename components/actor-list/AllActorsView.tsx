"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Phone,
  Mail,
  X,
  Filter,
  AlertTriangle,
  ListPlus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Tag,
  Users,
} from "lucide-react"
import { useActorList } from "./ActorListContext"
import { Actor, ActorGender, AggregatedActor } from "@/types/actor-list"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"
import ImageModal from "@/components/ui/ImageModal"
import ActorCard from "./ActorCard"

const GENDER_GROUPS: ActorGender[] = ["Male", "Female", "Other", "Not-specified"]

// Source-representation label for the aggregated "All Actors" cards.
// Mirrors the Submissions card's "Form Source Label" field: a tinted pill row
// placed directly below the header. Derived entirely from the existing
// `association` property and `sourceListNames` — no new actor properties.
function SourceLabel({ actor }: { actor: AggregatedActor }) {
  // Whether the actor is represented as a casting submission.
  const inSubmissions = actor.association === "submissions" || actor.association === "both"
  // Each individual My Actors list the actor card appears in (never collapsed).
  const myActorsLists = actor.sourceListNames

  // Unassociated: nothing to represent.
  if (!inSubmissions && myActorsLists.length === 0) {
    return (
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-white/5 rounded-lg">
        <Tag className="w-3.5 h-3.5 text-white/30" />
        <span className="text-sm text-white/40 font-sans">Not in any list</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 px-3 py-2 bg-sky-500/10 rounded-lg">
      <Users className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
      {inSubmissions && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 rounded text-xs text-violet-300 font-sans">
          <Tag className="w-3 h-3" />
          Submissions
        </span>
      )}
      {myActorsLists.map((name, idx) => (
        <span
          key={idx}
          className="inline-flex items-center px-2 py-0.5 bg-sky-500/20 rounded text-xs text-sky-300 font-sans truncate max-w-[160px]"
          title={name}
        >
          {name}
        </span>
      ))}
    </div>
  )
}

type ActorSortOption = "name-asc" | "name-desc" | "age-asc" | "age-desc"

const actorSortOptions: { value: ActorSortOption; label: string }[] = [
  { value: "name-asc", label: "A-Z by Name" },
  { value: "name-desc", label: "Z-A by Name" },
  { value: "age-asc", label: "Age (Low-High)" },
  { value: "age-desc", label: "Age (High-Low)" },
]

// Read a custom field value off an actor by matching against candidate names.
function getActorCustomValue(actor: Actor, keys: string[]): string {
  const match = (actor.customFields || []).find((f) =>
    keys.some((k) => f.name.toLowerCase().includes(k))
  )
  return match?.value || ""
}

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
  const [filterByLocation, setFilterByLocation] = useState("")
  const [filterByAvailability, setFilterByAvailability] = useState("")
  const [sortBy, setSortBy] = useState<ActorSortOption>("name-asc")
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [detailActorId, setDetailActorId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AggregatedActor | null>(null)
  const [fullScreenHeadshot, setFullScreenHeadshot] = useState<{ src: string; alt: string } | null>(null)

  const advancedFilterCount =
    (ageMin ? 1 : 0) +
    (ageMax ? 1 : 0) +
    (genderFilter !== "all" ? 1 : 0) +
    (filterByLocation.trim() ? 1 : 0) +
    (filterByAvailability.trim() ? 1 : 0) +
    (duplicatesOnly ? 1 : 0)

  const clearAdvancedFilters = () => {
    setAgeMin("")
    setAgeMax("")
    setGenderFilter("all")
    setFilterByLocation("")
    setFilterByAvailability("")
    setDuplicatesOnly(false)
  }

  const filteredActors = allActors
    .filter((actor) => {
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
      const matchesLocation =
        !filterByLocation.trim() ||
        getActorCustomValue(actor, ["location"]).toLowerCase().includes(filterByLocation.toLowerCase().trim())
      const matchesAvailability =
        !filterByAvailability.trim() ||
        getActorCustomValue(actor, ["availability"]).toLowerCase().includes(filterByAvailability.toLowerCase().trim())
      return matchesSearch && matchesGender && matchesMin && matchesMax && matchesDup && matchesLocation && matchesAvailability
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "age-asc":
          return (a.age || 0) - (b.age || 0)
        case "age-desc":
          return (b.age || 0) - (a.age || 0)
        default:
          return 0
      }
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
    setDetailActorId(newActor.id)
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

        {/* Search + Filters + Sort */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row sm:flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or list..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#13261c] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-sky-500/50 focus:outline-none font-sans text-sm"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-sans transition-colors ${
              showFilters || advancedFilterCount > 0
                ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                : "bg-[#13261c] border-white/10 text-white hover:border-white/20"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {advancedFilterCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-sky-500 text-white text-[10px] font-bold rounded-full">
                {advancedFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#13261c] border border-white/10 rounded-xl text-white text-sm hover:border-white/20 transition-colors font-sans min-w-[160px]"
            >
              <SlidersHorizontal className="w-4 h-4 text-white/60" />
              <span>{actorSortOptions.find((o) => o.value === sortBy)?.label}</span>
              <ChevronDown className="w-4 h-4 text-white/40 ml-auto" />
            </button>

            {showSortDropdown && (
              <div className="absolute top-full mt-1 right-0 w-full bg-[#13261c] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20">
                {actorSortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setShowSortDropdown(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-sans transition-colors ${
                      sortBy === option.value
                        ? "bg-sky-500/20 text-sky-300"
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

        {showFilters && (
          <div className="mx-6 mb-4 rounded-xl border border-white/10 bg-[#13261c] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white font-sans">Advanced Filters</h3>
              {advancedFilterCount > 0 && (
                <button
                  onClick={clearAdvancedFilters}
                  className="flex items-center gap-1 text-xs text-white/50 hover:text-white font-sans transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Age Min */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Age (Min)</label>
                <input
                  type="number"
                  autoComplete="off"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="18"
                  className="w-full px-3 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-sky-500/50 focus:outline-none font-sans text-sm"
                />
              </div>
              {/* Age Max */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Age (Max)</label>
                <input
                  type="number"
                  autoComplete="off"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  placeholder="65"
                  className="w-full px-3 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-sky-500/50 focus:outline-none font-sans text-sm"
                />
              </div>
              {/* Gender */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Gender</label>
                <div className="relative">
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value as "all" | ActorGender)}
                    className="appearance-none w-full pl-3 pr-9 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white focus:border-sky-500/50 focus:outline-none font-sans text-sm cursor-pointer"
                  >
                    <option value="all" className="bg-[#0f1f17] text-white">All Genders</option>
                    {GENDER_GROUPS.map((g) => (
                      <option key={g} value={g} className="bg-[#0f1f17] text-white">
                        {g}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                </div>
              </div>
              {/* Location */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Location</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={filterByLocation}
                  onChange={(e) => setFilterByLocation(e.target.value)}
                  placeholder="e.g. Los Angeles"
                  className="w-full px-3 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-sky-500/50 focus:outline-none font-sans text-sm"
                />
              </div>
              {/* Availability */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Availability</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={filterByAvailability}
                  onChange={(e) => setFilterByAvailability(e.target.value)}
                  placeholder="e.g. Weekends"
                  className="w-full px-3 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-sky-500/50 focus:outline-none font-sans text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-white/70 font-sans cursor-pointer mt-4">
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
        {/* Full View - canonical ActorCard with selection + association overlay */}
        {viewMode === "full" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredActors.map((actor) => (
              <ActorFullCard
                key={actor.id}
                actor={actor}
                selected={selectedIds.has(actor.id)}
                onToggle={() => toggleSelect(actor.id)}
                onUpdate={updateActorGlobally}
                onDelete={() => handleDelete(actor)}
                onDismissDuplicate={() => dismissDuplicate(actor.name)}
                onNameClick={() => setDetailActorId(actor.id)}
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
                    <button
                      onClick={() => setDetailActorId(actor.id)}
                      className="text-left max-w-full"
                      title="View full actor details"
                    >
                      <h3 className="text-sm font-semibold text-white truncate hover:text-emerald-300 transition-colors cursor-pointer">{actor.name}</h3>
                    </button>
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
                          <button
                            onClick={() => setDetailActorId(actor.id)}
                            className="text-left max-w-full"
                            title="View full actor details"
                          >
                            <h4 className="text-sm font-semibold text-white truncate hover:text-emerald-300 transition-colors cursor-pointer">{actor.name}</h4>
                          </button>
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
                        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                          {(actor.association === "submissions" || actor.association === "both") && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-500/20 rounded text-xs text-violet-300">
                              <Tag className="w-3 h-3" />
                              Submissions
                            </span>
                          )}
                          {actor.sourceListNames.slice(0, 2).map((name, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-sky-500/20 rounded text-xs text-sky-300 truncate max-w-[120px]" title={name}>
                              {name}
                            </span>
                          ))}
                          {actor.sourceListNames.length > 2 && (
                            <span className="text-xs text-white/40">+{actor.sourceListNames.length - 2}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
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
                    autoComplete="off"
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

      {/* Actor Detail Modal - canonical ActorCard, fully expanded (matches My Actors → Actor cards) */}
      {detailActorId && (() => {
        const detailActor = allActors.find((a) => a.id === detailActorId)
        if (!detailActor) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailActorId(null) }}
          >
            <div className="relative w-full max-w-xl my-auto" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setDetailActorId(null)}
                className="absolute -top-2 -right-2 z-10 p-2 bg-[#1a2e23] hover:bg-white/20 border border-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <ActorCard
                actor={stripAggregate(detailActor)}
                onUpdate={updateActorGlobally}
                onDelete={() => {
                  handleDelete(detailActor)
                  setDetailActorId(null)
                }}
                forceExpanded
              />
            </div>
          </div>
        )
      })()}

      {/* Delete Warning Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
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
    videos: a.videos,
    photos: a.photos,
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
  onUpdate,
  onDelete,
  onDismissDuplicate,
  onNameClick,
}: {
  actor: AggregatedActor
  selected: boolean
  onToggle: () => void
  onUpdate: (actor: Actor) => void
  onDelete: () => void
  onDismissDuplicate: () => void
  onNameClick: () => void
}) {
  return (
    <div
      className={`relative rounded-xl transition-all ${
        selected ? "ring-2 ring-sky-500/40 ring-offset-2 ring-offset-[#0f1f17]" : ""
      }`}
    >
      {/* Canonical actor card - identical UI/behavior to My Actors → Actor cards and Submissions.
          The source-representation label is injected into the same field position as the Submissions card. */}
      <ActorCard
        actor={stripAggregate(actor)}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onNameClick={onNameClick}
        sourceLabel={<SourceLabel actor={actor} />}
      />

      {/* Selection checkbox overlay - All Actors only (preserves Add-to-List workflow) */}
      <button
        onClick={onToggle}
        className={`absolute top-3 left-3 z-20 w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          selected ? "bg-sky-500 border-sky-500 text-white" : "border-white/40 hover:border-sky-400 bg-[#1a2e23]"
        }`}
        title={selected ? "Deselect" : "Select"}
      >
        {selected && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Duplicate overlay - All Actors only */}
      {actor.isDuplicate && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded text-[11px] text-amber-300 font-sans pointer-events-auto">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Duplicate
            <button onClick={onDismissDuplicate} className="ml-0.5 text-amber-400/60 hover:text-amber-300" title="Dismiss">
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}
    </div>
  )
}
