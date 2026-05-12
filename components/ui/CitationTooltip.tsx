"use client"

import { useState, useRef, useEffect } from "react"
import { Info } from "lucide-react"
import type { Citations } from "@/types/character-bible"

interface CitationTooltipProps {
  citeKey: string | undefined
  citations: Citations | undefined
  className?: string
}

export default function CitationTooltip({ citeKey, citations, className = "" }: CitationTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Don't render if no citation key or citations map
  if (!citeKey || !citations) return null

  // Look up the citation text
  const citationText = citations[citeKey as keyof Citations]

  // Don't render if citation doesn't resolve
  if (!citationText) return null

  return (
    <span className={`inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="ml-1 p-0.5 text-emerald-400/60 hover:text-emerald-400 transition-colors rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
        aria-label="View source citation"
      >
        <Info className="w-3 h-3" />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="absolute z-50 left-0 mt-1 top-full"
        >
          <div className="bg-[#0f1f17] border border-emerald-500/30 rounded-lg shadow-xl p-3 max-w-sm">
            <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1.5 font-semibold">
              Source
            </p>
            <p className="text-sm text-white/90 font-mono whitespace-pre-wrap leading-relaxed">
              {citationText}
            </p>
          </div>
        </div>
      )}
    </span>
  )
}

// Wrapper component for values with citations
interface CitedValueProps {
  value: string | undefined
  citeKey: string | undefined
  citations: Citations | undefined
  className?: string
}

export function CitedValue({ value, citeKey, citations, className = "" }: CitedValueProps) {
  if (!value) return null

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <span>{value}</span>
      <CitationTooltip citeKey={citeKey} citations={citations} />
    </span>
  )
}
