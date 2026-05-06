"use client"

import type React from "react"
import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { isValidImageUrl } from "@/lib/utils"
import {
  X,
  Users,
  Upload,
  ImageIcon,
  ChevronRight,
  Plus,
  Filter,
  ChevronDown,
  Check,
  SortAsc,
  User,
  CircleCheckBig,
  BookOpen,
  Home,
  Sparkles,
  FolderPlus,
  Pencil,
  Trash2,
  GripVertical,
  Layers,
  LayoutGrid,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import AddCharacterModal from "./AddCharacterModal"
import { openModal, replaceModal } from "./ModalManager"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import EmbeddedCoPilot from "@/components/copilot/EmbeddedCoPilot"
import type { Character, Actor } from "@/types/casting"
import {
  DndContext,
  closestCenter,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface CharacterCategory {
  id: string
  name: string
  isExpanded: boolean
  characterIds: string[]
}

interface CharactersModalProps {
  onClose: () => void
}

type SortOption = "alphabetical" | "actorCount" | "progress" | "recent"
type FilterOption = "all" | "cast" | "inProgress" | "notStarted"
type GenderFilter = "all" | "male" | "female" | "other"
type CardViewMode = "full" | "medium" | "small"

function ViewModeToggle({ value, onChange }: { value: CardViewMode; onChange: (mode: CardViewMode) => void }) {
  const modes: { mode: CardViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: "full", label: "Full", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { mode: "medium", label: "Medium", icon: <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg> },
    { mode: "small", label: "Small", icon: <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="3" x2="13" y2="3" /><line x1="1" y1="7" x2="13" y2="7" /><line x1="1" y1="11" x2="13" y2="11" /></svg> },
  ]
  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
      {modes.map(({ mode, label, icon }) => (
        <button
          key={mode}
          onClick={(e) => { e.stopPropagation(); onChange(mode) }}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
            value === mode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
          title={`${label} view`}
          aria-label={`${label} view`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

interface CharacterCardInnerProps {
  character: Character
  allActors: Actor[]
  castingStatus: { greenlit: number; total: number; hasGreenlit: boolean; progress: number; status: string }
  isSelected: boolean
  selectedActor: Actor | undefined
  greenlitActors: Actor[]
  selectedActors: Record<string, string>
  generatingArtCharacterId: string | null
  handleCharacterClick: (id: string) => void
  handleUploadClick: (e: React.MouseEvent, id: string) => void
  handleGenerateArt: (e: React.MouseEvent, id: string, name: string) => void
  handleActorSelect: (e: React.MouseEvent, characterId: string, actorId: string) => void
  viewMode?: CardViewMode
}

function CharacterCardInner({
  character,
  allActors,
  castingStatus,
  isSelected,
  selectedActor,
  greenlitActors,
  selectedActors,
  generatingArtCharacterId,
  handleCharacterClick,
  handleUploadClick,
  handleGenerateArt,
  handleActorSelect,
  viewMode = "full",
}: CharacterCardInnerProps) {
  const MAX_MOSAIC = 9
  const MAX_AVATAR_ROW = 5
  const actorsWithPhotos = allActors.filter((a) => a.headshots?.[0])
  const primaryGreenlit = greenlitActors.find((a) => a.headshots?.[0])
  const otherActors = primaryGreenlit ? allActors.filter((a) => a.id !== primaryGreenlit.id) : []
  const heroImg = primaryGreenlit?.headshots?.[0] || actorsWithPhotos[0]?.headshots?.[0]

  // ─── Small: compact list row ───
  if (viewMode === "small") {
    return (
      <div
        onClick={() => handleCharacterClick(character.id)}
        className={`group flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? "border-success-500 ring-2 ring-success-500/20 shadow-sm" : "border-slate-200 hover:border-success-300"
        }`}
      >
        {/* Actor count */}
        <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${
          allActors.length > 0 ? "bg-success-50 text-success-700" : "bg-slate-100 text-slate-400"
        }`}>
          <div className="flex flex-col items-center leading-none">
            <span className="text-sm font-bold">{allActors.length}</span>
          </div>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{character.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-500">{allActors.length} actor{allActors.length !== 1 ? "s" : ""}</span>
            {castingStatus.hasGreenlit && (
              <span className="text-[11px] text-success-600 flex items-center gap-0.5 font-medium"><CircleCheckBig className="w-3 h-3" />Cast</span>
            )}
          </div>
        </div>
        {/* Badges */}
        {isSelected && <span className="px-2 py-0.5 bg-success-500 text-white text-[10px] font-semibold rounded-md flex-shrink-0">Current</span>}
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-success-500 transition-colors flex-shrink-0" />
      </div>
    )
  }

  // ─── Medium: compact card with small image ───
  if (viewMode === "medium") {
    return (
      <div
        onClick={() => handleCharacterClick(character.id)}
        className={`group relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
          isSelected ? "border-success-500 ring-2 ring-success-500/20 shadow-sm" : "border-slate-200 hover:border-success-300"
        }`}
      >
        {/* Actor counter + thumbnails */}
        <div className={`relative px-3 py-3.5 ${
          allActors.length > 0 ? "bg-success-50/40" : "bg-slate-50"
        }`}>
          {/* Status badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
            {isSelected && <div className="px-1.5 py-0.5 bg-success-500 text-white text-[10px] font-semibold rounded-md shadow-sm">Current</div>}
            {castingStatus.hasGreenlit && <div className="px-1.5 py-0.5 bg-success-100 text-success-700 text-[10px] font-semibold rounded-md shadow-sm flex items-center gap-0.5"><CircleCheckBig className="w-2.5 h-2.5" />Cast</div>}
          </div>
          <div className="flex items-center gap-2.5 mt-3">
            {/* Count badge */}
            <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg flex-shrink-0 ${
              allActors.length > 0 ? "bg-success-100/80 text-success-700" : "bg-slate-100 text-slate-400"
            }`}>
              <span className="text-lg font-bold leading-none">{allActors.length}</span>
              <span className="text-[8px] font-medium mt-0.5 opacity-70">actor{allActors.length !== 1 ? "s" : ""}</span>
            </div>
            {/* Thumbnail row */}
            {actorsWithPhotos.length > 0 ? (
              <div className="flex items-center flex-1 min-w-0">
                {actorsWithPhotos.slice(0, 4).map((actor, i) => (
                  <div
                    key={actor.id}
                    className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-200 flex-shrink-0 shadow-sm"
                    style={{ marginLeft: i > 0 ? "-6px" : "0", zIndex: 4 - i }}
                    title={actor.name}
                  >
                    {isValidImageUrl(actor.headshots?.[0]) ? <img src={actor.headshots[0]} alt={actor.name} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-3 h-3 text-slate-500" /></div>}
                  </div>
                ))}
                {actorsWithPhotos.length > 4 && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white bg-slate-700/70 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 shadow-sm"
                    style={{ marginLeft: "-6px", zIndex: 0 }}
                  >
                    +{actorsWithPhotos.length - 4}
                  </div>
                )}
              </div>
            ) : allActors.length > 0 ? (
              <div className="flex items-center flex-1 min-w-0">
                {allActors.slice(0, 4).map((actor, i) => (
                  <div
                    key={actor.id}
                    className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0 shadow-sm"
                    style={{ marginLeft: i > 0 ? "-6px" : "0", zIndex: 4 - i }}
                    title={actor.name}
                  >
                    {actor.name.charAt(0)}
                  </div>
                ))}
                {allActors.length > 4 && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-600 flex-shrink-0 shadow-sm"
                    style={{ marginLeft: "-6px", zIndex: 0 }}
                  >
                    +{allActors.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">No actors yet</span>
            )}
          </div>
        </div>
        {/* Compact info */}
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{character.name}</h3>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-success-500 transition-colors flex-shrink-0" />
          </div>
          {greenlitActors.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[11px] text-success-600 font-medium flex items-center gap-0.5"><CircleCheckBig className="w-3 h-3" />{greenlitActors.length} greenlit</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Full: original mosaic card ───
  return (
    <div
      onClick={() => handleCharacterClick(character.id)}
      className={`group relative bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isSelected ? "border-success-500 ring-2 ring-success-500/20 shadow-lg" : "border-slate-200 hover:border-success-300"
      }`}
    >
      {/* Mosaic / Greenlit Hero Image Area */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {(() => {
          if (primaryGreenlit) {
            return (
              <>
                {isValidImageUrl(primaryGreenlit.headshots?.[0]) ? <img src={primaryGreenlit.headshots[0]} alt={primaryGreenlit.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" crossOrigin="anonymous" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100"><User className="w-12 h-12 text-slate-400" /></div>}
                {otherActors.length > 0 && <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />}
                {otherActors.length > 0 && (
                  <div className="absolute bottom-2.5 left-3 flex items-center">
                    {otherActors.slice(0, MAX_AVATAR_ROW).map((actor, i) => (
                      <div key={actor.id} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-slate-300 flex-shrink-0 shadow-sm" style={{ marginLeft: i > 0 ? "-6px" : "0", zIndex: MAX_AVATAR_ROW - i }} title={actor.name}>
                        {isValidImageUrl(actor.headshots?.[0]) ? <img src={actor.headshots[0]} alt={actor.name} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-3 h-3 text-slate-500" /></div>}
                      </div>
                    ))}
                    {otherActors.length > MAX_AVATAR_ROW && (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-800/70 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 shadow-sm" style={{ marginLeft: "-6px", zIndex: 0 }}>+{otherActors.length - MAX_AVATAR_ROW}</div>
                    )}
                  </div>
                )}
              </>
            )
          }
          if (actorsWithPhotos.length > 0) {
            const tiles = actorsWithPhotos.slice(0, MAX_MOSAIC)
            const overflow = allActors.length - tiles.length
            const cols = tiles.length === 1 ? 1 : tiles.length <= 4 ? 2 : 3
            return (
              <div className="w-full h-full grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {tiles.map((actor) => (
                  <div key={actor.id} className="relative overflow-hidden bg-slate-200" title={actor.name}>
                    {isValidImageUrl(actor.headshots?.[0]) ? <img src={actor.headshots[0]} alt={actor.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" crossOrigin="anonymous" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-slate-400" /></div>}
                  </div>
                ))}
                {overflow > 0 && <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-900/60 backdrop-blur-sm text-white text-[10px] font-semibold rounded-md">+{overflow} more</div>}
              </div>
            )
          }
          if (allActors.length > 0) {
            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
                <div className="flex items-center justify-center" style={{ gap: "4px" }}>
                  {allActors.slice(0, 6).map((actor) => (
                    <div key={actor.id} className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500" title={actor.name}>{actor.name.charAt(0).toUpperCase()}</div>
                  ))}
                  {allActors.length > 6 && <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">+{allActors.length - 6}</div>}
                </div>
                <span className="text-[11px] font-medium text-slate-400">{allActors.length} actor{allActors.length !== 1 ? "s" : ""} - no headshots</span>
              </div>
            )
          }
          return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
              <span className="text-xs font-medium">No actors yet</span>
            </div>
          )
        })()}
        <button onClick={(e) => handleUploadClick(e, character.id)} className="absolute bottom-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105 z-10" title="Upload concept art">
          <Upload className="w-4 h-4 text-slate-600" />
        </button>
        <button onClick={(e) => handleGenerateArt(e, character.id, character.name)} disabled={generatingArtCharacterId === character.id} className="absolute bottom-3 right-14 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105 disabled:opacity-100 disabled:cursor-wait z-10" title="Generate AI concept art">
          {generatingArtCharacterId === character.id ? <div className="w-4 h-4 border-2 border-success-500 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4 text-success-600" />}
        </button>
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          {isSelected && <div className="px-2.5 py-1 bg-success-500 text-white text-xs font-semibold rounded-lg shadow-md">Current</div>}
          {castingStatus.hasGreenlit && <div className="px-2.5 py-1 bg-success-100 text-success-700 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1"><CircleCheckBig className="w-3 h-3" />Cast</div>}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-900 text-lg leading-tight truncate">{character.name}</h3>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-success-500 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
        </div>
        {character.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{character.description}</p>}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">{allActors.length} actor{allActors.length !== 1 ? "s" : ""}</span>
            {greenlitActors.length > 0 && <span className="px-2.5 py-1 bg-success-100 text-success-600 rounded-lg font-medium flex items-center gap-1"><CircleCheckBig className="w-3 h-3" />{greenlitActors.length}</span>}
          </div>
          {allActors.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="flex items-center gap-1.5 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  {(() => {
                    const sa = selectedActor
                    if (sa) return (<>{isValidImageUrl(sa.headshots?.[0]) ? <img src={sa.headshots[0]} alt={sa.name} className="w-4 h-4 rounded-full object-cover" /> : <User className="w-3 h-3" />}<span className="max-w-16 truncate">{sa.name}</span></>)
                    return (<><User className="w-3 h-3" /><span>Select</span></>)
                  })()}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Select Actor</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {greenlitActors.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-success-600 flex items-center gap-1"><CircleCheckBig className="w-3 h-3" />Greenlit</DropdownMenuLabel>
                    {greenlitActors.map((actor) => (
                      <DropdownMenuItem key={actor.id} onClick={(e) => handleActorSelect(e, character.id, actor.id)} className="gap-2">
                        {isValidImageUrl(actor.headshots?.[0]) ? <img src={actor.headshots[0]} alt={actor.name} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><User className="w-3 h-3 text-slate-500" /></div>}
                        <span className="flex-1 truncate">{actor.name}</span>
                        {selectedActors[character.id] === actor.id && <Check className="w-4 h-4 text-success-500" />}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                {allActors.filter((a) => !a.isGreenlit).slice(0, 10).map((actor) => (
                  <DropdownMenuItem key={actor.id} onClick={(e) => handleActorSelect(e, character.id, actor.id)} className="gap-2">
                    {isValidImageUrl(actor.headshots?.[0]) ? <img src={actor.headshots[0]} alt={actor.name} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><User className="w-3 h-3 text-slate-500" /></div>}
                    <span className="flex-1 truncate">{actor.name}</span>
                    {selectedActors[character.id] === actor.id && <Check className="w-4 h-4 text-success-500" />}
                  </DropdownMenuItem>
                ))}
                {allActors.filter((a) => !a.isGreenlit).length > 10 && <DropdownMenuItem disabled className="text-xs text-slate-400">+{allActors.filter((a) => !a.isGreenlit).length - 10} more...</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {selectedActor && (
          <div className="mt-3 p-2 bg-slate-50 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {isValidImageUrl(selectedActor.headshots?.[0]) ? <img src={selectedActor.headshots[0]} alt={selectedActor.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm" /> : <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><User className="w-4 h-4 text-slate-500" /></div>}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{selectedActor.name}</p>
              <p className="text-xs text-slate-500">{selectedActor.isGreenlit ? <span className="text-success-600 flex items-center gap-1"><CircleCheckBig className="w-3 h-3" /> Greenlit</span> : selectedActor.age || "Actor"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryDropZone({ categoryId, children }: { categoryId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: categoryId })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] transition-colors duration-200 ${isOver ? "bg-success-50/50" : ""}`}
    >
      {children}
    </div>
  )
}

function EmptyDropZone({ categoryId }: { categoryId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: categoryId })
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center py-10 text-sm border-2 border-dashed m-4 rounded-xl transition-all duration-200 ${
        isOver
          ? "border-success-400 bg-success-50 text-success-600"
          : "border-slate-200 text-slate-400"
      }`}
    >
      {isOver ? "Drop here to add" : "Drag characters here"}
    </div>
  )
}

function SortableCharacterWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto" as any,
  }
  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200/60 opacity-0 group-hover/sortable:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5 text-slate-400" />
      </div>
      {children}
    </div>
  )
}

export default function CharactersModal({ onClose }: CharactersModalProps) {
  const { state, dispatch } = useCasting()
  const [uploadingCharacterId, setUploadingCharacterId] = useState<string | null>(null)
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("alphabetical")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all")
  const [selectedActors, setSelectedActors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [generatingArtCharacterId, setGeneratingArtCharacterId] = useState<string | null>(null)

  // --- Category state ---
  const [showCategoryView, setShowCategoryView] = useState(false)
  const [categories, setCategories] = useState<CharacterCategory[]>([])
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")
  const [activeCharId, setActiveCharId] = useState<string | null>(null)
  const [categoryViewModes, setCategoryViewModes] = useState<Record<string, CardViewMode>>({})
  const [globalViewMode, setGlobalViewMode] = useState<CardViewMode>("full")
  const editInputRef = useRef<HTMLInputElement>(null)

  const getCategoryViewMode = (catId: string): CardViewMode => categoryViewModes[catId] || "full"
  const setCategoryViewMode = (catId: string, mode: CardViewMode) => setCategoryViewModes((prev) => ({ ...prev, [catId]: mode }))
  const gridClasses = (mode: CardViewMode) =>
    mode === "small"
      ? "flex flex-col gap-2 p-4"
      : mode === "medium"
        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4"
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4"

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const characters = currentProject?.characters || []

  // Get all actors for a character
  const getAllActors = (character: Character): Actor[] => {
    const actors: Actor[] = []
    if (character.actors) {
      actors.push(...(character.actors.longList || []))
      actors.push(...(character.actors.audition || []))
      actors.push(...(character.actors.approval || []))
      character.actors.shortLists?.forEach((sl) => {
        actors.push(...(sl.actors || []))
      })
    }
    return actors
  }

  // Get casting status for a character
  const getCastingStatus = (character: Character) => {
    const allActors = getAllActors(character)
    const greenlit = allActors.filter((a) => a.isGreenlit).length
    const total = allActors.length
    const hasGreenlit = greenlit > 0

    return {
      greenlit,
      total,
      hasGreenlit,
      progress: total > 0 ? Math.round((greenlit / Math.max(1, total)) * 100) : 0,
      status: hasGreenlit ? "cast" : total > 0 ? "inProgress" : "notStarted",
    }
  }

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (characters.length === 0) return { cast: 0, total: 0, percentage: 0 }
    const cast = characters.filter((c) => getCastingStatus(c).hasGreenlit).length
    return {
      cast,
      total: characters.length,
      percentage: Math.round((cast / characters.length) * 100),
    }
  }, [characters])

  // Filter and sort characters
  const filteredAndSortedCharacters = useMemo(() => {
    let result = [...characters]

    // Apply casting status filter
    if (filterBy !== "all") {
      result = result.filter((c) => getCastingStatus(c).status === filterBy)
    }

    // Apply gender filter (based on character description or name heuristics)
    if (genderFilter !== "all") {
      result = result.filter((c) => {
        const desc = (c.description || "").toLowerCase()
        if (genderFilter === "male") return desc.includes("male") || desc.includes("man") || desc.includes("boy")
        if (genderFilter === "female") return desc.includes("female") || desc.includes("woman") || desc.includes("girl")
        return true
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "alphabetical":
          return a.name.localeCompare(b.name)
        case "actorCount":
          return getAllActors(b).length - getAllActors(a).length
        case "progress":
          return getCastingStatus(b).progress - getCastingStatus(a).progress
        default:
          return 0
      }
    })

    return result
  }, [characters, filterBy, genderFilter, sortBy])

const handleCharacterClick = (characterId: string) => {
  dispatch({ type: "SELECT_CHARACTER", payload: characterId })
  // Use replaceModal for smooth transition without flicker
  replaceModal("casting")
  }

  const handleUploadClick = (e: React.MouseEvent, characterId: string) => {
    e.stopPropagation()
    setUploadingCharacterId(characterId)
    fileInputRef.current?.click()
  }

  const handleGenerateArt = async (e: React.MouseEvent, characterId: string, characterName: string) => {
    e.stopPropagation()
    setGeneratingArtCharacterId(characterId)

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate a simple placeholder for AI-generated concept art
    const placeholderUrl = ""

    dispatch({
      type: "UPDATE_CHARACTER_CONCEPT_ART",
      payload: {
        characterId,
        conceptArt: placeholderUrl,
      },
    })

    setGeneratingArtCharacterId(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && uploadingCharacterId) {
      const imageUrl = URL.createObjectURL(file)
      dispatch({
        type: "UPDATE_CHARACTER_CONCEPT_ART",
        payload: {
          characterId: uploadingCharacterId,
          conceptArt: imageUrl,
        },
      })
    }
    setUploadingCharacterId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleActorSelect = (e: React.MouseEvent, characterId: string, actorId: string) => {
    e.stopPropagation()
    setSelectedActors((prev) => ({
      ...prev,
      [characterId]: actorId,
    }))
  }

  const getSelectedActor = (character: Character): Actor | undefined => {
    const selectedId = selectedActors[character.id]
    if (!selectedId) return undefined
    return getAllActors(character).find((a) => a.id === selectedId)
  }

  // --- localStorage persistence for categories ---
  const projectId = state.currentFocus.currentProjectId
  const storageKey = `greenlight-categories-${projectId}`

  useEffect(() => {
    if (!projectId) return
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as CharacterCategory[]
        setCategories(parsed)
        setShowCategoryView(parsed.length > 0)
      } else {
        setCategories([])
      }
    } catch {
      setCategories([])
    }
  }, [projectId, storageKey])

  const persistCategories = useCallback(
    (next: CharacterCategory[]) => {
      setCategories(next)
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch { /* quota exceeded, silently fail */ }
    },
    [storageKey],
  )

  // --- Category CRUD ---
  const addCategory = () => {
    const id = `cat_${Date.now()}`
    const next = [...categories, { id, name: `Category ${categories.length + 1}`, isExpanded: true, characterIds: [] }]
    persistCategories(next)
    setEditingCategoryId(id)
    setEditingCategoryName(`Category ${categories.length + 1}`)
    if (!showCategoryView) setShowCategoryView(true)
  }

  const renameCategory = (id: string) => {
    if (!editingCategoryName.trim()) return
    persistCategories(categories.map((c) => (c.id === id ? { ...c, name: editingCategoryName.trim() } : c)))
    setEditingCategoryId(null)
    setEditingCategoryName("")
  }

  const deleteCategory = (id: string) => {
    persistCategories(categories.filter((c) => c.id !== id))
  }

  const toggleCategoryExpand = (id: string) => {
    persistCategories(categories.map((c) => (c.id === id ? { ...c, isExpanded: !c.isExpanded } : c)))
  }

  // Characters not in any category
  const categorizedIds = useMemo(() => new Set(categories.flatMap((c) => c.characterIds)), [categories])
  const uncategorizedChars = useMemo(
    () => filteredAndSortedCharacters.filter((c) => !categorizedIds.has(c.id)),
    [filteredAndSortedCharacters, categorizedIds],
  )

  // --- DnD sensors + handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCharId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCharId(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    // Find which category the dragged item currently belongs to
    const sourceCat = categories.find((c) => c.characterIds.includes(activeId))

    // Determine destination: overId could be a category id (from useDroppable), or a character id (from useSortable)
    let destCat: CharacterCategory | undefined
    let destIsUncategorized = false

    // Check if overId matches a category id directly (dropped on the category zone / empty zone)
    destCat = categories.find((c) => c.id === overId)

    if (!destCat) {
      // overId is a character id -- find which category it belongs to
      destCat = categories.find((c) => c.characterIds.includes(overId))
      // If the over-character is uncategorized, destination is uncategorized
      if (!destCat) {
        destIsUncategorized = true
      }
    }

    let next = categories.map((c) => ({ ...c, characterIds: [...c.characterIds] }))

    // Remove from source category first
    if (sourceCat) {
      next = next.map((c) =>
        c.id === sourceCat.id
          ? { ...c, characterIds: c.characterIds.filter((id) => id !== activeId) }
          : c
      )
    }

    if (destIsUncategorized) {
      // Just remove from source -- character becomes uncategorized
      persistCategories(next)
      return
    }

    if (destCat) {
      const destIdx = next.findIndex((c) => c.id === destCat!.id)
      if (destIdx === -1) return

      const overCharIdx = next[destIdx].characterIds.indexOf(overId)

      if (sourceCat?.id === destCat.id) {
        // Reorder within same category
        const currentIds = next[destIdx].characterIds
        const activeIdx = currentIds.indexOf(activeId)
        if (activeIdx >= 0 && overCharIdx >= 0) {
          next[destIdx].characterIds = arrayMove(currentIds, activeIdx, overCharIdx)
        } else if (activeIdx === -1) {
          // Was removed above, re-insert at position
          currentIds.splice(Math.max(overCharIdx, 0), 0, activeId)
        }
      } else {
        // Moving to a different category
        if (overCharIdx >= 0) {
          // Insert next to the character we dropped on
          next[destIdx].characterIds.splice(overCharIdx, 0, activeId)
        } else {
          // Dropped on the empty zone of this category -- append
          next[destIdx].characterIds.push(activeId)
        }
      }

      persistCategories(next)
    }
  }

  // Find the dragged character for DragOverlay
  const activeCharacter = activeCharId ? characters.find((c) => c.id === activeCharId) : null

const handleOpenCharacterBible = () => {
  // Stack Character Bible on top of Characters modal
  // When Character Bible closes, Characters modal will still be visible underneath
  openModal("scriptAnalysis")
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col pl-14">
        {/* Slim Sidebar Strip / Expandable Drawer */}
        <FloatingSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          currentModal="characters"
        />

        {/* Header */}
        <ModalHeader
          title="Characters"
          titleColor="bg-purple-600"
          onClose={onClose}
        />

        {/* Toolbar */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-white">

            {characters.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Casting Progress</span>
                  <span className="text-sm font-semibold text-success-600">
                    {overallProgress.cast} / {overallProgress.total} Cast ({overallProgress.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success-400 to-success-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${overallProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {characters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg gap-2 bg-transparent">
                      <SortAsc className="w-4 h-4" />
                      Sort
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy("alphabetical")} className="gap-2">
                      {sortBy === "alphabetical" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={sortBy !== "alphabetical" ? "pl-6" : ""}>Alphabetically</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("actorCount")} className="gap-2">
                      {sortBy === "actorCount" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={sortBy !== "actorCount" ? "pl-6" : ""}>Actor Count</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("progress")} className="gap-2">
                      {sortBy === "progress" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={sortBy !== "progress" ? "pl-6" : ""}>Casting Progress</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Casting Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg gap-2 bg-transparent">
                      <Filter className="w-4 h-4" />
                      Status
                      {filterBy !== "all" && (
                        <span className="ml-1 px-1.5 py-0.5 bg-success-100 text-success-700 text-xs rounded-md">
                          {filterBy === "cast" ? "Cast" : filterBy === "inProgress" ? "In Progress" : "Not Started"}
                        </span>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Casting Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterBy("all")} className="gap-2">
                      {filterBy === "all" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={filterBy !== "all" ? "pl-6" : ""}>All Characters</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("cast")} className="gap-2">
                      {filterBy === "cast" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={filterBy !== "cast" ? "pl-6" : ""}>Cast</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("inProgress")} className="gap-2">
                      {filterBy === "inProgress" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={filterBy !== "inProgress" ? "pl-6" : ""}>In Progress</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("notStarted")} className="gap-2">
                      {filterBy === "notStarted" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={filterBy !== "notStarted" ? "pl-6" : ""}>Not Started</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Gender Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg gap-2 bg-transparent">
                      <User className="w-4 h-4" />
                      Gender
                      {genderFilter !== "all" && (
                        <span className="ml-1 px-1.5 py-0.5 bg-info-100 text-info-700 text-xs rounded-md capitalize">
                          {genderFilter}
                        </span>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuLabel>Gender</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setGenderFilter("all")} className="gap-2">
                      {genderFilter === "all" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={genderFilter !== "all" ? "pl-6" : ""}>All</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGenderFilter("male")} className="gap-2">
                      {genderFilter === "male" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={genderFilter !== "male" ? "pl-6" : ""}>Male</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGenderFilter("female")} className="gap-2">
                      {genderFilter === "female" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={genderFilter !== "female" ? "pl-6" : ""}>Female</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGenderFilter("other")} className="gap-2">
                      {genderFilter === "other" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={genderFilter !== "other" ? "pl-6" : ""}>Other</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Active Filters Count */}
                {(filterBy !== "all" || genderFilter !== "all") && (
                  <button
                    onClick={() => {
                      setFilterBy("all")
                      setGenderFilter("all")
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline ml-2"
                  >
                    Clear filters
                  </button>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Character Bible */}
                <Button
                  onClick={handleOpenCharacterBible}
                  variant="outline"
                  size="sm"
                  className="rounded-lg gap-2 border-info-200 text-info-700 hover:bg-info-50 transition-all duration-200 bg-transparent"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Character Bible</span>
                </Button>

                {/* Create Character */}
                <Button
                  onClick={() => setShowAddCharacterModal(true)}
                  size="sm"
                  className="bg-success-500 hover:bg-success-600 text-white rounded-lg gap-2 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Character</span>
                </Button>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-200" />

                {/* Category View Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCategoryView(!showCategoryView)}
                  className={`rounded-lg gap-2 transition-colors ${showCategoryView ? "bg-success-50 border-success-300 text-success-700" : "bg-transparent"}`}
                >
                  {showCategoryView ? <LayoutGrid className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                  {showCategoryView ? "Grid View" : "Categories"}
                </Button>

                {/* Add Category */}
                {showCategoryView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCategory}
                    className="rounded-lg gap-2 bg-transparent border-dashed border-slate-300 text-slate-600 hover:border-success-400 hover:text-success-600"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Add Category
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white">
            {characters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Characters Yet</h3>
                <p className="text-slate-500 mb-6 max-w-md">
                  Create your first character to start organizing actors for your casting sessions.
                </p>
                <Button
                  onClick={() => setShowAddCharacterModal(true)}
                  className="bg-success-500 hover:bg-success-600 text-white rounded-xl px-6 py-3 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create First Character</span>
                </Button>
              </div>
            ) : filteredAndSortedCharacters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Filter className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Matching Characters</h3>
                <p className="text-slate-500 mb-6 max-w-md">
                  No characters match your current filters. Try adjusting your filter settings.
                </p>
                <Button
                  onClick={() => {
                    setFilterBy("all")
                    setGenderFilter("all")
                  }}
                  variant="outline"
                  className="rounded-xl"
                >
                  Clear Filters
                </Button>
              </div>
            ) : showCategoryView ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={pointerWithin}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="space-y-4">
                    {categories.map((category) => {
                      const catChars = category.characterIds
                        .map((cid) => filteredAndSortedCharacters.find((c) => c.id === cid))
                        .filter(Boolean) as Character[]

                      return (
                        <div key={category.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                          {/* Category header */}
                          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                            <button
                              onClick={() => toggleCategoryExpand(category.id)}
                              className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
                              aria-label={category.isExpanded ? "Collapse category" : "Expand category"}
                            >
                              <ChevronRight
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${category.isExpanded ? "rotate-90" : ""}`}
                              />
                            </button>

                            {editingCategoryId === category.id ? (
                              <input
                                ref={editInputRef}
                                autoFocus
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onBlur={() => renameCategory(category.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") renameCategory(category.id)
                                  if (e.key === "Escape") { setEditingCategoryId(null); setEditingCategoryName("") }
                                }}
                                className="flex-1 text-sm font-semibold bg-white border border-success-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-success-400"
                              />
                            ) : (
                              <span className="flex-1 text-sm font-semibold text-slate-800 truncate">{category.name}</span>
                            )}

                            <span className="text-xs text-slate-400 font-medium tabular-nums">
                              {catChars.length} character{catChars.length !== 1 ? "s" : ""}
                            </span>

                            <ViewModeToggle value={getCategoryViewMode(category.id)} onChange={(m) => setCategoryViewMode(category.id, m)} />

                            <button
                              onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name) }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                              title="Rename category"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteCategory(category.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Category body */}
                          <div
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${
                              category.isExpanded ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <CategoryDropZone categoryId={category.id}>
                            <SortableContext items={catChars.map((c) => c.id)} strategy={rectSortingStrategy} id={category.id}>
                              {catChars.length === 0 ? (
                                <EmptyDropZone categoryId={category.id} />
                              ) : (
                                <div className={gridClasses(getCategoryViewMode(category.id))}>
                                  {catChars.map((character) => {
                                    const allActors = getAllActors(character)
                                    const castingStatus = getCastingStatus(character)
                                    const isSelected = state.currentFocus.characterId === character.id
                                    const selectedActor = getSelectedActor(character)
                                    const greenlitActors = allActors.filter((a) => a.isGreenlit)
                                    return (
                                      <SortableCharacterWrapper key={character.id} id={character.id}>
                                        <CharacterCardInner
                                          character={character}
                                          allActors={allActors}
                                          castingStatus={castingStatus}
                                          isSelected={isSelected}
                                          selectedActor={selectedActor}
                                          greenlitActors={greenlitActors}
                                          selectedActors={selectedActors}
                                          generatingArtCharacterId={generatingArtCharacterId}
                                          handleCharacterClick={handleCharacterClick}
                                          handleUploadClick={handleUploadClick}
                                          handleGenerateArt={handleGenerateArt}
                                          handleActorSelect={handleActorSelect}
                                          viewMode={getCategoryViewMode(category.id)}
                                        />
                                      </SortableCharacterWrapper>
                                    )
                                  })}
                                </div>
                              )}
                            </SortableContext>
                            </CategoryDropZone>
                          </div>
                        </div>
                      )
                    })}

                    {/* Uncategorized section */}
                    {uncategorizedChars.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                          <Layers className="w-4 h-4 text-slate-400" />
                          <span className="flex-1 text-sm font-semibold text-slate-500">Uncategorized</span>
                          <span className="text-xs text-slate-400 font-medium tabular-nums">
                            {uncategorizedChars.length} character{uncategorizedChars.length !== 1 ? "s" : ""}
                          </span>
                          <ViewModeToggle value={getCategoryViewMode("_uncategorized")} onChange={(m) => setCategoryViewMode("_uncategorized", m)} />
                        </div>
                        <SortableContext items={uncategorizedChars.map((c) => c.id)} strategy={rectSortingStrategy} id="uncategorized">
                          <div className={gridClasses(getCategoryViewMode("_uncategorized"))}>
                            {uncategorizedChars.map((character) => {
                              const allActors = getAllActors(character)
                              const castingStatus = getCastingStatus(character)
                              const isSelected = state.currentFocus.characterId === character.id
                              const selectedActor = getSelectedActor(character)
                              const greenlitActors = allActors.filter((a) => a.isGreenlit)
                              return (
                                <SortableCharacterWrapper key={character.id} id={character.id}>
                                  <CharacterCardInner
                                    character={character}
                                    allActors={allActors}
                                    castingStatus={castingStatus}
                                    isSelected={isSelected}
                                    selectedActor={selectedActor}
                                    greenlitActors={greenlitActors}
                                    selectedActors={selectedActors}
                                    generatingArtCharacterId={generatingArtCharacterId}
                                    handleCharacterClick={handleCharacterClick}
                                    handleUploadClick={handleUploadClick}
                                    handleGenerateArt={handleGenerateArt}
                                    handleActorSelect={handleActorSelect}
                                    viewMode={getCategoryViewMode("_uncategorized")}
                                  />
                                </SortableCharacterWrapper>
                              )
                            })}
                          </div>
                        </SortableContext>
                      </div>
                    )}
                  </div>

                  {/* Drag overlay */}
                  <DragOverlay>
                    {activeCharacter ? (
                      <div className="w-72 opacity-80 rotate-2 shadow-2xl rounded-2xl overflow-hidden border-2 border-success-400 pointer-events-none">
                        <div className="bg-white p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                            {activeCharacter.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{activeCharacter.name}</p>
                            <p className="text-xs text-slate-500">{getAllActors(activeCharacter).length} actors</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
              <div>
                <div className="flex justify-end mb-4">
                  <ViewModeToggle value={globalViewMode} onChange={setGlobalViewMode} />
                </div>
                <div className={
                  globalViewMode === "small"
                    ? "flex flex-col gap-2"
                    : globalViewMode === "medium"
                      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                }>
                  {filteredAndSortedCharacters.map((character) => {
                    const allActors = getAllActors(character)
                    const castingStatus = getCastingStatus(character)
                    const isSelected = state.currentFocus.characterId === character.id
                    const selectedActor = getSelectedActor(character)
                    const greenlitActors = allActors.filter((a) => a.isGreenlit)

                    return (
                      <CharacterCardInner
                        key={character.id}
                        character={character}
                        allActors={allActors}
                        castingStatus={castingStatus}
                        isSelected={isSelected}
                        selectedActor={selectedActor}
                        greenlitActors={greenlitActors}
                        selectedActors={selectedActors}
                        generatingArtCharacterId={generatingArtCharacterId}
                        handleCharacterClick={handleCharacterClick}
                        handleUploadClick={handleUploadClick}
                        handleGenerateArt={handleGenerateArt}
                        handleActorSelect={handleActorSelect}
                        viewMode={globalViewMode}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {/* Embedded CoPilot - Fixed position in lower right corner */}
        <div className="fixed bottom-6 right-6 z-40">
          <EmbeddedCoPilot context="characters" />
        </div>
      </div>

      {showAddCharacterModal && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[8vh] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="animate-in slide-in-from-top-4 fade-in duration-300 w-full max-w-2xl mx-4">
            <AddCharacterModal onClose={() => setShowAddCharacterModal(false)} />
          </div>
        </div>
      )}
    </>
  )
}
