"use client"

import { useState, useMemo, useRef, useCallback, useEffect, type DragEvent } from "react"
import { isValidImageUrl } from "@/lib/utils"
import {
  X,
  Plus,
  Search,
  MoreVertical,
  Grid3X3,
  List,
  ChevronDown,
  Check,
  Package,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Layout,
  CheckCircle,
  XCircle,
  HelpCircle,
  Upload,
  Trash2,
  Pencil,
  Film,
  User,
  LayoutGrid,
  AlertTriangle,
  Palette,
  ShoppingBag,
  Wrench,
  ArrowRight,
  ShieldAlert,
  Home,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal, navigateToModal } from "./ModalManager"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import EmbeddedCoPilot from "@/components/copilot/EmbeddedCoPilot"
import type { ProjectProp, PropVote, PropComment, PropAvailability, PropInventoryItem, PropPurchaseRequest, Character, Actor } from "@/types/casting"
import type { Scene } from "@/types/schedule"
import { compressImage } from "@/utils/imageCompression"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type VoteValue = "yes" | "no" | "maybe"

/* The global inventory is persisted to the project data store.        */
type InventoryItem = PropInventoryItem

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES = ["Action Props", "Decorations", "Household Items", "Sci-Fi", "Fantasy", "Images"]
const STATUS_OPTIONS: { value: InventoryItem["status"]; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "in-use", label: "In Use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
]

/* ------------------------------------------------------------------ */
/*  Mock inventory data                                                */
/* ------------------------------------------------------------------ */

function generateMockInventory(characters: Character[], scenes: Scene[]): InventoryItem[] {
  const charId = (idx: number) => characters[idx]?.id ?? null
  const scnIds = (...indices: number[]) => indices.filter((i) => scenes[i]).map((i) => scenes[i].id)
  return [
    { id: "p1", name: "Medieval Broadsword", model: "Steel Replica", category: "Action Props", brand: "Regal Arms", serialNumber: "MBS-00192", skuBarcode: "7891234560", notes: "Live steel edge - requires armorer present during all choreographed sequences", imageUrl: "", purchaseType: "Bought", unitPrice: "$450", quantity: 3, bookedTo: null, availability: [], status: "available", sceneIds: scnIds(0, 2), characterId: charId(0), requiresArmorySupervision: true },
    { id: "p2", name: "Victorian Chandelier", model: "Grand 48", category: "Decorations", brand: "Heritage Lights", serialNumber: "VCH-90234", skuBarcode: "7891234561", notes: "", imageUrl: "", purchaseType: "Rental", unitPrice: "$2,500", quantity: 2, bookedTo: null, availability: [], status: "available", sceneIds: scnIds(1), characterId: null },
    { id: "p3", name: "Antique Telephone", model: "Rotary 1950s", category: "Household Items", brand: "Retro Props Co.", serialNumber: "ATP-44210", skuBarcode: "7891234562", notes: "Dial is functional, bell rings", imageUrl: "", purchaseType: "Bought", unitPrice: "$320", quantity: 4, bookedTo: null, availability: [], status: "available", sceneIds: scnIds(0, 1, 3), characterId: charId(1) },
    { id: "p4", name: "Plasma Rifle", model: "PR-7X", category: "Sci-Fi", brand: "FutureForge", serialNumber: "PLR-11002", skuBarcode: "7891234563", notes: "Modified airsoft mechanism with muzzle flash FX - classified as firearm replica", imageUrl: "", purchaseType: "Rental", unitPrice: "$1,800", quantity: 1, bookedTo: "Jurassic Park - Remake", availability: [], status: "in-use", sceneIds: scnIds(2, 4), characterId: charId(0), requiresArmorySupervision: true },
    { id: "p5", name: "Crystal Ball", model: "12\" Illuminated", category: "Fantasy", brand: "Mystic Props", serialNumber: "CRB-78301", skuBarcode: "7891234564", notes: "LED base included", imageUrl: "", purchaseType: "Bought", unitPrice: "$280", quantity: 2, bookedTo: null, availability: [], status: "available", sceneIds: scnIds(3), characterId: charId(2) },
    { id: "p6", name: "Framed Oil Painting", model: "Large Landscape", category: "Images", brand: "Art House Props", serialNumber: "FOP-460D0G", skuBarcode: "1234567890", notes: "Canvas reproduction, gilt frame", imageUrl: "", purchaseType: "Rental", unitPrice: "$600", quantity: 1, bookedTo: null, availability: [], status: "available", sceneIds: [], characterId: null },
    { id: "p7", name: "Wooden Treasure Chest", model: "Pirate Style", category: "Fantasy", brand: "Old World Props", serialNumber: "WTC-20102", skuBarcode: "7891234566", notes: "", imageUrl: "", purchaseType: "Bought", unitPrice: "$180", quantity: 5, bookedTo: null, availability: [], status: "available", sceneIds: scnIds(0, 4), characterId: null },
    { id: "p8", name: "Holographic Display", model: "HoloDesk v2", category: "Sci-Fi", brand: "FutureForge", serialNumber: "HLD-66102", skuBarcode: "7891234567", notes: "Requires 220V power", imageUrl: "", purchaseType: "Rental", unitPrice: "$3,200", quantity: 3, bookedTo: "Avatar 3", availability: [], status: "in-use", sceneIds: scnIds(1, 2), characterId: null },
    { id: "p9", name: "Leather Holster Set", model: "Double Draw", category: "Action Props", brand: "Western Outfitters", serialNumber: "LHS-34501", skuBarcode: "7891234568", notes: "", imageUrl: "", purchaseType: "Bought", unitPrice: "$150", quantity: 6, bookedTo: null, availability: [], status: "available", sceneIds: scnIds(0), characterId: charId(0) },
    { id: "p10", name: "Velvet Curtain Panels", model: "12ft Burgundy", category: "Decorations", brand: "Stage Dressing Co.", serialNumber: "VCP-90001", skuBarcode: "7891234569", notes: "Flame retardant treated", imageUrl: "", purchaseType: "Bought", unitPrice: "$420", quantity: 8, bookedTo: null, availability: [], status: "available", sceneIds: scnIds(1, 3), characterId: null },
    { id: "p11", name: "Cast Iron Skillet", model: "14\"", category: "Household Items", brand: "Lodge", serialNumber: "CIS-00442", skuBarcode: "7891234570", notes: "Pre-seasoned, food safe", imageUrl: "", purchaseType: "Bought", unitPrice: "$60", quantity: 4, bookedTo: "Stranger Things S6", availability: [], status: "in-use", sceneIds: scnIds(2), characterId: charId(1) },
    { id: "p12", name: "Vintage Movie Poster", model: "27x40 Framed", category: "Images", brand: "Art House Props", serialNumber: "VMP-12093", skuBarcode: "7891234571", notes: "1960s Hitchcock reproduction", imageUrl: "", purchaseType: "Bought", unitPrice: "$95", quantity: 3, bookedTo: null, availability: [], status: "available", sceneIds: [], characterId: null },
  ]
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/* ------------------------------------------------------------------ */
/*  Image helpers                                                      */
/* ------------------------------------------------------------------ */

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

/* ------------------------------------------------------------------ */
/*  Floating-label form fields (matching reference image 2)            */
/* ------------------------------------------------------------------ */

function FloatingField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 peer placeholder-transparent"
        placeholder={placeholder || label}
      />
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
    </div>
  )
}

function FloatingSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] | string[] }) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
      >
        <option value="">Select...</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Image Upload Placeholder (click to upload)                         */
/* ------------------------------------------------------------------ */

function ImageUploadBox({ imageUrl, onImageChange, className }: { imageUrl: string; onImageChange: (url: string) => void; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isPlaceholder = !imageUrl || imageUrl.includes("placeholder.svg")

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return
    const dataUrl = await readFileAsDataUrl(file)
    const compressed = await compressImage(dataUrl)
    onImageChange(compressed)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-xl border border-gray-300 bg-white overflow-hidden cursor-pointer hover:border-emerald-400 transition-colors group ${className || "w-32 h-[72px]"}`}
    >
      {isPlaceholder ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
          <Upload className="w-6 h-6 mb-0.5" />
          <span className="text-[9px] font-medium">Upload</span>
        </div>
      ) : (
        <>
          {isValidImageUrl(imageUrl) ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><Package className="w-5 h-5 text-gray-300" /></div>}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
            <Upload className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = "" }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Add Item Sub-Modal                                                 */
/* ------------------------------------------------------------------ */

function AddItemModal({ onClose, onAdd, scenes, characters, characterActorMap }: { onClose: () => void; onAdd: (item: InventoryItem) => void; scenes: Scene[]; characters: Character[]; characterActorMap: { character: Character; castActor: Actor | null }[] }) {
  const [form, setForm] = useState({ name: "", model: "", category: "", serialNumber: "", brand: "", skuBarcode: "", notes: "", purchaseType: "", unitPrice: "", quantity: 1 })
  const [imageUrl, setImageUrl] = useState("")
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [sceneSearch, setSceneSearch] = useState("")
  const [requiresArmorySupervision, setRequiresArmorySupervision] = useState(false)
  const [availSlots, setAvailSlots] = useState<{ id: string; day: string; startTime: string; endTime: string }[]>([
    { id: uid(), day: "", startTime: "09:00", endTime: "17:00" },
  ])

  const update = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }))

  const toggleScene = (id: string) => setSelectedSceneIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

  const filteredScenes = useMemo(() => {
    if (!sceneSearch) return scenes
    const q = sceneSearch.toLowerCase()
    return scenes.filter((s) => s.sceneNumber.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q))
  }, [scenes, sceneSearch])

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const newItem: InventoryItem = {
      id: `p-${uid()}`,
      name: form.name,
      model: form.model,
      category: form.category || "Misc",
      brand: form.brand,
      serialNumber: form.serialNumber,
      skuBarcode: form.skuBarcode,
      notes: form.notes,
      imageUrl,
      purchaseType: form.purchaseType || "To Procure",
      unitPrice: form.unitPrice || "$0",
      quantity: form.quantity,
      bookedTo: null,
      availability: availSlots.filter((s) => s.day),
      status: "available",
      sceneIds: selectedSceneIds,
      characterId: selectedCharacterId,
      requiresArmorySupervision,
    }
    onAdd(newItem)
    onClose()
  }

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Item</h2>
              <p className="text-sm text-gray-500 mt-0.5">Register an item with the inventory system</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Row 1 */}
          <div className="flex gap-4">
            <div className="flex-1"><FloatingField label="Name" value={form.name} onChange={(v) => update("name", v)} /></div>
            <div className="flex-1"><FloatingField label="Model" value={form.model} onChange={(v) => update("model", v)} /></div>
            <ImageUploadBox imageUrl={imageUrl} onImageChange={setImageUrl} />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <FloatingSelect label="Category" value={form.category} onChange={(v) => update("category", v)} options={CATEGORIES} />
            <FloatingField label="Serial Number" value={form.serialNumber} onChange={(v) => update("serialNumber", v)} />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Brand" value={form.brand} onChange={(v) => update("brand", v)} />
            <FloatingField label="Sku / Barcode" value={form.skuBarcode} onChange={(v) => update("skuBarcode", v)} />
          </div>

          {/* Scene Assignment */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Scenes</h3>
            <p className="text-xs text-gray-500 mb-3">Assign this prop to one or more scenes.</p>
            {selectedSceneIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedSceneIds.map((sid) => {
                  const scene = scenes.find((s) => s.id === sid)
                  if (!scene) return null
                  return (
                    <span key={sid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-medium">
                      <Film className="w-3 h-3" />
                      Sc {scene.sceneNumber}
                      <button onClick={() => toggleScene(sid)} className="ml-0.5 text-emerald-400 hover:text-emerald-700 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            {scenes.length > 0 ? (
              <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
                <div className="relative border-b border-gray-200">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={sceneSearch} onChange={(e) => setSceneSearch(e.target.value)} placeholder="Search scenes..." className="w-full pl-8 pr-3 py-2.5 text-xs bg-gray-50 focus:outline-none focus:bg-white text-gray-900 placeholder-gray-400" />
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                  {filteredScenes.map((scene) => {
                    const isSelected = selectedSceneIds.includes(scene.id)
                    return (
                      <button key={scene.id} onClick={() => toggleScene(scene.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isSelected ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900">Sc {scene.sceneNumber}</span>
                            <span className="text-[10px] text-gray-400">{scene.intExt}. {scene.location} - {scene.dayNight}</span>
                          </div>
                          {scene.description && <p className="text-[10px] text-gray-500 truncate mt-0.5">{scene.description}</p>}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{scene.pages} pg</span>
                      </button>
                    )
                  })}
                  {filteredScenes.length === 0 && <p className="text-center text-xs text-gray-400 py-4">No scenes match your search</p>}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No scenes available. Add scenes in the Schedule view.</p>
            )}
          </div>

          {/* Character Assignment */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Character</h3>
            <p className="text-xs text-gray-500 mb-3">Assign this prop to a character (optional).</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCharacterId(null)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-left ${
                  selectedCharacterId === null
                    ? "border-emerald-400 bg-emerald-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${selectedCharacterId === null ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                  <Package className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-medium ${selectedCharacterId === null ? "text-emerald-700" : "text-gray-600"}`}>No character</span>
              </button>
              {characterActorMap.map(({ character, castActor }) => {
                const isSelected = selectedCharacterId === character.id
                return (
                  <button
                    key={character.id}
                    onClick={() => setSelectedCharacterId(isSelected ? null : character.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-50 shadow-sm"
                        : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
                    }`}
                  >
                    {isValidImageUrl(castActor?.headshots?.[0]) ? (
                      <img src={castActor.headshots[0]} alt="" className={`w-7 h-8 object-cover rounded-lg shrink-0 ${isSelected ? "ring-2 ring-emerald-300" : ""}`} />
                    ) : (
                      <div className={`w-7 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-emerald-100" : "bg-gray-100"}`}>
                        <User className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-500" : "text-gray-400"}`} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isSelected ? "text-emerald-700" : "text-gray-800"}`}>{character.name}</p>
                      {castActor && <p className="text-[10px] text-gray-500 truncate">{castActor.name}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
            {characters.length === 0 && <p className="text-xs text-gray-400 italic mt-2">No characters in this project yet.</p>}
          </div>

          {/* Notes */}
          <div className="relative">
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none peer placeholder-transparent" placeholder="Notes" />
            <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">Notes</label>
          </div>

          {/* Armory Supervision */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${requiresArmorySupervision ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
            <button
              type="button"
              onClick={() => setRequiresArmorySupervision(!requiresArmorySupervision)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${requiresArmorySupervision ? "bg-red-600 border-red-600" : "border-gray-300 hover:border-gray-400"}`}
            >
              {requiresArmorySupervision && <Check className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 shrink-0 ${requiresArmorySupervision ? "text-red-600" : "text-gray-400"}`} />
                <span className={`text-sm font-semibold ${requiresArmorySupervision ? "text-red-800" : "text-gray-900"}`}>Requires Certified Armory Supervision</span>
              </div>
              <p className={`text-xs mt-1 ${requiresArmorySupervision ? "text-red-600" : "text-gray-500"}`}>
                Check this if the item is a weapon, replica firearm, or dangerous prop that requires a certified armorer on set during use.
              </p>
            </div>
          </div>

          {/* Budgeting */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Budgeting / Accounting</h3>
            <p className="text-xs text-gray-500 mb-3">Used for generating cost reports.</p>
            <div className="grid grid-cols-2 gap-4">
              <FloatingSelect label="Purchase Type" value={form.purchaseType} onChange={(v) => update("purchaseType", v)} options={["Bought", "Rental", "Lease", "To Procure"]} />
              <FloatingField label="Unit Price" value={form.unitPrice} onChange={(v) => update("unitPrice", v)} placeholder="$0.00" />
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Availability</h3>
            <p className="text-xs text-gray-500 mb-3">Define when this item can be used.</p>
            {availSlots.map((slot, idx) => (
              <div key={slot.id} className="grid grid-cols-[1fr_auto_auto] gap-3 mb-3">
                <div className="relative">
                  <select value={slot.day} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], day: e.target.value }; setAvailSlots(u) }} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                    <option value="">Select the day</option>
                    {weekdays.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <input type="time" value={slot.startTime} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], startTime: e.target.value }; setAvailSlots(u) }} className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="time" value={slot.endTime} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], endTime: e.target.value }; setAvailSlots(u) }} className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setAvailSlots((s) => [...s, { id: uid(), day: "", startTime: "09:00", endTime: "17:00" }])} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Weekday
              </button>
              <button onClick={() => setAvailSlots((s) => [...s, { id: uid(), day: "", startTime: "09:00", endTime: "17:00" }])} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add specific date
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSubmit} disabled={!form.name.trim()} className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              Add Item
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit Item Modal (pre-populated, status, delete availability)       */
/* ------------------------------------------------------------------ */

function EditItemModal({ item, onClose, onSave, scenes, characters, characterActorMap }: { item: InventoryItem | ProjectProp; onClose: () => void; onSave: (updated: InventoryItem | ProjectProp) => void; scenes: Scene[]; characters: Character[]; characterActorMap: { character: Character; castActor: Actor | null }[] }) {
  const [form, setForm] = useState({
    name: item.name,
    model: item.model,
    category: item.category,
    serialNumber: item.serialNumber,
    skuBarcode: item.skuBarcode,
    brand: item.brand,
    notes: item.notes,
    purchaseType: item.purchaseType,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    status: item.status,
  })
  const [imageUrl, setImageUrl] = useState(item.imageUrl)
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>(item.sceneIds || [])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(item.characterId ?? null)
  const [sceneSearch, setSceneSearch] = useState("")
  const [requiresArmorySupervision, setRequiresArmorySupervision] = useState(!!item.requiresArmorySupervision)
  const [availSlots, setAvailSlots] = useState<{ id: string; day: string; startTime: string; endTime: string }[]>(
    item.availability.length > 0 ? item.availability.map((a) => ({ id: "id" in a ? (a as any).id : uid(), day: a.day, startTime: a.startTime, endTime: a.endTime })) : [{ id: uid(), day: "", startTime: "09:00", endTime: "17:00" }]
  )

  const update = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }))
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const toggleScene = (id: string) => setSelectedSceneIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

  const filteredScenes = useMemo(() => {
    if (!sceneSearch) return scenes
    const q = sceneSearch.toLowerCase()
    return scenes.filter((s) => s.sceneNumber.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q))
  }, [scenes, sceneSearch])

  const handleDeleteSlot = (slotId: string) => {
    setAvailSlots((s) => s.filter((slot) => slot.id !== slotId))
  }

  const handleSave = () => {
    onSave({
      ...item,
      ...form,
      imageUrl,
      availability: availSlots.filter((s) => s.day),
      sceneIds: selectedSceneIds,
      characterId: selectedCharacterId,
      requiresArmorySupervision,
    } as any)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Item</h2>
              <p className="text-sm text-gray-500 mt-0.5">Modify item details and availability</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Row 1 */}
          <div className="flex gap-4">
            <div className="flex-1"><FloatingField label="Name" value={form.name} onChange={(v) => update("name", v)} /></div>
            <div className="flex-1"><FloatingField label="Model" value={form.model} onChange={(v) => update("model", v)} /></div>
            <ImageUploadBox imageUrl={imageUrl} onImageChange={setImageUrl} />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <FloatingSelect label="Category" value={form.category} onChange={(v) => update("category", v)} options={CATEGORIES} />
            <FloatingField label="Serial Number" value={form.serialNumber} onChange={(v) => update("serialNumber", v)} />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Brand" value={form.brand} onChange={(v) => update("brand", v)} />
            <FloatingField label="Sku / Barcode" value={form.skuBarcode} onChange={(v) => update("skuBarcode", v)} />
          </div>

          {/* Notes */}
          <div className="relative">
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none peer placeholder-transparent" placeholder="Notes" />
            <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">Notes</label>
          </div>

          {/* Scene Assignment */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Scenes</h3>
            <p className="text-xs text-gray-500 mb-3">Assign this prop to one or more scenes.</p>
            {selectedSceneIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedSceneIds.map((sid) => {
                  const scene = scenes.find((s) => s.id === sid)
                  if (!scene) return null
                  return (
                    <span key={sid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-medium">
                      <Film className="w-3 h-3" />
                      Sc {scene.sceneNumber}
                      <button onClick={() => toggleScene(sid)} className="ml-0.5 text-emerald-400 hover:text-emerald-700 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            {scenes.length > 0 ? (
              <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
                <div className="relative border-b border-gray-200">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={sceneSearch} onChange={(e) => setSceneSearch(e.target.value)} placeholder="Search scenes..." className="w-full pl-8 pr-3 py-2.5 text-xs bg-gray-50 focus:outline-none focus:bg-white text-gray-900 placeholder-gray-400" />
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                  {filteredScenes.map((scene) => {
                    const isSelected = selectedSceneIds.includes(scene.id)
                    return (
                      <button key={scene.id} onClick={() => toggleScene(scene.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isSelected ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900">Sc {scene.sceneNumber}</span>
                            <span className="text-[10px] text-gray-400">{scene.intExt}. {scene.location} - {scene.dayNight}</span>
                          </div>
                          {scene.description && <p className="text-[10px] text-gray-500 truncate mt-0.5">{scene.description}</p>}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{scene.pages} pg</span>
                      </button>
                    )
                  })}
                  {filteredScenes.length === 0 && <p className="text-center text-xs text-gray-400 py-4">No scenes match your search</p>}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No scenes available. Add scenes in the Schedule view.</p>
            )}
          </div>

          {/* Character Assignment */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Character</h3>
            <p className="text-xs text-gray-500 mb-3">Assign this prop to a character (optional).</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCharacterId(null)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-left ${
                  selectedCharacterId === null
                    ? "border-emerald-400 bg-emerald-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${selectedCharacterId === null ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                  <Package className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-medium ${selectedCharacterId === null ? "text-emerald-700" : "text-gray-600"}`}>No character</span>
              </button>
              {characterActorMap.map(({ character, castActor }) => {
                const isSelected = selectedCharacterId === character.id
                return (
                  <button
                    key={character.id}
                    onClick={() => setSelectedCharacterId(isSelected ? null : character.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-50 shadow-sm"
                        : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
                    }`}
                  >
                    {isValidImageUrl(castActor?.headshots?.[0]) ? (
                      <img src={castActor.headshots[0]} alt="" className={`w-7 h-8 object-cover rounded-lg shrink-0 ${isSelected ? "ring-2 ring-emerald-300" : ""}`} />
                    ) : (
                      <div className={`w-7 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-emerald-100" : "bg-gray-100"}`}>
                        <User className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-500" : "text-gray-400"}`} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isSelected ? "text-emerald-700" : "text-gray-800"}`}>{character.name}</p>
                      {castActor && <p className="text-[10px] text-gray-500 truncate">{castActor.name}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Armory Supervision */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${requiresArmorySupervision ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
            <button
              type="button"
              onClick={() => setRequiresArmorySupervision(!requiresArmorySupervision)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${requiresArmorySupervision ? "bg-red-600 border-red-600" : "border-gray-300 hover:border-gray-400"}`}
            >
              {requiresArmorySupervision && <Check className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 shrink-0 ${requiresArmorySupervision ? "text-red-600" : "text-gray-400"}`} />
                <span className={`text-sm font-semibold ${requiresArmorySupervision ? "text-red-800" : "text-gray-900"}`}>Requires Certified Armory Supervision</span>
              </div>
              <p className={`text-xs mt-1 ${requiresArmorySupervision ? "text-red-600" : "text-gray-500"}`}>
                Check this if the item is a weapon, replica firearm, or dangerous prop that requires a certified armorer on set during use.
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Status</h3>
            <p className="text-xs text-gray-500 mb-3">Current item status.</p>
            <FloatingSelect label="Status" value={form.status} onChange={(v) => update("status", v)} options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
          </div>

          {/* Budgeting */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Budgeting / Accounting</h3>
            <p className="text-xs text-gray-500 mb-3">Used for generating cost reports.</p>
            <div className="grid grid-cols-2 gap-4">
              <FloatingSelect label="Purchase Type" value={form.purchaseType} onChange={(v) => update("purchaseType", v)} options={["Bought", "Rental", "Lease", "To Procure"]} />
              <FloatingField label="Unit Price" value={form.unitPrice} onChange={(v) => update("unitPrice", v)} placeholder="$0.00" />
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Availability</h3>
            <p className="text-xs text-gray-500 mb-3">Define when this item can be used.</p>
            {availSlots.map((slot, idx) => (
              <div key={slot.id} className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <select value={slot.day} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], day: e.target.value }; setAvailSlots(u) }} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                    <option value="">Select the day</option>
                    {weekdays.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <input type="time" value={slot.startTime} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], startTime: e.target.value }; setAvailSlots(u) }} className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="time" value={slot.endTime} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], endTime: e.target.value }; setAvailSlots(u) }} className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="Delete slot">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setAvailSlots((s) => [...s, { id: uid(), day: "", startTime: "09:00", endTime: "17:00" }])} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Weekday
              </button>
              <button onClick={() => setAvailSlots((s) => [...s, { id: uid(), day: "", startTime: "09:00", endTime: "17:00" }])} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add specific date
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-white transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Vote Button                                                        */
/* ------------------------------------------------------------------ */

const VOTE_PILL_STYLES: Record<string, { base: string; active: string }> = {
  Yes:   { base: "bg-[#d5dece] text-[#6b7a5e] hover:bg-[#c8d4bf]", active: "bg-[#b5c9a8] text-[#4a5b3f] ring-2 ring-[#8fa67e]" },
  Maybe: { base: "bg-[#f5e6d0] text-[#9b8a5e] hover:bg-[#eddbbd]", active: "bg-[#f0d9b5] text-[#7a6a3a] ring-2 ring-[#d4b88a]" },
  No:    { base: "bg-[#f0cdd0] text-[#a06b6e] hover:bg-[#e8bfc3]", active: "bg-[#e8b4b8] text-[#8b4c4f] ring-2 ring-[#d49396]" },
}

function VoteButton({ label, isActive, count, onClick }: { label: string; icon?: typeof CheckCircle; isActive: boolean; count: number; activeClassName?: string; onClick: () => void }) {
  const style = VOTE_PILL_STYLES[label] || VOTE_PILL_STYLES["Maybe"]
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-1.5 rounded-full text-xs font-semibold text-center transition-all duration-200 ${isActive ? style.active : style.base}`}
      title={label}
    >
      <span>{label}</span>
      {count > 0 && <span className="ml-1 text-[10px] opacity-70">{count}</span>}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Comment Section                                                    */
/* ------------------------------------------------------------------ */

function CommentSection({ comments, onAddComment }: { comments: PropComment[]; onAddComment: (text: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")

  const handleSubmit = () => {
    if (!text.trim()) return
    onAddComment(text.trim())
    setText("")
  }

  return (
    <div className="mt-1">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
        <MessageSquare className="w-3 h-3" />
        {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Add comment"}
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {comments.length > 0 && (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-gray-600">{c.userInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-700 leading-snug">{c.text}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{c.userName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Write a comment..." className="flex-1 px-2.5 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 text-gray-900" />
            <button onClick={handleSubmit} disabled={!text.trim()} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    "available": "bg-emerald-100 text-emerald-700",
    "in-use": "bg-blue-100 text-blue-700",
    "maintenance": "bg-amber-100 text-amber-700",
    "retired": "bg-gray-200 text-gray-600",
  }
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg[status] || cfg["available"]}`}>
      {STATUS_OPTIONS.find((s) => s.value === status)?.label || status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Inventory Card (All Items) -- with drag-and-drop image replacement */
/* ------------------------------------------------------------------ */

function InventoryCard({ item, isInProject, onToggleAdd, onEdit, onImageReplace, onDelete, onAddToCanvas, hasProject, onVote, onAddComment, currentUserId, votes, comments, scenes, characters }: { item: InventoryItem; isInProject: boolean; onToggleAdd: (id: string) => void; onEdit: (item: InventoryItem) => void; onImageReplace: (id: string, url: string) => void; onDelete: (id: string) => void; onAddToCanvas: (item: InventoryItem) => void; hasProject: boolean; onVote?: (id: string, vote: VoteValue) => void; onAddComment?: (id: string, text: string) => void; currentUserId?: string; votes?: PropVote[]; comments?: PropComment[]; scenes?: Scene[]; characters?: Character[] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isBooked = !!item.bookedTo

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false) }, [])
  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith("image/")) {
      const dataUrl = await readFileAsDataUrl(file)
      const compressed = await compressImage(dataUrl)
      onImageReplace(item.id, compressed)
    }
  }, [item.id, onImageReplace])

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden group ${isInProject ? "border-emerald-300 ring-1 ring-emerald-200" : isBooked ? "border-orange-200 bg-orange-50/30" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>
      <div className="flex items-stretch">
        {/* Image area -- drag target */}
        <div
          className={`w-24 sm:w-32 shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center relative transition-all ${isDragOver ? "ring-2 ring-emerald-500 ring-inset" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isValidImageUrl(item.imageUrl) ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Package className="w-6 h-6 text-gray-300" />
            </div>
          )}
          {isDragOver && (
            <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row">
          {/* Primary info */}
          <div className="flex-1 min-w-0 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                  <span className="font-medium text-gray-700">{item.category}</span>
                  <span className="text-gray-300">{"\u2022"}</span>
                  <span>{item.brand}</span>
                  <span className="text-gray-300">{"\u2022"}</span>
                  <span>Qty {item.quantity}</span>
                  {item.unitPrice && (
                    <>
                      <span className="text-gray-300">{"\u2022"}</span>
                      <span className="font-medium text-gray-600">{item.unitPrice}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <StatusBadge status={item.status} />
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                      <button onClick={() => { onEdit(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5" /> Edit details
                      </button>
                      <button onClick={() => { onAddToCanvas(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Layout className="w-3.5 h-3.5" /> Add to Canvas
                      </button>
                      <button onClick={() => { onToggleAdd(item.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                        {isInProject ? "Remove from project" : "Add to project"}
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button onClick={() => { onDelete(item.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" /> Delete item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {item.characterId && (() => {
                const char = characters?.find((c) => c.id === item.characterId)
                return char ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                    <User className="w-3 h-3 text-gray-500" />
                    {char.name}
                  </span>
                ) : null
              })()}
              {item.sceneIds && item.sceneIds.length > 0 && (() => {
                const resolved = item.sceneIds.map((sid) => scenes?.find((s) => s.id === sid)).filter(Boolean) as Scene[]
                if (resolved.length === 0) return null
                const show = resolved.slice(0, 3)
                const extra = resolved.length - 3
                return (
                  <>
                    {show.map((sc) => (
                      <span key={sc.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold" title={`${sc.intExt}. ${sc.location} - ${sc.dayNight}`}>
                        <Film className="w-3 h-3" />
                        Sc {sc.sceneNumber}
                      </span>
                    ))}
                    {extra > 0 && <span className="text-[10px] text-gray-400 font-medium">+{extra} more</span>}
                  </>
                )
              })()}
              {item.requiresArmorySupervision && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold" title="Requires Certified Armory Supervision">
                  <ShieldAlert className="w-3 h-3" />
                  Armory
                </span>
              )}
              {isBooked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> {item.bookedTo}
                </span>
              )}
            </div>
          </div>

          {/* Actions column */}
          <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 px-3 pb-3 sm:pb-0 sm:pr-4 sm:border-l sm:border-gray-100 shrink-0">
            {isBooked ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3" /> Booked
              </span>
            ) : isInProject ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                <Check className="w-3 h-3" /> In Project
              </span>
            ) : (
              <button
                onClick={() => onToggleAdd(item.id)}
                disabled={!hasProject}
                title={!hasProject ? "Create or open a project first" : "Add to project"}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
            <button onClick={() => onAddToCanvas(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Add to Canvas">
              <Layout className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Vote/Comment row when in project */}
      {isInProject && onVote && onAddComment && (() => {
        const itemVotes = votes || []
        const itemComments = comments || []
        const userVote = itemVotes.find((v) => v.userId === currentUserId)?.vote
        const yesCt = itemVotes.filter((v) => v.vote === "yes").length
        const noCt = itemVotes.filter((v) => v.vote === "no").length
        const maybeCt = itemVotes.filter((v) => v.vote === "maybe").length
        return (
          <div className="border-t border-gray-100">
            <div className="px-4 py-2 flex items-center gap-1.5">
              <VoteButton label="Yes" isActive={userVote === "yes"} count={yesCt} onClick={() => onVote(item.id, "yes")} />
              <VoteButton label="Maybe" isActive={userVote === "maybe"} count={maybeCt} onClick={() => onVote(item.id, "maybe")} />
              <VoteButton label="No" isActive={userVote === "no"} count={noCt} onClick={() => onVote(item.id, "no")} />
            </div>
            <div className="px-4 pb-3">
              <CommentSection comments={itemComments} onAddComment={(text) => onAddComment(item.id, text)} />
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Project Prop Card (My Project tab)                                 */
/* ------------------------------------------------------------------ */

function ProjectPropCard({ item, onVote, onAddComment, onRemove, onAddToCanvas, onEdit, onDelete, currentUserId, scenes, characters }: { item: ProjectProp; onVote: (id: string, vote: VoteValue) => void; onAddComment: (id: string, text: string) => void; onRemove: (id: string) => void; onAddToCanvas: (item: ProjectProp) => void; onEdit: (item: ProjectProp) => void; onDelete: (id: string) => void; currentUserId: string | undefined; scenes?: Scene[]; characters?: Character[] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const userVote = item.votes.find((v) => v.userId === currentUserId)?.vote
  const yesCt = item.votes.filter((v) => v.vote === "yes").length
  const noCt = item.votes.filter((v) => v.vote === "no").length
  const maybeCt = item.votes.filter((v) => v.vote === "maybe").length

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden hover:shadow-sm">
      <div className="flex items-stretch">
        {/* Image */}
        <div className="w-24 sm:w-32 shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center">
          {isValidImageUrl(item.imageUrl) ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6 text-gray-300" />
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row">
          {/* Primary info */}
          <div className="flex-1 min-w-0 p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                  <span className="font-medium text-gray-700">{item.category}</span>
                  <span className="text-gray-300">{"\u2022"}</span>
                  <span>{item.brand}</span>
                  <span className="text-gray-300">{"\u2022"}</span>
                  <span>Qty {item.quantity}</span>
                </div>
              </div>
              <div className="relative shrink-0" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                    <button onClick={() => { onEdit(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Pencil className="w-3.5 h-3.5" /> Edit details
                    </button>
                    <button onClick={() => { onAddToCanvas(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Layout className="w-3.5 h-3.5" /> Add to Canvas
                    </button>
                    <button onClick={() => { onRemove(item.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <X className="w-3.5 h-3.5" /> Remove from project
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button onClick={() => { onDelete(item.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Delete item
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {item.characterId && (() => {
                const char = characters?.find((c) => c.id === item.characterId)
                return char ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                    <User className="w-3 h-3 text-gray-500" />
                    {char.name}
                  </span>
                ) : null
              })()}
              {item.sceneIds && item.sceneIds.length > 0 && (() => {
                const resolved = item.sceneIds.map((sid) => scenes?.find((s) => s.id === sid)).filter(Boolean) as Scene[]
                if (resolved.length === 0) return null
                const show = resolved.slice(0, 3)
                const extra = resolved.length - 3
                return (
                  <>
                    {show.map((sc) => (
                      <span key={sc.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold" title={`${sc.intExt}. ${sc.location} - ${sc.dayNight}`}>
                        <Film className="w-3 h-3" />
                        Sc {sc.sceneNumber}
                      </span>
                    ))}
                    {extra > 0 && <span className="text-[10px] text-gray-400 font-medium">+{extra} more</span>}
                  </>
                )
              })()}
              {item.requiresArmorySupervision && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold" title="Requires Certified Armory Supervision">
                  <ShieldAlert className="w-3 h-3" />
                  Armory
                </span>
              )}
            </div>
          </div>

          {/* Vote + Canvas column */}
          <div className="flex sm:flex-col items-center gap-1.5 px-3 pb-3 sm:pb-0 sm:pr-4 sm:py-3 sm:border-l sm:border-gray-100 shrink-0">
            <VoteButton label="Yes" isActive={userVote === "yes"} count={yesCt} onClick={() => onVote(item.id, "yes")} />
            <VoteButton label="Maybe" isActive={userVote === "maybe"} count={maybeCt} onClick={() => onVote(item.id, "maybe")} />
            <VoteButton label="No" isActive={userVote === "no"} count={noCt} onClick={() => onVote(item.id, "no")} />
            <button onClick={() => onAddToCanvas(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Add to Canvas">
              <Layout className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      {item.comments.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2.5">
          <CommentSection comments={item.comments} onAddComment={(text) => onAddComment(item.id, text)} />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  List rows (compact views)                                          */
/* ------------------------------------------------------------------ */

function InventoryListRow({ item, isInProject, onToggleAdd, onEdit, onDelete, hasProject, scenes, characters }: { item: InventoryItem; isInProject: boolean; onToggleAdd: (id: string) => void; onEdit: (item: InventoryItem) => void; onDelete: (id: string) => void; hasProject: boolean; scenes?: Scene[]; characters?: Character[] }) {
  const isBooked = !!item.bookedTo
  return (
    <div className={`flex items-center gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isInProject ? "bg-emerald-50/40" : ""}`}>
      <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
        {isValidImageUrl(item.imageUrl) ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-5 h-5 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500">{item.category} &middot; {item.brand}</span>
          {item.characterId && (() => {
            const char = characters?.find((c) => c.id === item.characterId)
            return char ? <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-medium"><User className="w-2.5 h-2.5" />{char.name}</span> : null
          })()}
          {item.sceneIds && item.sceneIds.length > 0 && (() => {
            const resolved = item.sceneIds.map((sid) => scenes?.find((s) => s.id === sid)).filter(Boolean) as Scene[]
            return resolved.slice(0, 2).map((sc) => (
              <span key={sc.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-[9px] font-medium"><Film className="w-2.5 h-2.5" />Sc {sc.sceneNumber}</span>
            ))
          })()}
          {item.sceneIds && item.sceneIds.length > 2 && <span className="text-[9px] text-gray-400">+{item.sceneIds.length - 2}</span>}
          {item.requiresArmorySupervision && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-bold" title="Requires Certified Armory Supervision">
              <ShieldAlert className="w-2.5 h-2.5" />
              Armory
            </span>
          )}
        </div>
      </div>
      <div className="hidden sm:block text-xs text-gray-500 w-16 text-center">Qty: {item.quantity}</div>
      <div className="hidden md:block w-36 text-xs">
        {isBooked ? <span className="text-orange-600 font-medium truncate block">{item.bookedTo}</span> : <StatusBadge status={item.status} />}
      </div>
      <div className="text-xs text-gray-500 hidden lg:block w-20 text-right">{item.unitPrice}</div>
      <button onClick={() => onEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Edit">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onToggleAdd(item.id)}
        disabled={!hasProject && !isInProject}
        title={!hasProject && !isInProject ? "Create or open a project first" : undefined}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isInProject ? "bg-emerald-100 text-emerald-700" : "border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
      >
        {isInProject ? "Added" : "Add"}
      </button>
    </div>
  )
}

function ProjectListRow({ item, onVote, onAddComment, onRemove, onAddToCanvas, onEdit, onDelete, currentUserId, scenes, characters }: { item: ProjectProp; onVote: (id: string, vote: VoteValue) => void; onAddComment: (id: string, text: string) => void; onRemove: (id: string) => void; onAddToCanvas: (item: ProjectProp) => void; onEdit: (item: ProjectProp) => void; onDelete: (id: string) => void; currentUserId: string | undefined; scenes?: Scene[]; characters?: Character[] }) {
  const userVote = item.votes.find((v) => v.userId === currentUserId)?.vote
  const yesCt = item.votes.filter((v) => v.vote === "yes").length
  const noCt = item.votes.filter((v) => v.vote === "no").length
  const maybeCt = item.votes.filter((v) => v.vote === "maybe").length

  return (
    <div className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          {isValidImageUrl(item.imageUrl) ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-5 h-5 text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500">{item.category} &middot; {item.brand}</span>
            {item.characterId && (() => {
              const char = characters?.find((c) => c.id === item.characterId)
              return char ? <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-medium"><User className="w-2.5 h-2.5" />{char.name}</span> : null
            })()}
            {item.sceneIds && item.sceneIds.length > 0 && (() => {
              const resolved = item.sceneIds.map((sid) => scenes?.find((s) => s.id === sid)).filter(Boolean) as Scene[]
              return resolved.slice(0, 2).map((sc) => (
                <span key={sc.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-[9px] font-medium"><Film className="w-2.5 h-2.5" />Sc {sc.sceneNumber}</span>
              ))
            })()}
            {item.sceneIds && item.sceneIds.length > 2 && <span className="text-[9px] text-gray-400">+{item.sceneIds.length - 2}</span>}
            {item.requiresArmorySupervision && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-bold" title="Requires Certified Armory Supervision">
                <ShieldAlert className="w-2.5 h-2.5" />
                Armory
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <VoteButton label="Yes" isActive={userVote === "yes"} count={yesCt} onClick={() => onVote(item.id, "yes")} />
          <VoteButton label="Maybe" isActive={userVote === "maybe"} count={maybeCt} onClick={() => onVote(item.id, "maybe")} />
          <VoteButton label="No" isActive={userVote === "no"} count={noCt} onClick={() => onVote(item.id, "no")} />
        </div>
        <button onClick={() => onEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onAddToCanvas(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Add to Canvas">
          <Layout className="w-4 h-4" />
        </button>
        <button onClick={() => onRemove(item.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="Remove from project">
          <X className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete item">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="ml-16 mt-1">
        <CommentSection comments={item.comments} onAddComment={(text) => onAddComment(item.id, text)} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

interface PropsModalProps {
  onClose: () => void
}

export default function PropsModal({ onClose }: PropsModalProps) {
  const { state, dispatch } = useCasting()
  /* Strictly bind to the active project from the project manager */
  const projectId = state.currentFocus.currentProjectId
  const currentProject = projectId
    ? state.projects.find((p) => p.id === projectId) ?? null
    : null

  /* ---- Scenes & Characters ---- */
  const scenes: Scene[] = state.scenes || []
  const characters: Character[] = currentProject?.characters || []

  /* Helper to find the cast actor for a character (mirroring CostumesModal pattern) */
  const getCastActorForCharacter = useCallback((character: Character): Actor | null => {
    const allActors: Actor[] = [
      ...((character.actors?.longList as Actor[]) || []),
      ...((character.actors?.audition as Actor[]) || []),
      ...((character.actors?.approval as Actor[]) || []),
      ...(character.actors?.shortLists?.flatMap((sl) => sl.actors) || []),
    ]
    const approved = (character.actors?.approval as Actor[]) || []
    if (approved.length > 0) return approved[0]
    if (allActors.length > 0) return allActors[0]
    return null
  }, [])

  const characterActorMap = useMemo(() => {
    return characters.map((ch) => ({ character: ch, castActor: getCastActorForCharacter(ch) }))
  }, [characters, getCastActorForCharacter])

  /* ---- Global inventory (persisted to project data store) ---- */
  const inventory: InventoryItem[] = currentProject?.propInventory || []
  const inventoryRef = useRef(inventory)
  inventoryRef.current = inventory

  const syncInventory = useCallback(
    (updater: (prev: InventoryItem[]) => InventoryItem[]) => {
      if (!projectId) return
      const next = updater(inventoryRef.current)
      dispatch({ type: "SET_PROJECT_PROP_INVENTORY", payload: { projectId, inventory: next } })
    },
    [projectId, dispatch],
  )

  /* Auto-seed mock data if project has no prop inventory yet, or if it lacks the armory field (stale seed) */
  const needsReseed = inventory.length === 0 || (inventory.length > 0 && !inventory.some((i) => "requiresArmorySupervision" in i))
  const hasSeeded = useRef(false)
  useEffect(() => {
    if (!hasSeeded.current && projectId && needsReseed) {
      hasSeeded.current = true
      const mockData = generateMockInventory(characters, scenes)
      dispatch({ type: "SET_PROJECT_PROP_INVENTORY", payload: { projectId, inventory: mockData } })
    }
  }, [projectId, needsReseed, dispatch, characters, scenes])

  /* ---- Project props (from context, persisted) ---- */
  const projectProps: ProjectProp[] = currentProject?.props || []

  /* Keep a ref to always have latest projectProps without stale closures */
  const projectPropsRef = useRef(projectProps)
  projectPropsRef.current = projectProps

  const syncProjectProps = useCallback(
    (updater: (prev: ProjectProp[]) => ProjectProp[]) => {
      if (!projectId) return
      const next = updater(projectPropsRef.current)
      dispatch({ type: "SET_PROJECT_PROPS", payload: { projectId, props: next } })
    },
    [projectId, dispatch],
  )

  /* ---- UI state ---- */
  type MainTab = "inventory" | "project" | "crossplot" | "purchase"
  const [mainTab, setMainTab] = useState<MainTab>("inventory")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "project">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [charFilter, setCharFilter] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null)
  const [editingProjectProp, setEditingProjectProp] = useState<ProjectProp | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteSource, setConfirmDeleteSource] = useState<"inventory" | "project">("inventory")
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)

  /* ---- Purchase / Design Requests ---- */
  const purchaseRequests: PropPurchaseRequest[] = currentProject?.propPurchaseRequests ?? []
  const syncPurchaseRequests = useCallback(
    (updater: (prev: PropPurchaseRequest[]) => PropPurchaseRequest[]) => {
      if (!projectId) return
      const next = updater(purchaseRequests)
      dispatch({ type: "SET_PROP_PURCHASE_REQUESTS", payload: { projectId, requests: next } })
    },
    [projectId, dispatch, purchaseRequests],
  )

  const currentUserId = state.currentUser?.id

  /* ---- Helpers: check if inventory item is in project ---- */
  const projectPropIds = useMemo(() => new Set(projectProps.map((p) => p.id)), [projectProps])

  /* ---- Filtered items ---- */
  const filteredInventory = useMemo(() => {
    let items = inventory
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (categoryFilter) items = items.filter((p) => p.category === categoryFilter)
    if (charFilter === "__unassigned__") items = items.filter((p) => !p.characterId)
    else if (charFilter) items = items.filter((p) => p.characterId === charFilter)
    return items
  }, [inventory, searchTerm, categoryFilter, charFilter])

  const filteredProjectProps = useMemo(() => {
    let items = projectProps
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (categoryFilter) items = items.filter((p) => p.category === categoryFilter)
    if (charFilter === "__unassigned__") items = items.filter((p) => !p.characterId)
    else if (charFilter) items = items.filter((p) => p.characterId === charFilter)
    return items
  }, [projectProps, searchTerm, categoryFilter, charFilter])

  const availableCategories = useMemo(() => {
    const cats = new Set(inventory.map((p) => p.category))
    return Array.from(cats).sort()
  }, [inventory])

  /* ---- Handlers ---- */
  const handleToggleAdd = (id: string) => {
    if (!projectId) return
    if (projectPropIds.has(id)) {
      syncProjectProps((prev) => prev.filter((p) => p.id !== id))
    } else {
      const inv = inventory.find((p) => p.id === id)
      if (!inv) return
      const newProp: ProjectProp = {
        ...inv,
        votes: [],
        comments: [],
        availability: inv.availability,
      }
      syncProjectProps((prev) => [...prev, newProp])
    }
  }

  const handleVote = (id: string, vote: VoteValue) => {
    if (!currentUserId) return
    syncProjectProps((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const existing = p.votes.findIndex((v) => v.userId === currentUserId)
        const newVotes = [...p.votes]
        if (existing >= 0) {
          if (newVotes[existing].vote === vote) newVotes.splice(existing, 1)
          else newVotes[existing] = { userId: currentUserId, vote }
        } else {
          newVotes.push({ userId: currentUserId, vote })
        }
        return { ...p, votes: newVotes }
      }),
    )
  }

  const handleAddComment = (propId: string, text: string) => {
    if (!state.currentUser) return
    const newComment: PropComment = {
      id: `c-${uid()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userInitials: state.currentUser.initials,
      text,
      timestamp: Date.now(),
    }
    syncProjectProps((prev) => prev.map((p) => (p.id === propId ? { ...p, comments: [...p.comments, newComment] } : p)))
  }

  const handleRemoveFromProject = (id: string) => {
    syncProjectProps((prev) => prev.filter((p) => p.id !== id))
  }

const handleAddToCanvas = (item: InventoryItem | ProjectProp) => {
  navigateToModal("canvas")
  }

  const handleAddInventoryItem = (item: InventoryItem) => {
    syncInventory((prev) => [item, ...prev])
  }

  const handleSaveInventoryEdit = (updated: InventoryItem | ProjectProp) => {
    syncInventory((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } as InventoryItem : p)))
    // Also update in project props if it exists there
    if (projectPropIds.has(updated.id)) {
      syncProjectProps((prev) => prev.map((p) => (p.id === updated.id ? { ...p, name: updated.name, model: updated.model, category: updated.category, brand: updated.brand, serialNumber: updated.serialNumber, skuBarcode: updated.skuBarcode, notes: updated.notes, imageUrl: updated.imageUrl, purchaseType: updated.purchaseType, unitPrice: updated.unitPrice, quantity: updated.quantity, status: updated.status, availability: updated.availability, sceneIds: updated.sceneIds, characterId: updated.characterId } : p)))
    }
    setEditingInventoryItem(null)
  }

  const handleSaveProjectPropEdit = (updated: InventoryItem | ProjectProp) => {
    syncProjectProps((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } as ProjectProp : p)))
    // Also update in inventory
    syncInventory((prev) => prev.map((p) => (p.id === updated.id ? { ...p, name: updated.name, model: updated.model, category: updated.category, brand: updated.brand, serialNumber: updated.serialNumber, skuBarcode: updated.skuBarcode, notes: updated.notes, imageUrl: updated.imageUrl, purchaseType: updated.purchaseType, unitPrice: updated.unitPrice, quantity: updated.quantity, status: updated.status, availability: updated.availability, sceneIds: updated.sceneIds, characterId: updated.characterId } as InventoryItem : p)))
    setEditingProjectProp(null)
  }

  const handleImageReplace = async (id: string, rawUrl: string) => {
    const url = await compressImage(rawUrl)
    syncInventory((prev) => prev.map((p) => (p.id === id ? { ...p, imageUrl: url } : p)))
    if (projectPropIds.has(id)) {
      syncProjectProps((prev) => prev.map((p) => (p.id === id ? { ...p, imageUrl: url } : p)))
    }
  }

  const handleRequestDeleteInventory = (id: string) => {
    setConfirmDeleteId(id)
    setConfirmDeleteSource("inventory")
  }

  const handleRequestDeleteProject = (id: string) => {
    setConfirmDeleteId(id)
    setConfirmDeleteSource("project")
  }

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return
    if (confirmDeleteSource === "inventory") {
      syncInventory((prev) => prev.filter((p) => p.id !== confirmDeleteId))
      // Also remove from project if present
      if (projectPropIds.has(confirmDeleteId)) {
        syncProjectProps((prev) => prev.filter((p) => p.id !== confirmDeleteId))
      }
    } else {
      syncProjectProps((prev) => prev.filter((p) => p.id !== confirmDeleteId))
    }
    setConfirmDeleteId(null)
  }

  const isProjectTab = activeTab === "project"

  const TABS: { key: MainTab; label: string; icon: React.ReactNode }[] = [
  { key: "inventory", label: "Inventory", icon: <Package className="w-4 h-4" /> },
  { key: "project", label: "Project Props", icon: <Palette className="w-4 h-4" /> },
  { key: "crossplot", label: "Cross-Plot", icon: <LayoutGrid className="w-4 h-4" /> },
  { key: "purchase", label: "Purchase/Design", icon: <ShoppingBag className="w-4 h-4" /> },
  ]

const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
  <div className="fixed inset-0 bg-gray-100 flex flex-col z-50 pl-14">
  {/* Slim Sidebar Strip / Expandable Drawer */}
  <FloatingSidebar
    isOpen={isSidebarOpen}
    onClose={() => setIsSidebarOpen(false)}
    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
    currentModal="props"
  />

  {/* ---- Header ---- */}
  <ModalHeader
    title="Props"
    titleColor="bg-amber-600"
    onClose={onClose}
  />

      {/* ---- Tab Bar ---- */}
      <div className="flex items-center gap-2 px-6 py-2 bg-white border-b border-gray-200 shrink-0 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setMainTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              mainTab === t.key
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "text-gray-600 hover:bg-gray-100 border border-transparent"
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === "project" && projectProps.length > 0 && (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{projectProps.length}</span>
            )}
            {t.key === "purchase" && purchaseRequests.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{purchaseRequests.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ---- Content Area ---- */}
      <div className="flex-1 overflow-hidden">
        {!projectId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No project selected</p>
            <p className="text-gray-400 text-xs mt-1">Create or open a project first to manage props</p>
          </div>
        ) : mainTab === "crossplot" ? (
          <PropsCrossPlotTab inventory={inventory} scenes={scenes} characters={characters} characterActorMap={characterActorMap} onEditProp={(item) => setEditingInventoryItem(item)} />
        ) : mainTab === "purchase" ? (
          <PropsPurchaseTab
            requests={purchaseRequests}
            characters={characters}
            scenes={scenes}
            onAdd={() => setShowPurchaseForm(true)}
            onUpdateStatus={(id, status) => syncPurchaseRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))}
            onDelete={(id) => syncPurchaseRequests((prev) => prev.filter((r) => r.id !== id))}
          />
        ) : (
          /* Inventory / Project tab with character panel */
          <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
              {/* Sub-tab toggle (inventory vs project) */}
              {mainTab === "inventory" && (
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setActiveTab("all")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>All Items</button>
                  <button onClick={() => setActiveTab("project")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${activeTab === "project" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    In Project
                    {projectProps.length > 0 && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{projectProps.length}</span>}
                  </button>
                </div>
              )}

              {/* View toggle */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`} title="Grid view">
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`} title="List view">
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[160px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search props..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-300 bg-white"
                />
              </div>

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-300"
              >
                <option value="">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Active filter badge */}
              {(categoryFilter || charFilter) && (
                <button
                  onClick={() => { setCategoryFilter(""); setCharFilter(null) }}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors"
                >
                  Clear filters
                  <X className="w-3 h-3" />
                </button>
              )}

              <button onClick={() => setShowAddModal(true)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shrink-0">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {/* Two-panel: Left = Characters, Right = Props */}
            <div className="flex-1 flex overflow-hidden">
              {/* Character panel */}
              <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Characters</h3>

                {/* "All" option */}
                <button
                  onClick={() => setCharFilter(null)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 transition-all text-left ${
                    charFilter === null
                      ? "bg-emerald-50 border-2 border-emerald-400 shadow-sm"
                      : "border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    charFilter === null ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${charFilter === null ? "text-emerald-800" : "text-gray-900"}`}>All Props</p>
                    <p className="text-[10px] text-gray-500">{inventory.length} items total</p>
                  </div>
                </button>

                {/* Unassigned */}
                {(() => {
                  const unassignedCount = inventory.filter((p) => !p.characterId).length
                  return (
                    <button
                      onClick={() => setCharFilter("__unassigned__")}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 transition-all text-left ${
                        charFilter === "__unassigned__"
                          ? "bg-gray-200 border-2 border-gray-400 shadow-sm"
                          : "border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        charFilter === "__unassigned__" ? "bg-gray-500 text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${charFilter === "__unassigned__" ? "text-gray-800" : "text-gray-700"}`}>Unassigned</p>
                        <p className="text-[10px] text-gray-500">{unassignedCount} items</p>
                      </div>
                    </button>
                  )
                })()}

                {characterActorMap.length === 0 ? (
                  <p className="text-xs text-gray-400 mt-2">No characters in this project</p>
                ) : (
                  <div className="space-y-1.5">
                    {characterActorMap.map(({ character, castActor }) => {
                      const isSelected = charFilter === character.id
                      const charPropCount = inventory.filter((p) => p.characterId === character.id).length
                      const charSceneCount = new Set(
                        inventory.filter((p) => p.characterId === character.id).flatMap((p) => p.sceneIds || [])
                      ).size
                      return (
                        <button
                          key={character.id}
                          onClick={() => setCharFilter(isSelected ? null : character.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                            isSelected
                              ? "bg-emerald-50 border-2 border-emerald-400 shadow-sm"
                              : "border border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
                          }`}
                        >
{isValidImageUrl(castActor?.headshots?.[0]) ? (
                      <img src={castActor.headshots[0]} alt="" className={`w-9 h-11 object-cover rounded-lg shrink-0 ${isSelected ? "ring-2 ring-emerald-300" : ""}`} />
                    ) : (
                      <div className={`w-9 h-11 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-emerald-100" : "bg-gray-100"}`}>
                        <User className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-gray-400"}`} />
                      </div>
                    )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${isSelected ? "text-emerald-800" : "text-gray-900"}`}>{character.name}</p>
                            {castActor ? (
                              <p className="text-[10px] text-gray-500 truncate">{castActor.name}</p>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Not yet cast
                              </span>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-gray-400">{charPropCount} props</span>
                              <span className="text-[9px] text-gray-300">&middot;</span>
                              <span className="text-[9px] text-gray-400">{charSceneCount} scenes</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Props content area */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Active character filter banner */}
                {charFilter && charFilter !== "__unassigned__" && (() => {
                  const pair = characterActorMap.find(({ character }) => character.id === charFilter)
                  return pair ? (
                    <div className="flex items-center gap-2 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                      {isValidImageUrl(pair.castActor?.headshots?.[0]) ? (
                        <img src={pair.castActor.headshots[0]} alt="" className="w-6 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-6 h-8 rounded bg-emerald-200 flex items-center justify-center"><User className="w-3 h-3 text-emerald-400" /></div>
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-emerald-800">
                          Showing props for {pair.character.name}
                          {pair.castActor ? ` (${pair.castActor.name})` : ""}
                        </p>
                        <p className="text-[10px] text-emerald-600">
                          {(mainTab === "project" ? filteredProjectProps : filteredInventory).length} items
                        </p>
                      </div>
                      <button onClick={() => setCharFilter(null)} className="p-1 text-emerald-400 hover:text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null
                })()}

                {/* Result count */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">
                      {(mainTab === "project" || (mainTab === "inventory" && isProjectTab) ? filteredProjectProps : filteredInventory).length}
                    </span>{" "}
                    item{(mainTab === "project" || (mainTab === "inventory" && isProjectTab) ? filteredProjectProps : filteredInventory).length !== 1 ? "s" : ""}
                    {charFilter && charFilter !== "__unassigned__" ? " for this character" : ""}
                  </p>
                </div>

                {mainTab === "project" ? (
                  /* ---- Project Props ---- */
                  filteredProjectProps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <Package className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm font-medium">No props in project{charFilter ? " for this character" : ""}</p>
                      <p className="text-gray-400 text-xs mt-1">Browse the Inventory tab and add props to your project</p>
                      <button onClick={() => setMainTab("inventory")} className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                        Browse Inventory
                      </button>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {filteredProjectProps.map((item) => (
                        <ProjectPropCard key={item.id} item={item} onVote={handleVote} onAddComment={handleAddComment} onRemove={handleRemoveFromProject} onAddToCanvas={handleAddToCanvas} onEdit={(i) => setEditingProjectProp(i)} onDelete={handleRequestDeleteProject} currentUserId={currentUserId} scenes={scenes} characters={characters} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {filteredProjectProps.map((item) => (
                        <ProjectListRow key={item.id} item={item} onVote={handleVote} onAddComment={handleAddComment} onRemove={handleRemoveFromProject} onAddToCanvas={handleAddToCanvas} onEdit={(i) => setEditingProjectProp(i)} onDelete={handleRequestDeleteProject} currentUserId={currentUserId} scenes={scenes} characters={characters} />
                      ))}
                    </div>
                  )
                ) : (
                  /* ---- Inventory tab content ---- */
                  (() => {
                    const items = isProjectTab ? filteredProjectProps : filteredInventory
                    return items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Package className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm font-medium">{charFilter ? "No props for this character" : "No props found"}</p>
                        <p className="text-gray-400 text-xs mt-1">{charFilter ? "Assign props to this character via Edit" : "Try adjusting your search or filters"}</p>
                        {!charFilter && (
                          <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">Add First Item</button>
                        )}
                      </div>
                    ) : viewMode === "grid" ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {(isProjectTab ? filteredProjectProps.map((pp) => inventory.find((i) => i.id === pp.id) || pp as unknown as InventoryItem) : filteredInventory).map((item) => (
                          <InventoryCard key={item.id} item={item} isInProject={projectPropIds.has(item.id)} onToggleAdd={handleToggleAdd} onEdit={(i) => setEditingInventoryItem(i)} onImageReplace={handleImageReplace} onDelete={handleRequestDeleteInventory} onAddToCanvas={handleAddToCanvas} hasProject={!!projectId} onVote={handleVote} onAddComment={handleAddComment} currentUserId={currentUserId} votes={projectProps.find((p) => p.id === item.id)?.votes} comments={projectProps.find((p) => p.id === item.id)?.comments} scenes={scenes} characters={characters} />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {(isProjectTab ? filteredProjectProps.map((pp) => inventory.find((i) => i.id === pp.id) || pp as unknown as InventoryItem) : filteredInventory).map((item) => (
                          <InventoryListRow key={item.id} item={item} isInProject={projectPropIds.has(item.id)} onToggleAdd={handleToggleAdd} onEdit={(i) => setEditingInventoryItem(i)} onDelete={handleRequestDeleteInventory} hasProject={!!projectId} scenes={scenes} characters={characters} />
                        ))}
                      </div>
                    )
                  })()
                )}
              </div>
            </div>
          </div>
        )}
      </div>

{/* Embedded CoPilot - Fixed position in lower right corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <EmbeddedCoPilot context="props" />
      </div>

  {/* Sub-modals */}
  {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onAdd={handleAddInventoryItem} scenes={scenes} characters={characters} characterActorMap={characterActorMap} />}
      {editingInventoryItem && <EditItemModal item={editingInventoryItem} onClose={() => setEditingInventoryItem(null)} onSave={handleSaveInventoryEdit} scenes={scenes} characters={characters} characterActorMap={characterActorMap} />}
      {editingProjectProp && <EditItemModal item={editingProjectProp} onClose={() => setEditingProjectProp(null)} onSave={handleSaveProjectPropEdit} scenes={scenes} characters={characters} characterActorMap={characterActorMap} />}

      {showPurchaseForm && (
        <PropsPurchaseFormModal
          characters={characters}
          scenes={scenes}
          onClose={() => setShowPurchaseForm(false)}
          onSave={(item) => {
            syncPurchaseRequests((prev) => [...prev, { ...item, id: `ppr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }])
            setShowPurchaseForm(false)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">Delete Item</h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                Are you sure you want to delete this prop? This action cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="w-px bg-gray-200" />
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  CROSS-PLOT TAB                                                     */
/* ================================================================== */

function PropsCrossPlotTab({
  inventory,
  scenes,
  characters,
  characterActorMap,
  onEditProp,
}: {
  inventory: InventoryItem[]
  scenes: Scene[]
  characters: Character[]
  characterActorMap: { character: Character; castActor: Actor | null }[]
  onEditProp?: (item: InventoryItem) => void
}) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [expandedCell, setExpandedCell] = useState<string | null>(null)

  const displayChars = selectedCharacterId ? characters.filter((c) => c.id === selectedCharacterId) : characters
  const sortedScenes = useMemo(
    () =>
      [...scenes].sort((a, b) => {
        const numA = parseInt(a.sceneNumber.replace(/\D/g, ""), 10) || 0
        const numB = parseInt(b.sceneNumber.replace(/\D/g, ""), 10) || 0
        return numA - numB
      }),
    [scenes],
  )

  /* Also include "Unassigned" column for props with scene IDs but no character */
  const hasUnassigned = useMemo(
    () => inventory.some((p) => !p.characterId && p.sceneIds && p.sceneIds.length > 0),
    [inventory],
  )

  /* Build matrix: scene -> character -> props[] */
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, InventoryItem[]>> = {}
    for (const sc of sortedScenes) {
      m[sc.id] = {}
      for (const ch of displayChars) {
        m[sc.id][ch.id] = inventory.filter(
          (p) => p.characterId === ch.id && p.sceneIds?.includes(sc.id),
        )
      }
      if (hasUnassigned && !selectedCharacterId) {
        m[sc.id]["__unassigned__"] = inventory.filter(
          (p) => !p.characterId && p.sceneIds?.includes(sc.id),
        )
      }
    }
    return m
  }, [sortedScenes, displayChars, inventory, hasUnassigned, selectedCharacterId])

  /* Detect continuity issues: same character has different props between consecutive scenes */
  const continuityFlags = useMemo(() => {
    const flags = new Set<string>()
    const checkCols = [...displayChars.map((c) => c.id)]
    if (hasUnassigned && !selectedCharacterId) checkCols.push("__unassigned__")
    for (let i = 1; i < sortedScenes.length; i++) {
      for (const colId of checkCols) {
        const prev = matrix[sortedScenes[i - 1].id]?.[colId] || []
        const curr = matrix[sortedScenes[i].id]?.[colId] || []
        if (prev.length === 0 || curr.length === 0) continue
        const prevIds = new Set(prev.map((p) => p.id))
        const currIds = new Set(curr.map((p) => p.id))
        const added = curr.filter((p) => !prevIds.has(p.id))
        const removed = prev.filter((p) => !currIds.has(p.id))
        if (added.length > 0 || removed.length > 0) {
          flags.add(`${sortedScenes[i].id}-${colId}`)
        }
      }
    }
    return flags
  }, [sortedScenes, displayChars, matrix, hasUnassigned, selectedCharacterId])

  /* Scene-level prop summary */
  const scenePropCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sc of sortedScenes) {
      counts[sc.id] = inventory.filter((p) => p.sceneIds?.includes(sc.id)).length
    }
    return counts
  }, [sortedScenes, inventory])

  if (sortedScenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <LayoutGrid className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm font-medium">No scene data yet</p>
        <p className="text-gray-400 text-xs mt-1">Assign scenes to props in the Inventory tab to populate the cross-plot</p>
      </div>
    )
  }

  /* Column IDs for rendering */
  const colDefs: { id: string; name: string; actor?: string }[] = displayChars.map((ch) => {
    const pair = characterActorMap.find((c) => c.character.id === ch.id)
    return { id: ch.id, name: ch.name, actor: pair?.castActor?.name }
  })
  if (hasUnassigned && !selectedCharacterId) {
    colDefs.push({ id: "__unassigned__", name: "Unassigned" })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <span className="text-xs font-medium text-gray-500">Filter:</span>
        <select
          value={selectedCharacterId ?? ""}
          onChange={(e) => setSelectedCharacterId(e.target.value || null)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-300"
        >
          <option value="">All Characters</option>
          {characters.map((ch) => (
            <option key={ch.id} value={ch.id}>{ch.name}</option>
          ))}
        </select>

        {/* Summary stats */}
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[10px] text-gray-400">{sortedScenes.length} scenes &middot; {colDefs.length} columns</span>
          {continuityFlags.size > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {continuityFlags.size} continuity issue{continuityFlags.size !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Cross-plot table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max p-6">
          <table className="border-collapse w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 min-w-[140px] text-left">
                  Scene
                </th>
                {colDefs.map((col) => (
                  <th key={col.id} className="px-4 py-3 border-b border-gray-200 min-w-[180px] bg-gray-50 text-left">
                    <p className="text-xs font-semibold text-gray-900">{col.name}</p>
                    {col.actor && <p className="text-[10px] text-gray-500 font-normal">{col.actor}</p>}
                    {col.id === "__unassigned__" && <p className="text-[10px] text-gray-400 font-normal">No character</p>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedScenes.map((scene, sceneIdx) => (
                <tr key={scene.id} className="group hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-4 py-2.5 text-xs border-b border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shrink-0">
                        {scene.sceneNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-500 truncate">{scene.intExt}. {scene.location}</div>
                        <div className="text-[9px] text-gray-400">{scene.dayNight} &middot; {scenePropCounts[scene.id]} prop{scenePropCounts[scene.id] !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                  </td>
                  {colDefs.map((col) => {
                    const props = matrix[scene.id]?.[col.id] || []
                    const isFlag = continuityFlags.has(`${scene.id}-${col.id}`)
                    const cellKey = `${scene.id}-${col.id}`
                    const isExpanded = expandedCell === cellKey
                    return (
                      <td key={col.id} className={`px-3 py-2 border-b border-gray-200 align-top transition-colors ${isFlag ? "bg-amber-50/70" : ""}`}>
                        {props.length > 0 ? (
                          <div className="space-y-1">
                            {(isExpanded ? props : props.slice(0, 2)).map((p) => (
                              <div
                                key={p.id}
                                onClick={() => onEditProp?.(p)}
                                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs cursor-pointer transition-all hover:shadow-sm ${
                                  isFlag
                                    ? "border-2 border-amber-300 bg-amber-100/80 hover:bg-amber-100"
                                    : "bg-emerald-50 border border-emerald-200 hover:border-emerald-300"
                                }`}
                              >
                                {isValidImageUrl(p.imageUrl) ? (
                                  <img src={p.imageUrl} alt="" className="w-7 h-7 rounded-md object-cover shrink-0" />
                                ) : (
                                  <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0"><Package className="w-3.5 h-3.5 text-gray-300" /></div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900 truncate text-[11px]">{p.name}</p>
                                  <p className="text-gray-500 text-[9px]">{p.category}</p>
                                </div>
                                <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>
                            ))}
                            {props.length > 2 && !isExpanded && (
                              <button onClick={() => setExpandedCell(cellKey)} className="text-[9px] font-medium text-emerald-600 hover:text-emerald-700 px-1">
                                +{props.length - 2} more
                              </button>
                            )}
                            {isExpanded && props.length > 2 && (
                              <button onClick={() => setExpandedCell(null)} className="text-[9px] font-medium text-gray-400 hover:text-gray-600 px-1">
                                Show less
                              </button>
                            )}
                            {isFlag && (
                              <span className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] font-bold text-amber-700">
                                <AlertTriangle className="w-3 h-3" /> Prop Change
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-200 text-xs select-none">&mdash;</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  PURCHASE / DESIGN TAB                                              */
/* ================================================================== */

const PURCHASE_STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  requested: { bg: "bg-gray-100", text: "text-gray-700", label: "Requested" },
  approved: { bg: "bg-blue-100", text: "text-blue-700", label: "Approved" },
  ordered: { bg: "bg-amber-100", text: "text-amber-700", label: "Ordered" },
  received: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Received" },
  "in-design": { bg: "bg-purple-100", text: "text-purple-700", label: "In Design" },
  "design-complete": { bg: "bg-teal-100", text: "text-teal-700", label: "Design Complete" },
}

const REQUEST_TYPE_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  purchase: { bg: "bg-emerald-50", text: "text-emerald-700", icon: <ShoppingBag className="w-3 h-3" /> },
  design: { bg: "bg-purple-50", text: "text-purple-700", icon: <Palette className="w-3 h-3" /> },
  fabrication: { bg: "bg-amber-50", text: "text-amber-700", icon: <Wrench className="w-3 h-3" /> },
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-gray-100", text: "text-gray-600" },
  medium: { bg: "bg-blue-100", text: "text-blue-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  urgent: { bg: "bg-red-100", text: "text-red-700" },
}

function PropsPurchaseTab({
  requests,
  characters,
  scenes,
  onAdd,
  onUpdateStatus,
  onDelete,
}: {
  requests: PropPurchaseRequest[]
  characters: Character[]
  scenes: Scene[]
  onAdd: () => void
  onUpdateStatus: (id: string, status: PropPurchaseRequest["status"]) => void
  onDelete: (id: string) => void
}) {
  const [filterType, setFilterType] = useState<"all" | "purchase" | "design" | "fabrication">("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filtered = useMemo(() => {
    let items = requests
    if (filterType !== "all") items = items.filter((r) => r.requestType === filterType)
    if (filterStatus !== "all") items = items.filter((r) => r.status === filterStatus)
    return items
  }, [requests, filterType, filterStatus])

  const grouped: Record<string, PropPurchaseRequest[]> = {}
  for (const item of filtered) {
    const key = item.requestType
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }

  const totalEstimate = requests.reduce((sum, r) => sum + (parseFloat(r.estimatedPrice.replace(/[^0-9.]/g, "")) || 0), 0)
  const pendingCount = requests.filter((r) => r.status === "requested" || r.status === "approved").length
  const urgentCount = requests.filter((r) => r.priority === "urgent" || r.priority === "high").length

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Purchase & Design Requests</p>
          <p className="text-xs text-gray-500">
            {requests.length} request{requests.length !== 1 ? "s" : ""}
            {totalEstimate > 0 && <span className="mx-1">{"\u2022"}</span>}
            {totalEstimate > 0 && <span>Est. total: ${totalEstimate.toFixed(2)}</span>}
            {pendingCount > 0 && <span className="mx-1">{"\u2022"}</span>}
            {pendingCount > 0 && <span className="text-amber-600 font-medium">{pendingCount} pending</span>}
          </p>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-300"
        >
          <option value="all">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="design">Design</option>
          <option value="fabrication">Fabrication</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-300"
        >
          <option value="all">All Statuses</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="ordered">Ordered</option>
          <option value="received">Received</option>
          <option value="in-design">In Design</option>
          <option value="design-complete">Design Complete</option>
        </select>

        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No purchase or design requests yet</p>
            <p className="text-gray-400 text-xs mt-1 max-w-xs">
              Add requests for props that need to be purchased, custom designed, or fabricated for the production
            </p>
            <button
              onClick={onAdd}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create First Request
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Search className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No requests match your filters</p>
            <button
              onClick={() => { setFilterType("all"); setFilterStatus("all") }}
              className="mt-2 text-emerald-600 text-xs font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {urgentCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  {urgentCount} high-priority or urgent request{urgentCount !== 1 ? "s" : ""} need attention
                </span>
              </div>
            )}

            {(["purchase", "design", "fabrication"] as const).map((type) => {
              const items = grouped[type]
              if (!items || items.length === 0) return null
              const typeInfo = REQUEST_TYPE_COLORS[type]
              const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
              const typeTotal = items.reduce(
                (sum, r) => sum + (parseFloat(r.estimatedPrice.replace(/[^0-9.]/g, "")) || 0),
                0,
              )

              return (
                <div key={type} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${typeInfo.bg} ${typeInfo.text}`}>
                        {typeInfo.icon}
                        {typeLabel}
                      </span>
                      <span className="text-xs text-gray-500">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {typeTotal > 0 && (
                      <span className="text-xs font-medium text-gray-600">Est. ${typeTotal.toFixed(2)}</span>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const ch = characters.find((c) => c.id === item.characterId)
                      const s = PURCHASE_STATUS_COLORS[item.status] ?? PURCHASE_STATUS_COLORS.requested
                      const p = PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.medium
                      const itemScenes =
                        item.sceneIds
                          ?.map((sid) => scenes.find((sc) => sc.id === sid))
                          .filter(Boolean) || []

                      return (
                        <div
                          key={item.id}
                          className="px-5 py-3.5 flex items-start gap-3 group hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900">{item.description}</p>
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${p.bg} ${p.text}`}
                              >
                                {item.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                              {item.quantity > 1 && <span>Qty: {item.quantity}</span>}
                              {item.estimatedPrice && <span>{item.estimatedPrice}</span>}
                              {item.vendor && <span>{item.vendor}</span>}
                              {ch && (
                                <span className="inline-flex items-center gap-0.5">
                                  <User className="w-3 h-3" /> {ch.name}
                                </span>
                              )}
                              <span className="text-gray-400">by {item.requestedBy}</span>
                            </div>
                            {item.designNotes && (
                              <p className="text-[10px] text-gray-500 italic mt-1 line-clamp-2">
                                {item.designNotes}
                              </p>
                            )}
                            {itemScenes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {itemScenes.slice(0, 4).map((sc: any) => (
                                  <span
                                    key={sc.id}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-medium"
                                  >
                                    <Film className="w-2.5 h-2.5" /> Sc {sc.sceneNumber}
                                  </span>
                                ))}
                                {itemScenes.length > 4 && (
                                  <span className="text-[9px] text-gray-400">
                                    +{itemScenes.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                            {item.requiresArmorySupervision && (
                              <span className="inline-flex items-center gap-0.5 mt-1.5 px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-bold" title="Requires Certified Armory Supervision">
                                <ShieldAlert className="w-2.5 h-2.5" />
                                Armory Supervision Required
                              </span>
                            )}
                          </div>

                          <select
                            value={item.status}
                            onChange={(e) =>
                              onUpdateStatus(item.id, e.target.value as PropPurchaseRequest["status"])
                            }
                            className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer shrink-0 ${s.bg} ${s.text}`}
                          >
                            <option value="requested">Requested</option>
                            <option value="approved">Approved</option>
                            <option value="ordered">Ordered</option>
                            <option value="received">Received</option>
                            <option value="in-design">In Design</option>
                            <option value="design-complete">Design Complete</option>
                          </select>

                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  PURCHASE / DESIGN FORM MODAL                                       */
/* ================================================================== */

function PropsPurchaseFormModal({
  characters,
  scenes,
  onClose,
  onSave,
}: {
  characters: Character[]
  scenes: Scene[]
  onClose: () => void
  onSave: (item: Omit<PropPurchaseRequest, "id">) => void
}) {
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [vendor, setVendor] = useState("")
  const [price, setPrice] = useState("")
  const [designNotes, setDesignNotes] = useState("")
  const [requestType, setRequestType] = useState<PropPurchaseRequest["requestType"]>("purchase")
  const [priority, setPriority] = useState<PropPurchaseRequest["priority"]>("medium")
  const [charId, setCharId] = useState("")
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([])
  const [requiresArmorySupervision, setRequiresArmorySupervision] = useState(false)

  const sortedScenes = useMemo(
    () =>
      [...scenes].sort((a, b) => {
        const numA = parseInt(a.sceneNumber.replace(/\D/g, ""), 10) || 0
        const numB = parseInt(b.sceneNumber.replace(/\D/g, ""), 10) || 0
        return numA - numB
      }),
    [scenes],
  )

  const handleSubmit = () => {
    if (!description.trim()) return
    onSave({
      description: description.trim(),
      quantity: parseInt(quantity, 10) || 1,
      vendor: vendor.trim(),
      estimatedPrice: price.trim(),
      designNotes: designNotes.trim(),
      status: "requested",
      requestType,
      requestedBy: "Current User",
      priority,
      characterId: charId || undefined,
      sceneIds: selectedSceneIds.length > 0 ? selectedSceneIds : undefined,
      requiresArmorySupervision,
    })
  }

  const toggleScene = (id: string) => {
    setSelectedSceneIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">New Purchase/Design Request</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Request Type */}
            <div>
              <label className="text-[10px] text-gray-500 font-medium mb-1.5 block">
                Request Type
              </label>
              <div className="flex gap-2">
                {(["purchase", "design", "fabrication"] as const).map((t) => {
                  const info = REQUEST_TYPE_COLORS[t]
                  const label = t.charAt(0).toUpperCase() + t.slice(1)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRequestType(t)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        requestType === t
                          ? `${info.bg} ${info.text} border-current`
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {info.icon}
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            <div className="relative">
              <label className="absolute left-3 top-1.5 text-[10px] text-gray-500 pointer-events-none">
                Description *
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pt-5 pb-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
              />
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="absolute left-3 top-1.5 text-[10px] text-gray-500 pointer-events-none">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full pt-5 pb-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
                />
              </div>
              <div className="relative">
                <label className="absolute left-3 top-1.5 text-[10px] text-gray-500 pointer-events-none">
                  Estimated Price
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="$0.00"
                  className="w-full pt-5 pb-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
                />
              </div>
            </div>

            {/* Vendor */}
            <div className="relative">
              <label className="absolute left-3 top-1.5 text-[10px] text-gray-500 pointer-events-none">
                Vendor / Supplier
              </label>
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full pt-5 pb-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] text-gray-500 font-medium mb-1.5 block">Priority</label>
              <div className="flex gap-2">
                {(["low", "medium", "high", "urgent"] as const).map((p) => {
                  const info = PRIORITY_COLORS[p]
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                        priority === p
                          ? `${info.bg} ${info.text} border-current`
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Character */}
            <div className="relative">
              <label className="absolute left-3 top-1.5 text-[10px] text-gray-500 pointer-events-none z-[1]">
                For Character (optional)
              </label>
              <select
                value={charId}
                onChange={(e) => setCharId(e.target.value)}
                className="w-full pt-5 pb-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300 appearance-none cursor-pointer"
              >
                <option value="">None</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Scene Selection */}
            {sortedScenes.length > 0 && (
              <div>
                <label className="text-[10px] text-gray-500 font-medium mb-1.5 block">
                  Scene Associations (optional)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-2 bg-white rounded-xl border border-gray-200">
                  {sortedScenes.map((sc) => {
                    const isSelected = selectedSceneIds.includes(sc.id)
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => toggleScene(sc.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <Film className="w-3 h-3" />
                        Sc {sc.sceneNumber}
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Armory Supervision */}
            <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${requiresArmorySupervision ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
              <button
                type="button"
                onClick={() => setRequiresArmorySupervision(!requiresArmorySupervision)}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${requiresArmorySupervision ? "bg-red-600 border-red-600" : "border-gray-300 hover:border-gray-400"}`}
              >
                {requiresArmorySupervision && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-4 h-4 shrink-0 ${requiresArmorySupervision ? "text-red-600" : "text-gray-400"}`} />
                  <span className={`text-xs font-semibold ${requiresArmorySupervision ? "text-red-800" : "text-gray-900"}`}>Requires Certified Armory Supervision</span>
                </div>
                <p className={`text-[10px] mt-0.5 ${requiresArmorySupervision ? "text-red-600" : "text-gray-500"}`}>
                  Weapon, replica firearm, or dangerous prop requiring a certified armorer on set.
                </p>
              </div>
            </div>

            {/* Design Notes */}
            <div>
              <label className="text-[10px] text-gray-500 font-medium mb-1.5 block">
                Design Notes
              </label>
              <textarea
                value={designNotes}
                onChange={(e) => setDesignNotes(e.target.value)}
                placeholder="Dimensions, materials, references, aging instructions..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-300 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors"
          >
            Add Request
          </button>
        </div>
      </div>
    </div>
  )
}
