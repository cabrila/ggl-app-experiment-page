"use client"

import type { LucideIcon } from "lucide-react"
import { FileText, Sparkles, X, ArrowRight } from "lucide-react"

interface ReadyToExtractCardProps {
  /** Project/source title shown as the card heading. */
  name: string
  /** Filename of the attached script. */
  scriptName: string
  /** Human-readable source, e.g. "From Scenes". */
  sourceLabel: string
  /** Section icon (matches the page's project icon). */
  icon: LucideIcon
  onStart: () => void
  onDismiss: () => void
}

export default function ReadyToExtractCard({
  name,
  scriptName,
  sourceLabel,
  icon: Icon,
  onStart,
  onDismiss,
}: ReadyToExtractCardProps) {
  return (
    <div
      className="group relative flex flex-col rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-500/[0.07] ring-2 ring-emerald-500/20 hover:ring-emerald-500/40 hover:border-emerald-400 transition-all min-h-[200px] overflow-hidden"
    >
      {/* Soft glow accent */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl" aria-hidden="true" />

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 z-10 p-1.5 bg-white/5 hover:bg-white/15 rounded-lg text-white/50 hover:text-white transition-colors"
        title="Dismiss"
        aria-label={`Dismiss ${name}`}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col flex-1 p-5">
        {/* Status badge */}
        <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300 font-sans">
            Ready to Extract
          </span>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-base font-bold text-white font-sans leading-snug break-words line-clamp-2">
              {name}
            </h3>
            <p className="text-xs text-emerald-300/70 font-sans mt-0.5">{sourceLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-white/50 mb-4 min-w-0">
          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{scriptName}</span>
        </div>

        <button
          onClick={onStart}
          className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0f1f17] font-semibold font-sans text-sm transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start extraction</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
