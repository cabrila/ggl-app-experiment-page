"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Plus, FileJson, Download, Trash2, FileSpreadsheet } from "lucide-react"
import { useSceneList } from "./SceneListContext"
import SceneCard from "./SceneCard"
import { Scene } from "@/types/scene-list"
import { exportScenesAsJSON, exportScenesAsPDF, exportScenesAsExcel } from "@/lib/scene-export"
import SearchBar from "@/components/ui/SearchBar"
import { trackAddItem, trackExport, trackDelete } from "@/lib/analytics"

export default function SceneResultsView() {
  const { currentProject, setView, updateScene, deleteScene, addScene, deleteProject } = useSceneList()
  const [searchQuery, setSearchQuery] = useState("")
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

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

  const filtered = currentProject.scenes.filter(
    (s) =>
      s.sceneHeading.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rawText.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => a.sceneNumber - b.sceneNumber)

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
              <span className="text-sm font-sans">Back to Projects</span>
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
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
              title="Add Scene"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Scene</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
              title="Export as JSON"
            >
              <FileJson className="w-4 h-4" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
              title="Export as Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-semibold font-sans text-sm transition-colors"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 font-sans text-sm transition-colors"
              title="Delete List"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search scenes..." />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((scene) => (
            <div key={scene.id} data-scene-id={scene.id} className="transition-all duration-300 rounded-xl">
              <SceneCard
                scene={scene}
                onUpdate={(updated) => updateScene(currentProject.id, updated)}
                onDelete={() => deleteScene(currentProject.id, scene.id)}
              />
            </div>
          ))}
        </div>

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
    </div>
  )
}
