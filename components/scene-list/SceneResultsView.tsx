"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Plus, Trash2, Share2, Pencil, X, ChevronDown } from "lucide-react"
import { useSceneList } from "./SceneListContext"
import SceneCard from "./SceneCard"
import { Scene } from "@/types/scene-list"
import { exportScenesAsJSON, exportScenesAsPDF, exportScenesAsExcel } from "@/lib/scene-export"
import ListToolbar, { SortOption } from "@/components/ui/ListToolbar"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"

type SceneSortOption = "number-asc" | "number-desc" | "name-asc" | "name-desc"

const sceneSortOptions: SortOption[] = [
  { value: "number-asc", label: "Scene # (Low-High)" },
  { value: "number-desc", label: "Scene # (High-Low)" },
  { value: "name-asc", label: "A-Z by Heading" },
  { value: "name-desc", label: "Z-A by Heading" },
]

const SCENE_TIME_OPTIONS = ["DAY", "NIGHT", "DAWN", "DUSK"]
import AddItemDropdown from "@/components/ui/AddItemDropdown"
import DownloadDropdown from "@/components/ui/DownloadDropdown"
import ScriptButton from "@/components/ui/ScriptButton"
import AddViaUploadModal, { FoundEntry } from "@/components/ui/AddViaUploadModal"
import type { SceneExtractResult } from "@/types/ai"
import { trackAddItem, trackExport, trackDelete } from "@/lib/analytics"
import ShareModal from "@/components/modals/ShareModal"

export default function SceneResultsView() {
  const { currentProject, setView, updateScene, deleteScene, addScene, deleteProject } = useSceneList()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SceneSortOption>("number-asc")
  const [timeFilter, setTimeFilter] = useState<"all" | string>("all")
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

  useEffect(() => {
    if (newItemId && gridRef.current) {
      const el = gridRef.current.querySelector(`[data-scene-id="${newItemId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("ring-2", "ring-teal-500", "ring-offset-2", "ring-offset-[#0f1f17]")
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-teal-500", "ring-offset-2", "ring-offset-[#0f1f17]")
          setNewItemId(null)
        }, 2000)
      }
    }
  }, [newItemId, currentProject?.scenes])

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/50 font-sans">No project selected</p>
      </div>
    )
  }

  const filterCount = timeFilter !== "all" ? 1 : 0

  const filtered = currentProject.scenes.filter((s) => {
    const matchesSearch =
      s.sceneHeading.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rawText.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTime =
      timeFilter === "all" || (s.timeOfDay || "").toUpperCase().includes(timeFilter.toUpperCase())
    return matchesSearch && matchesTime
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "number-asc":
        return a.sceneNumber - b.sceneNumber
      case "number-desc":
        return b.sceneNumber - a.sceneNumber
      case "name-asc":
        return a.sceneHeading.localeCompare(b.sceneHeading)
      case "name-desc":
        return b.sceneHeading.localeCompare(a.sceneHeading)
      default:
        return 0
    }
  })

  const handleAdd = () => {
    const id = crypto.randomUUID()
    const nextNumber = currentProject.scenes.length
      ? Math.max(...currentProject.scenes.map((s) => s.sceneNumber)) + 1
      : 1
    const newScene: Scene = {
      id,
      sceneNumber: nextNumber,
      sceneHeading: "INT. NEW SCENE - DAY",
      location: "NEW SCENE",
      timeOfDay: "DAY",
      rawText: "",
    }
    addScene(currentProject.id, newScene)
    trackAddItem("scene-list", "scene")
    setNewItemId(id)
  }

  // Map AI extraction result into selectable entries for the modal.
  const mapSceneResult = (result: SceneExtractResult): FoundEntry<Scene>[] =>
    (result.scenes || []).map((s, i) => ({
      item: {
        id: `${Date.now()}-${i}`,
        sceneNumber: typeof s.scene_number === "number" ? s.scene_number : i + 1,
        sceneHeading:
          typeof s.scene_heading === "string" && s.scene_heading
            ? s.scene_heading
            : `Scene ${i + 1}`,
        location: typeof s.location === "string" ? s.location : "",
        timeOfDay: typeof s.time_of_day === "string" ? s.time_of_day : "",
        rawText: typeof s.raw_text === "string" ? s.raw_text : "",
      },
      label:
        (typeof s.scene_heading === "string" && s.scene_heading) || `Scene ${i + 1}`,
      sublabel: [s.location, s.time_of_day].filter(Boolean).join(" • "),
    }))

  const handleAddUploaded = (items: Scene[]) => {
    if (items.length === 0) return
    // Continue scene numbering from the current max so added scenes don't
    // collide with existing ones.
    let nextNumber = currentProject.scenes.length
      ? Math.max(...currentProject.scenes.map((s) => s.sceneNumber)) + 1
      : 1
    
    const numberedScenes = items.map((item) => ({
      ...item,
      sceneNumber: nextNumber++
    }))

    addScene(currentProject.id, numberedScenes)
    
    items.forEach(() => {
      trackAddItem("scene-list", "scene")
    })
    const lastId = items[items.length - 1]?.id
    if (lastId) setNewItemId(lastId)
  }

  const handleExportJSON = () => {
    trackExport("scene-list", "json")
    exportScenesAsJSON(currentProject.scenes, currentProject.name)
  }
  const handleExportPDF = () => {
    trackExport("scene-list", "pdf")
    exportScenesAsPDF(currentProject.scenes, currentProject.name)
  }
  const handleExportExcel = () => {
    trackExport("scene-list", "excel")
    exportScenesAsExcel(currentProject.scenes, currentProject.name)
  }
  const handleDeleteList = () => {
    if (confirm("Are you sure you want to delete this entire scene breakdown?")) {
      trackDelete("scene-list", "list")
      deleteProject(currentProject.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 p-6 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("projects")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-sans">Back to My Scenes</span>
            </button>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <h1 className="text-2xl font-bold text-white font-sans">{currentProject.name}</h1>
              <p className="text-white/50 font-sans text-sm">
                Scene Breakdown &bull; Found {currentProject.scenes.length} scenes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <AddItemDropdown
              label="Add Scene"
              onAddManually={handleAdd}
              onAddViaUpload={() => setShowUploadModal(true)}
              triggerClassName="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
              labelClassName="hidden sm:inline"
            />
            <DownloadDropdown
              onDownloadJSON={handleExportJSON}
              onDownloadExcel={handleExportExcel}
              onDownloadPDF={handleExportPDF}
            />
            <ScriptButton script={currentProject?.script} />
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

        <ListToolbar
          className="mt-4"
          accent="teal"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search scenes..."
          sortOptions={sceneSortOptions}
          sortValue={sortBy}
          onSortChange={(v) => setSortBy(v as SceneSortOption)}
          filterCount={filterCount}
          onClearFilters={() => setTimeFilter("all")}
        >
          {/* Time of Day */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-sans">Time of Day</label>
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="appearance-none w-full pl-3 pr-9 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white focus:border-teal-500/50 focus:outline-none font-sans text-sm cursor-pointer"
              >
                <option value="all" className="bg-[#0f1f17] text-white">Any time</option>
                {SCENE_TIME_OPTIONS.map((t) => (
                  <option key={t} value={t} className="bg-[#0f1f17] text-white">{t}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
          </div>
        </ListToolbar>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Full View - card grid */}
        {viewMode === "full" && (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((scene) => (
              <div key={scene.id} data-scene-id={scene.id} className="transition-all duration-300 rounded-xl">
                <SceneCard
                  scene={scene}
                  onUpdate={(updated) => updateScene(currentProject.id, updated)}
                  onDelete={() => deleteScene(currentProject.id, scene.id)}
                  onNameClick={() => openDetail(scene.id)}
                  onEditClick={() => openEdit(scene.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Minimal View - condensed cards */}
        {viewMode === "minimal" && (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {sorted.map((scene) => (
              <div
                key={scene.id}
                data-scene-id={scene.id}
                className="group relative p-3 rounded-lg border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors"
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(scene.id)}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteScene(currentProject.id, scene.id)}
                    className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-teal-400">{scene.sceneNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => openDetail(scene.id)} className="text-left max-w-full" title="View full scene details">
                      <h3 className="text-sm font-semibold text-white truncate hover:text-teal-300 transition-colors cursor-pointer">{scene.sceneHeading}</h3>
                    </button>
                    <p className="text-xs text-white/50 truncate">
                      {[scene.location, scene.timeOfDay].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View - compact rows */}
        {viewMode === "list" && (
          <div ref={gridRef} className="border border-white/10 rounded-xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {sorted.map((scene) => (
                <div
                  key={scene.id}
                  data-scene-id={scene.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-teal-400">{scene.sceneNumber}</span>
                  </div>
                  <div className="w-44 sm:w-56 md:w-64 min-w-0 flex-shrink-0">
                    <button onClick={() => openDetail(scene.id)} className="text-left max-w-full" title="View full scene details">
                      <h4 className="text-sm font-semibold text-white truncate hover:text-teal-300 transition-colors cursor-pointer">{scene.sceneHeading}</h4>
                    </button>
                    <p className="text-xs text-white/50 truncate">
                      {[scene.location, scene.timeOfDay].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                  {scene.rawText && (
                    <div className="hidden lg:block flex-1 text-xs text-white/40 truncate">
                      {scene.rawText}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => openEdit(scene.id)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteScene(currentProject.id, scene.id)}
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
        )}

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-white/50 font-sans mb-4">
              {searchQuery ? "No scenes match your search" : "No scenes yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-semibold font-sans text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Scene
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scene Detail Modal - full card, fully expanded */}
      {detailId && (() => {
        const detailScene = currentProject.scenes.find((s) => s.id === detailId)
        if (!detailScene) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
            onMouseDown={(e) => { if (e.target === e.currentTarget) closeDetail() }}
          >
            <div className="relative w-full max-w-xl my-auto" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closeDetail}
                className="absolute -top-2 -right-2 z-10 p-2 bg-[#1a2e23] hover:bg-white/20 border border-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <SceneCard
                key={`${detailScene.id}-${detailEdit}`}
                scene={detailScene}
                onUpdate={(updated) => updateScene(currentProject.id, updated)}
                onDelete={() => {
                  deleteScene(currentProject.id, detailScene.id)
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
          toolType="scene-list"
          projectName={currentProject.name}
          data={currentProject.scenes}
        />
      )}

      {/* Add via Upload Modal */}
      {showUploadModal && (
        <AddViaUploadModal<Scene, SceneExtractResult>
          title="Scenes"
          taskType="scene-extract"
          accept=".pdf,.docx"
          acceptLabel="PDF or DOCX files"
          accent="teal"
          mapResult={mapSceneResult}
          onAddSelected={handleAddUploaded}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}
