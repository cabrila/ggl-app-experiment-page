"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Plus, Trash2, Share2, MapPin, Pencil, X } from "lucide-react"
import { useLocationScouting } from "./LocationScoutingContext"
import LocationCard from "./LocationCard"
import { Location } from "@/types/location-scouting"
import { exportLocationsAsJSON, exportLocationsAsPDF, exportLocationsAsExcel } from "@/lib/location-export"
import SearchBar from "@/components/ui/SearchBar"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"
import AddItemDropdown from "@/components/ui/AddItemDropdown"
import DownloadDropdown from "@/components/ui/DownloadDropdown"
import AddViaUploadModal, { FoundEntry } from "@/components/ui/AddViaUploadModal"
import type { LocationOverviewResult } from "@/types/ai"
import { trackAddItem, trackExport, trackDelete } from "@/lib/analytics"
import ShareModal from "@/components/modals/ShareModal"

const TYPE_GROUPS: { value: Location["type"]; label: string }[] = [
  { value: "INT", label: "Interior" },
  { value: "EXT", label: "Exterior" },
]
const TIME_OPTIONS: Location["timeOfDay"][] = ["DAY", "NIGHT", "DAWN", "DUSK"]

export default function LocationResultsView() {
  const {
    currentProject,
    setView,
    updateLocation,
    deleteLocation,
    addLocation,
    deleteProject,
  } = useLocationScouting()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | Location["type"]>("all")
  const [timeFilter, setTimeFilter] = useState<"all" | Location["timeOfDay"]>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("full")
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailEdit, setDetailEdit] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const openDetail = (id: string) => {
    setDetailId(id)
    setDetailEdit(false)
  }
  const openEdit = (id: string) => {
    setDetailId(id)
    setDetailEdit(true)
  }
  const closeDetail = () => {
    setDetailId(null)
    setDetailEdit(false)
  }

  // Scroll to newly added item
  useEffect(() => {
    if (newItemId && gridRef.current) {
      const newElement = gridRef.current.querySelector(`[data-location-id="${newItemId}"]`)
      if (newElement) {
        newElement.scrollIntoView({ behavior: "smooth", block: "center" })
        // Add a brief highlight effect
        newElement.classList.add("ring-2", "ring-amber-500", "ring-offset-2", "ring-offset-[#0f1f17]")
        setTimeout(() => {
          newElement.classList.remove("ring-2", "ring-amber-500", "ring-offset-2", "ring-offset-[#0f1f17]")
          setNewItemId(null)
        }, 2000)
      }
    }
  }, [newItemId, currentProject?.locations])

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/50 font-sans">No project selected</p>
      </div>
    )
  }

  const filteredLocations = currentProject.locations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || location.type === typeFilter
    const matchesTime = timeFilter === "all" || location.timeOfDay === timeFilter
    return matchesSearch && matchesType && matchesTime
  })

  const handleAddLocation = () => {
    const id = crypto.randomUUID()
    const newLocation: Location = {
      id,
      name: "NEW LOCATION",
      type: "EXT",
      timeOfDay: "DAY",
      description: "Enter a description for this location...",
      scoutingNotes: "Add scouting notes here...",
    }
    addLocation(currentProject.id, newLocation)
    trackAddItem("location-overview", "location")
    setNewItemId(id)
  }

  // Map AI extraction result into selectable entries for the modal.
  const mapLocationResult = (result: LocationOverviewResult): FoundEntry<Location>[] =>
    (result.locations || []).map((loc, index) => ({
      item: {
        id: `${Date.now()}-${index}`,
        name: loc.name,
        type: loc.type === "INT/EXT" ? "INT" : (loc.type === "unknown" ? "INT" : loc.type) || "EXT",
        timeOfDay: loc.time_of_day === "unknown" ? "DAY" : loc.time_of_day || "DAY",
        description: loc.description || "",
        scoutingNotes: loc.scouting_notes || "",
      },
      label: loc.name || "Unnamed location",
      sublabel: [loc.type, loc.time_of_day].filter((v) => v && v !== "unknown").join(" • "),
    }))

  const handleAddUploaded = (items: Location[]) => {
    if (items.length === 0) return
    addLocation(currentProject.id, items)
    items.forEach(() => {
      trackAddItem("location-overview", "location")
    })
    const lastId = items[items.length - 1]?.id
    if (lastId) setNewItemId(lastId)
  }

  const handleExportJSON = () => {
    trackExport("location-overview", "json")
    exportLocationsAsJSON(currentProject.locations, currentProject.name)
  }

  const handleExportPDF = () => {
    trackExport("location-overview", "pdf")
    exportLocationsAsPDF(currentProject.locations, currentProject.name)
  }

  const handleExportExcel = () => {
    trackExport("location-overview", "excel")
    exportLocationsAsExcel(currentProject.locations, currentProject.name)
  }

  const handleDeleteList = () => {
    trackDelete("location-overview", "list")
    if (confirm("Are you sure you want to delete this entire location list?")) {
      deleteProject(currentProject.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 p-6 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("projects")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-sans">Back to My Locations</span>
            </button>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <h1 className="text-2xl font-bold text-white font-sans">
                {currentProject.name}
              </h1>
              <p className="text-white/50 font-sans text-sm">
                Location List • Found {currentProject.locations.length} items.
              </p>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <AddItemDropdown
              label="Add Location"
              onAddManually={handleAddLocation}
              onAddViaUpload={() => setShowUploadModal(true)}
              triggerClassName="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
              labelClassName="hidden sm:inline"
            />
            <DownloadDropdown
              onDownloadJSON={handleExportJSON}
              onDownloadExcel={handleExportExcel}
              onDownloadPDF={handleExportPDF}
            />
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-sans text-sm transition-colors"
              title="Share via Email"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 font-sans text-sm transition-colors"
              title="Delete List"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            {/* View Mode Toggle */}
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search locations..."
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | Location["type"])}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:border-amber-500/50 focus:outline-none font-sans"
          >
            <option value="all">All types</option>
            {TYPE_GROUPS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as "all" | Location["timeOfDay"])}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:border-amber-500/50 focus:outline-none font-sans"
          >
            <option value="all">Any time</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Locations Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Full View - unchanged card grid */}
        {viewMode === "full" && (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredLocations.map((location) => (
              <div key={location.id} data-location-id={location.id} className="transition-all duration-300 rounded-xl">
                <LocationCard
                  location={location}
                  onUpdate={(updated) => updateLocation(currentProject.id, updated)}
                  onDelete={() => deleteLocation(currentProject.id, location.id)}
                  onNameClick={() => openDetail(location.id)}
                  onEditClick={() => openEdit(location.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Minimal View - condensed cards */}
        {viewMode === "minimal" && (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                data-location-id={location.id}
                className="group relative p-3 rounded-lg border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors"
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(location.id)}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteLocation(currentProject.id, location.id)}
                    className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => openDetail(location.id)} className="text-left max-w-full" title="View full location details">
                      <h3 className="text-sm font-semibold text-white truncate hover:text-amber-300 transition-colors cursor-pointer">{location.name}</h3>
                    </button>
                    <p className="text-xs text-white/50 truncate">
                      {location.type} • {location.timeOfDay}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View - grouped by type */}
        {viewMode === "list" && (
          <div ref={gridRef} className="space-y-6">
            {TYPE_GROUPS.map(({ value, label }) => {
              const typeLocations = filteredLocations.filter((l) => l.type === value)
              if (typeLocations.length === 0) return null
              return (
                <div key={value} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                      {label} ({typeLocations.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {typeLocations.map((location) => (
                      <div
                        key={location.id}
                        data-location-id={location.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="w-40 sm:w-48 md:w-56 min-w-0 flex-shrink-0">
                          <button onClick={() => openDetail(location.id)} className="text-left max-w-full" title="View full location details">
                            <h4 className="text-sm font-semibold text-white truncate hover:text-amber-300 transition-colors cursor-pointer">{location.name}</h4>
                          </button>
                          <p className="text-xs text-white/50 truncate">{location.timeOfDay}</p>
                        </div>
                        {location.description && (
                          <div className="hidden lg:block flex-1 text-xs text-white/40 truncate">
                            {location.description}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => openEdit(location.id)}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLocation(currentProject.id, location.id)}
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

        {filteredLocations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-white/50 font-sans mb-4">
              {searchQuery ? "No locations match your search" : "No locations yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddLocation}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-lg text-black font-semibold font-sans text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Location
              </button>
            )}
          </div>
        )}
      </div>

      {/* Location Detail Modal - full card, fully expanded */}
      {detailId && (() => {
        const detailLocation = currentProject.locations.find((l) => l.id === detailId)
        if (!detailLocation) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
            onMouseDown={(e) => { if (e.target === e.currentTarget) closeDetail() }}
          >
            <div className="relative w-full max-w-xl my-auto">
              <button
                onClick={closeDetail}
                className="absolute -top-2 -right-2 z-10 p-2 bg-[#1a2e23] hover:bg-white/20 border border-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <LocationCard
                key={`${detailLocation.id}-${detailEdit}`}
                location={detailLocation}
                onUpdate={(updated) => updateLocation(currentProject.id, updated)}
                onDelete={() => {
                  deleteLocation(currentProject.id, detailLocation.id)
                  closeDetail()
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
          toolType="location-overview"
          projectName={currentProject.name}
          data={currentProject.locations}
        />
      )}

      {/* Add via Upload Modal */}
      {showUploadModal && (
        <AddViaUploadModal<Location, LocationOverviewResult>
          title="Locations"
          taskType="location-overview"
          accept=".pdf,.docx"
          acceptLabel="PDF or DOCX files"
          accent="amber"
          mapResult={mapLocationResult}
          onAddSelected={handleAddUploaded}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}
