"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Plus, FileJson, Download, Trash2, FileSpreadsheet, Share2 } from "lucide-react"
import { usePropList } from "./PropListContext"
import PropCard from "./PropCard"
import { Prop } from "@/types/prop-list"
import { exportPropsAsJSON, exportPropsAsPDF, exportPropsAsExcel } from "@/lib/prop-export"
import SearchBar from "@/components/ui/SearchBar"
import { trackAddItem, trackExport, trackDelete } from "@/lib/analytics"
import ShareModal from "@/components/modals/ShareModal"

export default function PropResultsView() {
  const { currentProject, setView, updateProp, deleteProp, addProp, deleteProject } = usePropList()
  const [searchQuery, setSearchQuery] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (newItemId && gridRef.current) {
      const el = gridRef.current.querySelector(`[data-prop-id="${newItemId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("ring-2", "ring-rose-500", "ring-offset-2", "ring-offset-[#0f1f17]")
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-rose-500", "ring-offset-2", "ring-offset-[#0f1f17]")
          setNewItemId(null)
        }, 2000)
      }
    }
  }, [newItemId, currentProject?.props])

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/50 font-sans">No project selected</p>
      </div>
    )
  }

  const filtered = currentProject.props.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    const id = crypto.randomUUID()
    const newProp: Prop = {
      id,
      name: "NEW PROP",
      category: "other",
      description: "Enter a description...",
      sceneAppearances: [],
    }
    addProp(currentProject.id, newProp)
    trackAddItem("prop-list", "prop")
    setNewItemId(id)
  }

  const handleExportJSON = () => {
    trackExport("prop-list", "json")
    exportPropsAsJSON(currentProject.props, currentProject.name)
  }
  const handleExportPDF = () => {
    trackExport("prop-list", "pdf")
    exportPropsAsPDF(currentProject.props, currentProject.name)
  }
  const handleExportExcel = () => {
    trackExport("prop-list", "excel")
    exportPropsAsExcel(currentProject.props, currentProject.name)
  }
  const handleDeleteList = () => {
    if (confirm("Are you sure you want to delete this entire prop list?")) {
      trackDelete("prop-list", "list")
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
                Prop List &bull; Found {currentProject.props.length} items.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
              title="Add Prop"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Prop</span>
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
              className="flex items-center gap-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-white font-semibold font-sans text-sm transition-colors"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
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
          </div>
        </div>

        <div className="mt-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search props..." />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((prop) => (
            <div key={prop.id} data-prop-id={prop.id} className="transition-all duration-300 rounded-xl">
              <PropCard
                prop={prop}
                onUpdate={(updated) => updateProp(currentProject.id, updated)}
                onDelete={() => deleteProp(currentProject.id, prop.id)}
              />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-white/50 font-sans mb-4">
              {searchQuery ? "No props match your search" : "No props yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-white font-semibold font-sans text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Prop
              </button>
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          toolType="prop-list"
          projectName={currentProject.name}
          data={currentProject.props}
        />
      )}
    </div>
  )
}
