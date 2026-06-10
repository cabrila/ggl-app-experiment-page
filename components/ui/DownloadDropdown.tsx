"use client"

import { useState, useRef, useEffect } from "react"
import { Download, ChevronDown, FileJson, FileSpreadsheet, FileText } from "lucide-react"

interface DownloadDropdownProps {
  /** Fires the page's existing "export as JSON" behavior. */
  onDownloadJSON: () => void
  /** Fires the page's existing "export as Excel" behavior. */
  onDownloadExcel: () => void
  /** Fires the page's existing "export as PDF" behavior. */
  onDownloadPDF: () => void
  /** Trigger button classes so each page keeps its existing look. */
  triggerClassName?: string
  /** Classes for the label span (controls responsive hide behavior). */
  labelClassName?: string
}

/**
 * Collapses the three separate JSON / Excel / PDF export buttons into a single
 * "Download" button with a dropdown menu. Each menu item fires the page's
 * existing export handler so download behavior is unchanged.
 */
export default function DownloadDropdown({
  onDownloadJSON,
  onDownloadExcel,
  onDownloadPDF,
  triggerClassName = "flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors",
  labelClassName = "hidden sm:inline",
}: DownloadDropdownProps) {
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
        title="Download"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="w-4 h-4" />
        <span className={labelClassName}>Download</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-white/10 bg-[#1a2e23] shadow-xl shadow-black/40 overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDownloadJSON()
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors font-sans"
          >
            <FileJson className="w-4 h-4 shrink-0" />
            JSON
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDownloadExcel()
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors font-sans border-t border-white/5"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            Excel
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDownloadPDF()
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors font-sans border-t border-white/5"
          >
            <FileText className="w-4 h-4 shrink-0" />
            PDF
          </button>
        </div>
      )}
    </div>
  )
}
