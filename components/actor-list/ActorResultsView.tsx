"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Trash2, Share2, Phone, Mail, ChevronDown, X, Search, SlidersHorizontal, Filter, Pencil } from "lucide-react"
import { useActorList } from "./ActorListContext"
import ActorCard from "./ActorCard"
import { Actor, ActorGender } from "@/types/actor-list"
import { exportActorsAsJSON, exportActorsAsPDF, exportActorsAsExcel } from "@/lib/actor-export"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"
import AddItemDropdown from "@/components/ui/AddItemDropdown"
import DownloadDropdown from "@/components/ui/DownloadDropdown"
import AddViaUploadModal, { FoundEntry } from "@/components/ui/AddViaUploadModal"
import type { ActorExtractResult } from "@/types/ai"
import { trackAddItem, trackExport, trackDelete } from "@/lib/analytics"
import ShareModal from "@/components/modals/ShareModal"
import Image from "next/image"

const GENDER_GROUPS: ActorGender[] = ["Male", "Female", "Other", "Not-specified"]

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

export default function ActorResultsView() {
  const { currentProject, goBack, addActor, updateActor, deleteActor, deleteProject } = useActorList()
  const [searchQuery, setSearchQuery] = useState("")
  const [genderFilter, setGenderFilter] = useState<"all" | ActorGender>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("full")
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const [detailActorId, setDetailActorId] = useState<string | null>(null)
  const [detailEdit, setDetailEdit] = useState(false)
  const [sortBy, setSortBy] = useState<ActorSortOption>("name-asc")
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [ageMin, setAgeMin] = useState("")
  const [ageMax, setAgeMax] = useState("")
  const [filterByLocation, setFilterByLocation] = useState("")
  const [filterByAvailability, setFilterByAvailability] = useState("")
  const gridRef = useRef<HTMLDivElement>(null)

  const advancedFilterCount =
    (ageMin ? 1 : 0) +
    (ageMax ? 1 : 0) +
    (genderFilter !== "all" ? 1 : 0) +
    (filterByLocation.trim() ? 1 : 0) +
    (filterByAvailability.trim() ? 1 : 0)

  const clearAdvancedFilters = () => {
    setAgeMin("")
    setAgeMax("")
    setGenderFilter("all")
    setFilterByLocation("")
    setFilterByAvailability("")
  }

  const openActorDetail = (id: string) => {
    setDetailActorId(id)
    setDetailEdit(false)
  }
  const openActorEdit = (id: string) => {
    setDetailActorId(id)
    setDetailEdit(true)
  }
  const closeActorDetail = () => {
    setDetailActorId(null)
    setDetailEdit(false)
  }

  // Scroll to newly added item
  useEffect(() => {
    if (newItemId && gridRef.current) {
      const newElement = gridRef.current.querySelector(`[data-actor-id="${newItemId}"]`)
      if (newElement) {
        newElement.scrollIntoView({ behavior: "smooth", block: "center" })
        // Add a brief highlight effect
        newElement.classList.add("ring-2", "ring-sky-500", "ring-offset-2", "ring-offset-[#0f1f17]")
        setTimeout(() => {
          newElement.classList.remove("ring-2", "ring-sky-500", "ring-offset-2", "ring-offset-[#0f1f17]")
          setNewItemId(null)
        }, 2000)
      }
    }
  }, [newItemId, currentProject?.actors])

  if (!currentProject) return null

  const filteredActors = currentProject.actors
    .filter((actor) => {
      const matchesSearch =
        actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.notes.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGender = genderFilter === "all" || (actor.gender || "Not-specified") === genderFilter
      const matchesMin = !ageMin || (Number.isFinite(actor.age) && actor.age >= parseInt(ageMin, 10))
      const matchesMax = !ageMax || (Number.isFinite(actor.age) && actor.age <= parseInt(ageMax, 10))
      const matchesLocation =
        !filterByLocation.trim() ||
        getActorCustomValue(actor, ["location"]).toLowerCase().includes(filterByLocation.toLowerCase().trim())
      const matchesAvailability =
        !filterByAvailability.trim() ||
        getActorCustomValue(actor, ["availability"]).toLowerCase().includes(filterByAvailability.toLowerCase().trim())
      return matchesSearch && matchesGender && matchesMin && matchesMax && matchesLocation && matchesAvailability
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

  const handleAddActor = () => {
    const id = Date.now().toString()
    const newActor: Actor = {
      id,
      name: "New Actor",
      age: 30,
      playingAge: "25-35",
      phone: "+1-555-0000",
      email: "new.actor@email.com",
      headshotUrl: "",
      notes: "",
    }
    addActor(newActor)
    trackAddItem("actor-list", "actor")
    setNewItemId(id)
  }

  // Map AI extraction result into selectable entries for the modal.
  const mapActorResult = (result: ActorExtractResult): FoundEntry<Actor>[] =>
    (result.actors || []).map((actor, index) => ({
      item: {
        id: `${Date.now()}-${index}`,
        name: actor.name,
        age: actor.age || 0,
        playingAge: actor.playing_age || "Unknown",
        phone: actor.phone || "",
        email: actor.email || "",
        headshotUrl: actor.headshot_url || "",
        notes: actor.notes || "",
      },
      label: actor.name || "Unnamed actor",
      sublabel: [actor.age ? `${actor.age}yo` : "", actor.email].filter(Boolean).join(" • "),
    }))

  const handleAddUploaded = (items: Actor[]) => {
    if (items.length === 0) return
    addActor(items)
    items.forEach(() => {
      trackAddItem("actor-list", "actor")
    })
    const lastId = items[items.length - 1]?.id
    if (lastId) setNewItemId(lastId)
  }

  const handleExportJSON = () => {
    trackExport("actor-list", "json")
    exportActorsAsJSON(currentProject.actors, currentProject.name)
  }

  const handleExportPDF = () => {
    trackExport("actor-list", "pdf")
    exportActorsAsPDF(currentProject.actors, currentProject.name)
  }

  const handleExportExcel = () => {
    trackExport("actor-list", "excel")
    exportActorsAsExcel(currentProject.actors, currentProject.name)
  }

  const handleDeleteList = () => {
    trackDelete("actor-list", "list")
    if (confirm("Are you sure you want to delete this actor list?")) {
      deleteProject(currentProject.id)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10">
        {/* Back Navigation */}
        <div className="px-6 py-3 border-b border-white/5">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-sans">Back to My Actors</span>
          </button>
        </div>

        {/* Title and Actions */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-sans">
              {currentProject.name}
            </h1>
            <p className="text-white/50 text-sm font-sans">
              Actor List &bull; Found {currentProject.actors.length} items.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <AddItemDropdown
              label="Add Actor"
              onAddManually={handleAddActor}
              onAddViaUpload={() => setShowUploadModal(true)}
              triggerClassName="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              labelClassName="font-sans text-sm hidden sm:inline"
            />
            <DownloadDropdown
              onDownloadJSON={handleExportJSON}
              onDownloadExcel={handleExportExcel}
              onDownloadPDF={handleExportPDF}
              triggerClassName="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              labelClassName="font-sans text-sm hidden sm:inline"
            />
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors"
              title="Share via Email"
            >
              <Share2 className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">Share</span>
            </button>
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
              title="Delete List"
            >
              <Trash2 className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">Delete</span>
            </button>

            {/* View Mode Toggle */}
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Search Bar + Filters + Sort */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row sm:flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actors..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#13261c] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none font-sans text-sm"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowAdvancedFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-sans transition-colors ${
              showAdvancedFilters || advancedFilterCount > 0
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                : "bg-[#13261c] border-white/10 text-white hover:border-white/20"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {advancedFilterCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
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
                        ? "bg-emerald-500/20 text-emerald-300"
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

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
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
                  className="w-full px-3 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none font-sans text-sm"
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
                  className="w-full px-3 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none font-sans text-sm"
                />
              </div>
              {/* Gender */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Gender</label>
                <div className="relative">
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value as "all" | ActorGender)}
                    className="appearance-none w-full pl-3 pr-9 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white focus:border-emerald-500/50 focus:outline-none font-sans text-sm cursor-pointer"
                  >
                    <option value="all">All Genders</option>
                    {GENDER_GROUPS.map((g) => (
                      <option key={g} value={g}>
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
                  className="w-full px-3 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none font-sans text-sm"
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
                  className="w-full px-3 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none font-sans text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actors Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Full View - unchanged card grid */}
        {viewMode === "full" && (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredActors.map((actor) => (
              <div key={actor.id} data-actor-id={actor.id} className="transition-all duration-300 rounded-xl">
                <ActorCard
                  actor={actor}
                  onUpdate={updateActor}
                  onDelete={() => deleteActor(actor.id)}
                  onNameClick={() => openActorDetail(actor.id)}
                  onEditClick={() => openActorEdit(actor.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Minimal View - condensed cards */}
        {viewMode === "minimal" && (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredActors.map((actor) => (
              <div
                key={actor.id}
                data-actor-id={actor.id}
                className="group relative p-3 rounded-lg border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors"
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openActorEdit(actor.id)}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteActor(actor.id)}
                    className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-sky-500/20 flex-shrink-0">
                    {actor.headshotUrl ? (
                      <Image src={actor.headshotUrl} alt={actor.name} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sky-400 text-sm font-bold">
                        {actor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                    onClick={() => openActorDetail(actor.id)}
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
          <div ref={gridRef} className="space-y-6">
            {GENDER_GROUPS.map((gender) => {
              const genderActors = filteredActors.filter((a) => (a.gender || "Not-specified") === gender)
              if (genderActors.length === 0) return null
              return (
                <div key={gender} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                      {gender} ({genderActors.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {genderActors.map((actor) => (
                      <div
                        key={actor.id}
                        data-actor-id={actor.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-sky-500/20 flex-shrink-0">
                          {actor.headshotUrl ? (
                            <Image src={actor.headshotUrl} alt={actor.name} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sky-400 text-sm font-bold">
                              {actor.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="w-40 sm:w-48 md:w-56 min-w-0 flex-shrink-0">
                          <button
                    onClick={() => openActorDetail(actor.id)}
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
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {actor.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => openActorEdit(actor.id)}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteActor(actor.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
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
            <p className="text-white/40 font-sans">
              {searchQuery || genderFilter !== "all"
                ? "No actors found matching your search."
                : "No actors in this list yet."}
            </p>
          </div>
        )}
      </div>

      {/* Actor Detail Modal - full card, fully expanded */}
      {detailActorId && (() => {
        const detailActor = currentProject.actors.find((a) => a.id === detailActorId)
        if (!detailActor) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
            onMouseDown={(e) => { if (e.target === e.currentTarget) closeActorDetail() }}
          >
            <div className="relative w-full max-w-xl my-auto" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closeActorDetail}
                className="absolute -top-2 -right-2 z-10 p-2 bg-[#1a2e23] hover:bg-white/20 border border-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <ActorCard
                key={`${detailActor.id}-${detailEdit}`}
                actor={detailActor}
                onUpdate={updateActor}
                onDelete={() => {
                  deleteActor(detailActor.id)
                  closeActorDetail()
                }}
                forceExpanded
                startInEdit={detailEdit}
              />
            </div>
          </div>
        )
      })()}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          toolType="actor-list"
          projectName={currentProject.name}
          data={currentProject.actors}
        />
      )}

      {/* Add via Upload Modal */}
      {showUploadModal && (
        <AddViaUploadModal<Actor, ActorExtractResult>
          title="Actors"
          taskType="actor-extract"
          accept=".pdf,.csv,.xlsx,.xls"
          acceptLabel="Supports .CSV, .XLSX, and .PDF"
          accent="sky"
          mapResult={mapActorResult}
          onAddSelected={handleAddUploaded}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}
