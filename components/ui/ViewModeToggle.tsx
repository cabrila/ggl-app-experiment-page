"use client"

import { useState } from "react"
import { LayoutGrid, List, AlignJustify } from "lucide-react"

export type ViewMode = "full" | "minimal" | "list"

interface ViewModeToggleProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

interface TooltipButtonProps {
  isActive: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function TooltipButton({ isActive, onClick, icon, label }: TooltipButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center justify-center p-2 rounded-md transition-all ${
          isActive
            ? "bg-white/15 text-white shadow-sm"
            : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
      >
        {icon}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0d1a14] border border-white/20 rounded text-xs text-white whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white/20" />
        </div>
      )}
    </div>
  )
}

export default function ViewModeToggle({ viewMode, onChange, className = "" }: ViewModeToggleProps) {
  return (
    <div className={`flex items-center bg-white/5 rounded-lg p-0.5 ${className}`}>
      <TooltipButton
        isActive={viewMode === "full"}
        onClick={() => onChange("full")}
        icon={<LayoutGrid className="w-4 h-4" />}
        label="Full"
      />
      <TooltipButton
        isActive={viewMode === "minimal"}
        onClick={() => onChange("minimal")}
        icon={<AlignJustify className="w-4 h-4" />}
        label="Minimal"
      />
      <TooltipButton
        isActive={viewMode === "list"}
        onClick={() => onChange("list")}
        icon={<List className="w-4 h-4" />}
        label="List View"
      />
    </div>
  )
}
