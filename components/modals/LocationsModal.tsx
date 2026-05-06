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
  SlidersHorizontal,
  ChevronDown,
  Check,
  MapPin,
  Upload,
  Trash2,
  Pencil,
  Map as MapIcon,
  Building2,
  TreePine,
  Camera,
  Tag,
  Calendar,
  Clock,
  AlertTriangle,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Volume2,
  Truck,
  Zap,
  Ruler,
  Users,
  Phone,
  Mail,
  Link,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Thermometer,
  Droplets,
  Film,
  Layers,
  Layout,
  CheckCircle,
  XCircle,
  HelpCircle,
  MessageSquare,
  Send,
  Home,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal, navigateToModal } from "./ModalManager"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import EmbeddedCoPilot from "@/components/copilot/EmbeddedCoPilot"
import { compressImage } from "@/utils/imageCompression"
import type {
  ProjectLocation,
  LocationType,
  LocationStatus,
  LocationMediaItem,
  LocationContact,
  LocationScheduleBlock,
  LocationBlackoutDate,
  LocationSceneTag,
  PropVote,
  PropComment,
} from "@/types/casting"

type VoteValue = "yes" | "no" | "maybe"

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LOCATION_STATUSES: { value: LocationStatus; label: string; color: string }[] = [
  { value: "scouted", label: "Scouted", color: "bg-blue-100 text-blue-700" },
  { value: "pending-approval", label: "Pending Approval", color: "bg-amber-100 text-amber-700" },
  { value: "secured", label: "Secured / Permitted", color: "bg-emerald-100 text-emerald-700" },
  { value: "burned", label: "Burned / Unavailable", color: "bg-red-100 text-red-700" },
]

const VIBE_TAG_OPTIONS = ["Gritty", "Modern", "Dystopian", "Posh", "1980s", "Industrial", "Rustic", "Gothic", "Futuristic", "Suburban", "Tropical", "Noir", "Vintage", "Minimalist", "Spooky", "Forest", "Urban", "Coastal"]

const LOAD_IN_OPTIONS = ["Ground floor", "Stairs only", "Freight elevator"]
const FLOOR_TYPE_OPTIONS = ["Concrete", "Wood", "Paintable", "Epoxy", "Sprung"]
const SOUND_RATING_OPTIONS = ["Soundproof", "Semi-soundproof", "Warehouse shell"]

/* Mock weather data per location */
const MOCK_WEATHER: Record<string, { temp: string; condition: "sunny" | "cloudy" | "rainy" | "windy"; humidity: string }> = {
  loc1: { temp: "72F", condition: "sunny", humidity: "45%" },
  loc2: { temp: "68F", condition: "cloudy", humidity: "58%" },
  loc3: { temp: "65F", condition: "sunny", humidity: "40%" },
  loc4: { temp: "70F", condition: "windy", humidity: "52%" },
  loc5: { temp: "58F", condition: "rainy", humidity: "78%" },
  loc6: { temp: "66F", condition: "sunny", humidity: "42%" },
}

function getWeather(id: string) {
  return MOCK_WEATHER[id] || { temp: `${Math.floor(60 + Math.random() * 20)}F`, condition: "sunny" as const, humidity: `${Math.floor(35 + Math.random() * 40)}%` }
}

function WeatherIcon({ condition }: { condition: string }) {
  switch (condition) {
    case "sunny": return <Sun className="w-3.5 h-3.5 text-amber-500" />
    case "cloudy": return <Cloud className="w-3.5 h-3.5 text-gray-400" />
    case "rainy": return <CloudRain className="w-3.5 h-3.5 text-blue-400" />
    case "windy": return <Wind className="w-3.5 h-3.5 text-sky-400" />
    default: return <Sun className="w-3.5 h-3.5 text-amber-500" />
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function generateLocationCode(existing: ProjectLocation[]): string {
  const num = existing.length + 1
  return `LOC-${String(num).padStart(3, "0")}`
}

const OFFICE_LAT = 34.0522
const OFFICE_LNG = -118.2437
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function parseGoogleMapsLink(link: string): { lat: number; lng: number; address: string } | null {
  const atMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), address: `${parseFloat(atMatch[1]).toFixed(4)}, ${parseFloat(atMatch[2]).toFixed(4)}` }
  const placeMatch = link.match(/\/place\/([^/@]+)/)
  if (placeMatch) {
    const name = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ")
    return { lat: OFFICE_LAT + (Math.random() - 0.5) * 0.1, lng: OFFICE_LNG + (Math.random() - 0.5) * 0.1, address: name }
  }
  const qMatch = link.match(/[?&]q=([^&]+)/)
  if (qMatch) {
    const coords = decodeURIComponent(qMatch[1]).split(",")
    if (coords.length === 2 && !isNaN(parseFloat(coords[0]))) return { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]), address: `${coords[0]}, ${coords[1]}` }
    return { lat: OFFICE_LAT + (Math.random() - 0.5) * 0.1, lng: OFFICE_LNG + (Math.random() - 0.5) * 0.1, address: decodeURIComponent(qMatch[1]) }
  }
  return null
}

/* ------------------------------------------------------------------ */
/*  Mock inventory                                                     */
/* ------------------------------------------------------------------ */

function generateMockLocations(): ProjectLocation[] {
  return [
    {
      id: "loc1", code: "LOC-001", name: "Hero House", locationType: "on-location", status: "secured",
      lat: 34.0622, lng: -118.3537, address: "742 Evergreen Terrace, Los Angeles, CA",
      vibeTags: ["Suburban", "1980s", "Vintage"],
      media: [
        { id: "m1a", url: "", type: "photo" as const, caption: "Front exterior" },
        { id: "m1b", url: "", type: "photo" as const, caption: "Kitchen" },
        { id: "m1c", url: "", type: "photo" as const, caption: "Living room" },
        { id: "m1d", url: "", type: "photo" as const, caption: "Backyard" },
      ],
      notes: "Perfect mid-century home. Owner very cooperative.", dailyRate: "$3,500", overtimeRate: "$500/hr", securityDeposit: "$5,000",
      basecampParking: "Cul-de-sac, room for 4 trucks", crewParkingCapacity: 8, cateringArea: "Backyard patio",
      sunPathNotes: "Great morning light through east windows", noiseProfile: "Quiet residential",
      loadInDifficulty: "Ground floor", bathroomCount: 3, greenRoomCapability: "Master bedroom",
      makeupAreaSuitability: "Guest bathroom has great lighting",
      contacts: [{ id: "c1", role: "Owner", name: "Margaret Chen", phone: "(310) 555-0142", email: "mchen@email.com" }],
      sceneTags: [{ sceneNumber: "21", sceneTitle: "Family Dinner" }, { sceneNumber: "24" }, { sceneNumber: "55", sceneTitle: "Flashback" }],
      scheduleBlocks: [{ id: "sb1", type: "prep", startDate: "2026-03-10", endDate: "2026-03-11", notes: "Art dept" }, { id: "sb2", type: "shoot", startDate: "2026-03-12", endDate: "2026-03-14" }],
      blackoutDates: [{ id: "bd1", date: "2026-03-20", reason: "Owner holiday" }],
      bookedTo: null,
    },
    {
      id: "loc2", code: "LOC-002", name: "Neon Alley", locationType: "on-location", status: "scouted",
      lat: 34.0400, lng: -118.2500, address: "Downtown Arts District, Los Angeles, CA",
      vibeTags: ["Gritty", "Noir", "Urban", "Dystopian"],
      media: [
        { id: "m2a", url: "", type: "photo" as const, caption: "Neon signs at night" },
        { id: "m2b", url: "", type: "photo" as const, caption: "Alley view" },
        { id: "m2c", url: "", type: "photo" as const, caption: "Side entrance" },
      ],
      notes: "Amazing neon signage at night. Permission needed from 3 businesses.", dailyRate: "$2,000", overtimeRate: "$300/hr", securityDeposit: "$1,500",
      basecampParking: "Public lot 2 blocks away", crewParkingCapacity: 4, noiseProfile: "Urban noise",
      loadInDifficulty: "Ground floor",
      contacts: [{ id: "c2", role: "Site Rep", name: "Danny Vega", phone: "(213) 555-0199", email: "dvega@artsdistrict.com" }],
      sceneTags: [{ sceneNumber: "7", sceneTitle: "Chase Scene" }],
      scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    },
    {
      id: "loc3", code: "LOC-003", name: "Studio A - Raleigh", locationType: "studio", status: "secured",
      lat: 34.0800, lng: -118.3700, address: "Raleigh Studios, 5300 Melrose Ave, Los Angeles, CA",
      vibeTags: ["Modern", "Minimalist"],
      media: [
        { id: "m3a", url: "", type: "photo" as const, caption: "Stage floor" },
        { id: "m3b", url: "", type: "photo" as const, caption: "Grid rigging" },
      ],
      notes: "Stage 12. Full soundstage.", dailyRate: "$8,500", overtimeRate: "$1,200/hr", securityDeposit: "$15,000",
      dimensionsL: 120, dimensionsW: 80, dimensionsH: 35, gridHeight: 30, floorType: "Concrete",
      amperage: "3-Phase, 400 Amps", camlockAvailable: true, soundRating: "Soundproof",
      workshopAccess: true, millSpace: true, paintShopProximity: "On-lot, Building 4",
      sceneTags: [{ sceneNumber: "1", sceneTitle: "Opening" }, { sceneNumber: "30", sceneTitle: "Climax" }],
      scheduleBlocks: [{ id: "sb4", type: "prep", startDate: "2026-03-01", endDate: "2026-03-05" }, { id: "sb5", type: "shoot", startDate: "2026-03-06", endDate: "2026-03-20" }],
      blackoutDates: [], bookedTo: null,
    },
    {
      id: "loc4", code: "LOC-004", name: "Abandoned Warehouse", locationType: "on-location", status: "pending-approval",
      lat: 33.9800, lng: -118.3000, address: "1400 Industrial Blvd, Inglewood, CA",
      vibeTags: ["Gritty", "Industrial", "Dystopian", "Spooky"],
      media: [
        { id: "m4a", url: "", type: "photo" as const, caption: "Interior wide" },
        { id: "m4b", url: "", type: "photo" as const, caption: "Loading dock" },
        { id: "m4c", url: "", type: "photo" as const, caption: "Upper floor" },
        { id: "m4d", url: "", type: "photo" as const, caption: "Roof access" },
        { id: "m4e", url: "", type: "photo" as const, caption: "Exterior" },
      ],
      notes: "Needs structural safety inspection.", dailyRate: "$1,200", overtimeRate: "$200/hr", securityDeposit: "$3,000",
      basecampParking: "Adjacent lot", crewParkingCapacity: 12, noiseProfile: "Flight path overhead",
      loadInDifficulty: "Ground floor", bathroomCount: 1,
      contacts: [{ id: "c3", role: "Owner", name: "Eastside Holdings LLC", phone: "(310) 555-0277", email: "permits@eastsideholdings.com" }],
      sceneTags: [{ sceneNumber: "42", sceneTitle: "Villain Lair" }],
      scheduleBlocks: [], blackoutDates: [{ id: "bd2", date: "2026-04-01", reason: "Building inspection" }],
      bookedTo: "Avatar 3",
    },
    {
      id: "loc5", code: "LOC-005", name: "Redwood Forest Clearing", locationType: "on-location", status: "scouted",
      lat: 37.8000, lng: -122.1800, address: "Muir Woods, Mill Valley, CA",
      vibeTags: ["Forest", "Gothic", "Spooky", "Rustic"],
      media: [
        { id: "m5a", url: "", type: "photo" as const, caption: "Clearing" },
        { id: "m5b", url: "", type: "photo" as const, caption: "Trail path" },
      ],
      notes: "NPS permit required. 6-week lead.", dailyRate: "$500", overtimeRate: "$100/hr", securityDeposit: "$2,000",
      basecampParking: "Lot 0.5mi away", crewParkingCapacity: 3,
      sunPathNotes: "Canopy blocks most direct sunlight",
      noiseProfile: "Very quiet",
      contacts: [{ id: "c4", role: "Ranger", name: "Tom Whitfield", phone: "(415) 555-0333", email: "twhitfield@nps.gov" }],
      sceneTags: [], scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    },
    {
      id: "loc6", code: "LOC-006", name: "Studio B - Build Stage", locationType: "studio", status: "scouted",
      lat: 34.1500, lng: -118.3400, address: "Universal Studios, 100 Universal City Plaza, CA",
      vibeTags: ["Futuristic", "Modern"],
      media: [
        { id: "m6a", url: "", type: "photo" as const, caption: "Empty stage" },
      ],
      notes: "Available for sci-fi build. 4-week advance booking.", dailyRate: "$12,000", overtimeRate: "$1,800/hr", securityDeposit: "$25,000",
      dimensionsL: 150, dimensionsW: 100, dimensionsH: 45, gridHeight: 40, floorType: "Epoxy",
      amperage: "3-Phase, 600 Amps", camlockAvailable: true, soundRating: "Soundproof",
      workshopAccess: true, millSpace: true, paintShopProximity: "Adjacent building",
      sceneTags: [], scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    },
  ]
}

/* ------------------------------------------------------------------ */
/*  Reusable Form Fields                                               */
/* ------------------------------------------------------------------ */

function FloatingField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="relative">
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 peer placeholder-transparent" placeholder={placeholder || label} />
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
    </div>
  )
}

function FloatingTextarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="relative">
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none peer placeholder-transparent" placeholder={label} />
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
    </div>
  )
}

function FloatingSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] | string[] }) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none">
        <option value="">Select...</option>
        {opts.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

function TagPicker({ selected, onChange, options }: { selected: string[]; onChange: (tags: string[]) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((tag) => {
        const active = selected.includes(tag)
        return (
          <button key={tag} type="button" onClick={() => onChange(active ? selected.filter((t) => t !== tag) : [...selected, tag])}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${active ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {tag}
          </button>
        )
      })}
    </div>
  )
}

function LocationStatusBadge({ status }: { status: LocationStatus }) {
  const cfg = LOCATION_STATUSES.find((s) => s.value === status) || LOCATION_STATUSES[0]
  return <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
}

/* ------------------------------------------------------------------ */
/*  Photo Drop Zone                                                    */
/* ------------------------------------------------------------------ */

function PhotoDropZone({ media, onAdd, onDelete, onUpdateCaption, showCaptions = false }: {
  media: LocationMediaItem[]; onAdd: (items: LocationMediaItem[]) => void
  onDelete?: (id: string) => void; onUpdateCaption?: (id: string, caption: string) => void; showCaptions?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [editCaptionId, setEditCaptionId] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState("")

  const processFiles = async (files: FileList | File[]) => {
    const items: LocationMediaItem[] = []
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const raw = await readFileAsDataUrl(file)
        const url = await compressImage(raw)
        items.push({ id: uid(), url, type: "photo" })
      }
    }
    if (items.length > 0) onAdd(items)
  }

  const previewItem = previewId ? media.find((m) => m.id === previewId) : null
  const previewIdx = previewItem ? media.indexOf(previewItem) : -1

  return (
    <div>
      {/* Gallery grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {media.map((m) => (
            <div key={m.id} className="relative group/thumb rounded-lg overflow-hidden bg-gray-100 border border-gray-200 aspect-[4/3]">
              {isValidImageUrl(m.url) ? (
                <img
                  src={m.url}
                  alt={m.caption || ""}
                  className="w-full h-full object-cover cursor-pointer transition-transform group-hover/thumb:scale-105"
                  onClick={() => setPreviewId(m.id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => setPreviewId(m.id)}>
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-all pointer-events-none" />
              <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                {showCaptions && onUpdateCaption && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditCaptionId(m.id); setCaptionDraft(m.caption || "") }}
                    className="p-1 bg-white/90 rounded-md text-gray-600 hover:text-teal-600 hover:bg-white transition-colors shadow-sm"
                    title="Edit caption"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(m.id) }}
                    className="p-1 bg-white/90 rounded-md text-gray-600 hover:text-red-600 hover:bg-white transition-colors shadow-sm"
                    title="Delete image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              {/* Caption */}
              {showCaptions && m.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-2 py-1">
                  <p className="text-[9px] text-white truncate">{m.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
        onDrop={async (e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${isDragOver ? "border-teal-400 bg-teal-50" : "border-gray-300 hover:border-teal-300 hover:bg-gray-50"}`}
      >
        <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
        <p className="text-xs text-gray-500">Drop scouting photos here or click to upload</p>
        {media.length > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{media.length} image{media.length !== 1 ? "s" : ""} uploaded</p>}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = "" }} />
      </div>

      {/* Lightbox preview */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[90] p-6" onClick={() => setPreviewId(null)}>
          <div className="relative max-w-3xl w-full max-h-[80vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {isValidImageUrl(previewItem.url) ? (
              <img src={previewItem.url} alt={previewItem.caption || ""} className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-2xl" />
            ) : (
              <div className="w-full h-64 rounded-xl bg-gray-800 flex items-center justify-center"><MapPin className="w-12 h-12 text-gray-500" /></div>
            )}
            {previewItem.caption && (
              <p className="text-white text-sm mt-3 bg-black/40 px-3 py-1 rounded-full">{previewItem.caption}</p>
            )}
            <div className="text-white/60 text-xs mt-2">{previewIdx + 1} of {media.length}</div>
            {/* Nav arrows */}
            {media.length > 1 && (
              <>
                <button
                  onClick={() => setPreviewId(media[(previewIdx - 1 + media.length) % media.length].id)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPreviewId(media[(previewIdx + 1) % media.length].id)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <button onClick={() => setPreviewId(null)} className="absolute -top-2 -right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Caption edit inline modal */}
      {editCaptionId && onUpdateCaption && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[95] p-4" onClick={() => setEditCaptionId(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Edit Caption</h4>
            <input
              type="text" value={captionDraft} onChange={(e) => setCaptionDraft(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder-gray-400"
              placeholder="Enter caption..."
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { onUpdateCaption(editCaptionId, captionDraft); setEditCaptionId(null) } }}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setEditCaptionId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => { onUpdateCaption(editCaptionId, captionDraft); setEditCaptionId(null) }} className="px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Image Carousel                                                     */
/* ------------------------------------------------------------------ */

function ImageCarousel({ media, size = "large" }: { media: LocationMediaItem[]; size?: "large" | "mini" }) {
  const [current, setCurrent] = useState(0)
  if (media.length === 0) return null

  const goTo = (dir: 1 | -1) => {
    setCurrent((c) => {
      const next = c + dir
      if (next < 0) return media.length - 1
      if (next >= media.length) return 0
      return next
    })
  }

  if (size === "mini") {
    return (
      <div className="relative w-full h-full">
        {isValidImageUrl(media[current]?.url) ? (
          <img src={media[current].url} alt={media[current].caption || ""} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100"><MapPin className="w-6 h-6 text-gray-300" /></div>
        )}
        {media.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); goTo(-1) }} className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); goTo(1) }} className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronRight className="w-3 h-3" />
            </button>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {media.slice(0, 5).map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full group/carousel">
      {isValidImageUrl(media[current]?.url) ? (
        <img src={media[current].url} alt={media[current].caption || ""} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100"><MapPin className="w-6 h-6 text-gray-300" /></div>
      )}
      {media.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); goTo(-1) }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-black/60 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); goTo(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-black/60 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {media.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`} />
            ))}
          </div>
          {media[current].caption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
              {media[current].caption}
            </div>
          )}
        </>
      )}
      <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
        {current + 1}/{media.length}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Hover Preview Overlay (Instagram-style top-3 carousel)             */
/* ------------------------------------------------------------------ */

function HoverPreviewOverlay({ media }: { media: LocationMediaItem[] }) {
  const previewMedia = media.slice(0, 3)
  if (previewMedia.length === 0) return null
  return (
    <div className="absolute inset-0 z-10">
      <ImageCarousel media={previewMedia} size="mini" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Interactive Leaflet Map                                            */
/* ------------------------------------------------------------------ */

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function useLeaflet() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if ((window as any).L) { setReady(true); return }
    // Load CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }
    // Load JS
    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement("script")
      script.src = LEAFLET_JS
      script.onload = () => setReady(true)
      document.head.appendChild(script)
    } else {
      const check = setInterval(() => { if ((window as any).L) { setReady(true); clearInterval(check) } }, 100)
      return () => clearInterval(check)
    }
  }, [])
  return ready
}

function getStatusColor(status: LocationStatus) {
  switch (status) {
    case "secured": return "#10b981"
    case "scouted": return "#3b82f6"
    case "pending-approval": return "#f59e0b"
    case "burned": return "#ef4444"
    default: return "#6b7280"
  }
}

function InteractiveMap({
  locations, selectedId, onSelect, onEditLocation, onDeleteLocation, onAddAtCoords, isAddingMode, onToggleAddMode,
}: {
  locations: ProjectLocation[]; selectedId: string | null; onSelect: (id: string) => void
  onEditLocation: (loc: ProjectLocation) => void; onDeleteLocation: (id: string) => void
  onAddAtCoords: (lat: number, lng: number) => void; isAddingMode: boolean; onToggleAddMode: () => void
}) {
  const leafletReady = useLeaflet()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const popupsRef = useRef<Record<string, any>>({})
  const pendingMarkerRef = useRef<any>(null)

  // Initialize map
  useEffect(() => {
    if (!leafletReady || !containerRef.current || mapRef.current) return
    const L = (window as any).L
    const map = L.map(containerRef.current, {
      center: [OFFICE_LAT, OFFICE_LNG],
      zoom: 10,
      zoomControl: false,
      attributionControl: true,
    })
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: "bottomright" }).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady])

  // Click-to-add handler
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const handler = (e: any) => {
      if (!isAddingMode) return
      const { lat, lng } = e.latlng
      // Show temporary marker
      const L = (window as any).L
      if (pendingMarkerRef.current) map.removeLayer(pendingMarkerRef.current)
      const tmpIcon = L.divIcon({
        className: "leaflet-tmp-marker",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#14b8a6;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;animation:pulse 1s infinite alternate"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      pendingMarkerRef.current = L.marker([lat, lng], { icon: tmpIcon }).addTo(map)
      onAddAtCoords(lat, lng)
    }
    map.on("click", handler)
    return () => { map.off("click", handler) }
  }, [isAddingMode, onAddAtCoords])

  // Update markers when locations change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const L = (window as any).L

    // Remove old markers not in current locations
    const locIds = new Set(locations.map((l) => l.id))
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!locIds.has(id)) { map.removeLayer(marker); delete markersRef.current[id]; delete popupsRef.current[id] }
    })

    // Add/update markers
    locations.forEach((loc) => {
      const color = getStatusColor(loc.status)
      const isStudio = loc.locationType === "studio"
      const iconSvg = isStudio
        ? `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V6h6V2h6v8h6v12z"/></svg>`
        : `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`

      const icon = L.divIcon({
        className: "leaflet-loc-marker",
        html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.2s">${iconSvg}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      if (markersRef.current[loc.id]) {
        markersRef.current[loc.id].setLatLng([loc.lat, loc.lng]).setIcon(icon)
      } else {
        const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map)
        marker.on("click", () => onSelect(loc.id))
        markersRef.current[loc.id] = marker
      }

      // Build popup content
      const statusLabel = LOCATION_STATUSES.find((s) => s.value === loc.status)?.label || loc.status
      const dist = haversineDistance(OFFICE_LAT, OFFICE_LNG, loc.lat, loc.lng).toFixed(1)
      const popupHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif;min-width:220px;max-width:280px;padding:0">
          <div style="display:flex;align-items:start;gap:10px;padding:10px 12px 6px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                <span style="font-size:10px;font-family:monospace;color:#9ca3af">${loc.code}</span>
                <span style="font-size:9px;font-weight:600;background:${color}20;color:${color};padding:1px 6px;border-radius:99px">${statusLabel}</span>
              </div>
              <p style="font-size:13px;font-weight:600;color:#111827;margin:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${loc.name}</p>
              <p style="font-size:10px;color:#6b7280;margin:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${loc.address}</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;background:#f9fafb;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;font-size:10px;color:#6b7280">
            <span style="font-weight:600;color:#111827">${loc.dailyRate}</span><span>/day</span>
            <span style="margin-left:auto">${dist} mi away</span>
          </div>
          <div style="display:flex;padding:0;border-top:0">
            <button data-loc-edit="${loc.id}" style="flex:1;padding:8px;border:none;background:none;font-size:11px;font-weight:500;color:#0d9488;cursor:pointer;border-right:1px solid #f3f4f6">Edit</button>
            <button data-loc-delete="${loc.id}" style="flex:1;padding:8px;border:none;background:none;font-size:11px;font-weight:500;color:#ef4444;cursor:pointer">Remove</button>
          </div>
        </div>
      `
      if (popupsRef.current[loc.id]) {
        popupsRef.current[loc.id].setContent(popupHtml)
      } else {
        const popup = L.popup({ closeButton: true, className: "leaflet-loc-popup", offset: [0, -10], maxWidth: 300, minWidth: 220 }).setContent(popupHtml)
        markersRef.current[loc.id].bindPopup(popup)
        popupsRef.current[loc.id] = popup
      }
    })
  }, [locations, onSelect])

  // Leaflet popup styles are defined in globals.css

  // Listen for popup button clicks via event delegation
  useEffect(() => {
  const handleClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
      const editId = target.getAttribute("data-loc-edit")
      const deleteId = target.getAttribute("data-loc-delete")
      
      if (editId) {
        const loc = locations.find((l) => l.id === editId)
        if (loc) onEditLocation(loc)
      }
      if (deleteId) {
        onDeleteLocation(deleteId)
      }
    }
    document.addEventListener("click", handleClick)
    return () => {
      document.removeEventListener("click", handleClick)
    }
  }, [locations, onEditLocation, onDeleteLocation])

  // Fly to selected location
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const loc = locations.find((l) => l.id === selectedId)
    if (!loc) return
    map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 13), { duration: 0.8 })

    // Highlight selected marker
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement()
      if (!el) return
      const inner = el.querySelector("div")
      if (!inner) return
      if (id === selectedId) {
        inner.style.transform = "scale(1.3)"
        inner.style.boxShadow = "0 0 0 4px rgba(20,184,166,0.3), 0 2px 8px rgba(0,0,0,0.3)"
      } else {
        inner.style.transform = "scale(1)"
        inner.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"
      }
    })

    // Open popup
    const marker = markersRef.current[selectedId]
    if (marker) marker.openPopup()
  }, [selectedId, locations])

  // Fit bounds when locations change
  useEffect(() => {
    const map = mapRef.current
    if (!map || locations.length === 0) return
    const L = (window as any).L
    const bounds = L.latLngBounds(locations.map((l: any) => [l.lat, l.lng]))
    map.fitBounds(bounds.pad(0.15), { maxZoom: 14 })
  }, [locations.length])

  // Clean up pending marker when add mode turns off
  useEffect(() => {
    if (!isAddingMode && pendingMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(pendingMarkerRef.current)
      pendingMarkerRef.current = null
    }
  }, [isAddingMode])

  return (
    <div className="w-full h-full rounded-2xl border border-gray-200 overflow-hidden relative bg-gray-100">
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" style={{ zIndex: 1 }} />

      {/* Loading state */}
      {!leafletReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading map...</p>
          </div>
        </div>
      )}

      {/* Add mode toggle */}
      <button
        onClick={onToggleAddMode}
        className={`absolute top-3 left-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium shadow-lg transition-all ${
          isAddingMode
            ? "bg-teal-600 text-white ring-2 ring-teal-300"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
      >
        <MapPin className="w-3.5 h-3.5" />
        {isAddingMode ? "Click map to place pin..." : "Add Pin on Map"}
      </button>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 rounded-xl px-3 py-2.5 text-[9px] flex flex-col gap-1.5 backdrop-blur-sm border border-gray-200/60 shadow-lg">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-gray-600">Secured</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-gray-600">Scouted</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-gray-600">Pending</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-gray-600">Burned</span></div>
      </div>

    </div>
  )
}

/* ------------------------------------------------------------------ */
  /*  Location Vote / Comment components                                 */
  /* ------------------------------------------------------------------ */

  const LOC_VOTE_PILL: Record<string, { base: string; active: string }> = {
    Yes:   { base: "bg-[#d5dece] text-[#6b7a5e] hover:bg-[#c8d4bf]", active: "bg-[#b5c9a8] text-[#4a5b3f] ring-2 ring-[#8fa67e]" },
    Maybe: { base: "bg-[#f5e6d0] text-[#9b8a5e] hover:bg-[#eddbbd]", active: "bg-[#f0d9b5] text-[#7a6a3a] ring-2 ring-[#d4b88a]" },
    No:    { base: "bg-[#f0cdd0] text-[#a06b6e] hover:bg-[#e8bfc3]", active: "bg-[#e8b4b8] text-[#8b4c4f] ring-2 ring-[#d49396]" },
  }

  function LocVoteButton({ label, isActive, count, onClick }: { label: string; icon?: typeof CheckCircle; isActive: boolean; count: number; activeClassName?: string; onClick: () => void }) {
    const style = LOC_VOTE_PILL[label] || LOC_VOTE_PILL["Maybe"]
    return (
      <button onClick={(e) => { e.stopPropagation(); onClick() }} className={`flex-1 px-3 py-1.5 rounded-full text-xs font-semibold text-center transition-all duration-200 ${isActive ? style.active : style.base}`} title={label}>
        <span>{label}</span>
        {count > 0 && <span className="ml-1 text-[10px] opacity-70">{count}</span>}
      </button>
    )
  }

  function LocCommentSection({ comments, onAddComment }: { comments: PropComment[]; onAddComment: (text: string) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [text, setText] = useState("")
    const handleSubmit = () => { if (!text.trim()) return; onAddComment(text.trim()); setText("") }
    return (
      <div className="mt-1">
        <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
          <MessageSquare className="w-3 h-3" />
          {comments.length > 0 ? `${comments.length} note${comments.length === 1 ? "" : "s"}` : "Add note"}
        </button>
        {isOpen && (
          <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
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
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Write a note..." className="flex-1 px-2.5 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-900" />
              <button onClick={handleSubmit} disabled={!text.trim()} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /*  Location Card (Instagram-style with hover preview + drag-drop)     */
  /* ------------------------------------------------------------------ */
  
  function LocationCard({ loc, isSelected, isInProject, onSelect, onToggleAdd, onEdit, onDelete, onAddToCanvas, hasProject, onAddMedia, onVote, onAddComment, currentUserId }: {
  loc: ProjectLocation; isSelected: boolean; isInProject: boolean;
  onSelect: (id: string) => void; onToggleAdd: (id: string) => void;
  onEdit: (loc: ProjectLocation) => void; onDelete: (id: string) => void;
  onAddToCanvas: (loc: ProjectLocation) => void;
  hasProject: boolean; onAddMedia: (id: string, items: LocationMediaItem[]) => void;
  onVote?: (id: string, vote: VoteValue) => void; onAddComment?: (id: string, text: string) => void; currentUserId?: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dist = haversineDistance(OFFICE_LAT, OFFICE_LNG, loc.lat, loc.lng)
  const weather = getWeather(loc.id)

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files) {
      const items: LocationMediaItem[] = []
      for (const file of Array.from(e.dataTransfer.files)) {
        if (file.type.startsWith("image/")) {
          const raw = await readFileAsDataUrl(file)
          const url = await compressImage(raw)
          items.push({ id: uid(), url, type: "photo" })
        }
      }
      if (items.length > 0) onAddMedia(loc.id, items)
    }
  }

  return (
    <div
      onClick={() => onSelect(loc.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false) }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
      onDrop={handleDrop}
      className={`relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected ? "border-teal-500 ring-2 ring-teal-200 shadow-md" :
        isDragOver ? "border-teal-400 ring-2 ring-teal-100 shadow-md" :
        isInProject ? "border-teal-300/60" :
        "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      {/* Image area (square aspect ratio for Instagram feel) */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {loc.media.length > 0 ? (
          <>
            {/* Default: show first image */}
            {!isHovered ? (
              isValidImageUrl(loc.media[0]?.url) ? <img src={loc.media[0].url} alt={loc.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><MapPin className="w-8 h-8 text-gray-300" /></div>
            ) : (
              /* Hover: show mini carousel of top 3 */
              <HoverPreviewOverlay media={loc.media} />
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
            <MapPin className="w-8 h-8" />
            <span className="text-[10px] text-gray-400">No photos</span>
          </div>
        )}

        {/* Drag-drop overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-teal-500/30 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white rounded-xl px-4 py-3 shadow-lg text-center">
              <Upload className="w-6 h-6 text-teal-600 mx-auto mb-1" />
              <p className="text-xs font-medium text-teal-700">Drop to add photos</p>
            </div>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <span className="bg-black/60 text-white text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">{loc.code}</span>
          <LocationStatusBadge status={loc.status} />
        </div>

        {/* Type badge */}
        <div className="absolute top-2 right-2 z-10">
          <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${loc.locationType === "studio" ? "bg-purple-100/90 text-purple-700" : "bg-sky-100/90 text-sky-700"}`}>
            {loc.locationType === "studio" ? <Building2 className="w-2.5 h-2.5" /> : <TreePine className="w-2.5 h-2.5" />}
            {loc.locationType === "studio" ? "Studio" : "Location"}
          </span>
        </div>

        {/* Photo count badge */}
        {loc.media.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowGallery(true) }}
            className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1 hover:bg-black/70 transition-colors z-10"
          >
            <ImageIcon className="w-3 h-3" /> {loc.media.length}
          </button>
        )}

        {/* In-project indicator */}
        {isInProject && (
          <div className="absolute bottom-2 left-2 bg-teal-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 z-10">
            <Check className="w-3 h-3" /> In Project
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{loc.name}</h3>
            <p className="text-[11px] text-gray-500 truncate mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0 text-gray-400" />{loc.address}
            </p>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[160px] z-30">
                <button onClick={(e) => { e.stopPropagation(); onEdit(loc); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5" /> Edit details
                </button>
                <button onClick={(e) => { e.stopPropagation(); onAddToCanvas(loc); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5" /> Add to Canvas
                </button>
                <button onClick={(e) => { e.stopPropagation(); onToggleAdd(loc.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                  {isInProject ? "Remove from project" : "Add to project"}
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={(e) => { e.stopPropagation(); onDelete(loc.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Weather row */}
        <div className="flex items-center gap-3 mt-2 px-2 py-1.5 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1">
            <WeatherIcon condition={weather.condition} />
            <span className="text-[11px] font-medium text-gray-700">{weather.temp}</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span className="text-[11px] text-gray-500">{weather.humidity}</span>
          </div>
          <span className="text-[10px] text-gray-400 ml-auto">{dist.toFixed(1)} mi</span>
        </div>

        {/* Vibe tags + scene tags */}
        <div className="flex flex-wrap items-center gap-1 mt-2">
          {loc.vibeTags.slice(0, 3).map((t) => (
            <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded-md font-medium">{t}</span>
          ))}
          {loc.vibeTags.length > 3 && <span className="text-[9px] text-gray-400">+{loc.vibeTags.length - 3}</span>}
          {loc.sceneTags.length > 0 && (
            <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">
              <Film className="w-2.5 h-2.5" /> {loc.sceneTags.length} scene{loc.sceneTags.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
          {loc.bookedTo ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" /> {loc.bookedTo}
            </span>
          ) : !isInProject ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleAdd(loc.id) }}
              disabled={!hasProject}
              title={!hasProject ? "Create or open a project first" : "Add to project"}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" /> Add to project
            </button>
          ) : (
            <span className="text-[10px] text-teal-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Added</span>
          )}
          <span className="text-[10px] text-gray-500 font-semibold">{loc.dailyRate}<span className="text-gray-400 font-normal">/day</span></span>
        </div>

        {/* Response buttons + note when in project */}
        {isInProject && onVote && onAddComment && (() => {
          const itemVotes = loc.votes || []
          const itemComments = loc.comments || []
          const userVote = itemVotes.find((v) => v.userId === currentUserId)?.vote
          const yesCt = itemVotes.filter((v) => v.vote === "yes").length
          const noCt = itemVotes.filter((v) => v.vote === "no").length
          const maybeCt = itemVotes.filter((v) => v.vote === "maybe").length
          return (
            <div className="mt-2.5 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <LocVoteButton label="Yes" isActive={userVote === "yes"} count={yesCt} onClick={() => onVote(loc.id, "yes")} />
                <LocVoteButton label="Maybe" isActive={userVote === "maybe"} count={maybeCt} onClick={() => onVote(loc.id, "maybe")} />
                <LocVoteButton label="No" isActive={userVote === "no"} count={noCt} onClick={() => onVote(loc.id, "no")} />
              </div>
              <LocCommentSection comments={itemComments} onAddComment={(text) => onAddComment(loc.id, text)} />
            </div>
          )
        })()}
      </div>

      {/* Gallery modal */}
      {showGallery && loc.media.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4" onClick={(e) => { e.stopPropagation(); setShowGallery(false) }}>
          <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <ImageCarousel media={loc.media} size="large" />
            <button onClick={(e) => { e.stopPropagation(); setShowGallery(false) }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-50">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Location List Row (list view)                                      */
/* ------------------------------------------------------------------ */

function LocationListRow({ loc, isSelected, isInProject, onSelect, onToggleAdd, onEdit, onDelete, onAddToCanvas, hasProject }: {
  loc: ProjectLocation; isSelected: boolean; isInProject: boolean;
  onSelect: (id: string) => void; onToggleAdd: (id: string) => void;
  onEdit: (loc: ProjectLocation) => void; onDelete: (id: string) => void;
  onAddToCanvas: (loc: ProjectLocation) => void;
  hasProject: boolean
}) {
  const dist = haversineDistance(OFFICE_LAT, OFFICE_LNG, loc.lat, loc.lng)
  const weather = getWeather(loc.id)

  return (
    <div
      onClick={() => onSelect(loc.id)}
      className={`flex items-center gap-4 bg-white rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${
        isSelected
          ? "border-teal-500 ring-2 ring-teal-200 shadow-md"
          : isInProject
          ? "border-teal-300/60 hover:shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
        {loc.media.length > 0 ? (
          isValidImageUrl(loc.media[0]?.url) ? <img src={loc.media[0].url} alt={loc.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><MapPin className="w-8 h-8 text-gray-300" /></div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <MapPin className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] font-mono font-semibold text-gray-400">{loc.code}</span>
          <LocationStatusBadge status={loc.status} />
          <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${loc.locationType === "studio" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"}`}>
            {loc.locationType === "studio" ? <Building2 className="w-2.5 h-2.5" /> : <TreePine className="w-2.5 h-2.5" />}
            {loc.locationType === "studio" ? "Studio" : "Location"}
          </span>
          {isInProject && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-full">
              <Check className="w-2.5 h-2.5" /> In Project
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 truncate">{loc.name}</h3>
        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 shrink-0 text-gray-400" />{loc.address}
        </p>
        {/* Tags row */}
        {loc.vibeTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {loc.vibeTags.slice(0, 4).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded-md font-medium">{t}</span>
            ))}
            {loc.vibeTags.length > 4 && <span className="text-[9px] text-gray-400">+{loc.vibeTags.length - 4}</span>}
          </div>
        )}
      </div>

      {/* Scene tags */}
      <div className="hidden lg:flex flex-col items-end gap-1 shrink-0 max-w-[120px]">
        {loc.sceneTags.length > 0 ? (
          loc.sceneTags.slice(0, 2).map((s) => (
            <span key={s.sceneNumber} className="text-[9px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
              <Film className="w-2.5 h-2.5" /> Sc. {s.sceneNumber}{s.sceneTitle ? `: ${s.sceneTitle}` : ""}
            </span>
          ))
        ) : (
          <span className="text-[9px] text-gray-400 italic">No scenes</span>
        )}
        {loc.sceneTags.length > 2 && <span className="text-[9px] text-purple-500">+{loc.sceneTags.length - 2} more</span>}
      </div>

      {/* Stats column */}
      <div className="hidden md:flex flex-col items-end gap-1 shrink-0 text-right min-w-[80px]">
        <div className="flex items-center gap-1.5">
          <WeatherIcon condition={weather.condition} />
          <span className="text-[11px] font-medium text-gray-700">{weather.temp}</span>
        </div>
        <span className="text-[10px] text-gray-400">{dist.toFixed(1)} mi</span>
        <span className="text-[10px] text-gray-700 font-semibold">{loc.dailyRate}<span className="text-gray-400 font-normal">/day</span></span>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        {!isInProject && hasProject && (
          <button onClick={(e) => { e.stopPropagation(); onToggleAdd(loc.id) }} className="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors" title="Add to project">
            <Plus className="w-4 h-4" />
          </button>
        )}
        {isInProject && (
          <button onClick={(e) => { e.stopPropagation(); onToggleAdd(loc.id) }} className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors" title="Remove from project">
            <X className="w-4 h-4" />
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onAddToCanvas(loc) }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Add to Canvas">
          <Layout className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(loc) }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(loc.id) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Add Location Modal                                                 */
/* ------------------------------------------------------------------ */

function AddLocationModal({ onClose, onAdd, existingLocations, prefillCoords }: { onClose: () => void; onAdd: (loc: ProjectLocation) => void; existingLocations: ProjectLocation[]; prefillCoords?: { lat: number; lng: number } | null }) {
  const [locType, setLocType] = useState<LocationType>("on-location")
  const [mapsLink, setMapsLink] = useState("")
  const [mapsAutoFilled, setMapsAutoFilled] = useState(false)
  const [form, setForm] = useState({
    name: "", address: "", lat: prefillCoords ? String(prefillCoords.lat) : "", lng: prefillCoords ? String(prefillCoords.lng) : "",
    notes: "", dailyRate: "", overtimeRate: "", securityDeposit: "",
    basecampParking: "", crewParkingCapacity: "", cateringArea: "",
    sunPathNotes: "", noiseProfile: "", loadInDifficulty: "",
    bathroomCount: "", greenRoomCapability: "", makeupAreaSuitability: "",
    dimL: "", dimW: "", dimH: "", gridHeight: "", floorType: "",
    amperage: "", soundRating: "",
  })
  const [vibeTags, setVibeTags] = useState<string[]>([])
  const [media, setMedia] = useState<LocationMediaItem[]>([])
  const [camlockAvailable, setCamlockAvailable] = useState(false)
  const [workshopAccess, setWorkshopAccess] = useState(false)
  const [millSpace, setMillSpace] = useState(false)

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleParseMapsLink = () => {
    const result = parseGoogleMapsLink(mapsLink)
    if (result) {
      setForm((f) => ({ ...f, lat: String(result.lat), lng: String(result.lng), address: result.address || f.address }))
      setMapsAutoFilled(true)
    }
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const loc: ProjectLocation = {
      id: `loc-${uid()}`, code: generateLocationCode(existingLocations), name: form.name,
      locationType: locType, status: "scouted",
      lat: parseFloat(form.lat) || OFFICE_LAT + (Math.random() - 0.5) * 0.1,
      lng: parseFloat(form.lng) || OFFICE_LNG + (Math.random() - 0.5) * 0.1,
      address: form.address, vibeTags, media, notes: form.notes,
      dailyRate: form.dailyRate || "$0", overtimeRate: form.overtimeRate || "$0", securityDeposit: form.securityDeposit || "$0",
      ...(locType === "on-location" ? {
        basecampParking: form.basecampParking, crewParkingCapacity: parseInt(form.crewParkingCapacity) || undefined,
        cateringArea: form.cateringArea, sunPathNotes: form.sunPathNotes, noiseProfile: form.noiseProfile,
        loadInDifficulty: form.loadInDifficulty, bathroomCount: parseInt(form.bathroomCount) || undefined,
        greenRoomCapability: form.greenRoomCapability, makeupAreaSuitability: form.makeupAreaSuitability,
        contacts: [],
      } : {
        dimensionsL: parseFloat(form.dimL) || undefined, dimensionsW: parseFloat(form.dimW) || undefined,
        dimensionsH: parseFloat(form.dimH) || undefined, gridHeight: parseFloat(form.gridHeight) || undefined,
        floorType: form.floorType, amperage: form.amperage, camlockAvailable,
        soundRating: form.soundRating, workshopAccess, millSpace,
      }),
      sceneTags: [], scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    }
    onAdd(loc)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Location</h2>
              <p className="text-sm text-gray-500 mt-0.5">Scout a new filming location</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="px-6 pb-6 space-y-5">
          <div>
            <p className="text-xs text-gray-500 mb-2">Location Type</p>
            <div className="flex gap-2">
              <button onClick={() => setLocType("on-location")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${locType === "on-location" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                <TreePine className="w-4 h-4" /> On-Location
              </button>
              <button onClick={() => setLocType("studio")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${locType === "studio" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                <Building2 className="w-4 h-4" /> Studio / Build
              </button>
            </div>
          </div>
          {locType === "on-location" && (
            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Link className="w-3 h-3" /> Paste a Google Maps Link</p>
              <div className="flex gap-2">
                <input type="text" value={mapsLink} onChange={(e) => { setMapsLink(e.target.value); setMapsAutoFilled(false) }}
                  placeholder="https://maps.google.com/..."
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400" />
                <button onClick={handleParseMapsLink} disabled={!mapsLink.trim()} className="px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Auto-Fill</button>
              </div>
              {mapsAutoFilled && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Auto-filled</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Location Name" value={form.name} onChange={(v) => update("name", v)} />
            <FloatingField label="Address" value={form.address} onChange={(v) => update("address", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Latitude" value={form.lat} onChange={(v) => update("lat", v)} type="number" />
            <FloatingField label="Longitude" value={form.lng} onChange={(v) => update("lng", v)} type="number" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Vibe Tags</p>
            <TagPicker selected={vibeTags} onChange={setVibeTags} options={VIBE_TAG_OPTIONS} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Scouting Photos</p>
            <PhotoDropZone
              media={media}
              onAdd={(items) => setMedia((prev) => [...prev, ...items])}
              onDelete={(id) => setMedia((prev) => prev.filter((m) => m.id !== id))}
              onUpdateCaption={(id, caption) => setMedia((prev) => prev.map((m) => m.id === id ? { ...m, caption } : m))}
              showCaptions
            />
          </div>
          <FloatingTextarea label="Notes" value={form.notes} onChange={(v) => update("notes", v)} />
          <div>
            <h3 className="text-base font-bold text-gray-900">Costing</h3>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <FloatingField label="Daily Rate" value={form.dailyRate} onChange={(v) => update("dailyRate", v)} placeholder="$0" />
              <FloatingField label="Overtime Rate" value={form.overtimeRate} onChange={(v) => update("overtimeRate", v)} placeholder="$0/hr" />
              <FloatingField label="Security Deposit" value={form.securityDeposit} onChange={(v) => update("securityDeposit", v)} placeholder="$0" />
            </div>
          </div>
          {locType === "on-location" ? (
            <div>
              <h3 className="text-base font-bold text-gray-900">Logistics</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <FloatingField label="Basecamp Parking" value={form.basecampParking} onChange={(v) => update("basecampParking", v)} />
                <FloatingField label="Crew Parking Capacity" value={form.crewParkingCapacity} onChange={(v) => update("crewParkingCapacity", v)} type="number" />
                <FloatingField label="Sun Path Notes" value={form.sunPathNotes} onChange={(v) => update("sunPathNotes", v)} />
                <FloatingField label="Noise Profile" value={form.noiseProfile} onChange={(v) => update("noiseProfile", v)} />
                <FloatingSelect label="Load-in Difficulty" value={form.loadInDifficulty} onChange={(v) => update("loadInDifficulty", v)} options={LOAD_IN_OPTIONS} />
                <FloatingField label="Bathrooms" value={form.bathroomCount} onChange={(v) => update("bathroomCount", v)} type="number" />
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-gray-900">Technical Specs</h3>
              <div className="grid grid-cols-4 gap-3 mt-2 mb-4">
                <FloatingField label="Length (ft)" value={form.dimL} onChange={(v) => update("dimL", v)} type="number" />
                <FloatingField label="Width (ft)" value={form.dimW} onChange={(v) => update("dimW", v)} type="number" />
                <FloatingField label="Height (ft)" value={form.dimH} onChange={(v) => update("dimH", v)} type="number" />
                <FloatingField label="Grid Height" value={form.gridHeight} onChange={(v) => update("gridHeight", v)} type="number" />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <FloatingSelect label="Floor Type" value={form.floorType} onChange={(v) => update("floorType", v)} options={FLOOR_TYPE_OPTIONS} />
                <FloatingField label="Amperage" value={form.amperage} onChange={(v) => update("amperage", v)} />
                <FloatingSelect label="Sound Rating" value={form.soundRating} onChange={(v) => update("soundRating", v)} options={SOUND_RATING_OPTIONS} />
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Camlock Available", value: camlockAvailable, set: setCamlockAvailable },
                  { label: "Workshop Access", value: workshopAccess, set: setWorkshopAccess },
                  { label: "Mill Space", value: millSpace, set: setMillSpace },
                ].map((opt) => (
                  <button key={opt.label} type="button" onClick={() => opt.set(!opt.value)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${opt.value ? "bg-teal-50 border-teal-300 text-teal-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${opt.value ? "bg-teal-600 border-teal-600" : "border-gray-300"}`}>
                      {opt.value && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={handleSubmit} disabled={!form.name.trim()} className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Add Location</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit Location Modal                                                */
/* ------------------------------------------------------------------ */

function EditLocationModal({ location, onClose, onSave }: { location: ProjectLocation; onClose: () => void; onSave: (updated: ProjectLocation) => void }) {
  const [form, setForm] = useState({
    name: location.name, address: location.address, notes: location.notes,
    dailyRate: location.dailyRate, overtimeRate: location.overtimeRate, securityDeposit: location.securityDeposit,
    status: location.status as string,
  })
  const [vibeTags, setVibeTags] = useState(location.vibeTags)
  const [media, setMedia] = useState<LocationMediaItem[]>(location.media || [])
  const [sceneTags, setSceneTags] = useState(location.sceneTags)
  const [newSceneNumber, setNewSceneNumber] = useState("")
  const [scheduleBlocks, setScheduleBlocks] = useState(location.scheduleBlocks)
  const [blackoutDates, setBlackoutDates] = useState(location.blackoutDates)

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSave = () => {
    onSave({ ...location, ...form, status: form.status as LocationStatus, vibeTags, media, sceneTags, scheduleBlocks, blackoutDates })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Location</h2>
              <p className="text-sm text-gray-500 mt-0.5">{location.code} - {location.name}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="px-6 pb-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Location Name" value={form.name} onChange={(v) => update("name", v)} />
            <FloatingSelect label="Status" value={form.status} onChange={(v) => update("status", v)} options={LOCATION_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
          </div>
          <FloatingField label="Address" value={form.address} onChange={(v) => update("address", v)} />
          <FloatingTextarea label="Notes" value={form.notes} onChange={(v) => update("notes", v)} />
          <div>
            <h3 className="text-base font-bold text-gray-900">Vibe Tags</h3>
            <TagPicker selected={vibeTags} onChange={setVibeTags} options={VIBE_TAG_OPTIONS} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-gray-900">Image Gallery</h3>
              <span className="text-xs text-gray-400">{media.length} image{media.length !== 1 ? "s" : ""}</span>
            </div>
            <PhotoDropZone
              media={media}
              onAdd={(items) => setMedia((prev) => [...prev, ...items])}
              onDelete={(id) => setMedia((prev) => prev.filter((m) => m.id !== id))}
              onUpdateCaption={(id, caption) => setMedia((prev) => prev.map((m) => m.id === id ? { ...m, caption } : m))}
              showCaptions
            />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Costing</h3>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <FloatingField label="Daily Rate" value={form.dailyRate} onChange={(v) => update("dailyRate", v)} />
              <FloatingField label="Overtime Rate" value={form.overtimeRate} onChange={(v) => update("overtimeRate", v)} />
              <FloatingField label="Security Deposit" value={form.securityDeposit} onChange={(v) => update("securityDeposit", v)} />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Scene Assignments</h3>
            <div className="flex flex-wrap gap-1.5 mb-2 mt-2">
              {sceneTags.map((st) => (
                <span key={st.sceneNumber} className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                  Sc. {st.sceneNumber}{st.sceneTitle ? ` - ${st.sceneTitle}` : ""}
                  <button onClick={() => setSceneTags((prev) => prev.filter((s) => s.sceneNumber !== st.sceneNumber))} className="hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSceneNumber} onChange={(e) => setNewSceneNumber(e.target.value)} placeholder="Scene #" className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder-gray-400 w-32" />
              <button onClick={() => { if (newSceneNumber.trim()) { setSceneTags((p) => [...p, { sceneNumber: newSceneNumber.trim() }]); setNewSceneNumber("") } }} disabled={!newSceneNumber.trim()} className="px-3 py-2 bg-teal-600 text-white text-xs font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50">Add</button>
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Schedule</h3>
            {scheduleBlocks.map((b, idx) => (
              <div key={b.id} className="flex items-center gap-2 mb-2 mt-2">
                <select value={b.type} onChange={(e) => { const u = [...scheduleBlocks]; u[idx] = { ...b, type: e.target.value as "prep" | "shoot" | "strike" }; setScheduleBlocks(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 appearance-none w-24">
                  <option value="prep">Prep</option><option value="shoot">Shoot</option><option value="strike">Strike</option>
                </select>
                <input type="date" value={b.startDate} onChange={(e) => { const u = [...scheduleBlocks]; u[idx] = { ...b, startDate: e.target.value }; setScheduleBlocks(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700" />
                <span className="text-xs text-gray-400">to</span>
                <input type="date" value={b.endDate} onChange={(e) => { const u = [...scheduleBlocks]; u[idx] = { ...b, endDate: e.target.value }; setScheduleBlocks(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700" />
                <button onClick={() => setScheduleBlocks((p) => p.filter((s) => s.id !== b.id))} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => setScheduleBlocks((p) => [...p, { id: uid(), type: "shoot", startDate: "", endDate: "", notes: "" }])} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors mt-1">
              <Plus className="w-3 h-3" /> Add Block
            </button>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Blackout Dates</h3>
            {blackoutDates.map((bd, idx) => (
              <div key={bd.id} className="flex items-center gap-2 mb-2 mt-2">
                <input type="date" value={bd.date} onChange={(e) => { const u = [...blackoutDates]; u[idx] = { ...bd, date: e.target.value }; setBlackoutDates(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700" />
                <input type="text" value={bd.reason || ""} onChange={(e) => { const u = [...blackoutDates]; u[idx] = { ...bd, reason: e.target.value }; setBlackoutDates(u) }} placeholder="Reason" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400" />
                <button onClick={() => setBlackoutDates((p) => p.filter((d) => d.id !== bd.id))} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => setBlackoutDates((p) => [...p, { id: uid(), date: "", reason: "" }])} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors mt-1">
              <Plus className="w-3 h-3" /> Add Blackout Date
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-white transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

interface LocationsModalProps { onClose: () => void }

export default function LocationsModal({ onClose }: LocationsModalProps) {
  const { state, dispatch } = useCasting()
  const projectId = state.currentFocus.currentProjectId
  const currentProject = projectId ? state.projects.find((p) => p.id === projectId) ?? null : null

  /* ---- Global location inventory (persisted to project data store) ---- */
  const inventory: ProjectLocation[] = currentProject?.locationInventory || []
  const inventoryRef = useRef(inventory)
  inventoryRef.current = inventory

  const syncInventory = useCallback(
    (updater: (prev: ProjectLocation[]) => ProjectLocation[]) => {
      if (!projectId) return
      const next = updater(inventoryRef.current)
      dispatch({ type: "SET_PROJECT_LOCATION_INVENTORY", payload: { projectId, inventory: next } })
    },
    [projectId, dispatch],
  )

  /* Auto-seed mock data if project has no location inventory yet */
  const hasSeeded = useRef(false)
  useEffect(() => {
    if (!hasSeeded.current && projectId && inventory.length === 0) {
      hasSeeded.current = true
      const mockData = generateMockLocations()
      dispatch({ type: "SET_PROJECT_LOCATION_INVENTORY", payload: { projectId, inventory: mockData } })
    }
  }, [projectId, inventory.length, dispatch])

  /* ---- Per-project locations (persisted to project data store) ---- */
  const projectLocations: ProjectLocation[] = currentProject?.locations || []
  const projectLocRef = useRef(projectLocations)
  projectLocRef.current = projectLocations

  const syncProjectLocations = useCallback(
    (updater: (prev: ProjectLocation[]) => ProjectLocation[]) => {
      if (!projectId) return
      const next = updater(projectLocRef.current)
      dispatch({ type: "SET_PROJECT_LOCATIONS", payload: { projectId, locations: next } })
    },
    [projectId, dispatch],
  )

  /* UI State */
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "project">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [groupByScene, setGroupByScene] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState<"" | "on-location" | "studio">("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [tagFilter, setTagFilter] = useState("")
  const [maxDistance, setMaxDistance] = useState("")
  const [hasPower, setHasPower] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<ProjectLocation | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteSource, setConfirmDeleteSource] = useState<"inventory" | "project">("inventory")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isMapAddMode, setIsMapAddMode] = useState(false)
  const [addAtCoords, setAddAtCoords] = useState<{ lat: number; lng: number } | null>(null)

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const projectLocIds = useMemo(() => new Set(projectLocations.map((l) => l.id)), [projectLocations])

  /* When map marker is clicked, scroll the card into view */
  const handleSelectFromMap = useCallback((id: string) => {
    setSelectedId(id)
    const el = cardRefs.current[id]
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [])

  /* When card is clicked, update selection (map reacts via selectedId) */
  const handleSelectFromCard = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

  /* Filtering */
  const applyFilters = useCallback((items: ProjectLocation[]) => {
    let filtered = items
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter((l) =>
        l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) ||
        l.vibeTags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (typeFilter) filtered = filtered.filter((l) => l.locationType === typeFilter)
    if (statusFilter) filtered = filtered.filter((l) => l.status === statusFilter)
    if (tagFilter) filtered = filtered.filter((l) => l.vibeTags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase())))
    if (maxDistance) { const d = parseFloat(maxDistance); if (!isNaN(d)) filtered = filtered.filter((l) => haversineDistance(OFFICE_LAT, OFFICE_LNG, l.lat, l.lng) <= d) }
    if (hasPower) filtered = filtered.filter((l) => l.amperage && l.amperage.includes("3-Phase"))
    return filtered
  }, [searchTerm, typeFilter, statusFilter, tagFilter, maxDistance, hasPower])

  const filteredInventory = useMemo(() => applyFilters(inventory), [inventory, applyFilters])
  const filteredProjectLocs = useMemo(() => applyFilters(projectLocations), [projectLocations, applyFilters])
  const displayLocations = activeTab === "project" ? filteredProjectLocs : filteredInventory

  /* Scene-based grouping for the Project tab */
  const sceneGroupedLocations = useMemo(() => {
    if (!groupByScene || activeTab !== "project") return null
    const groups: { scene: string; title: string; locations: ProjectLocation[] }[] = []
    const seenScenes = new Map<string, { scene: string; title: string; locations: ProjectLocation[] }>()
    const unassigned: ProjectLocation[] = []

    for (const loc of filteredProjectLocs) {
      if (!loc.sceneTags || loc.sceneTags.length === 0) {
        unassigned.push(loc)
        continue
      }
      for (const tag of loc.sceneTags) {
        const key = tag.sceneNumber
        if (!seenScenes.has(key)) {
          const group = { scene: tag.sceneNumber, title: tag.sceneTitle || "", locations: [] as ProjectLocation[] }
          seenScenes.set(key, group)
          groups.push(group)
        }
        const existing = seenScenes.get(key)!
        if (!existing.locations.find((l) => l.id === loc.id)) {
          existing.locations.push(loc)
        }
        if (tag.sceneTitle && !existing.title) existing.title = tag.sceneTitle
      }
    }
    // Sort by scene number numerically
    groups.sort((a, b) => {
      const nA = parseInt(a.scene, 10)
      const nB = parseInt(b.scene, 10)
      if (!isNaN(nA) && !isNaN(nB)) return nA - nB
      return a.scene.localeCompare(b.scene)
    })
    if (unassigned.length > 0) {
      groups.push({ scene: "", title: "Unassigned", locations: unassigned })
    }
    return groups
  }, [groupByScene, activeTab, filteredProjectLocs])

  /* Handlers */
  const handleToggleAdd = (id: string) => {
    if (!projectId) return
    if (projectLocIds.has(id)) {
      syncProjectLocations((prev) => prev.filter((l) => l.id !== id))
    } else {
      const inv = inventory.find((l) => l.id === id)
      if (!inv) return
      syncProjectLocations((prev) => [...prev, { ...inv }])
    }
  }

  const currentUserId = state.currentUser?.id

  const handleLocVote = (id: string, vote: VoteValue) => {
    if (!currentUserId) return
    syncProjectLocations((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const votes = l.votes || []
        const existing = votes.findIndex((v) => v.userId === currentUserId)
        const newVotes = [...votes]
        if (existing >= 0) {
          if (newVotes[existing].vote === vote) newVotes.splice(existing, 1)
          else newVotes[existing] = { userId: currentUserId, vote }
        } else {
          newVotes.push({ userId: currentUserId, vote })
        }
        return { ...l, votes: newVotes }
      }),
    )
    // Also update inventory so changes persist across tabs
    syncInventory((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const votes = l.votes || []
        const existing = votes.findIndex((v) => v.userId === currentUserId)
        const newVotes = [...votes]
        if (existing >= 0) {
          if (newVotes[existing].vote === vote) newVotes.splice(existing, 1)
          else newVotes[existing] = { userId: currentUserId, vote }
        } else {
          newVotes.push({ userId: currentUserId, vote })
        }
        return { ...l, votes: newVotes }
      }),
    )
  }

  const handleLocAddComment = (locId: string, text: string) => {
    if (!state.currentUser) return
    const newComment: PropComment = {
      id: `c-${Date.now()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userInitials: state.currentUser.initials,
      text,
      timestamp: Date.now(),
    }
    syncProjectLocations((prev) => prev.map((l) => (l.id === locId ? { ...l, comments: [...(l.comments || []), newComment] } : l)))
    syncInventory((prev) => prev.map((l) => (l.id === locId ? { ...l, comments: [...(l.comments || []), newComment] } : l)))
  }

  const handleAddLocation = (loc: ProjectLocation) => {
    syncInventory((prev) => [loc, ...prev])
    setIsMapAddMode(false)
    setAddAtCoords(null)
  }

const handleAddToCanvas = (loc: ProjectLocation) => {
  navigateToModal("canvas")
  }

  const handleAddAtCoords = useCallback((lat: number, lng: number) => {
    setAddAtCoords({ lat, lng })
    setShowAddModal(true)
  }, [])

  const handleSaveEdit = (updated: ProjectLocation) => {
    syncInventory((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    if (projectLocIds.has(updated.id)) syncProjectLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setEditingLocation(null)
  }

  const handleAddMedia = (id: string, items: LocationMediaItem[]) => {
    syncInventory((prev) => prev.map((l) => l.id === id ? { ...l, media: [...l.media, ...items] } : l))
    if (projectLocIds.has(id)) syncProjectLocations((prev) => prev.map((l) => l.id === id ? { ...l, media: [...l.media, ...items] } : l))
  }

  const handleRequestDelete = (id: string, source: "inventory" | "project") => { setConfirmDeleteId(id); setConfirmDeleteSource(source) }

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return
    if (confirmDeleteSource === "inventory") {
      syncInventory((prev) => prev.filter((l) => l.id !== confirmDeleteId))
      if (projectLocIds.has(confirmDeleteId)) syncProjectLocations((prev) => prev.filter((l) => l.id !== confirmDeleteId))
    } else {
      syncProjectLocations((prev) => prev.filter((l) => l.id !== confirmDeleteId))
    }
    setConfirmDeleteId(null)
    if (selectedId === confirmDeleteId) setSelectedId(null)
  }

  const isProjectTab = activeTab === "project"

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

return (
  <div className="fixed inset-0 bg-gray-50 flex flex-col z-50 pl-14">
  {/* Slim Sidebar Strip / Expandable Drawer */}
  <FloatingSidebar
  isOpen={isSidebarOpen}
  onClose={() => setIsSidebarOpen(false)}
  onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
  currentModal="locations"
  />

      {/* Top Bar */}
      <ModalHeader
        title="Locations"
        titleColor="bg-teal-600"
        onClose={onClose}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setActiveTab("all")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>All Locations</button>
          <button onClick={() => setActiveTab("project")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${activeTab === "project" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            My Project
            {projectLocations.length > 0 && <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{projectLocations.length}</span>}
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
            title="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Scene grouping toggle -- only on project tab */}
        {activeTab === "project" && (
          <button
            onClick={() => setGroupByScene((p) => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              groupByScene
                ? "border-teal-300 bg-teal-50 text-teal-700"
                : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            title="Group locations by scene"
          >
            <Layers className="w-3.5 h-3.5" />
            By Scene
          </button>
        )}

        <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-lg border transition-colors ${showFilters ? "border-teal-300 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`} title="Filters">
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search locations, tags..." className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-900" />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Smart Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 bg-white border-b border-gray-200 shrink-0">
          <span className="text-xs text-gray-500 shrink-0">Filters:</span>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setTypeFilter("")} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === "" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>All</button>
            <button onClick={() => setTypeFilter("on-location")} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === "on-location" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>On-Location</button>
            <button onClick={() => setTypeFilter("studio")} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === "studio" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Studio</button>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2.5 py-1.5 bg-gray-100 rounded-lg text-[11px] text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Any Status</option>
            {LOCATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500">Within</span>
            <input type="number" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} placeholder="mi" className="w-16 px-2 py-1.5 bg-gray-100 rounded-lg text-[11px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400" />
            <span className="text-[11px] text-gray-500">mi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-gray-400" />
            <input type="text" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="Vibe tag..." className="w-24 px-2 py-1.5 bg-gray-100 rounded-lg text-[11px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400" />
          </div>
          <button onClick={() => setHasPower(!hasPower)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${hasPower ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            <Zap className="w-3 h-3" /> 3-Phase Power
          </button>
        </div>
      )}

      {/* Main Content: Cards panel + Map panel side by side */}
      <div className="flex-1 overflow-hidden flex">
        {/* Cards Panel (50%) */}
        <div className="w-1/2 overflow-y-auto p-4 border-r border-gray-200">
          {isProjectTab && !projectId ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MapPin className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm font-medium">No project selected</p>
              <p className="text-gray-400 text-xs mt-1">Create or open a project first</p>
            </div>
          ) : displayLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MapPin className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm font-medium">{isProjectTab ? "No locations in project" : "No locations found"}</p>
              <p className="text-gray-400 text-xs mt-1">{isProjectTab ? "Browse All Locations to add some" : "Try adjusting your search or filters"}</p>
              {isProjectTab && (
                <button onClick={() => setActiveTab("all")} className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">Browse All Locations</button>
              )}
            </div>
          ) : sceneGroupedLocations && isProjectTab && groupByScene ? (
            /* Scene-grouped view */
            <div className="space-y-6">
              {sceneGroupedLocations.map((group) => (
                <div key={group.scene || "__unassigned"}>
                  {/* Scene group header */}
                  <div className="flex items-center gap-2.5 mb-3 sticky top-0 bg-gray-50/95 backdrop-blur-sm py-2 -mx-4 px-4 z-10 border-b border-gray-200/60">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${group.scene ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500"}`}>
                      {group.scene ? <Film className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-gray-900">
                        {group.scene ? `Scene ${group.scene}` : "Unassigned"}
                        {group.title && group.scene ? <span className="font-normal text-gray-500 ml-1.5">- {group.title}</span> : null}
                      </h3>
                      <p className="text-[10px] text-gray-400">{group.locations.length} location{group.locations.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  {/* Cards within the scene group */}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 gap-3">
                      {group.locations.map((loc) => (
                        <div key={loc.id} ref={(el) => { cardRefs.current[loc.id] = el }}>
                          <LocationCard
                            loc={loc}
                            isSelected={selectedId === loc.id}
                            isInProject={projectLocIds.has(loc.id)}
                            onSelect={handleSelectFromCard}
                            onToggleAdd={handleToggleAdd}
                            onEdit={(l) => setEditingLocation(l)}
                            onDelete={(id) => handleRequestDelete(id, "project")}
                            onAddToCanvas={handleAddToCanvas}
                            hasProject={!!projectId}
                            onAddMedia={handleAddMedia}
                            onVote={handleLocVote}
                            onAddComment={handleLocAddComment}
                            currentUserId={currentUserId}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.locations.map((loc) => (
                        <div key={loc.id} ref={(el) => { cardRefs.current[loc.id] = el }}>
                          <LocationListRow
                            loc={loc}
                            isSelected={selectedId === loc.id}
                            isInProject={projectLocIds.has(loc.id)}
                            onSelect={handleSelectFromCard}
                            onToggleAdd={handleToggleAdd}
                            onEdit={(l) => setEditingLocation(l)}
                            onDelete={(id) => handleRequestDelete(id, "project")}
                            onAddToCanvas={handleAddToCanvas}
                            hasProject={!!projectId}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : viewMode === "grid" ? (
            /* Standard grid view */
            <div className="grid grid-cols-2 gap-3">
              {displayLocations.map((loc) => (
                <div key={loc.id} ref={(el) => { cardRefs.current[loc.id] = el }}>
                  <LocationCard
                    loc={loc}
                    isSelected={selectedId === loc.id}
                    isInProject={projectLocIds.has(loc.id)}
                    onSelect={handleSelectFromCard}
                    onToggleAdd={handleToggleAdd}
                    onEdit={(l) => setEditingLocation(l)}
                    onDelete={(id) => handleRequestDelete(id, isProjectTab ? "project" : "inventory")}
                    onAddToCanvas={handleAddToCanvas}
                    hasProject={!!projectId}
                    onAddMedia={handleAddMedia}
                    onVote={handleLocVote}
                    onAddComment={handleLocAddComment}
                    currentUserId={currentUserId}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="space-y-2">
              {displayLocations.map((loc) => (
                <div key={loc.id} ref={(el) => { cardRefs.current[loc.id] = el }}>
                  <LocationListRow
                    loc={loc}
                    isSelected={selectedId === loc.id}
                    isInProject={projectLocIds.has(loc.id)}
                    onSelect={handleSelectFromCard}
                    onToggleAdd={handleToggleAdd}
                    onEdit={(l) => setEditingLocation(l)}
                    onDelete={(id) => handleRequestDelete(id, isProjectTab ? "project" : "inventory")}
                    onAddToCanvas={handleAddToCanvas}
                    hasProject={!!projectId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Panel (50%) */}
        <div className="w-1/2 p-4">
          <InteractiveMap
            locations={displayLocations}
            selectedId={selectedId}
            onSelect={handleSelectFromMap}
            onEditLocation={(l) => setEditingLocation(l)}
            onDeleteLocation={(id) => handleRequestDelete(id, isProjectTab ? "project" : "inventory")}
            onAddAtCoords={handleAddAtCoords}
            isAddingMode={isMapAddMode}
            onToggleAddMode={() => setIsMapAddMode((p) => !p)}
          />
        </div>
      </div>

{/* Embedded CoPilot - Fixed position in lower right corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <EmbeddedCoPilot context="locations" />
      </div>

  {/* Sub-modals */}
  {showAddModal && <AddLocationModal onClose={() => { setShowAddModal(false); setAddAtCoords(null) }} onAdd={handleAddLocation} existingLocations={inventory} prefillCoords={addAtCoords} />}
      {editingLocation && <EditLocationModal location={editingLocation} onClose={() => setEditingLocation(null)} onSave={handleSaveEdit} />}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">Delete Location</h3>
              <p className="text-sm text-gray-500 text-center mt-2">Are you sure? This action cannot be undone.</p>
            </div>
            <div className="flex border-t border-gray-200">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <div className="w-px bg-gray-200" />
              <button onClick={handleConfirmDelete} className="flex-1 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
