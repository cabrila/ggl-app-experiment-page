"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Plus, Trash2, Share2, Package, Pencil, X } from "lucide-react"
import { usePropList } from "./PropListContext"
import PropCard from "./PropCard"
import { Prop, PropCategory } from "@/types/prop-list"
import { exportPropsAsJSON, exportPropsAsPDF, exportPropsAsExcel } from "@/lib/prop-export"
import SearchBar from "@/components/ui/SearchBar"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"
import AddItemDropdown from "@/components/ui/AddItemDropdown"
import DownloadDropdown from "@/components/ui/DownloadDropdown"
import AddViaUploadModal, { FoundEntry } from "@/components/ui/AddViaUploadModal"
import type { PropExtractResult } from "@/types/ai"
import { trackAddItem, trackExport, trackDelete } from "@/lib/analytics"
import ShareModal from "@/components/modals/ShareModal"

const CATEGORY_LABELS: Record<PropCategory, string> = {
  weapon: "Weapon",
  container: "Container",
  surveillance_device: "Surveillance Device",
  tool: "Tool",
  currency: "Currency",
  contraband: "Contraband",
  equipment: "Equipment",
  food_or_drink: "Food / Drink",
  vehicle: "Vehicle",
  wardrobe: "Wardrobe",
  document: "Document",
  other: "Other",
}
const CATEGORY_ORDER: PropCategory[] = [
  "weapon", "container", "surveillance_device", "tool", "currency",
  "contraband", "equipment", "food_or_drink", "vehicle", "wardrobe",
  "document", "other",
]

export default function PropResultsView() {
  const { currentProject, setView, updateProp, deleteProp, addProp, deleteProject } = usePropList()
  const [searchQuery, setSearchQuery] = useState("")
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

  // Map AI extraction result into selectable entries for the modal.
  const VALID_CATEGORIES: PropCategory[] = [
    "weapon", "container", "surveillance_device", "tool", "currency",
    "contraband", "equipment", "food_or_drink", "vehicle", "wardrobe",
    "document", "other",
  ]
  const normalizeCategory = (cat?: string): PropCategory => {
    if (!cat) return "other"
    const lower = cat.toLowerCase().replace(/\s+/g, "_") as PropCategory
    return VALID_CATEGORIES.includes(lower) ? lower : "other"
  }

  const mapPropResult = (result: PropExtractResult): FoundEntry<Prop>[] =>
    (result.props || []).map((p, i) => {
      const appearances = Array.isArray(p.scene_appearances) ? p.scene_appearances : []
      return {
        item: {
          id: `${Date.now()}-${i}`,
          name: typeof p.name === "string" ? p.name : "",
          category: normalizeCategory(p.category),
          description: typeof p.description === "string" ? p.description : "",
          sceneAppearances: appearances.map((a, j) => ({
            id: `${Date.now()}-${i}-${j}`,
            sceneHeading: typeof a.scene_heading === "string" ? a.scene_heading : "",
            handledBy: typeof a.handled_by === "string" ? a.handled_by : "unknown",
            citation: typeof a.citation === "string" ? a.citation : "",
          })),
        },
        label: p.name || "Unnamed prop",
        sublabel: normalizeCategory(p.category).replace(/_/g, " "),
      }
    })

  const handleAddUploaded = (items: Prop[]) => {
    let lastId: string | null = null
    items.forEach((item) => {
      addProp(currentProject.id, item)
      trackAddItem("prop-list", "prop")
      lastId = item.id
    })
    if (lastId) setNewItemId(lastId)
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
            <AddItemDropdown
              label="Add Prop"
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

        <div className="mt-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search props..." />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Full View - card grid */}
        {viewMode === "full" && (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((prop) => (
              <div key={prop.id} data-prop-id={prop.id} className="transition-all duration-300 rounded-xl">
                <PropCard
                  prop={prop}
                  onUpdate={(updated) => updateProp(currentProject.id, updated)}
                  onDelete={() => deleteProp(currentProject.id, prop.id)}
                  onNameClick={() => openDetail(prop.id)}
                  onEditClick={() => openEdit(prop.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Minimal View - condensed cards */}
        {viewMode === "minimal" && (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filtered.map((prop) => (
              <div
                key={prop.id}
                data-prop-id={prop.id}
                className="group relative p-3 rounded-lg border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors"
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(prop.id)}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteProp(currentProject.id, prop.id)}
                    className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex-shrink-0 flex items-center justify-center">
                    <Package className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => openDetail(prop.id)} className="text-left max-w-full" title="View full prop details">
                      <h3 className="text-sm font-semibold text-white truncate hover:text-rose-300 transition-colors cursor-pointer">{prop.name}</h3>
                    </button>
                    <p className="text-xs text-white/50 truncate">{CATEGORY_LABELS[prop.category]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View - grouped by category */}
        {viewMode === "list" && (
          <div ref={gridRef} className="space-y-6">
            {CATEGORY_ORDER.map((category) => {
              const categoryProps = filtered.filter((p) => p.category === category)
              if (categoryProps.length === 0) return null
              return (
                <div key={category} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                      {CATEGORY_LABELS[category]} ({categoryProps.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {categoryProps.map((prop) => (
                      <div
                        key={prop.id}
                        data-prop-id={prop.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex-shrink-0 flex items-center justify-center">
                          <Package className="w-5 h-5 text-rose-400" />
                        </div>
                        <div className="w-40 sm:w-48 md:w-56 min-w-0 flex-shrink-0">
                          <button onClick={() => openDetail(prop.id)} className="text-left max-w-full" title="View full prop details">
                            <h4 className="text-sm font-semibold text-white truncate hover:text-rose-300 transition-colors cursor-pointer">{prop.name}</h4>
                          </button>
                          <p className="text-xs text-white/50 truncate">{CATEGORY_LABELS[prop.category]}</p>
                        </div>
                        {prop.description && (
                          <div className="hidden lg:block flex-1 text-xs text-white/40 truncate">
                            {prop.description}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => openEdit(prop.id)}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProp(currentProject.id, prop.id)}
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

      {/* Prop Detail Modal - full card, fully expanded */}
      {detailId && (() => {
        const detailProp = currentProject.props.find((p) => p.id === detailId)
        if (!detailProp) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
            onClick={closeDetail}
          >
            <div className="relative w-full max-w-xl my-auto" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closeDetail}
                className="absolute -top-2 -right-2 z-10 p-2 bg-[#1a2e23] hover:bg-white/20 border border-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <PropCard
                key={`${detailProp.id}-${detailEdit}`}
                prop={detailProp}
                onUpdate={(updated) => updateProp(currentProject.id, updated)}
                onDelete={() => {
                  deleteProp(currentProject.id, detailProp.id)
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
          toolType="prop-list"
          projectName={currentProject.name}
          data={currentProject.props}
        />
      )}

      {/* Add via Upload Modal */}
      {showUploadModal && (
        <AddViaUploadModal<Prop, PropExtractResult>
          title="Props"
          taskType="prop-extract"
          accept=".pdf,.docx"
          acceptLabel="PDF or DOCX files"
          accent="rose"
          mapResult={mapPropResult}
          onAddSelected={handleAddUploaded}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}
