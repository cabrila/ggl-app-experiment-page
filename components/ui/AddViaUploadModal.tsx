"use client"

import { useState, useRef, useEffect } from "react"
import {
  Upload,
  FileText,
  Loader2,
  X,
  AlertCircle,
  RefreshCw,
  Check,
} from "lucide-react"
import { useImportJob } from "@/hooks/useImportJob"

/** A single found entry, ready to be added to the existing list. */
export interface FoundEntry<T> {
  item: T
  label: string
  sublabel?: string
}

export type AccentColor = "emerald" | "sky" | "amber" | "rose" | "teal"

// Static class strings so Tailwind's compiler can see them (dynamic
// `bg-${accent}-500` template literals would get purged from the build).
const ACCENT: Record<
  AccentColor,
  {
    text: string
    iconBg: string
    dragging: string
    selected: string
    checkbox: string
    button: string
  }
> = {
  emerald: {
    text: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    dragging: "border-emerald-400 bg-emerald-500/10",
    selected: "border-emerald-500/50 bg-emerald-500/10",
    checkbox: "bg-emerald-500 border-emerald-500",
    button: "bg-emerald-500 hover:bg-emerald-600",
  },
  sky: {
    text: "text-sky-400",
    iconBg: "bg-sky-500/20",
    dragging: "border-sky-400 bg-sky-500/10",
    selected: "border-sky-500/50 bg-sky-500/10",
    checkbox: "bg-sky-500 border-sky-500",
    button: "bg-sky-500 hover:bg-sky-600",
  },
  amber: {
    text: "text-amber-400",
    iconBg: "bg-amber-500/20",
    dragging: "border-amber-400 bg-amber-500/10",
    selected: "border-amber-500/50 bg-amber-500/10",
    checkbox: "bg-amber-500 border-amber-500",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  rose: {
    text: "text-rose-400",
    iconBg: "bg-rose-500/20",
    dragging: "border-rose-400 bg-rose-500/10",
    selected: "border-rose-500/50 bg-rose-500/10",
    checkbox: "bg-rose-500 border-rose-500",
    button: "bg-rose-500 hover:bg-rose-600",
  },
  teal: {
    text: "text-teal-400",
    iconBg: "bg-teal-500/20",
    dragging: "border-teal-400 bg-teal-500/10",
    selected: "border-teal-500/50 bg-teal-500/10",
    checkbox: "bg-teal-500 border-teal-500",
    button: "bg-teal-500 hover:bg-teal-600",
  },
}

interface AddViaUploadModalProps<T, R> {
  /** Heading + entity wording, e.g. "Characters", "Prop". */
  title: string
  /** useImportJob task type, e.g. "character-extract". */
  taskType: string
  /** Accepted file input string, e.g. ".pdf,.docx". */
  accept: string
  /** Human-readable accepted formats line. */
  acceptLabel: string
  /** Tailwind accent color token base, e.g. "emerald", "rose", "amber". */
  accent: AccentColor
  /** Maps the raw AI result into selectable entries. */
  mapResult: (result: R) => FoundEntry<T>[]
  /** Called with the user's selected items to append to the existing list. */
  onAddSelected: (items: T[]) => void
  onClose: () => void
}

export default function AddViaUploadModal<T, R>({
  title,
  taskType,
  accept,
  acceptLabel,
  accent,
  mapResult,
  onAddSelected,
  onClose,
}: AddViaUploadModalProps<T, R>) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [entries, setEntries] = useState<FoundEntry<T>[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { status, message, result, error, run, reset } = useImportJob<R>(taskType)
  const isProcessing = status === "uploading" || status === "running"
  const c = ACCENT[accent]

  // Hold mapResult in a ref so an inline (per-render) function identity
  // doesn't retrigger the mapping effect and loop on setEntries.
  const mapResultRef = useRef(mapResult)
  mapResultRef.current = mapResult

  // Map results into selectable entries once extraction completes. All
  // entries start selected so the common "add everything found" path is
  // one click, but nothing is added until the user confirms.
  useEffect(() => {
    if (status !== "complete" || !result) return
    const mapped = mapResultRef.current(result)
    setEntries(mapped)
    setSelected(Object.fromEntries(mapped.map((_, i) => [i, true])))
  }, [status, result])

  const isValidFile = (f: File) => {
    const exts = accept.split(",").map((s) => s.trim().replace(/^\./, ""))
    return new RegExp(`\\.(${exts.join("|")})$`, "i").test(f.name)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && isValidFile(dropped)) setFile(dropped)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isValidFile(selectedFile)) setFile(selectedFile)
  }

  const handleProcess = async () => {
    if (!file) return
    const sourceTitle = file.name.replace(/\.[^/.]+$/, "")
    await run(file, sourceTitle)
  }

  const handleRetry = () => {
    reset()
    setFile(null)
    setEntries([])
    setSelected({})
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeFile = () => {
    setFile(null)
    reset()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const selectedCount = entries.filter((_, i) => selected[i]).length
  const allSelected = entries.length > 0 && selectedCount === entries.length

  const toggleAll = () => {
    const next = !allSelected
    setSelected(Object.fromEntries(entries.map((_, i) => [i, next])))
  }

  const handleAdd = () => {
    const items = entries.filter((_, i) => selected[i]).map((e) => e.item)
    if (items.length === 0) return
    onAddSelected(items)
    onClose()
  }

  const showSelection = status === "complete"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#13261c] border border-white/10 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white font-sans">
              {showSelection ? `Select ${title} to Add` : `Add ${title} via Upload`}
            </h2>
            <p className="text-white/50 text-sm font-sans">
              {showSelection
                ? "Choose which found entries to add to this list."
                : "Upload a file and we'll extract entries for you to add."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error */}
          {status === "failed" && error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium font-sans mb-1">Extraction Failed</p>
                <p className="text-red-400/80 text-sm font-sans">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-sans">Retry</span>
              </button>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-white/10 bg-white/[0.02]">
              <Loader2 className={`w-12 h-12 ${c.text} animate-spin mb-4`} />
              <p className="text-white font-sans mb-2">
                {status === "uploading" ? "Uploading file..." : "Analyzing file..."}
              </p>
              <p className="text-white/50 text-sm font-sans">
                {message || "This can take a moment on a long script."}
              </p>
            </div>
          )}

          {/* Selection list */}
          {showSelection && !isProcessing && (
            <div>
              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/50 font-sans mb-4">No entries were found in this file.</p>
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-sans transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try another file
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={toggleAll}
                      className="text-sm text-white/70 hover:text-white font-sans transition-colors"
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </button>
                    <span className="text-sm text-white/50 font-sans">
                      {selectedCount} of {entries.length} selected
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {entries.map((entry, i) => {
                      const checked = !!selected[i]
                      return (
                        <li key={i}>
                          <button
                            onClick={() => setSelected((s) => ({ ...s, [i]: !s[i] }))}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                              checked
                                ? c.selected
                                : "border-white/10 bg-white/[0.02] hover:border-white/20"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                                checked
                                  ? c.checkbox
                                  : "border-white/30"
                              }`}
                            >
                              {checked && <Check className="w-3.5 h-3.5 text-white" />}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-white truncate">
                                {entry.label}
                              </span>
                              {entry.sublabel && (
                                <span className="block text-xs text-white/50 truncate">
                                  {entry.sublabel}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Upload step */}
          {!isProcessing && status !== "complete" && (
            <>
              {file && status !== "failed" ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-4 p-4 bg-[#1a2e23] rounded-xl border border-white/10 mb-6 w-full">
                    <div className={`w-12 h-12 ${c.iconBg} rounded-lg flex items-center justify-center`}>
                      <FileText className={`w-6 h-6 ${c.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-sans font-medium truncate">{file.name}</p>
                      <p className="text-white/50 text-sm font-sans">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button onClick={removeFile} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <X className="w-5 h-5 text-white/50" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                  }}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                    isDragging
                      ? c.dragging
                      : "border-white/20 hover:border-white/40 bg-[#1a2e23]/50"
                  }`}
                >
                  <div className="w-16 h-16 bg-[#2a3f33] rounded-full flex items-center justify-center mb-4">
                    <Upload className={`w-7 h-7 ${c.text}`} />
                  </div>
                  <p className="text-white font-sans font-medium mb-1">
                    Click to upload or drag a file here
                  </p>
                  <p className="text-white/50 text-sm font-sans">{acceptLabel}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                    autoComplete="off"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-sans transition-colors"
          >
            Cancel
          </button>
          {showSelection && entries.length > 0 ? (
            <button
              onClick={handleAdd}
              disabled={selectedCount === 0}
              className={`px-5 py-2 ${c.button} rounded-lg text-white text-sm font-semibold font-sans transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Add {selectedCount > 0 ? selectedCount : ""} to List
            </button>
          ) : (
            !isProcessing &&
            status !== "complete" && (
              <button
                onClick={handleProcess}
                disabled={!file}
                className={`px-5 py-2 ${c.button} rounded-lg text-white text-sm font-semibold font-sans transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Extract {title}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
