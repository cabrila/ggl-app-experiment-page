"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Plus, FileJson, Download, Trash2, FileSpreadsheet } from "lucide-react"
import { useActorList } from "./ActorListContext"
import ActorCard from "./ActorCard"
import { Actor } from "@/types/actor-list"
import { exportActorsAsJSON, exportActorsAsPDF, exportActorsAsExcel } from "@/lib/actor-export"
import SearchBar from "@/components/ui/SearchBar"

export default function ActorResultsView() {
  const { currentProject, goBack, addActor, updateActor, deleteActor, deleteProject } = useActorList()
  const [searchQuery, setSearchQuery] = useState("")
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

  const filteredActors = currentProject.actors.filter(
    (actor) =>
      actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actor.notes.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    setNewItemId(id)
  }

  const handleExportJSON = () => {
    exportActorsAsJSON(currentProject.actors, currentProject.name)
  }

  const handleExportPDF = () => {
    exportActorsAsPDF(currentProject.actors, currentProject.name)
  }

  const handleExportExcel = () => {
    exportActorsAsExcel(currentProject.actors, currentProject.name)
  }

  const handleDeleteList = () => {
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
            <span className="text-sm font-sans">Back to Projects</span>
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
            <button
              onClick={handleAddActor}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Add Actor"
            >
              <Plus className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">Add Actor</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Export as JSON"
            >
              <FileJson className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Export as Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
              title="Delete List"
            >
              <Trash2 className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search actors..."
          />
        </div>
      </div>

      {/* Actors Grid */}
      <div className="flex-1 overflow-y-auto p-6">
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

        {filteredActors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/40 font-sans">
              {searchQuery ? "No actors found matching your search." : "No actors in this list yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
