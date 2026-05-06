"use client"

import { useState, useEffect, useMemo, useCallback, useRef, type ChangeEvent } from "react"
import { isValidImageUrl } from "@/lib/utils"
import {
  X,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  Pencil,
  Trash2,
  Lightbulb,
  Image as ImageIcon,
  Layers,
  Hammer,
  Film,
  MapPin,
  Package,
  AlertTriangle,
  Calendar,
  DollarSign,
  Paintbrush,
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  Tag,
  Ruler,
  Sofa,
  StickyNote,
  Grid3X3,
  List,
  SlidersHorizontal,
  Columns3,
  Activity,
  Sparkles,
  Link2,
  CircleDot,
  Zap,
  Box,
  ChevronLeft,
  Save,
  RotateCcw,
  Upload,
  GripVertical,
  Copy,
  MoreVertical,
  Home,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal, navigateToModal } from "./ModalManager"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import EmbeddedCoPilot from "@/components/copilot/EmbeddedCoPilot"
import type {
  ProductionDesignSet,
  BuildElement,
  SetDecoration,
  LightingFixture,
  MoodBoardImage,
  ConstructionTask,
  SetStatusPhase,
  ConstructionPhase,
} from "@/types/casting"

/* ============================================================
   MOCK DATA
   ============================================================ */

const MOCK_SETS: ProductionDesignSet[] = [
  {
    id: "set-1",
    name: "Grant's Dig Site",
    description: "Badlands excavation camp with exposed fossil bed, canopy tents, and geological equipment. Desert environment with layered sediment walls.",
    status: "camera-ready",
    locationId: "loc1",
    sceneIds: ["scene-1", "scene-3"],
    buildElements: [
      { id: "be-1", name: "Sediment Wall Flat (12x8ft)", material: "Foam + Plaster", dimensions: "12' x 8' x 2'", quantity: 4, notes: "Painted desert strata layers" },
      { id: "be-2", name: "Fossil Bed Platform", material: "MDF + Resin casts", dimensions: "16' x 10'", quantity: 1, notes: "Embedded raptor claw replica" },
      { id: "be-3", name: "Canopy Frame", material: "Steel tube + Canvas", dimensions: "20' x 15'", quantity: 2 },
    ],
    decorations: [
      { id: "sd-1", name: "Geological Survey Maps", source: "fabricated", quantity: 6 },
      { id: "sd-2", name: "Paleontology Field Kit", source: "rental", quantity: 3 },
      { id: "sd-3", name: "Camp Chairs & Table", source: "inventory", propId: "prop-camp", quantity: 4 },
      { id: "sd-4", name: "Amber Specimen Display", source: "fabricated", quantity: 1, notes: "Hero prop, close-up ready" },
    ],
    lighting: [
      { id: "lf-1", name: "Desert Sun Rig (18K HMI)", type: "motivated", wattage: "18,000W", dimmable: false, notes: "Primary key through diffusion", fixtureImage: "", lightExampleImage: "" },
      { id: "lf-2", name: "Tent Practicals (Lanterns)", type: "practical", wattage: "60W", dimmable: true, fixtureImage: "" },
    ],
    moodBoard: [
      { id: "mb-1", url: "", caption: "Badlands rock formation reference", tags: ["terrain", "color"], addedAt: Date.now() - 14 * 86400000 },
      { id: "mb-2", url: "", caption: "Excavation camp layout", tags: ["layout", "camp"], addedAt: Date.now() - 12 * 86400000 },
      { id: "mb-3", url: "", caption: "Fossil bed texture detail", tags: ["texture", "prop"], addedAt: Date.now() - 10 * 86400000 },
    ],
    estimatedBudget: "$45,000",
    actualBudget: "$42,300",
    notes: "Wind machines needed for exterior shots. Coordinate with SFX for dust effects.",
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 2 * 86400000,
  },
  {
    id: "set-2",
    name: "Jurassic Park Visitor Center",
    description: "Grand rotunda with dinosaur skeleton displays, amber-themed decor, and park branding. Two-story set with balcony mezzanine.",
    status: "construction",
    locationId: "loc3",
    sceneIds: ["scene-5", "scene-8", "scene-12"],
    buildElements: [
      { id: "be-4", name: "Rotunda Columns (Fluted)", material: "Fibreglass", dimensions: "24' x 3' dia", quantity: 8 },
      { id: "be-5", name: "Mezzanine Balcony", material: "Steel + MDF", dimensions: "40' x 6'", quantity: 1, notes: "Must support 6 actors + camera crew" },
      { id: "be-6", name: "Entrance Arch", material: "Foam sculpted", dimensions: "18' x 12'", quantity: 1, notes: "Jurassic Park logo carved in stone" },
      { id: "be-7", name: "Gift Shop Shelving Units", material: "Pine + Paint", dimensions: "8' x 4'", quantity: 6 },
    ],
    decorations: [
      { id: "sd-5", name: "T-Rex Skeleton (3/4 scale)", source: "rental", quantity: 1, notes: "Mounted on rotating base" },
      { id: "sd-6", name: "Amber Display Cases", source: "fabricated", quantity: 4 },
      { id: "sd-7", name: "JP Branded Merchandise", source: "fabricated", quantity: 50 },
      { id: "sd-8", name: "Visitor Information Plaques", source: "fabricated", quantity: 12 },
    ],
    lighting: [
      { id: "lf-3", name: "Grand Chandelier Practical", type: "practical", wattage: "2,400W", dimmable: true, notes: "Amber glass shades, JP logo" },
      { id: "lf-4", name: "Display Case Spots", type: "ambient", wattage: "150W each", dimmable: true },
      { id: "lf-5", name: "Emergency Red Lights", type: "effect", wattage: "40W", dimmable: false, notes: "Triggered by power-failure scene" },
    ],
    moodBoard: [
      { id: "mb-4", url: "", caption: "Museum rotunda inspiration", tags: ["architecture", "grand"], addedAt: Date.now() - 20 * 86400000 },
      { id: "mb-5", url: "", caption: "Amber lighting mood", tags: ["lighting", "warm"], addedAt: Date.now() - 18 * 86400000 },
    ],
    estimatedBudget: "$120,000",
    actualBudget: "$95,500",
    notes: "Skeleton rigging must be inspected by structural engineer before camera day.",
    createdAt: Date.now() - 45 * 86400000,
    updatedAt: Date.now() - 1 * 86400000,
  },
  {
    id: "set-3",
    name: "Raptor Kitchen",
    description: "Industrial commercial kitchen with stainless steel surfaces, walk-in freezer door, and overhead pot racks. Must accommodate raptor animatronic clearance.",
    status: "dressing",
    locationId: "loc3",
    sceneIds: ["scene-42"],
    buildElements: [
      { id: "be-8", name: "Kitchen Island Counter", material: "Steel + Laminate", dimensions: "12' x 4'", quantity: 2 },
      { id: "be-9", name: "Walk-in Freezer Door", material: "Aluminium + Insulation", dimensions: "7' x 4'", quantity: 1, notes: "Functional latch, must lock from inside" },
      { id: "be-10", name: "Overhead Pot Rack", material: "Steel tube", dimensions: "8' x 3'", quantity: 3 },
    ],
    decorations: [
      { id: "sd-9", name: "Stainless Steel Cookware", source: "rental", quantity: 40 },
      { id: "sd-10", name: "Industrial Shelving + Jello Molds", source: "purchase", quantity: 6, notes: "Green jello, hero prop" },
    ],
    lighting: [
      { id: "lf-6", name: "Fluorescent Ceiling Banks", type: "practical", wattage: "120W", dimmable: false },
      { id: "lf-7", name: "Freezer Interior Light", type: "motivated", wattage: "60W", dimmable: true },
    ],
    moodBoard: [
      { id: "mb-6", url: "", caption: "Industrial kitchen reference", tags: ["steel", "industrial"], addedAt: Date.now() - 8 * 86400000 },
    ],
    estimatedBudget: "$35,000",
    notes: "Animatronic clearance: minimum 9ft ceiling required. Floor protection for raptor feet mechanisms.",
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now() - 3 * 86400000,
  },
  {
    id: "set-4",
    name: "Control Room",
    description: "High-tech nerve center with CRT monitors, server racks, and custom Unix workstations. Elevated viewing platform overlooking park.",
    status: "design",
    sceneIds: ["scene-15", "scene-20"],
    buildElements: [
      { id: "be-11", name: "Console Desk Array", material: "MDF + Acrylic", dimensions: "20' curved", quantity: 1 },
      { id: "be-12", name: "Server Rack Wall", material: "Steel + LED strips", dimensions: "12' x 8'", quantity: 1 },
    ],
    decorations: [
      { id: "sd-11", name: "CRT Monitors", source: "rental", quantity: 24 },
      { id: "sd-12", name: "Keyboard & Mouse Sets", source: "purchase", quantity: 12 },
      { id: "sd-13", name: "Park Map Backlit Display", source: "fabricated", quantity: 1 },
    ],
    lighting: [
      { id: "lf-8", name: "Monitor Glow (Practical)", type: "practical", wattage: "variable", dimmable: true },
      { id: "lf-9", name: "Overhead Fluorescent Grid", type: "ambient", wattage: "240W", dimmable: true, notes: "Flickers during power cut" },
    ],
    moodBoard: [
      { id: "mb-7", url: "", caption: "90s control room aesthetic", tags: ["tech", "retro"], addedAt: Date.now() - 5 * 86400000 },
    ],
    estimatedBudget: "$65,000",
    notes: "All monitors need functional screen content. Coordinate with VFX for park tracking UI.",
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: "set-5",
    name: "Ford Explorer Interior",
    description: "Custom vehicle interior for park tour sequence. Night-vision compatible. Must accommodate camera mounts on all angles.",
    status: "approved",
    sceneIds: ["scene-10", "scene-22", "scene-30"],
    buildElements: [
      { id: "be-13", name: "Explorer Shell (Split)", material: "Fibreglass + Steel", dimensions: "Vehicle scale", quantity: 1, notes: "Driver & passenger side separable" },
      { id: "be-14", name: "Dashboard Electronics", material: "Custom electronics", dimensions: "Standard", quantity: 1 },
    ],
    decorations: [
      { id: "sd-14", name: "Night Vision Goggles", source: "fabricated", quantity: 2 },
      { id: "sd-15", name: "Tour Guide Screens", source: "fabricated", quantity: 2 },
    ],
    lighting: [
      { id: "lf-10", name: "Dashboard Glow", type: "practical", wattage: "30W", dimmable: true },
      { id: "lf-11", name: "T-Rex Attack Lightning Effect", type: "effect", wattage: "6,000W", dimmable: false, notes: "Strobe + rain interaction" },
    ],
    moodBoard: [],
    estimatedBudget: "$55,000",
    notes: "Rain rig coordination with SFX. Breakaway windshield needed for T-Rex attack.",
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now() - 4 * 86400000,
  },
]

const MOCK_TASKS: ConstructionTask[] = [
  { id: "ct-1", title: "Build sediment wall flats", phase: "carpentry", priority: "high", completed: true, setId: "set-1" },
  { id: "ct-2", title: "Paint desert strata on flats", phase: "paint", priority: "high", completed: true, setId: "set-1" },
  { id: "ct-3", title: "Install canopy rigging", phase: "rigging", priority: "medium", completed: true, setId: "set-1" },
  { id: "ct-4", title: "Place fossil bed + dress camp", phase: "set-dec", priority: "high", completed: true, setId: "set-1" },
  { id: "ct-5", title: "Final camera walk-through", phase: "on-camera", priority: "high", completed: true, setId: "set-1" },
  { id: "ct-6", title: "Frame rotunda columns", phase: "carpentry", priority: "urgent", completed: true, setId: "set-2" },
  { id: "ct-7", title: "Mezzanine steel structure", phase: "carpentry", priority: "urgent", completed: true, setId: "set-2" },
  { id: "ct-8", title: "Prime & paint columns", phase: "paint", priority: "high", completed: false, setId: "set-2", assignedTo: "Paint Crew A" },
  { id: "ct-9", title: "Rig chandelier + display spots", phase: "rigging", priority: "high", completed: false, setId: "set-2", assignedTo: "Electric Dept" },
  { id: "ct-10", title: "Install T-Rex skeleton", phase: "set-dec", priority: "urgent", completed: false, setId: "set-2", notes: "Structural engineer sign-off needed" },
  { id: "ct-11", title: "Build kitchen islands", phase: "carpentry", priority: "high", completed: true, setId: "set-3" },
  { id: "ct-12", title: "Chrome finish on counters", phase: "paint", priority: "medium", completed: true, setId: "set-3" },
  { id: "ct-13", title: "Install pot racks + freezer door", phase: "rigging", priority: "high", completed: true, setId: "set-3" },
  { id: "ct-14", title: "Dress kitchen with cookware", phase: "set-dec", priority: "high", completed: false, setId: "set-3", assignedTo: "Set Dec Team" },
  { id: "ct-15", title: "Console desk CNC cut", phase: "carpentry", priority: "medium", completed: false, setId: "set-4", dueDate: Date.now() + 7 * 86400000 },
  { id: "ct-16", title: "Explorer shell fabrication", phase: "carpentry", priority: "high", completed: false, setId: "set-5", dueDate: Date.now() + 5 * 86400000 },
]

/* ============================================================
   LOCALSTORAGE PERSISTENCE
   ============================================================ */

const PD_STORAGE_KEY = "greenlight-production-design-sets"

function sanitizeUrl(url?: string): string {
  if (!url || url.includes("placeholder.svg")) return ""
  return url
}

function loadSavedSets(): ProductionDesignSet[] | null {
  try {
    const raw = localStorage.getItem(PD_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitize any placeholder.svg URLs from old saved data
        return parsed.map((set: ProductionDesignSet) => ({
          ...set,
          moodBoard: set.moodBoard.map((img) => ({ ...img, url: sanitizeUrl(img.url) })),
          lighting: set.lighting.map((lf) => ({
            ...lf,
            fixtureImage: sanitizeUrl(lf.fixtureImage),
            lightExampleImage: sanitizeUrl(lf.lightExampleImage),
          })),
        }))
      }
    }
  } catch { /* ignore corrupt data */ }
  return null
}

/* ============================================================
   HELPERS
   ============================================================ */

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const STATUS_CONFIG: Record<SetStatusPhase, { label: string; color: string; bg: string; dot: string }> = {
  concept:        { label: "Concept",        color: "text-gray-700",    bg: "bg-gray-100",    dot: "bg-gray-400" },
  design:         { label: "Design",         color: "text-blue-700",    bg: "bg-blue-50",     dot: "bg-blue-500" },
  drafting:       { label: "Drafting",       color: "text-indigo-700",  bg: "bg-indigo-50",   dot: "bg-indigo-500" },
  approved:       { label: "Approved",       color: "text-emerald-700", bg: "bg-emerald-50",  dot: "bg-emerald-500" },
  construction:   { label: "Construction",   color: "text-amber-700",   bg: "bg-amber-50",    dot: "bg-amber-500" },
  dressing:       { label: "Dressing",       color: "text-purple-700",  bg: "bg-purple-50",   dot: "bg-purple-500" },
  "camera-ready": { label: "Camera Ready",   color: "text-green-700",   bg: "bg-green-100",   dot: "bg-green-500" },
  wrapped:        { label: "Wrapped",        color: "text-gray-500",    bg: "bg-gray-50",     dot: "bg-gray-300" },
}

const STATUS_ORDER: SetStatusPhase[] = ["concept", "design", "drafting", "approved", "construction", "dressing", "camera-ready", "wrapped"]

const PHASE_CONFIG: Record<ConstructionPhase, { label: string; color: string; bg: string; border: string; barColor: string }> = {
  carpentry:  { label: "Carpentry",  color: "text-amber-800",   bg: "bg-amber-50",   border: "border-amber-200",  barColor: "bg-amber-500" },
  paint:      { label: "Paint",      color: "text-blue-800",    bg: "bg-blue-50",     border: "border-blue-200",   barColor: "bg-blue-500" },
  rigging:    { label: "Rigging",    color: "text-orange-800",  bg: "bg-orange-50",   border: "border-orange-200", barColor: "bg-orange-500" },
  "set-dec":  { label: "Set Dec",    color: "text-purple-800",  bg: "bg-purple-50",   border: "border-purple-200", barColor: "bg-purple-500" },
  "on-camera":{ label: "On Camera",  color: "text-green-800",   bg: "bg-green-50",    border: "border-green-200",  barColor: "bg-green-500" },
  strike:     { label: "Strike",     color: "text-gray-700",    bg: "bg-gray-50",     border: "border-gray-200",   barColor: "bg-gray-400" },
}

const PRIORITY_DOT: Record<string, string> = { low: "bg-gray-400", medium: "bg-blue-500", high: "bg-amber-500", urgent: "bg-red-500" }

const SOURCE_BADGE: Record<string, string> = {
  inventory: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rental: "bg-blue-50 text-blue-700 border-blue-200",
  purchase: "bg-amber-50 text-amber-700 border-amber-200",
  fabricated: "bg-slate-50 text-slate-700 border-slate-200",
}

const LIGHT_TYPE_STYLE: Record<string, { bg: string; text: string; badge: string }> = {
  practical: { bg: "bg-yellow-50", text: "text-yellow-600", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  motivated: { bg: "bg-orange-50", text: "text-orange-600", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  ambient:   { bg: "bg-gray-50",   text: "text-gray-500",   badge: "bg-gray-100 text-gray-600 border-gray-200" },
  effect:    { bg: "bg-red-50",     text: "text-red-600",     badge: "bg-red-50 text-red-700 border-red-200" },
}

function formatDate(ts: number) { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }
function formatRelative(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000)
  return d === 0 ? "Today" : d === 1 ? "Yesterday" : d < 7 ? `${d}d ago` : formatDate(ts)
}

/* ============================================================
   FLOATING-FIELD FORM COMPONENTS
   ============================================================ */

function FloatingField({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 peer placeholder-transparent"
        placeholder={placeholder || label}
      />
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    </div>
  )
}

function FloatingTextarea({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows || 3}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none leading-relaxed"
      />
      <label className="absolute left-4 top-2 text-xs text-gray-500 pointer-events-none">{label}</label>
    </div>
  )
}

function FloatingSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 appearance-none"
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <label className="absolute left-4 top-2 text-xs text-gray-500 pointer-events-none">{label}</label>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

function FloatingNumber({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        min={min || 0}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
      />
      <label className="absolute left-4 top-2 text-xs text-gray-500 pointer-events-none">{label}</label>
    </div>
  )
}

/* ============================================================
   COMPONENT
   ============================================================ */

type ModalTab = "sets" | "moodboards" | "construction" | "lighting"
type SetDetailTab = "elements" | "decorations" | "lighting" | "moodboard"

export default function ProductionDesignModal({ onClose }: { onClose: () => void }) {
  const { state } = useCasting()
  const currentProject = state.projects?.[0]
  const scenes = currentProject?.scenes || []
  const locations = currentProject?.locations || []

  const [activeTab, setActiveTab] = useState<ModalTab>("sets")
  const [searchTerm, setSearchTerm] = useState("")
  const [sets, setSets] = useState<ProductionDesignSet[]>(() => loadSavedSets() || MOCK_SETS)
  const [tasks, setTasks] = useState<ConstructionTask[]>(MOCK_TASKS)

  // Persist sets to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(PD_STORAGE_KEY, JSON.stringify(sets))
    } catch { /* quota exceeded or unavailable */ }
  }, [sets])
  const [selectedSetId, setSelectedSetId] = useState<string | null>("set-1")
  const [statusFilter, setStatusFilter] = useState<SetStatusPhase | "all">("all")
  const [setDetailTab, setSetDetailTab] = useState<SetDetailTab>("elements")
  const [kanbanSetFilter, setKanbanSetFilter] = useState<string>("all")

  /* CRUD overlay state */
  const [showAddSet, setShowAddSet] = useState(false)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [addSubItem, setAddSubItem] = useState<{ type: SetDetailTab; setId: string } | null>(null)
  const [editingSubItem, setEditingSubItem] = useState<{ type: SetDetailTab; setId: string; itemId: string } | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; name: string; setId?: string } | null>(null)

  const selectedSet = useMemo(() => sets.find((s) => s.id === selectedSetId), [sets, selectedSetId])

  const filteredSets = useMemo(() => {
    let result = sets
    if (statusFilter !== "all") result = result.filter((s) => s.status === statusFilter)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    return result
  }, [sets, searchTerm, statusFilter])

  const resolveLocationName = useCallback(
    (id?: string) => {
      if (!id) return null
      const loc = locations.find((l: any) => l.id === id)
      return loc ? loc.name : id
    },
    [locations],
  )

  const resolveSceneLabel = useCallback(
    (sceneId: string) => {
      const sc = scenes.find((s: any) => s.id === sceneId)
      return sc ? `Sc ${sc.sceneNumber}` : sceneId
    },
    [scenes],
  )

  /* ---- SET CRUD ---- */
  const handleAddSet = (newSet: ProductionDesignSet) => {
    setSets((prev) => [...prev, newSet])
    setSelectedSetId(newSet.id)
    setShowAddSet(false)
  }

  const handleEditSet = (updated: ProductionDesignSet) => {
    setSets((prev) => prev.map((s) => s.id === updated.id ? { ...updated, updatedAt: Date.now() } : s))
    setEditingSetId(null)
  }

  const handleDeleteSet = (setId: string) => {
    setSets((prev) => prev.filter((s) => s.id !== setId))
    setTasks((prev) => prev.filter((t) => t.setId !== setId))
    if (selectedSetId === setId) setSelectedSetId(sets.find((s) => s.id !== setId)?.id || null)
    setConfirmDelete(null)
  }

  const handleDuplicateSet = (setId: string) => {
    const source = sets.find((s) => s.id === setId)
    if (!source) return
    const newId = uid()
    const dup: ProductionDesignSet = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      status: "concept",
      buildElements: source.buildElements.map((el) => ({ ...el, id: uid() })),
      decorations: source.decorations.map((d) => ({ ...d, id: uid() })),
      lighting: source.lighting.map((l) => ({ ...l, id: uid() })),
      moodBoard: source.moodBoard.map((m) => ({ ...m, id: uid() })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSets((prev) => [...prev, dup])
    setSelectedSetId(newId)
  }

  /* ---- SUB-ITEM CRUD ---- */
  const updateSetField = (setId: string, field: string, value: any) => {
    setSets((prev) => prev.map((s) => s.id === setId ? { ...s, [field]: value, updatedAt: Date.now() } : s))
  }

  const addSubItemToSet = (setId: string, type: SetDetailTab, item: any) => {
    const fieldMap: Record<SetDetailTab, string> = { elements: "buildElements", decorations: "decorations", lighting: "lighting", moodboard: "moodBoard" }
    setSets((prev) => prev.map((s) => {
      if (s.id !== setId) return s
      return { ...s, [fieldMap[type]]: [...(s as any)[fieldMap[type]], item], updatedAt: Date.now() }
    }))
    setAddSubItem(null)
  }

  const editSubItemInSet = (setId: string, type: SetDetailTab, itemId: string, updated: any) => {
    const fieldMap: Record<SetDetailTab, string> = { elements: "buildElements", decorations: "decorations", lighting: "lighting", moodboard: "moodBoard" }
    setSets((prev) => prev.map((s) => {
      if (s.id !== setId) return s
      return { ...s, [fieldMap[type]]: (s as any)[fieldMap[type]].map((i: any) => i.id === itemId ? updated : i), updatedAt: Date.now() }
    }))
    setEditingSubItem(null)
  }

  const deleteSubItemFromSet = (setId: string, type: SetDetailTab, itemId: string) => {
    const fieldMap: Record<SetDetailTab, string> = { elements: "buildElements", decorations: "decorations", lighting: "lighting", moodboard: "moodBoard" }
    setSets((prev) => prev.map((s) => {
      if (s.id !== setId) return s
      return { ...s, [fieldMap[type]]: (s as any)[fieldMap[type]].filter((i: any) => i.id !== itemId), updatedAt: Date.now() }
    }))
    setConfirmDelete(null)
  }

  /* ---- INLINE LOCATION PICKER ---- */
  const [showLocationPicker, setShowLocationPicker] = useState<string | null>(null)

  const handleQuickLocationChange = useCallback((setId: string, locationId: string) => {
    setSets((prev) => prev.map((s) =>
      s.id === setId ? { ...s, locationId: locationId || undefined, updatedAt: Date.now() } : s
    ))
  }, [])

  /* ---- DRAG-AND-DROP IMAGE REPLACEMENT ---- */
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null)

  const handleDropImage = useCallback((e: React.DragEvent, setId: string, imageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverImageId(null)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setSets((prev) => prev.map((s) => {
        if (s.id !== setId) return s
        return {
          ...s,
          moodBoard: s.moodBoard.map((img) => img.id === imageId ? { ...img, url: dataUrl, addedAt: Date.now() } : img),
          updatedAt: Date.now(),
        }
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDropNewImage = useCallback((e: React.DragEvent, setId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverImageId(null)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const newImage: MoodBoardImage = {
        id: uid(),
        url: dataUrl,
        caption: file.name.replace(/\.[^.]+$/, ""),
        tags: [],
        addedAt: Date.now(),
      }
      setSets((prev) => prev.map((s) => s.id === setId ? { ...s, moodBoard: [...s.moodBoard, newImage], updatedAt: Date.now() } : s))
    }
    reader.readAsDataURL(file)
  }, [])

  /* ---- LIGHTING FIXTURE IMAGE DROP ---- */
  const handleDropFixtureImage = useCallback((e: React.DragEvent, setId: string, fixtureId: string, field: "fixtureImage" | "lightExampleImage") => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverImageId(null)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setSets((prev) => prev.map((s) => {
        if (s.id !== setId) return s
        return {
          ...s,
          lighting: s.lighting.map((lf) => lf.id === fixtureId ? { ...lf, [field]: dataUrl } : lf),
          updatedAt: Date.now(),
        }
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  /* ---- TASK CRUD ---- */
  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)))
  }

  const handleAddTask = (task: ConstructionTask) => {
    setTasks((prev) => [...prev, task])
    setShowAddTask(false)
  }

  const handleEditTask = (updated: ConstructionTask) => {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t))
    setEditingTaskId(null)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setConfirmDelete(null)
  }

  /* ---- COMPUTED ---- */
  const tasksByPhase = useMemo(() => {
    const phases: ConstructionPhase[] = ["carpentry", "paint", "rigging", "set-dec", "on-camera", "strike"]
    const filtered = kanbanSetFilter === "all" ? tasks : tasks.filter((t) => t.setId === kanbanSetFilter)
    return phases.map((phase) => ({ phase, tasks: filtered.filter((t) => t.phase === phase) }))
  }, [tasks, kanbanSetFilter])

  const budgetSummary = useMemo(() => {
    const parse = (s: string) => parseFloat(s.replace(/[^0-9.]/g, "")) || 0
    const est = sets.reduce((sum, s) => sum + parse(s.estimatedBudget), 0)
    const act = sets.reduce((sum, s) => sum + parse(s.actualBudget || "0"), 0)
    return { estimated: est, actual: act }
  }, [sets])

  const allMoodImages = useMemo(() => sets.flatMap((s) => s.moodBoard.map((img) => ({ ...img, setName: s.name, setId: s.id }))), [sets])
  const allLighting = useMemo(() => sets.flatMap((s) => s.lighting.map((l) => ({ ...l, setName: s.name, setId: s.id }))), [sets])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of sets) counts[s.status] = (counts[s.status] || 0) + 1
    return counts
  }, [sets])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length

  /* ========================================
     RENDER
     ======================================== */

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50 pl-14">
      {/* Slim Sidebar Strip / Expandable Drawer */}
      <FloatingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentModal="productionDesign"
      />

      {/* -------- HEADER -------- */}
      <ModalHeader
        title="Production Design"
        titleColor="bg-slate-600"
        onClose={onClose}
      />

      {/* -------- TOOLBAR -------- */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {([
            { key: "sets", label: "Sets", icon: Layers, count: sets.length },
            { key: "moodboards", label: "Mood Boards", icon: ImageIcon, count: allMoodImages.length },
            { key: "construction", label: "Construction", icon: Hammer, count: totalTasks },
            { key: "lighting", label: "Lighting", icon: Lightbulb, count: allLighting.length },
          ] as const).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === key ? "bg-slate-100 text-slate-700" : "bg-gray-200 text-gray-500"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sets, elements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 placeholder-gray-400 text-gray-900"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs">
              <DollarSign className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-500">Est</span>
              <span className="font-semibold text-gray-800">${budgetSummary.estimated.toLocaleString()}</span>
            </div>
            {budgetSummary.actual > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 rounded-lg text-xs">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Actual</span>
                <span className="font-semibold text-emerald-800">${budgetSummary.actual.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="w-px h-6 bg-gray-200 hidden lg:block" />
          <button onClick={() => openModal("locations")} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200">
            <MapPin className="w-3.5 h-3.5" /> Locations
          </button>
          <button onClick={() => openModal("props")} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200">
            <Package className="w-3.5 h-3.5" /> Props
          </button>
        </div>
      </div>

      {/* -------- BODY -------- */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* =================== SETS TAB =================== */}
        {activeTab === "sets" && (
          <div className="flex h-full">
            {/* Left sidebar */}
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
              {/* Status filter pills */}
              <div className="p-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${statusFilter === "all" ? "bg-slate-100 text-slate-700" : "bg-gray-100 text-gray-500 hover:text-gray-700"}`}
                  >
                    All ({sets.length})
                  </button>
                  {STATUS_ORDER.filter((s) => statusCounts[s]).map((s) => {
                    const cfg = STATUS_CONFIG[s]
                    return (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${statusFilter === s ? `${cfg.bg} ${cfg.color}` : "bg-gray-100 text-gray-500 hover:text-gray-700"}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label} ({statusCounts[s]})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Set list */}
              <div className="flex-1 overflow-y-auto">
                {filteredSets.map((s) => {
                  const st = STATUS_CONFIG[s.status]
                  const isActive = s.id === selectedSetId
                  const totalElements = s.buildElements.length + s.decorations.length + s.lighting.length
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSetId(s.id); setEditingSetId(null) }}
                      className={`w-full text-left px-4 py-3.5 border-b border-gray-100 transition-all ${isActive ? "bg-slate-50/80 border-l-[3px] border-l-slate-500" : "hover:bg-gray-50/80 border-l-[3px] border-l-transparent"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isActive ? "text-slate-900" : "text-gray-900"}`}>{s.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{s.description}</p>
                        </div>
                        <span className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${st.color} ${st.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {s.locationId && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium">
                            <MapPin className="w-2.5 h-2.5" /> {resolveLocationName(s.locationId) || s.locationId}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                          <Film className="w-2.5 h-2.5" /> {s.sceneIds.length}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                          <Box className="w-2.5 h-2.5" /> {totalElements}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-auto font-medium">{s.estimatedBudget}</span>
                      </div>
                    </button>
                  )
                })}
                {filteredSets.length === 0 && (
                  <div className="text-center py-12 px-4">
                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No sets found</p>
                  </div>
                )}
              </div>

              {/* Sidebar footer */}
              <div className="p-3 border-t border-gray-100 bg-gray-50/80 shrink-0">
                <button
                  onClick={() => setShowAddSet(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-600 text-white text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Set
                </button>
              </div>
            </div>

            {/* Right: detail panel */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              {selectedSet ? (
                <>
                  {/* Detail header */}
                  <div className="px-6 py-4 bg-white border-b border-gray-200 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-lg font-bold text-gray-900 truncate">{selectedSet.name}</h2>
                          <span className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_CONFIG[selectedSet.status].color} ${STATUS_CONFIG[selectedSet.status].bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedSet.status].dot}`} />
                            {STATUS_CONFIG[selectedSet.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{selectedSet.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingSetId(selectedSet.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Edit set"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDuplicateSet(selectedSet.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Duplicate set"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: "set", id: selectedSet.id, name: selectedSet.name })}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete set"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center flex-wrap gap-2 mt-3">
                      {/* Inline location picker */}
                      <div className="relative group/loc">
                        <button
                          onClick={() => setShowLocationPicker(showLocationPicker === selectedSet.id ? null : selectedSet.id)}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                            selectedSet.locationId
                              ? "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100"
                              : "text-gray-400 bg-gray-50 border-dashed border-gray-300 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/50"
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          {selectedSet.locationId ? (resolveLocationName(selectedSet.locationId) || selectedSet.locationId) : "Link location..."}
                          <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                        {showLocationPicker === selectedSet.id && (
                          <>
                          <div className="fixed inset-0 z-20" onClick={() => setShowLocationPicker(null)} />
                          <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-30 overflow-hidden">
                            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Link to Location</span>
                              {selectedSet.locationId && (
                                <button
                                  onClick={() => { handleQuickLocationChange(selectedSet.id, ""); setShowLocationPicker(null) }}
                                  className="text-[10px] text-red-500 hover:text-red-700 font-medium transition-colors"
                                >
                                  Remove Link
                                </button>
                              )}
                            </div>
                            <div className="max-h-48 overflow-y-auto py-1">
                              {locations.length > 0 ? locations.map((loc: any) => (
                                <button
                                  key={loc.id}
                                  onClick={() => { handleQuickLocationChange(selectedSet.id, loc.id); setShowLocationPicker(null) }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                                    selectedSet.locationId === loc.id
                                      ? "bg-teal-50 text-teal-800 font-semibold"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${selectedSet.locationId === loc.id ? "text-teal-600" : "text-gray-400"}`} />
                                  <div className="flex-1 min-w-0">
                                    <span className="block truncate">{loc.name}</span>
                                    {loc.address && <span className="block text-[10px] text-gray-400 truncate">{loc.address}</span>}
                                  </div>
                                  {selectedSet.locationId === loc.id && (
                                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  )}
                                </button>
                              )) : (
                                <div className="px-3 py-4 text-center text-xs text-gray-400">
                                  <MapPin className="w-5 h-5 mx-auto mb-1 opacity-30" />
                                  <p>No locations defined yet</p>
                                </div>
                              )}
                            </div>
                            {selectedSet.locationId && (
                              <div className="px-3 py-2 border-t border-gray-100">
                                <button
                                  onClick={() => { setShowLocationPicker(null); navigateToModal("locations") }}
                                  className="w-full flex items-center justify-center gap-1.5 text-[10px] font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                                >
                                  View in Locations <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          </>
                        )}
                      </div>
                      {selectedSet.sceneIds.map((sid) => (
                        <span key={sid} className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg font-medium">
                          <Film className="w-3 h-3" /> {resolveSceneLabel(sid)}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg font-medium">
                        <DollarSign className="w-3 h-3" /> Est {selectedSet.estimatedBudget}
                        {selectedSet.actualBudget && <span className="text-emerald-700 font-semibold"> / {selectedSet.actualBudget}</span>}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">Updated {formatRelative(selectedSet.updatedAt)}</span>
                    </div>

                    {/* Detail tab bar */}
                    <div className="flex items-center gap-1 mt-4 border-b border-gray-200 -mb-4 -mx-6 px-6">
                      {([
                        { key: "elements", label: "Build Elements", count: selectedSet.buildElements.length, icon: Hammer },
                        { key: "decorations", label: "Set Decorations", count: selectedSet.decorations.length, icon: Sofa },
                        { key: "lighting", label: "Lighting", count: selectedSet.lighting.length, icon: Lightbulb },
                        { key: "moodboard", label: "Mood Board", count: selectedSet.moodBoard.length, icon: ImageIcon },
                      ] as const).map(({ key, label, count, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setSetDetailTab(key)}
                          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${setDetailTab === key ? "border-slate-500 text-slate-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${setDetailTab === key ? "bg-slate-100 text-slate-700" : "bg-gray-100 text-gray-500"}`}>
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detail content */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-6">
                    <div className="max-w-4xl space-y-4">
                      {/* Add button for sub-items */}
                      <button
                        onClick={() => setAddSubItem({ type: setDetailTab, setId: selectedSet.id })}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add {setDetailTab === "elements" ? "Build Element" : setDetailTab === "decorations" ? "Decoration" : setDetailTab === "lighting" ? "Lighting Fixture" : "Mood Board Image"}
                      </button>

                      {/* Build Elements */}
                      {setDetailTab === "elements" && (
                        selectedSet.buildElements.length > 0 ? (
                          <div className="space-y-2">
                            {selectedSet.buildElements.map((el) => (
                              <div key={el.id} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-shadow group">
                                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                  <Hammer className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900">{el.name}</p>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">x{el.quantity}</span>
                                      <button onClick={() => setEditingSubItem({ type: "elements", setId: selectedSet.id, itemId: el.id })} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-slate-600 hover:bg-slate-50 transition-all"><Pencil className="w-3 h-3" /></button>
                                      <button onClick={() => setConfirmDelete({ type: "element", id: el.id, name: el.name })} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {el.material}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {el.dimensions}</span>
                                  </div>
                                  {el.notes && <p className="text-[11px] text-amber-700 bg-amber-50 mt-2 px-2 py-1 rounded italic">{el.notes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState icon={Hammer} label="No build elements defined yet" />
                        )
                      )}

                      {/* Decorations */}
                      {setDetailTab === "decorations" && (
                        selectedSet.decorations.length > 0 ? (
                          <div className="space-y-2">
                            {selectedSet.decorations.map((dec) => (
                              <div key={dec.id} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-shadow group">
                                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                  <Sofa className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900">{dec.name}</p>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${SOURCE_BADGE[dec.source] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{dec.source}</span>
                                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">x{dec.quantity}</span>
                                      <button onClick={() => setEditingSubItem({ type: "decorations", setId: selectedSet.id, itemId: dec.id })} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-slate-600 hover:bg-slate-50 transition-all"><Pencil className="w-3 h-3" /></button>
                                      <button onClick={() => setConfirmDelete({ type: "decoration", id: dec.id, name: dec.name })} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                  {dec.propId && (
                                    <button onClick={() => openModal("props")} className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-1.5 hover:bg-amber-100 transition-colors">
                                      <Link2 className="w-2.5 h-2.5" /> View linked prop <ArrowRight className="w-2 h-2 opacity-50" />
                                    </button>
                                  )}
                                  {dec.notes && <p className="text-[11px] text-purple-700 bg-purple-50 mt-2 px-2 py-1 rounded italic">{dec.notes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState icon={Sofa} label="No decorations defined yet" />
                        )
                      )}

                      {/* Lighting */}
                      {setDetailTab === "lighting" && (
                        selectedSet.lighting.length > 0 ? (
                          <div className="space-y-3">
                            {selectedSet.lighting.map((lf) => {
                              const style = LIGHT_TYPE_STYLE[lf.type] || LIGHT_TYPE_STYLE.ambient
                              return (
                                <div key={lf.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-shadow group overflow-hidden">
                                  <div className="flex items-start gap-3 p-4">
                                    <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                                      <Lightbulb className={`w-4 h-4 ${style.text}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-gray-900">{lf.name}</p>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${style.badge}`}>{lf.type}</span>
                                          <button onClick={() => setEditingSubItem({ type: "lighting", setId: selectedSet.id, itemId: lf.id })} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-slate-600 hover:bg-slate-50 transition-all"><Pencil className="w-3 h-3" /></button>
                                          <button onClick={() => setConfirmDelete({ type: "fixture", id: lf.id, name: lf.name })} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                                        {lf.wattage && <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {lf.wattage}</span>}
                                        {lf.wattage && <span className="text-gray-300">|</span>}
                                        <span className={lf.dimmable ? "text-emerald-600 font-medium" : "text-gray-400"}>{lf.dimmable ? "Dimmable" : "Non-dimmable"}</span>
                                      </div>
                                      {lf.notes && <p className="text-[11px] text-gray-500 bg-gray-50 mt-2 px-2 py-1 rounded italic">{lf.notes}</p>}
                                    </div>
                                  </div>
                                  {/* Fixture + Light Example image slots */}
                                  <div className="flex gap-2 px-4 pb-4">
                                    {(["fixtureImage", "lightExampleImage"] as const).map((field) => {
                                      const imgUrl = lf[field]
                                      const label = field === "fixtureImage" ? "Fixture" : "Light Example"
                                      const dragId = `detail-${lf.id}-${field}`
                                      return (
                                        <div
                                          key={field}
                                          className={`flex-1 rounded-lg border-2 overflow-hidden transition-all ${dragOverImageId === dragId ? "border-slate-400 ring-2 ring-slate-200 scale-[1.01]" : imgUrl ? "border-gray-200" : "border-dashed border-gray-200 hover:border-slate-300"}`}
                                          onDragOver={(e) => { e.preventDefault(); setDragOverImageId(dragId) }}
                                          onDragLeave={() => setDragOverImageId(null)}
                                          onDrop={(e) => handleDropFixtureImage(e, selectedSet.id, lf.id, field)}
                                        >
                                          {imgUrl ? (
                                            <div className="relative aspect-[3/2] bg-gray-100 group/img">
                                              {isValidImageUrl(imgUrl) ? <img src={imgUrl} alt={label} className={`w-full h-full object-cover transition-opacity ${dragOverImageId === dragId ? "opacity-30" : ""}`} /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}
                                              {dragOverImageId === dragId ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                  <Upload className="w-5 h-5 text-slate-500 mb-0.5" />
                                                  <span className="text-[9px] font-semibold text-slate-700">Drop to replace</span>
                                                </div>
                                              ) : (
                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors" />
                                              )}
                                              <span className="absolute bottom-1 left-1.5 text-[8px] font-bold uppercase tracking-wide text-white bg-black/50 px-1.5 py-0.5 rounded">{label}</span>
                                            </div>
                                          ) : (
                                            <div className={`aspect-[3/2] flex flex-col items-center justify-center transition-colors ${dragOverImageId === dragId ? "bg-slate-50" : "bg-gray-50/50 hover:bg-slate-50/30"}`}>
                                              {dragOverImageId === dragId ? (
                                                <>
                                                  <Upload className="w-4 h-4 text-slate-400 mb-0.5" />
                                                  <span className="text-[9px] font-semibold text-slate-600">Drop image</span>
                                                </>
                                              ) : (
                                                <>
                                                  <ImageIcon className="w-4 h-4 text-gray-300 mb-0.5" />
                                                  <span className="text-[8px] text-gray-400 font-medium">{label}</span>
                                                  <span className="text-[8px] text-gray-300">Drop image here</span>
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <EmptyState icon={Lightbulb} label="No lighting fixtures defined yet" />
                        )
                      )}

                      {/* Mood Board */}
                      {setDetailTab === "moodboard" && (
                        selectedSet.moodBoard.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedSet.moodBoard.map((img) => (
                              <div
                                key={img.id}
                                className={`group rounded-xl overflow-hidden border bg-white hover:shadow-md transition-all relative ${dragOverImageId === img.id ? "border-slate-400 ring-2 ring-slate-200 scale-[1.02]" : "border-gray-200"}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOverImageId(img.id) }}
                                onDragLeave={() => setDragOverImageId(null)}
                                onDrop={(e) => handleDropImage(e, selectedSet.id, img.id)}
                              >
                                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                                  {isValidImageUrl(img.url) ? <img src={img.url} alt={img.caption || "Mood board"} className={`w-full h-full object-cover transition-all duration-300 ${dragOverImageId === img.id ? "opacity-30 scale-105" : "group-hover:scale-105"}`} /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}
                                  {dragOverImageId === img.id && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <Upload className="w-8 h-8 text-slate-500 mb-1.5" />
                                      <span className="text-xs font-semibold text-slate-700">Drop to replace</span>
                                    </div>
                                  )}
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingSubItem({ type: "moodboard", setId: selectedSet.id, itemId: img.id })} className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:bg-slate-50 shadow-sm"><Pencil className="w-3 h-3" /></button>
                                  <button onClick={() => setConfirmDelete({ type: "moodimage", id: img.id, name: img.caption || "Image", setId: selectedSet.id })} className="p-1.5 rounded-lg bg-white/90 text-red-500 hover:bg-red-50 shadow-sm"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="p-3">
                                  {img.caption && <p className="text-xs text-gray-700 font-medium line-clamp-1">{img.caption}</p>}
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    {img.tags.map((t) => <span key={t} className="px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[9px] font-medium">{t}</span>)}
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1.5">{formatRelative(img.addedAt)}</p>
                                </div>
                              </div>
                            ))}
                            {/* Drop zone to add new image */}
                            <div
                              className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center aspect-[4/3] transition-all cursor-pointer ${dragOverImageId === "new-detail" ? "border-slate-400 bg-slate-50/50 scale-[1.02]" : "border-gray-200 hover:border-slate-300 bg-gray-50/50 hover:bg-slate-50/30"}`}
                              onClick={() => setAddSubItem({ type: "moodboard", setId: selectedSet.id })}
                              onDragOver={(e) => { e.preventDefault(); setDragOverImageId("new-detail") }}
                              onDragLeave={() => setDragOverImageId(null)}
                              onDrop={(e) => handleDropNewImage(e, selectedSet.id)}
                            >
                              {dragOverImageId === "new-detail" ? (
                                <>
                                  <Upload className="w-6 h-6 text-slate-500 mb-1" />
                                  <span className="text-[10px] text-slate-600 font-semibold">Drop to add</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-6 h-6 text-gray-300" />
                                  <span className="text-[10px] text-gray-400 mt-1 font-medium">Add or drop image</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`w-full py-12 rounded-xl border-2 border-dashed flex flex-col items-center cursor-pointer transition-all ${dragOverImageId === "empty-detail" ? "border-slate-400 bg-slate-50/50" : "border-gray-200 hover:border-slate-300 bg-gray-50/50 hover:bg-slate-50/30"}`}
                            onClick={() => setAddSubItem({ type: "moodboard", setId: selectedSet.id })}
                            onDragOver={(e) => { e.preventDefault(); setDragOverImageId("empty-detail") }}
                            onDragLeave={() => setDragOverImageId(null)}
                            onDrop={(e) => handleDropNewImage(e, selectedSet.id)}
                          >
                            {dragOverImageId === "empty-detail" ? (
                              <>
                                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-600 font-semibold">Drop image to add</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-10 h-10 text-gray-300 mb-2" />
                                <span className="text-xs text-gray-400 font-medium">No mood board images yet</span>
                                <span className="text-[10px] text-slate-500 mt-1 font-medium">Click or drag images here</span>
                              </>
                            )}
                          </div>
                        )
                      )}

                      {/* Notes */}
                      {selectedSet.notes && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Production Notes</span>
                          </div>
                          <p className="text-sm text-amber-900 leading-relaxed">{selectedSet.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Select a Set</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Choose a set from the list to view and manage build elements, decorations, lighting, and mood boards.</p>
                    <button onClick={() => setShowAddSet(true)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors">
                      <Plus className="w-4 h-4" /> Create New Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================== MOOD BOARDS TAB =================== */}
        {activeTab === "moodboards" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">All Mood Boards</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{allMoodImages.length} reference images across {sets.filter((s) => s.moodBoard.length > 0).length} sets</p>
                </div>
              </div>

              {/* Per-set mood boards with CRUD */}
              <div className="space-y-10">
                {sets.map((s) => (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setSelectedSetId(s.id); setActiveTab("sets"); setSetDetailTab("moodboard") }} className="flex items-center gap-2 group">
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-slate-700 transition-colors">{s.name}</h3>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-slate-500 transition-colors" />
                        </button>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${STATUS_CONFIG[s.status].color} ${STATUS_CONFIG[s.status].bg}`}>{STATUS_CONFIG[s.status].label}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{s.moodBoard.length} images</span>
                      </div>
                      <button
                        onClick={() => setAddSubItem({ type: "moodboard", setId: s.id })}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Image
                      </button>
                    </div>
                    {s.moodBoard.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {s.moodBoard.map((img) => (
                          <div
                            key={img.id}
                            className={`rounded-xl overflow-hidden border bg-white group hover:shadow-md transition-all relative ${dragOverImageId === `ov-${img.id}` ? "border-slate-400 ring-2 ring-slate-200 scale-[1.02]" : "border-gray-200"}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOverImageId(`ov-${img.id}`) }}
                            onDragLeave={() => setDragOverImageId(null)}
                            onDrop={(e) => handleDropImage(e, s.id, img.id)}
                          >
                            <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                              {isValidImageUrl(img.url) ? <img src={img.url} alt={img.caption || ""} className={`w-full h-full object-cover transition-all duration-300 ${dragOverImageId === `ov-${img.id}` ? "opacity-30 scale-105" : "group-hover:scale-105"}`} /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}
                              {dragOverImageId === `ov-${img.id}` && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <Upload className="w-7 h-7 text-slate-500 mb-1" />
                                  <span className="text-[10px] font-semibold text-slate-700">Drop to replace</span>
                                </div>
                              )}
                            </div>
                            {/* Hover action buttons */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingSubItem({ type: "moodboard", setId: s.id, itemId: img.id })}
                                className="p-1.5 rounded-lg bg-white/90 text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
                                title="Edit image"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ type: "moodimage", id: img.id, name: img.caption || "Image", setId: s.id })}
                                className="p-1.5 rounded-lg bg-white/90 text-red-500 hover:bg-red-50 shadow-sm transition-colors"
                                title="Delete image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="p-2.5">
                              {img.caption && <p className="text-[11px] text-gray-700 font-medium line-clamp-1">{img.caption}</p>}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {img.tags.map((t) => <span key={t} className="px-1 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[8px] font-medium">{t}</span>)}
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">{formatRelative(img.addedAt)}</p>
                            </div>
                          </div>
                        ))}
                        {/* Inline add / drop zone */}
                        <div
                          className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center aspect-[4/3] transition-all cursor-pointer ${dragOverImageId === `ov-new-${s.id}` ? "border-slate-400 bg-slate-50/50 scale-[1.02]" : "border-gray-200 hover:border-slate-300 bg-gray-50/50 hover:bg-slate-50/30"}`}
                          onClick={() => setAddSubItem({ type: "moodboard", setId: s.id })}
                          onDragOver={(e) => { e.preventDefault(); setDragOverImageId(`ov-new-${s.id}`) }}
                          onDragLeave={() => setDragOverImageId(null)}
                          onDrop={(e) => handleDropNewImage(e, s.id)}
                        >
                          {dragOverImageId === `ov-new-${s.id}` ? (
                            <>
                              <Upload className="w-6 h-6 text-slate-500 mb-1" />
                              <span className="text-[10px] text-slate-600 font-semibold">Drop to add</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-6 h-6 text-gray-300" />
                              <span className="text-[10px] text-gray-400 mt-1 font-medium">Add or drop image</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`w-full py-10 rounded-xl border-2 border-dashed flex flex-col items-center cursor-pointer transition-all ${dragOverImageId === `ov-empty-${s.id}` ? "border-slate-400 bg-slate-50/50" : "border-gray-200 hover:border-slate-300 bg-gray-50/50 hover:bg-slate-50/30"}`}
                        onClick={() => setAddSubItem({ type: "moodboard", setId: s.id })}
                        onDragOver={(e) => { e.preventDefault(); setDragOverImageId(`ov-empty-${s.id}`) }}
                        onDragLeave={() => setDragOverImageId(null)}
                        onDrop={(e) => handleDropNewImage(e, s.id)}
                      >
                        {dragOverImageId === `ov-empty-${s.id}` ? (
                          <>
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-sm text-slate-600 font-semibold">Drop image to add</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                            <span className="text-xs text-gray-400 font-medium">No images yet</span>
                            <span className="text-[10px] text-slate-500 mt-1 font-medium">Click or drag images here</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================== CONSTRUCTION TAB (KANBAN) =================== */}
        {activeTab === "construction" && (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 bg-white border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Construction Tracker</h2>
                    <p className="text-xs text-gray-500">{completedTasks} of {totalTasks} tasks complete</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-32 h-1.5 bg-gray-200 rounded-full">
                      <div className="h-full rounded-full bg-slate-500 transition-all" style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowAddTask(true)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 font-medium">Filter:</span>
                    <select value={kanbanSetFilter} onChange={(e) => setKanbanSetFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-400">
                      <option value="all">All Sets</option>
                      {sets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-[10px] border-l border-gray-200 pl-3">
                    {(["low", "medium", "high", "urgent"] as const).map((p) => (
                      <span key={p} className="flex items-center gap-1 text-gray-500 capitalize"><span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} /> {p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-3 p-5 h-full" style={{ minWidth: `${tasksByPhase.length * 260}px` }}>
                {tasksByPhase.map(({ phase, tasks: phaseTasks }) => {
                  const cfg = PHASE_CONFIG[phase]
                  const done = phaseTasks.filter((t) => t.completed).length
                  return (
                    <div key={phase} className={`w-60 shrink-0 flex flex-col rounded-xl border ${cfg.border} bg-white overflow-hidden`}>
                      <div className={`px-3 py-2.5 ${cfg.bg} border-b ${cfg.border} shrink-0`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                          <span className={`text-[10px] font-semibold ${cfg.color}`}>{done}/{phaseTasks.length}</span>
                        </div>
                        {phaseTasks.length > 0 && (
                          <div className="w-full h-1 bg-white/50 rounded-full mt-1.5">
                            <div className={`h-full rounded-full transition-all ${cfg.barColor}`} style={{ width: `${(done / phaseTasks.length) * 100}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {phaseTasks.map((task) => {
                          const taskSet = sets.find((s) => s.id === task.setId)
                          return (
                            <div key={task.id} className={`p-2.5 rounded-lg border transition-all group ${task.completed ? "bg-gray-50/80 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>
                              <div className="flex items-start gap-2">
                                <button onClick={() => toggleTaskComplete(task.id)} className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 hover:border-slate-400"}`}>
                                  {task.completed && <Check className="w-2.5 h-2.5" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium leading-snug ${task.completed ? "line-through text-gray-400" : "text-gray-900"}`}>{task.title}</p>
                                  {taskSet && (
                                    <button onClick={() => { setSelectedSetId(task.setId); setActiveTab("sets") }} className="text-[10px] text-slate-500 hover:text-slate-700 mt-0.5 truncate block transition-colors">{taskSet.name}</button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]}`} title={task.priority} />
                                  <button onClick={() => setEditingTaskId(task.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-slate-600 transition-all"><Pencil className="w-2.5 h-2.5" /></button>
                                  <button onClick={() => setConfirmDelete({ type: "task", id: task.id, name: task.title })} className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-600 transition-all"><Trash2 className="w-2.5 h-2.5" /></button>
                                </div>
                              </div>
                              {(task.assignedTo || task.dueDate || task.notes) && (
                                <div className="flex items-center flex-wrap gap-1.5 mt-2 ml-6">
                                  {task.assignedTo && <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">{task.assignedTo}</span>}
                                  {task.dueDate && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 ${task.dueDate < Date.now() && !task.completed ? "text-red-700 bg-red-50" : "text-gray-500 bg-gray-100"}`}>
                                      <Calendar className="w-2.5 h-2.5" /> {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                  {task.notes && <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Note</span>}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {phaseTasks.length === 0 && <div className="text-center py-8"><p className="text-[10px] text-gray-300">No tasks</p></div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================== LIGHTING TAB =================== */}
        {activeTab === "lighting" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Lighting & Practicals</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{allLighting.length} fixtures across {sets.filter((s) => s.lighting.length > 0).length} sets</p>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {(["practical", "motivated", "ambient", "effect"] as const).map((type) => {
                  const count = allLighting.filter((l) => l.type === type).length
                  const style = LIGHT_TYPE_STYLE[type]
                  return (
                    <div key={type} className={`${style.bg} border ${style.badge.split(" ").find((c) => c.startsWith("border-")) || "border-gray-200"} rounded-xl p-4`}>
                      <div className="flex items-center justify-between">
                        <Lightbulb className={`w-5 h-5 ${style.text}`} />
                        <span className={`text-2xl font-bold ${style.text}`}>{count}</span>
                      </div>
                      <p className={`text-xs font-semibold capitalize mt-1.5 ${style.text}`}>{type}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{type === "practical" ? "On-set visible" : type === "motivated" ? "Story-driven" : type === "ambient" ? "Fill lighting" : "Special FX"}</p>
                    </div>
                  )
                })}
              </div>

              {/* Per-set lighting with CRUD */}
              {sets.map((s) => (
                <div key={s.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setSelectedSetId(s.id); setActiveTab("sets"); setSetDetailTab("lighting") }} className="flex items-center gap-2 group">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-slate-700 transition-colors">{s.name}</h3>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-slate-500 transition-colors" />
                      </button>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${STATUS_CONFIG[s.status].color} ${STATUS_CONFIG[s.status].bg}`}>{STATUS_CONFIG[s.status].label}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{s.lighting.length} fixtures</span>
                    </div>
                    <button
                      onClick={() => setAddSubItem({ type: "lighting", setId: s.id })}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Fixture
                    </button>
                  </div>
                  {s.lighting.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {s.lighting.map((lf) => {
                        const style = LIGHT_TYPE_STYLE[lf.type] || LIGHT_TYPE_STYLE.ambient
                        return (
                          <div key={lf.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-shadow group overflow-hidden">
                            <div className="flex items-start gap-3 p-4">
                              <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                                <Lightbulb className={`w-5 h-5 ${style.text}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-gray-900">{lf.name}</p>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${style.badge}`}>{lf.type}</span>
                                    <button
                                      onClick={() => setEditingSubItem({ type: "lighting", setId: s.id, itemId: lf.id })}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                                      title="Edit fixture"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete({ type: "fixture", id: lf.id, name: lf.name, setId: s.id })}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                      title="Delete fixture"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                                  {lf.wattage && <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {lf.wattage}</span>}
                                  {lf.wattage && <span className="text-gray-300">|</span>}
                                  <span className={lf.dimmable ? "text-emerald-600 font-medium" : "text-gray-400"}>{lf.dimmable ? "Dimmable" : "Non-dimmable"}</span>
                                </div>
                                {lf.notes && <p className="text-[11px] text-gray-500 bg-gray-50 mt-2 px-2 py-1 rounded italic">{lf.notes}</p>}
                              </div>
                            </div>
                            {/* Fixture + Light Example image slots */}
                            <div className="flex gap-2 px-4 pb-4">
                              {(["fixtureImage", "lightExampleImage"] as const).map((field) => {
                                const imgUrl = lf[field]
                                const label = field === "fixtureImage" ? "Fixture" : "Light Example"
                                const dragId = `ov-${lf.id}-${field}`
                                return (
                                  <div
                                    key={field}
                                    className={`flex-1 rounded-lg border-2 overflow-hidden transition-all ${dragOverImageId === dragId ? "border-slate-400 ring-2 ring-slate-200 scale-[1.01]" : imgUrl ? "border-gray-200" : "border-dashed border-gray-200 hover:border-slate-300"}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverImageId(dragId) }}
                                    onDragLeave={() => setDragOverImageId(null)}
                                    onDrop={(e) => handleDropFixtureImage(e, s.id, lf.id, field)}
                                  >
                                    {imgUrl ? (
                                      <div className="relative aspect-[3/2] bg-gray-100 group/img">
                                        {isValidImageUrl(imgUrl) ? <img src={imgUrl} alt={label} className={`w-full h-full object-cover transition-opacity ${dragOverImageId === dragId ? "opacity-30" : ""}`} /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}
                                        {dragOverImageId === dragId ? (
                                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <Upload className="w-5 h-5 text-slate-500 mb-0.5" />
                                            <span className="text-[9px] font-semibold text-slate-700">Drop to replace</span>
                                          </div>
                                        ) : (
                                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors" />
                                        )}
                                        <span className="absolute bottom-1 left-1.5 text-[8px] font-bold uppercase tracking-wide text-white bg-black/50 px-1.5 py-0.5 rounded">{label}</span>
                                      </div>
                                    ) : (
                                      <div className={`aspect-[3/2] flex flex-col items-center justify-center transition-colors ${dragOverImageId === dragId ? "bg-slate-50" : "bg-gray-50/50 hover:bg-slate-50/30"}`}>
                                        {dragOverImageId === dragId ? (
                                          <>
                                            <Upload className="w-4 h-4 text-slate-400 mb-0.5" />
                                            <span className="text-[9px] font-semibold text-slate-600">Drop image</span>
                                          </>
                                        ) : (
                                          <>
                                            <ImageIcon className="w-4 h-4 text-gray-300 mb-0.5" />
                                            <span className="text-[8px] text-gray-400 font-medium">{label}</span>
                                            <span className="text-[8px] text-gray-300">Drop image here</span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddSubItem({ type: "lighting", setId: s.id })}
                      className="w-full py-8 rounded-xl border-2 border-dashed border-gray-200 hover:border-slate-300 bg-gray-50/50 hover:bg-slate-50/30 transition-colors flex flex-col items-center"
                    >
                      <Lightbulb className="w-7 h-7 text-gray-300 mb-2" />
                      <span className="text-xs text-gray-400 font-medium">No fixtures yet</span>
                      <span className="text-[10px] text-slate-500 mt-1 font-medium">Click to add first lighting fixture</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

{/* Embedded CoPilot - Fixed position in lower right corner */}
        <div className="fixed bottom-6 right-6 z-40">
          <EmbeddedCoPilot context="production" />
        </div>

        {/* ============================================================
        OVERLAY MODALS
        ============================================================ */}

        {/* Confirm Delete */}
        {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete {confirmDelete.type}?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {"Are you sure you want to delete "}
              <span className="font-semibold text-gray-700">{confirmDelete.name}</span>
              {"? This cannot be undone."}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={() => {
                  if (confirmDelete.type === "set") handleDeleteSet(confirmDelete.id)
                  else if (confirmDelete.type === "task") handleDeleteTask(confirmDelete.id)
                  else {
                    const parentSetId = confirmDelete.setId || selectedSet?.id
                    if (parentSetId) {
                      const typeMap: Record<string, SetDetailTab> = { element: "elements", decoration: "decorations", fixture: "lighting", moodimage: "moodboard" }
                      deleteSubItemFromSet(parentSetId, typeMap[confirmDelete.type] || "elements", confirmDelete.id)
                    }
                  }
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Set */}
      {(showAddSet || editingSetId) && (
        <SetFormOverlay
          existingSet={editingSetId ? sets.find((s) => s.id === editingSetId) : undefined}
          locations={locations}
          onSave={(s) => editingSetId ? handleEditSet(s) : handleAddSet(s)}
          onClose={() => { setShowAddSet(false); setEditingSetId(null) }}
        />
      )}

      {/* Add/Edit Sub-Item */}
      {(addSubItem || editingSubItem) && (() => {
        const targetSetId = (addSubItem || editingSubItem)!.setId
        const targetSet = sets.find((s) => s.id === targetSetId)
        if (!targetSet) return null
        return (
          <SubItemFormOverlay
            type={(addSubItem || editingSubItem)!.type}
            existingItem={editingSubItem ? getSubItem(targetSet, editingSubItem.type, editingSubItem.itemId) : undefined}
            onSave={(item) => editingSubItem ? editSubItemInSet(editingSubItem.setId, editingSubItem.type, editingSubItem.itemId, item) : addSubItemToSet(addSubItem!.setId, addSubItem!.type, item)}
            onClose={() => { setAddSubItem(null); setEditingSubItem(null) }}
          />
        )
      })()}

      {/* Add/Edit Task */}
      {(showAddTask || editingTaskId) && (
        <TaskFormOverlay
          existingTask={editingTaskId ? tasks.find((t) => t.id === editingTaskId) : undefined}
          sets={sets}
          onSave={(t) => editingTaskId ? handleEditTask(t) : handleAddTask(t)}
          onClose={() => { setShowAddTask(false); setEditingTaskId(null) }}
        />
      )}
    </div>
  )
}

/* ============================================================
   HELPER: get sub-item from set
   ============================================================ */

function getSubItem(set: ProductionDesignSet, type: SetDetailTab, id: string): any {
  const map: Record<SetDetailTab, any[]> = { elements: set.buildElements, decorations: set.decorations, lighting: set.lighting, moodboard: set.moodBoard }
  return map[type]?.find((i: any) => i.id === id)
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function EmptyState({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

/* ============================================================
   SET FORM OVERLAY
   ============================================================ */

function SetFormOverlay({ existingSet, locations, onSave, onClose }: {
  existingSet?: ProductionDesignSet
  locations: any[]
  onSave: (s: ProductionDesignSet) => void
  onClose: () => void
}) {
  const isEdit = !!existingSet
  const [form, setForm] = useState({
    name: existingSet?.name || "",
    description: existingSet?.description || "",
    status: existingSet?.status || "concept" as SetStatusPhase,
    locationId: existingSet?.locationId || "",
    estimatedBudget: existingSet?.estimatedBudget || "",
    actualBudget: existingSet?.actualBudget || "",
    notes: existingSet?.notes || "",
  })

  const handleSave = () => {
    if (!form.name.trim()) return
    const result: ProductionDesignSet = {
      ...(existingSet || {
        id: uid(),
        sceneIds: [],
        buildElements: [],
        decorations: [],
        lighting: [],
        moodBoard: [],
        createdAt: Date.now(),
      }),
      ...form,
      updatedAt: Date.now(),
    } as ProductionDesignSet
    onSave(result)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-bold text-gray-900">{isEdit ? "Edit Set" : "Add New Set"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <FloatingField label="Set Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <FloatingTextarea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <FloatingSelect label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v as SetStatusPhase })} options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))} />
            <FloatingSelect label="Location" value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v })} options={[{ value: "", label: "None (unlinked)" }, ...locations.map((l: any) => ({ value: l.id, label: l.name + (l.address ? ` - ${l.address}` : "") }))]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FloatingField label="Estimated Budget" value={form.estimatedBudget} onChange={(v) => setForm({ ...form, estimatedBudget: v })} placeholder="$50,000" />
            <FloatingField label="Actual Budget" value={form.actualBudget} onChange={(v) => setForm({ ...form, actualBudget: v })} placeholder="$48,000" />
          </div>
          <FloatingTextarea label="Production Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={3} />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50/70">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.name.trim()} className="flex items-center gap-1.5 px-5 py-2 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Save className="w-3.5 h-3.5" /> {isEdit ? "Save Changes" : "Create Set"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   MOOD BOARD DROP ZONE (for form overlay)
   ============================================================ */

function MoodBoardDropZone({ url, onUrlChange }: { url: string; onUrlChange: (v: string) => void }) {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => onUrlChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed overflow-hidden transition-all ${dragging ? "border-slate-400 bg-slate-50/50" : url ? "border-gray-200 bg-gray-100" : "border-gray-300 bg-gray-50 hover:border-slate-300"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {isValidImageUrl(url) ? (
        <div className="aspect-video relative group">
          <img src={url} alt="Preview" className={`w-full h-full object-cover transition-opacity ${dragging ? "opacity-30" : ""}`} />
          {dragging ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-slate-500 mb-1.5" />
              <span className="text-sm font-semibold text-slate-700">Drop to replace image</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white/90 text-sm font-semibold text-gray-800 rounded-lg shadow-sm hover:bg-white transition-colors"
              >
                Replace Image
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="w-full aspect-video flex flex-col items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {dragging ? (
            <>
              <Upload className="w-8 h-8 text-slate-500 mb-1.5" />
              <span className="text-sm font-semibold text-slate-700">Drop image here</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-1.5" />
              <span className="text-sm font-medium text-gray-500">Drag and drop an image, or click to browse</span>
              <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, WebP supported</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

/* ============================================================
   SUB-ITEM FORM OVERLAY
   ============================================================ */

function SubItemFormOverlay({ type, existingItem, onSave, onClose }: {
  type: SetDetailTab
  existingItem?: any
  onSave: (item: any) => void
  onClose: () => void
}) {
  const isEdit = !!existingItem
  const titles: Record<SetDetailTab, string> = { elements: "Build Element", decorations: "Set Decoration", lighting: "Lighting Fixture", moodboard: "Mood Board Image" }

  /* Element form */
  const [elForm, setElForm] = useState({ name: existingItem?.name || "", material: existingItem?.material || "", dimensions: existingItem?.dimensions || "", quantity: existingItem?.quantity || 1, notes: existingItem?.notes || "" })
  /* Decoration form */
  const [decForm, setDecForm] = useState({ name: existingItem?.name || "", source: existingItem?.source || "inventory", quantity: existingItem?.quantity || 1, propId: existingItem?.propId || "", notes: existingItem?.notes || "" })
  /* Lighting form */
  const [lfForm, setLfForm] = useState({ name: existingItem?.name || "", type: existingItem?.type || "practical", wattage: existingItem?.wattage || "", dimmable: existingItem?.dimmable ?? true, notes: existingItem?.notes || "" })
  /* Mood board form */
  const [mbForm, setMbForm] = useState({ caption: existingItem?.caption || "", tags: existingItem?.tags?.join(", ") || "", url: existingItem?.url || "" })

  const handleSave = () => {
    const id = existingItem?.id || uid()
    if (type === "elements") {
      if (!elForm.name.trim()) return
      onSave({ id, ...elForm })
    } else if (type === "decorations") {
      if (!decForm.name.trim()) return
      onSave({ id, ...decForm } as SetDecoration)
    } else if (type === "lighting") {
      if (!lfForm.name.trim()) return
      onSave({ id, ...lfForm } as LightingFixture)
    } else if (type === "moodboard") {
      onSave({ id, url: mbForm.url, caption: mbForm.caption, tags: mbForm.tags.split(",").map((t) => t.trim()).filter(Boolean), addedAt: existingItem?.addedAt || Date.now() } as MoodBoardImage)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-bold text-gray-900">{isEdit ? `Edit ${titles[type]}` : `Add ${titles[type]}`}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {type === "elements" && (
            <>
              <FloatingField label="Element Name" value={elForm.name} onChange={(v) => setElForm({ ...elForm, name: v })} required />
              <div className="grid grid-cols-2 gap-3">
                <FloatingField label="Material" value={elForm.material} onChange={(v) => setElForm({ ...elForm, material: v })} />
                <FloatingField label="Dimensions" value={elForm.dimensions} onChange={(v) => setElForm({ ...elForm, dimensions: v })} />
              </div>
              <FloatingNumber label="Quantity" value={elForm.quantity} onChange={(v) => setElForm({ ...elForm, quantity: v })} min={1} />
              <FloatingTextarea label="Notes" value={elForm.notes} onChange={(v) => setElForm({ ...elForm, notes: v })} />
            </>
          )}
          {type === "decorations" && (
            <>
              <FloatingField label="Decoration Name" value={decForm.name} onChange={(v) => setDecForm({ ...decForm, name: v })} required />
              <div className="grid grid-cols-2 gap-3">
                <FloatingSelect label="Source" value={decForm.source} onChange={(v) => setDecForm({ ...decForm, source: v as any })} options={[{ value: "inventory", label: "Inventory" }, { value: "rental", label: "Rental" }, { value: "purchase", label: "Purchase" }, { value: "fabricated", label: "Fabricated" }]} />
                <FloatingNumber label="Quantity" value={decForm.quantity} onChange={(v) => setDecForm({ ...decForm, quantity: v })} min={1} />
              </div>
              <FloatingField label="Linked Prop ID (optional)" value={decForm.propId} onChange={(v) => setDecForm({ ...decForm, propId: v })} />
              <FloatingTextarea label="Notes" value={decForm.notes} onChange={(v) => setDecForm({ ...decForm, notes: v })} />
            </>
          )}
          {type === "lighting" && (
            <>
              <FloatingField label="Fixture Name" value={lfForm.name} onChange={(v) => setLfForm({ ...lfForm, name: v })} required />
              <div className="grid grid-cols-2 gap-3">
                <FloatingSelect label="Type" value={lfForm.type} onChange={(v) => setLfForm({ ...lfForm, type: v as any })} options={[{ value: "practical", label: "Practical" }, { value: "motivated", label: "Motivated" }, { value: "ambient", label: "Ambient" }, { value: "effect", label: "Effect" }]} />
                <FloatingField label="Wattage" value={lfForm.wattage} onChange={(v) => setLfForm({ ...lfForm, wattage: v })} />
              </div>
              <label className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-xl cursor-pointer">
                <input type="checkbox" checked={lfForm.dimmable} onChange={(e) => setLfForm({ ...lfForm, dimmable: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500" />
                <span className="text-sm text-gray-700 font-medium">Dimmable</span>
              </label>
              <FloatingTextarea label="Notes" value={lfForm.notes} onChange={(v) => setLfForm({ ...lfForm, notes: v })} />
            </>
          )}
          {type === "moodboard" && (
            <>
              {/* Drop zone / image preview */}
              <MoodBoardDropZone url={mbForm.url} onUrlChange={(v) => setMbForm({ ...mbForm, url: v })} />
              <FloatingField label="Image URL" value={mbForm.url} onChange={(v) => setMbForm({ ...mbForm, url: v })} />
              <FloatingField label="Caption" value={mbForm.caption} onChange={(v) => setMbForm({ ...mbForm, caption: v })} />
              <FloatingField label="Tags (comma-separated)" value={mbForm.tags} onChange={(v) => setMbForm({ ...mbForm, tags: v })} placeholder="e.g. terrain, color, mood" />
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50/70">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors">
            <Save className="w-3.5 h-3.5" /> {isEdit ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   TASK FORM OVERLAY
   ============================================================ */

function TaskFormOverlay({ existingTask, sets, onSave, onClose }: {
  existingTask?: ConstructionTask
  sets: ProductionDesignSet[]
  onSave: (t: ConstructionTask) => void
  onClose: () => void
}) {
  const isEdit = !!existingTask
  const [form, setForm] = useState({
    title: existingTask?.title || "",
    phase: existingTask?.phase || "carpentry" as ConstructionPhase,
    setId: existingTask?.setId || sets[0]?.id || "",
    priority: existingTask?.priority || "medium" as ConstructionTask["priority"],
    assignedTo: existingTask?.assignedTo || "",
    notes: existingTask?.notes || "",
    completed: existingTask?.completed || false,
  })

  const handleSave = () => {
    if (!form.title.trim() || !form.setId) return
    onSave({
      id: existingTask?.id || uid(),
      ...form,
      dueDate: existingTask?.dueDate,
    } as ConstructionTask)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-bold text-gray-900">{isEdit ? "Edit Task" : "Add Construction Task"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <FloatingField label="Task Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <div className="grid grid-cols-2 gap-3">
            <FloatingSelect label="Phase" value={form.phase} onChange={(v) => setForm({ ...form, phase: v as ConstructionPhase })} options={(["carpentry", "paint", "rigging", "set-dec", "on-camera", "strike"] as ConstructionPhase[]).map((p) => ({ value: p, label: PHASE_CONFIG[p].label }))} />
            <FloatingSelect label="Set" value={form.setId} onChange={(v) => setForm({ ...form, setId: v })} options={sets.map((s) => ({ value: s.id, label: s.name }))} />
          </div>
          <FloatingSelect label="Priority" value={form.priority} onChange={(v) => setForm({ ...form, priority: v as any })} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} />
          <FloatingField label="Assigned To" value={form.assignedTo} onChange={(v) => setForm({ ...form, assignedTo: v })} placeholder="e.g. Paint Crew A" />
          <FloatingTextarea label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50/70">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.title.trim() || !form.setId} className="flex items-center gap-1.5 px-5 py-2 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Save className="w-3.5 h-3.5" /> {isEdit ? "Save" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  )
}
