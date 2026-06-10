"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, ChevronDown, PenLine, Upload } from "lucide-react"

interface AddItemDropdownProps {
  /** Label shown on the trigger, e.g. "Add Character". */
  label: string
  /** Fires the page's existing manual-add behavior. */
  onAddManually: () => void
  /** Opens the upload-from-list modal. */
  onAddViaUpload: () => void
  /** Trigger button classes so each page keeps its existing look. */
  triggerClassName: string
  /** Classes for the label span (controls responsive hide behavior). */
  labelClassName?: string
}

/**
 * Replaces the existing "+ Add X" button with a dropdown offering
 * "Add Manually" (existing manual flow) and "Add via Upload" (opens the
 * upload + result-selection modal). Trigger styling is passed in so each
 * results view keeps its current button appearance.
 */
export default function AddItemDropdown({
  label,
  onAddManually,
  onAddViaUpload,
  triggerClassName,
  labelClassName = "text-sm font-sans hidden sm:inline",
}: AddItemDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Plus className="w-4 h-4" />
        <span className={labelClassName}>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-[#1a2e23] shadow-xl shadow-black/40 overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onAddManually()
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors font-sans"
          >
            <PenLine className="w-4 h-4 shrink-0" />
            Add Manually
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onAddViaUpload()
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors font-sans border-t border-white/5"
          >
            <Upload className="w-4 h-4 shrink-0" />
            Add via Upload
          </button>
        </div>
      )}
    </div>
  )
}
