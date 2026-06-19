"use client"

export type RangeKey = "today" | "7d" | "30d" | "all"

interface UsageRangeSelectorProps {
  value: RangeKey
  onChange: (next: RangeKey) => void
}

const OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
]

export default function UsageRangeSelector({ value, onChange }: UsageRangeSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-sm font-sans">
      <span className="text-white/60">Range</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as RangeKey)}
        className="bg-white/10 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0f3520]">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
