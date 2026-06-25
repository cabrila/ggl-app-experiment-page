"use client"

type Accent = "rose" | "teal" | "emerald" | "amber" | "violet" | "neutral"

const ACCENT_TEXT: Record<Accent, string> = {
  rose: "text-rose-400 hover:text-rose-300",
  teal: "text-teal-400 hover:text-teal-300",
  emerald: "text-emerald-400 hover:text-emerald-300",
  amber: "text-amber-400 hover:text-amber-300",
  violet: "text-violet-400 hover:text-violet-300",
  neutral: "text-white/50 hover:text-white/80",
}

interface CardMoreProps {
  /** Opens the full detail modal. When omitted, renders a static [...] hint. */
  onClick?: () => void
  /** Deprecated: no longer rendered. Kept for backwards-compatible call sites. */
  label?: string
  accent?: Accent
  className?: string
}

/**
 * Compact "[...]" affordance shown on grid cards to indicate that more
 * information exists beyond the snapshot. Clicking opens the full detail modal,
 * where every field is rendered in full (forceExpanded). This keeps grid cards
 * uniform in height instead of expanding inline.
 */
export default function CardMore({
  onClick,
  accent = "neutral",
  className = "",
}: CardMoreProps) {
  if (!onClick) {
    return (
      <span className={`font-mono text-sm text-white/40 ${className}`} aria-hidden="true">
        [...]
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center font-mono text-sm leading-none transition-colors ${ACCENT_TEXT[accent]} ${className}`}
      title="Open full details"
      aria-label="Open full details"
    >
      [...]
    </button>
  )
}
