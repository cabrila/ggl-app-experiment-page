"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Trash2, Share2, Phone, Mail, ChevronDown } from "lucide-react"
import { useActorList } from "./ActorListContext"
import ActorCard from "./ActorCard"
import { Actor, ActorGender } from "@/types/actor-list"
import { exportActorsAsJSON, exportActorsAsPDF, exportActorsAsExcel } from "@/lib/actor-export"
import SearchBar from "@/components/ui/SearchBar"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"
import AddItemDropdown from "@/components/ui/AddItemDropdown"
import DownloadDropdown from "@/components/ui/DownloadDropdown"
import AddViaUploadModal, { FoundEntry } from "@/components/ui/AddViaUploadModal"
import type { ActorExtractResult } from "@/types/ai"
import { trackAddItem, trackExport, trackDelete } from "@/lib/analytics"
import ShareModal from "@/components/modals/ShareModal"
import Image from "next/image"

const GENDER_GROUPS: ActorGender[] = ["Male", "Female", "Other", "Not-specified"]

export default function ActorResultsView() {
  const { currentProject, goBack, addActor, updateActor, deleteActor, deleteProject } = useActorList()
  const [searchQuery, setSearchQuery] = useState("")
  const [genderFilter, setGenderFilter] = useState<"all" | ActorGender>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("full")
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

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

  const filteredActors = currentProject.actors.filter((actor) => {
    const matchesSearch =
      actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actor.notes.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = genderFilter === "all" || (actor.gender || "Not-specified") === genderFilter
    return matchesSearch && matchesGender
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
    let lastId: string | null = null
    items.forEach((item) => {
      addActor(item)
      trackAddItem("actor-list", "actor")
      lastId = item.id
    })
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

        {/* Search Bar + Filter */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search actors..."
            />
          </div>
          <div className="relative">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as "all" | ActorGender)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-[#13261c] border border-white/10 rounded-xl text-sm text-white focus:border-emerald-500/50 focus:outline-none font-sans min-w-[150px] cursor-pointer"
            >
              <option value="all">All genders</option>
              {GENDER_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
        </div>
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
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {actor.email}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteActor(actor.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
