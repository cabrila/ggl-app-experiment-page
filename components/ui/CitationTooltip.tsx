"use client"

import { useState, useRef } from "react"
import { Info } from "lucide-react"
import type { Character } from "@/types/character-bible"
import { getFieldCitation } from "@/types/character-bible"

interface CitationTooltipProps {
  character: Character
  fieldPath: string
  className?: string
}

export default function CitationTooltip({ character, fieldPath, className = "" }: CitationTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Use the two-step lookup
  const citationText = getFieldCitation(character, fieldPath)

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
  character: Character
  fieldPath: string
  className?: string
}

export function CitedValue({ value, character, fieldPath, className = "" }: CitedValueProps) {
  if (!value) return null

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <span>{value}</span>
      <CitationTooltip character={character} fieldPath={fieldPath} />
    </span>
  )
}
