"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import {
  X,
  Save,
  Undo2,
  Redo2,
  Lock,
  Unlock,
  ChevronDown,
  FileText,
  Film,
  MessageSquare,
  Type,
  AlignRight,
  Parentheses,
  Search,
  Plus,
  Trash2,
  Tag,
  ChevronRight,
  Eye,
  EyeOff,
  Asterisk,
  Palette,
  Hash,
  List,
  Settings2,
  ZoomIn,
  ZoomOut,
  BookOpen,
  BarChart3,
  Keyboard,
  Users,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Delete,
  LayoutGrid,
  GripVertical,
  Pencil,
  Link2,
  Home,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal } from "./ModalManager"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import EmbeddedCoPilot from "@/components/copilot/EmbeddedCoPilot"
import type {
  ScriptBlock,
  ScriptBlockType,
  ScriptData,
  RevisionColor,
  BreakdownTag,
  BeatItem,
  BeatColor,
} from "@/types/casting"
import { MOCK_SCRIPT_DATA } from "@/data/mockScriptAndSchedule"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const uid = () => Math.random().toString(36).slice(2, 10)

const BLOCK_TYPE_LABELS: Record<ScriptBlockType, string> = {
  "scene-heading": "Scene Heading",
  action: "Action",
  character: "Character",
  dialogue: "Dialogue",
  parenthetical: "Parenthetical",
  transition: "Transition",
}

const BLOCK_TYPE_ICONS: Record<ScriptBlockType, typeof Film> = {
  "scene-heading": Film,
  action: Type,
  character: MessageSquare,
  dialogue: BookOpen,
  parenthetical: Parentheses,
  transition: AlignRight,
}

const REVISION_COLORS: { key: RevisionColor; label: string; color: string; bg: string }[] = [
  { key: "white", label: "White (Original)", color: "text-gray-700", bg: "bg-white" },
  { key: "blue", label: "Blue", color: "text-blue-700", bg: "bg-blue-100" },
  { key: "pink", label: "Pink", color: "text-pink-700", bg: "bg-pink-100" },
  { key: "yellow", label: "Yellow", color: "text-yellow-700", bg: "bg-yellow-100" },
  { key: "green", label: "Green", color: "text-green-700", bg: "bg-green-100" },
  { key: "goldenrod", label: "Goldenrod", color: "text-amber-700", bg: "bg-amber-100" },
  { key: "salmon", label: "Salmon", color: "text-orange-700", bg: "bg-orange-100" },
  { key: "cherry", label: "Cherry", color: "text-red-700", bg: "bg-red-100" },
]

const BREAKDOWN_CATEGORIES = [
  { key: "prop", label: "Prop", color: "bg-violet-200 text-violet-800" },
  { key: "vehicle", label: "Vehicle", color: "bg-blue-200 text-blue-800" },
  { key: "wardrobe", label: "Wardrobe", color: "bg-pink-200 text-pink-800" },
  { key: "sfx", label: "SFX", color: "bg-orange-200 text-orange-800" },
  { key: "vfx", label: "VFX", color: "bg-cyan-200 text-cyan-800" },
  { key: "animal", label: "Animal", color: "bg-green-200 text-green-800" },
  { key: "extra", label: "Extra", color: "bg-yellow-200 text-yellow-800" },
  { key: "stunt", label: "Stunt", color: "bg-red-200 text-red-800" },
]

function getNextType(current: ScriptBlockType, isTab: boolean): ScriptBlockType {
  if (isTab) {
    if (current === "action") return "character"
    if (current === "dialogue") return "parenthetical"
    return current
  }
  // Enter logic
  switch (current) {
    case "scene-heading": return "action"
    case "character": return "dialogue"
    case "parenthetical": return "dialogue"
    case "dialogue": return "action"
    case "transition": return "scene-heading"
    default: return "action"
  }
}

function detectBlockType(text: string): ScriptBlockType | null {
  const trimmed = text.trim()
  if (/^(INT\.|EXT\.|I\/E\.|INT\/EXT\.)/i.test(trimmed)) return "scene-heading"
  if (/^(CUT TO:|FADE OUT\.|FADE IN:|DISSOLVE TO:|SMASH CUT TO:|MATCH CUT TO:)/i.test(trimmed)) return "transition"
  if (/^\(.*\)$/.test(trimmed)) return "parenthetical"
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 1 && /^[A-Z\s.'"-]+$/.test(trimmed)) return "character"
  return null
}

function getEmptyScript(): ScriptData {
  return {
    ...MOCK_SCRIPT_DATA,
    lastModified: Date.now(),
  }
}

/* ------------------------------------------------------------------ */
/*  ScriptBlock Row (contentEditable line)                              */
/* ------------------------------------------------------------------ */
function ScriptBlockRow({
  block,
  index,
  isActive,
  onActivate,
  onTextChange,
  onKeyDown,
  onTypeChange,
  sceneNumber,
  characters,
  showBreakdownTags,
  onAddBreakdownTag,
  onRemoveBreakdownTag,
  isLocked,
  zoom,
  isDragTarget,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  block: ScriptBlock
  index: number
  isActive: boolean
  onActivate: () => void
  onTextChange: (text: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onTypeChange: (type: ScriptBlockType) => void
  sceneNumber?: string
  characters: { id: string; name: string }[]
  showBreakdownTags: boolean
  onAddBreakdownTag: (tag: BreakdownTag) => void
  onRemoveBreakdownTag: (tagId: string) => void
  isLocked: boolean
  zoom: number
  isDragTarget?: boolean
  onDragStart?: (idx: number) => void
  onDragOver?: (idx: number) => void
  onDragEnd?: () => void
  onDrop?: (idx: number) => void
}) {
  const editRef = useRef<HTMLDivElement>(null)
  const typeBtnRef = useRef<HTMLButtonElement>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteItems, setAutocompleteItems] = useState<{ id: string; name: string }[]>([])
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [typeMenuPos, setTypeMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string } | null>(null)

  useEffect(() => {
    if (editRef.current && editRef.current.textContent !== block.text) {
      editRef.current.textContent = block.text
    }
  }, [block.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close type menu on outside click
  useEffect(() => {
    if (!showTypeMenu) return
    const handler = () => setShowTypeMenu(false)
    const timer = setTimeout(() => document.addEventListener("click", handler), 0)
    return () => { clearTimeout(timer); document.removeEventListener("click", handler) }
  }, [showTypeMenu])

  /** Apply smart casing: uppercase for character + scene-heading blocks */
  const applySmartCasing = useCallback(() => {
    if (!editRef.current) return
    const text = editRef.current.textContent || ""
    if ((block.type === "character" || block.type === "scene-heading") && text.length > 0) {
      const upper = text.toUpperCase()
      if (text !== upper) {
        // Preserve cursor position
        const sel = window.getSelection()
        const offset = sel?.focusOffset || text.length
        editRef.current.textContent = upper
        onTextChange(upper)
        // Restore cursor
        try {
          const range = document.createRange()
          const node = editRef.current.firstChild || editRef.current
          range.setStart(node, Math.min(offset, upper.length))
          range.collapse(true)
          sel?.removeAllRanges()
          sel?.addRange(range)
        } catch { /* noop */ }
        return
      }
    }
  }, [block.type, onTextChange])

  const handleInput = () => {
    const text = editRef.current?.textContent || ""
    onTextChange(text)

    // Smart casing: auto-uppercase character and scene-heading lines as user types
    if (block.type === "character" || block.type === "scene-heading") {
      applySmartCasing()
    }

    // Character autocomplete
    if (block.type === "character" && text.length > 0) {
      const upper = (editRef.current?.textContent || text).toUpperCase()
      const matches = characters.filter((c) =>
        c.name.toUpperCase().startsWith(upper)
      )
      if (matches.length > 0 && upper !== matches[0]?.name.toUpperCase()) {
        setAutocompleteItems(matches.slice(0, 5))
        setShowAutocomplete(true)
      } else {
        setShowAutocomplete(false)
      }
    } else {
      setShowAutocomplete(false)
    }
  }

  // Also apply smart casing when block type changes externally
  useEffect(() => {
    if (block.type === "character" || block.type === "scene-heading") {
      applySmartCasing()
    }
  }, [block.type, applySmartCasing])

  const handleSelectAutocomplete = (name: string) => {
    if (editRef.current) {
      editRef.current.textContent = name.toUpperCase()
      onTextChange(name.toUpperCase())
    }
    setShowAutocomplete(false)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!showBreakdownTags) return
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (text && text.length > 0) {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, text })
    }
  }

  const handleTagAs = (category: string) => {
    if (!contextMenu) return
    const tag: BreakdownTag = {
      id: uid(),
      startOffset: 0,
      endOffset: contextMenu.text.length,
      text: contextMenu.text,
      category,
    }
    onAddBreakdownTag(tag)
    setContextMenu(null)
  }

  // Indentation and styling per block type
  const blockStyles: Record<ScriptBlockType, string> = {
    "scene-heading": "uppercase font-bold tracking-wide",
    action: "",
    character: "text-center uppercase tracking-wider",
    dialogue: "mx-auto max-w-[65%] text-center",
    parenthetical: "mx-auto max-w-[50%] text-center italic",
    transition: "text-right uppercase",
  }

  const revColor = REVISION_COLORS.find((r) => r.key === block.revisionColor)
  const baseFontSize = 12 * zoom

  return (
    <div
      className={`group relative transition-colors ${isActive ? "bg-amber-50/40" : ""} ${isDragTarget ? "border-t-2 border-amber-400" : "border-t-2 border-transparent"}`}
      onClick={onActivate}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver?.(index) }}
      onDrop={(e) => { e.preventDefault(); onDrop?.(index) }}
    >
      {/* Scene number gutter */}
      {block.type === "scene-heading" && sceneNumber && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-gray-400 select-none" style={{ fontSize: 10 * zoom }}>
          {sceneNumber}
        </div>
      )}

      {/* Changed asterisk */}
      {isLocked && block.changed && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 select-none">
          <Asterisk className="w-3 h-3" />
        </div>
      )}

      {/* Revision color bar */}
      {block.revisionColor && block.revisionColor !== "white" && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${revColor?.bg || "bg-gray-200"} rounded-r`} />
      )}

      {/* Drag handle + Block type indicator (on hover) */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
        {/* Drag handle */}
        <div
          draggable
          onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart?.(index) }}
          onDragEnd={() => onDragEnd?.()}
          className="cursor-grab active:cursor-grabbing p-0.5 text-stone-300 hover:text-stone-500 transition-colors"
          title="Drag to reorder"
        >
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/></svg>
        </div>
        {/* Type button */}
        <button
          ref={typeBtnRef}
          onClick={(e) => {
            e.stopPropagation()
            if (!showTypeMenu) {
              const rect = typeBtnRef.current?.getBoundingClientRect()
              if (rect) setTypeMenuPos({ top: rect.bottom + 4, left: rect.left })
            }
            setShowTypeMenu(!showTypeMenu)
          }}
          className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
          title="Change block type"
        >
          {(() => {
            const Icon = BLOCK_TYPE_ICONS[block.type]
            return <Icon className="w-3 h-3" />
          })()}
        </button>
      </div>

      {/* Type picker dropdown -- fixed to viewport */}
      {showTypeMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-[80] min-w-[160px]"
          style={{ top: typeMenuPos.top, left: typeMenuPos.left }}
        >
          {(Object.keys(BLOCK_TYPE_LABELS) as ScriptBlockType[]).map((t) => {
            const Icon = BLOCK_TYPE_ICONS[t]
            return (
              <button
                key={t}
                onClick={(e) => { e.stopPropagation(); onTypeChange(t); setShowTypeMenu(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-stone-50 transition-colors ${block.type === t ? "text-amber-700 font-semibold bg-amber-50" : "text-stone-700"}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {BLOCK_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      )}

      {/* The editable content */}
      <div className="pl-10 pr-8 py-1">
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={onKeyDown}
          onFocus={onActivate}
          onContextMenu={handleContextMenu}
          className={`outline-none whitespace-pre-wrap ${blockStyles[block.type]} text-gray-900`}
          style={{
            fontFamily: "'Courier Prime', 'Courier New', monospace",
            fontSize: `${baseFontSize}pt`,
            lineHeight: 1.5,
            minHeight: `${baseFontSize * 1.5}pt`,
          }}
          data-placeholder={block.type === "scene-heading" ? "INT./EXT. LOCATION - TIME" : block.type === "character" ? "CHARACTER NAME" : block.type === "dialogue" ? "Dialogue..." : block.type === "parenthetical" ? "(parenthetical)" : block.type === "transition" ? "CUT TO:" : "Action description..."}
          spellCheck
        />
      </div>

      {/* Breakdown tags display */}
      {showBreakdownTags && block.breakdownTags && block.breakdownTags.length > 0 && (
        <div className="pl-10 pr-8 pb-1 flex flex-wrap gap-1">
          {block.breakdownTags.map((tag) => {
            const cat = BREAKDOWN_CATEGORIES.find((c) => c.key === tag.category)
            return (
              <span key={tag.id} className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${cat?.color || "bg-gray-200 text-gray-700"}`}>
                <Tag className="w-2.5 h-2.5" />
                {tag.text}
                <button onClick={(e) => { e.stopPropagation(); onRemoveBreakdownTag(tag.id) }} className="hover:text-red-600 ml-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Character autocomplete dropdown -- fixed to viewport, below the row */}
      {showAutocomplete && editRef.current && (() => {
        const rect = editRef.current.getBoundingClientRect()
        return (
          <div
            className="fixed bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-[80] min-w-[180px]"
            style={{ top: rect.bottom + 4, left: rect.left + rect.width / 2 - 90 }}
          >
            {autocompleteItems.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectAutocomplete(c.name)}
                className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-amber-50 hover:text-amber-700 transition-colors font-mono uppercase"
              >
                {c.name}
              </button>
            ))}
          </div>
        )
      })()}

      {/* Breakdown tagger context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[80] min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <p className="px-3 py-1 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Tag as...</p>
          {BREAKDOWN_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleTagAs(cat.key)}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${cat.color.split(" ")[0]}`} />
              {cat.label}: "{contextMenu.text.substring(0, 30)}"
            </button>
          ))}
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => setContextMenu(null)}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene Navigator sidebar                                            */
/* ------------------------------------------------------------------ */
function SceneNavigator({ blocks, onJumpToScene }: {
  blocks: ScriptBlock[]
  onJumpToScene: (blockId: string) => void
}) {
  const scenes = blocks.filter((b) => b.type === "scene-heading")

  return (
    <div className="space-y-0.5">
      {scenes.length === 0 ? (
        <p className="text-xs text-gray-400 italic px-2 py-4">No scenes yet. Start typing a scene heading (INT./EXT.)</p>
      ) : (
        scenes.map((s) => (
          <button
            key={s.id}
            onClick={() => onJumpToScene(s.id)}
            className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-amber-50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              {s.sceneNumber && (
                <span className="text-[10px] font-mono font-bold text-gray-400 shrink-0 w-6">{s.sceneNumber}</span>
              )}
              <span className="font-semibold text-gray-800 truncate uppercase text-[11px]">
                {s.text || "Untitled Scene"}
              </span>
            </div>
            {s.synopsis && (
              <p className="text-[10px] text-gray-500 mt-0.5 truncate ml-8">{s.synopsis}</p>
            )}
          </button>
        ))
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Synopsis Editor (inline for scene headings)                        */
/* ------------------------------------------------------------------ */
function SynopsisEditor({ synopsis, onChange }: { synopsis: string; onChange: (v: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(synopsis)

  return isEditing ? (
    <div className="pl-10 pr-8 pb-2">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setIsEditing(false) }}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(draft); setIsEditing(false) } if (e.key === "Escape") setIsEditing(false) }}
        placeholder="One-line scene summary..."
        className="w-full text-[11px] text-gray-500 italic bg-transparent border-b border-dashed border-gray-300 outline-none focus:border-amber-400 pb-0.5 font-sans"
      />
    </div>
  ) : (
    <div
      className="pl-10 pr-8 pb-2 cursor-pointer group/syn"
      onClick={() => { setDraft(synopsis); setIsEditing(true) }}
    >
      <p className="text-[11px] text-gray-400 italic group-hover/syn:text-gray-600 transition-colors">
        {synopsis || "Click to add scene summary..."}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Script Report (character dialogue frequency)                       */
/* ------------------------------------------------------------------ */
function ScriptReport({ blocks, characters, onClose }: {
  blocks: ScriptBlock[]
  characters: { id: string; name: string }[]
  onClose: () => void
}) {
  const report = useMemo(() => {
    const counts: Record<string, { name: string; lines: number; linkedId?: string; scenes: Set<string> }> = {}
    let currentScene = ""
    for (const b of blocks) {
      if (b.type === "scene-heading") {
        currentScene = b.sceneNumber || b.text || ""
      }
      if (b.type === "character") {
        const name = b.text.trim().toUpperCase().replace(/\s*\(.*\)$/, "") // strip (V.O.) etc.
        if (!name) continue
        if (!counts[name]) {
          counts[name] = { name, lines: 0, linkedId: b.linkedCharacterId, scenes: new Set() }
        }
        counts[name].lines++
        if (currentScene) counts[name].scenes.add(currentScene)
      }
    }
    return Object.values(counts).sort((a, b) => b.lines - a.lines)
  }, [blocks])

  const maxLines = report[0]?.lines || 1

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-200">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-stone-900">Script Report</h2>
            <p className="text-[11px] text-stone-500">Characters ranked by spoken lines</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats summary row */}
        <div className="flex items-center gap-4 px-5 py-3 bg-stone-50 border-b border-stone-100">
          <div className="text-center">
            <p className="text-lg font-bold text-stone-900">{report.length}</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Characters</p>
          </div>
          <div className="w-px h-8 bg-stone-200" />
          <div className="text-center">
            <p className="text-lg font-bold text-stone-900">{report.reduce((s, r) => s + r.lines, 0)}</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Dialogue Cues</p>
          </div>
          <div className="w-px h-8 bg-stone-200" />
          <div className="text-center">
            <p className="text-lg font-bold text-stone-900">{blocks.filter((b) => b.type === "scene-heading").length}</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Scenes</p>
          </div>
        </div>

        {/* Character list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {report.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-400">No character cues found in the script yet.</p>
            </div>
          ) : (
            report.map((r, i) => {
              const matched = characters.find((c) => c.id === r.linkedId)
              return (
                <div key={r.name} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-stone-50 transition-colors group">
                  {/* Rank */}
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    i === 0 ? "bg-amber-100 text-amber-700" :
                    i === 1 ? "bg-stone-200 text-stone-600" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-stone-100 text-stone-500"
                  }`}>
                    {i + 1}
                  </span>

                  {/* Name + details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wide font-mono">{r.name}</span>
                      {matched && (
                        <span className="text-[9px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full font-medium">Linked</span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {r.scenes.size} scene{r.scenes.size !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Bar chart + count */}
                  <div className="flex items-center gap-2 shrink-0 w-36">
                    <div className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${(r.lines / maxLines) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-stone-700 min-w-[30px] text-right">
                      {r.lines}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Keyboard Shortcuts Panel                                           */
/* ------------------------------------------------------------------ */
function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const groups = [
    {
      title: "Navigation",
      shortcuts: [
        { keys: ["Arrow Up"], desc: "Previous block" },
        { keys: ["Arrow Down"], desc: "Next block" },
        { keys: ["Ctrl", "F"], desc: "Search script" },
      ],
    },
    {
      title: "Editing",
      shortcuts: [
        { keys: ["Enter"], desc: "New block (smart type)" },
        { keys: ["Tab"], desc: "Cycle block type" },
        { keys: ["Backspace"], desc: "Delete empty block" },
        { keys: ["Ctrl", "Z"], desc: "Undo" },
        { keys: ["Ctrl", "Shift", "Z"], desc: "Redo" },
      ],
    },
    {
      title: "Smart Casing",
      shortcuts: [
        { keys: ["Character line"], desc: "Auto-uppercase name" },
        { keys: ["Scene heading"], desc: "Auto-uppercase INT./EXT." },
      ],
    },
    {
      title: "Block Types",
      shortcuts: [
        { keys: ["INT. / EXT."], desc: "Scene heading" },
        { keys: ["CUT TO:"], desc: "Transition" },
        { keys: ["( ... )"], desc: "Parenthetical" },
        { keys: ["ALL CAPS"], desc: "Character cue" },
      ],
    },
  ]

  return (
    <div className="w-56 bg-white/80 backdrop-blur-sm border-l border-stone-200 shrink-0 overflow-y-auto">
      <div className="p-3 border-b border-stone-200 flex items-center justify-between">
        <h2 className="text-[10px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5 text-amber-600" />
          Shortcuts
        </h2>
        <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded transition-colors">
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>
      <div className="p-3 space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">{g.title}</p>
            <div className="space-y-1.5">
              {g.shortcuts.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex items-center gap-0.5 shrink-0 mt-px">
                    {s.keys.map((k, j) => (
                      <span key={j}>
                        {j > 0 && <span className="text-[8px] text-stone-300 mx-0.5">+</span>}
                        <kbd className="inline-flex items-center px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-[9px] font-mono font-medium text-stone-600 leading-none">
                          {k === "Arrow Up" ? <ArrowUp className="w-2.5 h-2.5" /> :
                           k === "Arrow Down" ? <ArrowDown className="w-2.5 h-2.5" /> :
                           k === "Enter" ? <CornerDownLeft className="w-2.5 h-2.5" /> :
                           k === "Backspace" ? <Delete className="w-2.5 h-2.5" /> :
                           k}
                        </kbd>
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-stone-500 leading-tight">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Beat Board                                                         */
/* ------------------------------------------------------------------ */
const BEAT_COLORS: { key: BeatColor; bg: string; border: string; text: string; ring: string }[] = [
  { key: "amber", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", ring: "ring-amber-300" },
  { key: "blue", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", ring: "ring-blue-300" },
  { key: "green", bg: "bg-green-50", border: "border-green-200", text: "text-green-800", ring: "ring-green-300" },
  { key: "pink", bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-800", ring: "ring-pink-300" },
  { key: "purple", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", ring: "ring-purple-300" },
  { key: "rose", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", ring: "ring-rose-300" },
  { key: "sky", bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-800", ring: "ring-sky-300" },
  { key: "stone", bg: "bg-stone-100", border: "border-stone-300", text: "text-stone-800", ring: "ring-stone-400" },
]
const DEFAULT_ACTS = ["Act 1", "Act 2", "Act 3"]

function BeatBoard({ beats, onBeatsChange, scenes }: {
  beats: BeatItem[]
  onBeatsChange: (beats: BeatItem[]) => void
  scenes: { id: string; text: string; sceneNumber?: string }[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverAct, setDragOverAct] = useState<string | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // Group beats by act
  const acts = useMemo(() => {
    const actSet = new Set(DEFAULT_ACTS)
    beats.forEach((b) => { if (b.act) actSet.add(b.act) })
    return Array.from(actSet)
  }, [beats])

  const beatsByAct = useMemo(() => {
    const map: Record<string, BeatItem[]> = {}
    for (const act of acts) map[act] = []
    for (const b of [...beats].sort((a, c) => a.order - c.order)) {
      const act = b.act || "Act 1"
      if (!map[act]) map[act] = []
      map[act].push(b)
    }
    return map
  }, [beats, acts])

  const addBeat = (act: string) => {
    const newBeat: BeatItem = {
      id: uid(),
      title: "",
      description: "",
      color: BEAT_COLORS[Math.floor(Math.random() * BEAT_COLORS.length)].key,
      act,
      order: beats.length,
    }
    onBeatsChange([...beats, newBeat])
    setEditingId(newBeat.id)
  }

  const updateBeat = (id: string, updates: Partial<BeatItem>) => {
    onBeatsChange(beats.map((b) => b.id === id ? { ...b, ...updates } : b))
  }

  const deleteBeat = (id: string) => {
    onBeatsChange(beats.filter((b) => b.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const handleDrop = (targetAct: string, targetIdx: number) => {
    if (!dragId) return
    const beat = beats.find((b) => b.id === dragId)
    if (!beat) return
    // Remove from current position and insert into target
    const newBeats = beats.filter((b) => b.id !== dragId)
    const updated = { ...beat, act: targetAct }
    // Find insert position relative to the target act
    const actBeats = newBeats.filter((b) => b.act === targetAct)
    const globalIdx = targetIdx < actBeats.length
      ? newBeats.indexOf(actBeats[targetIdx])
      : newBeats.length
    newBeats.splice(globalIdx >= 0 ? globalIdx : newBeats.length, 0, updated)
    // Re-order
    onBeatsChange(newBeats.map((b, i) => ({ ...b, order: i })))
    setDragId(null)
    setDragOverAct(null)
    setDragOverIdx(null)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/20 p-6">
      {/* Board header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Beat Board</h2>
            <p className="text-[11px] text-stone-500">{beats.length} beat{beats.length !== 1 ? "s" : ""} across {acts.length} act{acts.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Act columns */}
      <div className="max-w-7xl mx-auto flex gap-5">
        {acts.map((act) => {
          const actBeats = beatsByAct[act] || []
          const isDropTarget = dragOverAct === act
          return (
            <div
              key={act}
              className={`flex-1 min-w-[240px] rounded-xl border-2 border-dashed transition-colors ${
                isDropTarget ? "border-amber-400 bg-amber-50/30" : "border-stone-200 bg-white/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
                setDragOverAct(act)
                if (dragOverIdx === null) setDragOverIdx(actBeats.length)
              }}
              onDrop={(e) => { e.preventDefault(); handleDrop(act, dragOverIdx ?? actBeats.length) }}
              onDragLeave={() => { if (dragOverAct === act) { setDragOverAct(null); setDragOverIdx(null) } }}
            >
              {/* Act header */}
              <div className="px-4 py-3 border-b border-stone-200/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">{act}</h3>
                  <span className="text-[10px] text-stone-400 font-medium">{actBeats.length}</span>
                </div>
              </div>

              {/* Beat cards */}
              <div className="p-3 space-y-2.5 min-h-[120px]">
                {actBeats.map((beat, beatIdx) => {
                  const color = BEAT_COLORS.find((c) => c.key === beat.color) || BEAT_COLORS[0]
                  const linked = beat.linkedSceneId ? scenes.find((s) => s.id === beat.linkedSceneId) : null
                  const isEditing = editingId === beat.id
                  const isDragDropTarget = dragOverAct === act && dragOverIdx === beatIdx

                  return (
                    <div
                      key={beat.id}
                      draggable={!isEditing}
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragId(beat.id) }}
                      onDragEnd={() => { setDragId(null); setDragOverAct(null); setDragOverIdx(null) }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverAct(act); setDragOverIdx(beatIdx) }}
                      className={`rounded-lg border ${color.border} ${color.bg} p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md group/beat ${
                        dragId === beat.id ? "opacity-50 scale-95" : ""
                      } ${isDragDropTarget && dragId !== beat.id ? "ring-2 " + color.ring : ""}`}
                    >
                      {isEditing ? (
                        /* Edit mode */
                        <div className="space-y-2">
                          <input
                            autoFocus
                            value={beat.title}
                            onChange={(e) => updateBeat(beat.id, { title: e.target.value })}
                            placeholder="Beat title..."
                            className={`w-full text-xs font-bold ${color.text} bg-transparent outline-none border-b border-current/20 pb-1 placeholder-current/40`}
                            onKeyDown={(e) => { if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) setEditingId(null) }}
                          />
                          <textarea
                            value={beat.description}
                            onChange={(e) => updateBeat(beat.id, { description: e.target.value })}
                            placeholder="Description..."
                            rows={3}
                            className={`w-full text-[11px] ${color.text} bg-transparent outline-none resize-none placeholder-current/40`}
                          />
                          {/* Color picker */}
                          <div className="flex items-center gap-1 pt-1">
                            {BEAT_COLORS.map((c) => (
                              <button
                                key={c.key}
                                onClick={() => updateBeat(beat.id, { color: c.key })}
                                className={`w-4 h-4 rounded-full border-2 ${c.bg} ${beat.color === c.key ? "border-stone-600 ring-1 ring-stone-300" : "border-transparent hover:border-stone-400"}`}
                              />
                            ))}
                          </div>
                          {/* Link to scene */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Link2 className={`w-3 h-3 ${color.text} opacity-50`} />
                            <select
                              value={beat.linkedSceneId || ""}
                              onChange={(e) => updateBeat(beat.id, { linkedSceneId: e.target.value || undefined })}
                              className="text-[10px] bg-transparent border border-current/20 rounded px-1.5 py-0.5 outline-none flex-1 min-w-0"
                            >
                              <option value="">No linked scene</option>
                              {scenes.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.sceneNumber ? `Sc.${s.sceneNumber} - ` : ""}{s.text || "Untitled"}
                                </option>
                              ))}
                            </select>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center justify-between pt-1">
                            <button onClick={() => deleteBeat(beat.id)} className="text-[10px] text-red-500 hover:text-red-700 font-medium">Delete</button>
                            <button onClick={() => setEditingId(null)} className="text-[10px] text-stone-600 hover:text-stone-800 font-semibold">Done</button>
                          </div>
                        </div>
                      ) : (
                        /* Display mode */
                        <div onClick={() => setEditingId(beat.id)}>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-xs font-bold ${color.text} leading-tight`}>
                              {beat.title || <span className="italic opacity-50">Untitled beat</span>}
                            </h4>
                            <GripVertical className="w-3 h-3 text-stone-300 shrink-0 opacity-0 group-hover/beat:opacity-100 transition-opacity" />
                          </div>
                          {beat.description && (
                            <p className={`text-[10px] ${color.text} opacity-70 mt-1 line-clamp-3 leading-relaxed`}>
                              {beat.description}
                            </p>
                          )}
                          {linked && (
                            <div className="flex items-center gap-1 mt-2">
                              <Link2 className={`w-2.5 h-2.5 ${color.text} opacity-40`} />
                              <span className={`text-[9px] font-medium ${color.text} opacity-60 truncate`}>
                                {linked.sceneNumber ? `Sc.${linked.sceneNumber}` : linked.text?.substring(0, 30)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Drop zone indicator when empty or at end */}
                {actBeats.length === 0 && !isDropTarget && (
                  <div className="flex flex-col items-center justify-center py-6 text-stone-300">
                    <Plus className="w-5 h-5 mb-1" />
                    <p className="text-[10px] text-stone-400">No beats yet</p>
                  </div>
                )}
              </div>

              {/* Add beat button */}
              <div className="px-3 pb-3">
                <button
                  onClick={() => addBeat(act)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-stone-300 text-stone-400 hover:text-stone-600 hover:border-stone-400 hover:bg-white/50 transition-colors text-[11px] font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Beat
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main ScriptModal                                                   */
/* ------------------------------------------------------------------ */
export default function ScriptModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCasting()
  const projectId = state.currentFocus.currentProjectId
  const currentProject = state.projects.find((p) => p.id === projectId)

  // Initialize script data from project or empty
  const savedScript = currentProject?.script
  const [blocks, setBlocks] = useState<ScriptBlock[]>(savedScript?.blocks || getEmptyScript().blocks)
  const [locked, setLocked] = useState(savedScript?.locked || false)
  const [lockedSceneSuffixes, setLockedSceneSuffixes] = useState<Record<string, number>>(savedScript?.lockedSceneSuffixes || {})
  const [currentRevision, setCurrentRevision] = useState<RevisionColor>(savedScript?.currentRevision || "white")

  const [activeBlockIdx, setActiveBlockIdx] = useState(0)
  const [showSceneNav, setShowSceneNav] = useState(true)
  const [showBreakdownTags, setShowBreakdownTags] = useState(false)
  const [showRevisionMenu, setShowRevisionMenu] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [typewriterMode, setTypewriterMode] = useState(true)
  const [showReport, setShowReport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showBeatBoard, setShowBeatBoard] = useState(false)
  const [beats, setBeats] = useState<BeatItem[]>(savedScript?.beats || [])

  // Block drag-reorder state
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const pageRef = useRef<HTMLDivElement>(null)
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Keep a ref to avoid stale closures
  const blocksRef = useRef(blocks)
  blocksRef.current = blocks

  // Characters from project for autocomplete
  const characters = useMemo(() =>
    (currentProject?.characters || []).map((c) => ({ id: c.id, name: c.name })),
    [currentProject?.characters]
  )

  // Locations from project for auto-linking
  const locations = useMemo(() =>
    (currentProject?.locations || []).map((l) => ({ id: l.id, name: l.name })),
    [currentProject?.locations]
  )

  // Auto-number scenes
  const sceneNumbers = useMemo(() => {
    const map: Record<string, string> = {}
    let num = 1
    for (const b of blocks) {
      if (b.type === "scene-heading") {
        if (locked && b.sceneNumber) {
          map[b.id] = b.sceneNumber
        } else {
          map[b.id] = String(num++)
        }
      }
    }
    return map
  }, [blocks, locked])

  // Keep a beats ref for syncing
  const beatsRef = useRef(beats)
  beatsRef.current = beats

  // Persist to project
  const syncToProject = useCallback(() => {
    if (!projectId) return
    const scriptData: ScriptData = {
      blocks: blocksRef.current,
      locked,
      lockedSceneSuffixes,
      currentRevision,
      lastModified: Date.now(),
      beats: beatsRef.current,
    }
    dispatch({ type: "SET_PROJECT_SCRIPT", payload: { projectId, script: scriptData } })
  }, [projectId, locked, lockedSceneSuffixes, currentRevision, dispatch])

  // Auto-save debounced
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => syncToProject(), 800)
  }, [syncToProject])

  // Scroll active line to center (typewriter mode)
  useEffect(() => {
    if (!typewriterMode) return
    const activeBlock = blocks[activeBlockIdx]
    if (activeBlock && blockRefs.current[activeBlock.id]) {
      blockRefs.current[activeBlock.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [activeBlockIdx, typewriterMode, blocks])

  // Undo/redo
  const historyRef = useRef<ScriptBlock[][]>([])
  const historyIdxRef = useRef(-1)
  const pushHistory = useCallback(() => {
    const snapshot = JSON.parse(JSON.stringify(blocksRef.current))
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1)
    historyRef.current.push(snapshot)
    if (historyRef.current.length > 100) historyRef.current.shift()
    historyIdxRef.current = historyRef.current.length - 1
  }, [])

  const undo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current--
      setBlocks(JSON.parse(JSON.stringify(historyRef.current[historyIdxRef.current])))
    }
  }, [])

  const redo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current++
      setBlocks(JSON.parse(JSON.stringify(historyRef.current[historyIdxRef.current])))
    }
  }, [])

  // Block drag reorder handler
  const handleBlockDrop = useCallback((targetIdx: number) => {
    if (dragFromIdx === null || dragFromIdx === targetIdx) { setDragFromIdx(null); setDragOverIdx(null); return }
    pushHistory()
    setBlocks((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragFromIdx, 1)
      const insertAt = targetIdx > dragFromIdx ? targetIdx - 1 : targetIdx
      next.splice(insertAt, 0, moved)
      return next
    })
    setDragFromIdx(null)
    setDragOverIdx(null)
    debouncedSave()
  }, [dragFromIdx, pushHistory, debouncedSave])

  // Push initial history
  useEffect(() => { pushHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle text change for a block
  const handleTextChange = useCallback((idx: number, text: string) => {
    setBlocks((prev) => {
      const next = [...prev]
      const block = { ...next[idx], text }

      // Auto-detect block type
      const detected = detectBlockType(text)
      if (detected && detected !== block.type) {
        block.type = detected
      }

      // Auto-link characters
      if (block.type === "character") {
        const match = characters.find((c) => c.name.toUpperCase() === text.trim().toUpperCase())
        block.linkedCharacterId = match?.id || undefined
      }

      // Auto-link locations
      if (block.type === "scene-heading") {
        const locName = text.replace(/^(INT\.|EXT\.|I\/E\.|INT\/EXT\.)\s*/i, "").replace(/\s*-\s*(DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER|MORNING|EVENING|SUNSET|SUNRISE)$/i, "").trim()
        const match = locations.find((l) => l.name.toUpperCase() === locName.toUpperCase())
        block.linkedLocationId = match?.id || undefined
      }

      // Mark as changed if locked
      if (locked) {
        block.changed = true
        block.revisionColor = currentRevision
      }

      next[idx] = block
      return next
    })
    debouncedSave()
  }, [characters, locations, locked, currentRevision, debouncedSave])

  // Handle key events
  const handleKeyDown = useCallback((idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      pushHistory()
      const currentBlock = blocksRef.current[idx]
      const nextType = getNextType(currentBlock.type, false)

      // If locked and inserting after a scene heading, create A/B scene numbers
      let newSceneNumber: string | undefined
      if (locked && nextType === "scene-heading") {
        const prevScene = blocksRef.current.slice(0, idx + 1).reverse().find((b) => b.type === "scene-heading")
        if (prevScene?.sceneNumber) {
          const base = prevScene.sceneNumber.replace(/[A-Z]$/, "")
          const suffix = (lockedSceneSuffixes[base] || 0) + 1
          newSceneNumber = base + String.fromCharCode(64 + suffix)
          setLockedSceneSuffixes((prev) => ({ ...prev, [base]: suffix }))
        }
      }

      const newBlock: ScriptBlock = {
        id: uid(),
        type: nextType,
        text: "",
        sceneNumber: newSceneNumber,
      }
      setBlocks((prev) => {
        const next = [...prev]
        next.splice(idx + 1, 0, newBlock)
        return next
      })
      setActiveBlockIdx(idx + 1)
      debouncedSave()
      // Focus the new block
      setTimeout(() => {
        const el = blockRefs.current[newBlock.id]
        const editable = el?.querySelector("[contenteditable]") as HTMLElement
        editable?.focus()
      }, 20)
    }

    if (e.key === "Tab") {
      e.preventDefault()
      pushHistory()
      const currentBlock = blocksRef.current[idx]
      if (currentBlock.text.trim() === "") {
        const nextType = getNextType(currentBlock.type, true)
        setBlocks((prev) => {
          const next = [...prev]
          next[idx] = { ...next[idx], type: nextType }
          return next
        })
      }
    }

    if (e.key === "Backspace" && blocksRef.current[idx].text === "" && idx > 0) {
      e.preventDefault()
      pushHistory()
      setBlocks((prev) => {
        const next = [...prev]
        next.splice(idx, 1)
        return next
      })
      setActiveBlockIdx(idx - 1)
      debouncedSave()
      setTimeout(() => {
        const prevBlock = blocksRef.current[idx - 1]
        if (prevBlock) {
          const el = blockRefs.current[prevBlock.id]
          const editable = el?.querySelector("[contenteditable]") as HTMLElement
          editable?.focus()
        }
      }, 20)
    }

    // Ctrl+Z / Ctrl+Shift+Z
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }

    // Ctrl+F to open search
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault()
      setShowSearch(true)
    }

    // Arrow keys
    if (e.key === "ArrowUp" && idx > 0) {
      const sel = window.getSelection()
      const atStart = sel && sel.anchorOffset === 0
      if (atStart) {
        e.preventDefault()
        setActiveBlockIdx(idx - 1)
        setTimeout(() => {
          const prev = blocksRef.current[idx - 1]
          if (prev) {
            const el = blockRefs.current[prev.id]
            const editable = el?.querySelector("[contenteditable]") as HTMLElement
            editable?.focus()
          }
        }, 10)
      }
    }

    if (e.key === "ArrowDown" && idx < blocksRef.current.length - 1) {
      const sel = window.getSelection()
      const el = blockRefs.current[blocksRef.current[idx].id]?.querySelector("[contenteditable]")
      const atEnd = sel && el && sel.anchorOffset === (el.textContent?.length || 0)
      if (atEnd) {
        e.preventDefault()
        setActiveBlockIdx(idx + 1)
        setTimeout(() => {
          const next = blocksRef.current[idx + 1]
          if (next) {
            const nel = blockRefs.current[next.id]
            const editable = nel?.querySelector("[contenteditable]") as HTMLElement
            editable?.focus()
          }
        }, 10)
      }
    }
  }, [pushHistory, locked, lockedSceneSuffixes, debouncedSave, undo, redo])

  const handleTypeChange = useCallback((idx: number, type: ScriptBlockType) => {
    pushHistory()
    setBlocks((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], type }
      return next
    })
    debouncedSave()
  }, [pushHistory, debouncedSave])

  const handleSynopsisChange = useCallback((idx: number, synopsis: string) => {
    setBlocks((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], synopsis }
      return next
    })
    debouncedSave()
  }, [debouncedSave])

  const handleAddBreakdownTag = useCallback((idx: number, tag: BreakdownTag) => {
    setBlocks((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], breakdownTags: [...(next[idx].breakdownTags || []), tag] }
      return next
    })
    debouncedSave()
  }, [debouncedSave])

  const handleRemoveBreakdownTag = useCallback((idx: number, tagId: string) => {
    setBlocks((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], breakdownTags: (next[idx].breakdownTags || []).filter((t) => t.id !== tagId) }
      return next
    })
    debouncedSave()
  }, [debouncedSave])

  const handleJumpToScene = (blockId: string) => {
    const idx = blocks.findIndex((b) => b.id === blockId)
    if (idx >= 0) {
      setActiveBlockIdx(idx)
      blockRefs.current[blockId]?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const handleLockToggle = () => {
    pushHistory()
    if (!locked) {
      // Lock: freeze scene numbers
      setBlocks((prev) => prev.map((b) => b.type === "scene-heading" ? { ...b, sceneNumber: sceneNumbers[b.id] } : b))
    } else {
      // Unlock: clear scene numbers and change markers
      setBlocks((prev) => prev.map((b) => ({ ...b, sceneNumber: undefined, changed: false, revisionColor: undefined })))
    }
    setLocked(!locked)
    debouncedSave()
  }

  const handleManualSave = () => {
    syncToProject()
  }

  // Scene and page counts
  const sceneCount = blocks.filter((b) => b.type === "scene-heading").length
  const estimatedPages = Math.max(1, Math.round(blocks.length / 56))

  // Search filter highlights
  const searchMatchIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>()
    const term = searchTerm.toLowerCase()
    return new Set(blocks.filter((b) => b.text.toLowerCase().includes(term)).map((b) => b.id))
  }, [blocks, searchTerm])

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/30 z-50 flex flex-col pl-14">
      {/* Slim Sidebar Strip / Expandable Drawer */}
      <FloatingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentModal="script"
      />

      {/* Header */}
      <header className="bg-white border-b border-stone-200 shrink-0">
        {/* Top row - Logo, Home, Title, Close */}
        <ModalHeader
          title="Script"
          titleColor="bg-amber-600"
          onClose={onClose}
        />

        {/* Toolbar row */}
        <div className="flex items-center gap-2 px-6 py-2 bg-stone-50/80 border-t border-stone-100">
          <div className="text-[10px] text-stone-400 font-medium bg-white px-2 py-0.5 rounded-full border border-stone-200">
            {sceneCount} scene{sceneCount !== 1 ? "s" : ""} / ~{estimatedPages} pg{estimatedPages !== 1 ? "s" : ""}
          </div>

          <div className="w-px h-5 bg-stone-200" />

          {/* Undo / Redo */}
          <button onClick={undo} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-white rounded-lg transition-colors" title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-white rounded-lg transition-colors" title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-stone-200" />

          {/* Zoom */}
          <button onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-white rounded-lg transition-colors" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-stone-500 font-mono min-w-[35px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-white rounded-lg transition-colors" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-stone-200" />

          {/* Typewriter mode */}
          <button
            onClick={() => setTypewriterMode(!typewriterMode)}
            className={`p-1.5 rounded-lg transition-colors ${typewriterMode ? "text-amber-600 bg-amber-100" : "text-stone-400 hover:text-stone-700 hover:bg-white"}`}
            title="Typewriter mode"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          {/* Scene Navigator toggle */}
          <button
            onClick={() => setShowSceneNav(!showSceneNav)}
            className={`p-1.5 rounded-lg transition-colors ${showSceneNav ? "text-amber-600 bg-amber-100" : "text-stone-400 hover:text-stone-700 hover:bg-white"}`}
            title="Scene navigator"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Beat Board toggle */}
          <button
            onClick={() => setShowBeatBoard(!showBeatBoard)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${showBeatBoard ? "text-amber-700 bg-amber-100 border-amber-200" : "text-stone-400 hover:text-stone-700 hover:bg-white border-transparent"}`}
            title="Beat board"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Beats</span>
          </button>

          {/* Breakdown tagger toggle */}
          <button
            onClick={() => setShowBreakdownTags(!showBreakdownTags)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${showBreakdownTags ? "text-violet-700 bg-violet-100 border border-violet-200" : "text-stone-400 hover:text-stone-700 hover:bg-white border border-transparent"}`}
            title="Breakdown tagger"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Breakdown</span>
          </button>

          {/* Search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg transition-colors ${showSearch ? "text-amber-600 bg-amber-100" : "text-stone-400 hover:text-stone-700 hover:bg-white"}`}
            title="Search (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Script Report */}
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-700 hover:bg-white border border-transparent transition-colors"
            title="Script report"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Report</span>
          </button>

          {/* Shortcuts panel */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`p-1.5 rounded-lg transition-colors ${showShortcuts ? "text-amber-600 bg-amber-100" : "text-stone-400 hover:text-stone-700 hover:bg-white"}`}
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <div className="flex-1" />

          {/* Revision color picker */}
          <div className="relative">
            <button
              onClick={() => setShowRevisionMenu(!showRevisionMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-white border border-stone-200 transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{REVISION_COLORS.find((r) => r.key === currentRevision)?.label.split(" ")[0]}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showRevisionMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-stone-200 py-1 z-30 min-w-[200px]">
                <p className="px-3 py-1.5 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Revision Draft</p>
                {REVISION_COLORS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => { setCurrentRevision(r.key); setShowRevisionMenu(false); debouncedSave() }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-stone-50 transition-colors ${currentRevision === r.key ? "font-semibold" : ""}`}
                  >
                    <span className={`w-4 h-4 rounded-md border border-stone-200 ${r.bg}`} />
                    <span className={r.color}>{r.label}</span>
                    {currentRevision === r.key && <span className="ml-auto text-amber-600">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lock toggle */}
          <button
            onClick={handleLockToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${locked ? "text-red-700 bg-red-50 border-red-200" : "text-stone-500 hover:text-stone-700 hover:bg-white border-stone-200"}`}
            title={locked ? "Unlock script (unfreeze scene numbers)" : "Lock script (freeze scene numbers)"}
          >
            {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{locked ? "Locked" : "Lock"}</span>
          </button>

          {/* Save */}
          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </header>

      {/* Search bar */}
      {showSearch && (
        <div className="h-10 bg-white/80 border-b border-stone-200 flex items-center gap-2 px-4 shrink-0">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search script..."
            className="flex-1 text-sm bg-transparent outline-none text-stone-800 placeholder-stone-400"
          />
          {searchTerm && <span className="text-[10px] text-stone-400">{searchMatchIds.size} match{searchMatchIds.size !== 1 ? "es" : ""}</span>}
          <button onClick={() => { setShowSearch(false); setSearchTerm("") }} className="p-1 text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {showBeatBoard ? (
          /* ---- Beat Board View ---- */
          <BeatBoard
            beats={beats}
            onBeatsChange={(newBeats) => { setBeats(newBeats); debouncedSave() }}
            scenes={blocks.filter((b) => b.type === "scene-heading").map((b) => ({ id: b.id, text: b.text, sceneNumber: sceneNumbers[b.id] }))}
          />
        ) : (
          <>
            {/* Scene navigator sidebar */}
            {showSceneNav && (
              <div className="w-60 bg-white/70 border-r border-stone-200 shrink-0 overflow-y-auto">
                <div className="p-3 border-b border-stone-200">
                  <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-600" />
                    Scenes
                  </h2>
                </div>
                <div className="p-2">
                  <SceneNavigator blocks={blocks} onJumpToScene={handleJumpToScene} />
                </div>
              </div>
            )}

            {/* Script page */}
            <div className="flex-1 overflow-y-auto" ref={pageRef}>
              <div className="max-w-[8.5in] mx-auto my-8">
                {/* Page representation */}
                <div className="bg-white rounded-sm shadow-lg border border-stone-200/80 min-h-[11in]" style={{ padding: `${1 * zoom}in ${1.5 * zoom}in` }}>
                  {blocks.map((block, idx) => (
                    <div key={block.id} ref={(el) => { blockRefs.current[block.id] = el }}>
                      {/* Highlight search matches */}
                      <div className={searchTerm && searchMatchIds.has(block.id) ? "bg-amber-100/50 -mx-4 px-4 rounded" : ""}>
                        <ScriptBlockRow
                          block={block}
                          index={idx}
                          isActive={activeBlockIdx === idx}
                          onActivate={() => setActiveBlockIdx(idx)}
                          onTextChange={(text) => handleTextChange(idx, text)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          onTypeChange={(type) => handleTypeChange(idx, type)}
                          sceneNumber={sceneNumbers[block.id]}
                          characters={characters}
                          showBreakdownTags={showBreakdownTags}
                          onAddBreakdownTag={(tag) => handleAddBreakdownTag(idx, tag)}
                          onRemoveBreakdownTag={(tagId) => handleRemoveBreakdownTag(idx, tagId)}
                          isLocked={locked}
                          zoom={zoom}
                          isDragTarget={dragOverIdx === idx}
                          onDragStart={setDragFromIdx}
                          onDragOver={setDragOverIdx}
                          onDragEnd={() => { setDragFromIdx(null); setDragOverIdx(null) }}
                          onDrop={handleBlockDrop}
                        />
                        {/* Synopsis slot for scene headings */}
                        {block.type === "scene-heading" && (
                          <SynopsisEditor
                            synopsis={block.synopsis || ""}
                            onChange={(v) => handleSynopsisChange(idx, v)}
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty-state bottom click area to add new blocks */}
                  <div
                    className="min-h-[200px] cursor-text"
                    onClick={() => {
                      const lastBlock = blocks[blocks.length - 1]
                      if (lastBlock && lastBlock.text.trim() === "") {
                        setActiveBlockIdx(blocks.length - 1)
                        const el = blockRefs.current[lastBlock.id]
                        const editable = el?.querySelector("[contenteditable]") as HTMLElement
                        editable?.focus()
                      } else {
                        pushHistory()
                        const newBlock: ScriptBlock = { id: uid(), type: "action", text: "" }
                        setBlocks((prev) => [...prev, newBlock])
                        setActiveBlockIdx(blocks.length)
                        setTimeout(() => {
                          const el = blockRefs.current[newBlock.id]
                          const editable = el?.querySelector("[contenteditable]") as HTMLElement
                          editable?.focus()
                        }, 20)
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Keyboard shortcuts side panel */}
        {showShortcuts && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}
      </div>

      {/* Script Report overlay */}
      {showReport && (
        <ScriptReport
          blocks={blocks}
          characters={characters}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Status bar */}
      <div className="h-7 bg-white/90 border-t border-stone-200 flex items-center justify-between px-4 shrink-0 text-[10px] text-stone-400 font-medium">
        <div className="flex items-center gap-4">
          {showBeatBoard ? (
            <>
              <span className="text-amber-600 font-semibold">Beat Board</span>
              <span>{beats.length} beat{beats.length !== 1 ? "s" : ""}</span>
            </>
          ) : (
            <>
              <span>{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
              <span>{sceneCount} scene{sceneCount !== 1 ? "s" : ""}</span>
              <span>~{estimatedPages} page{estimatedPages !== 1 ? "s" : ""}</span>
              {locked && <span className="text-red-500 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Locked</span>}
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!showBeatBoard && (
            <>
              <span>Block {activeBlockIdx + 1} of {blocks.length}</span>
              <span className="uppercase">{BLOCK_TYPE_LABELS[blocks[activeBlockIdx]?.type || "action"]}</span>
              <span>{currentRevision !== "white" ? `Rev: ${currentRevision}` : ""}</span>
            </>
          )}
          <span>Auto-saving</span>
        </div>
      </div>

      {/* Embedded CoPilot - Fixed position in lower right corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <EmbeddedCoPilot context="script" />
      </div>
    </div>
  )
}
