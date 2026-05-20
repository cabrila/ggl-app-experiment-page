// Shared formatting helpers for the usage surface.

export function formatCostUsd(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "$0.0000"
  // 4 decimals — sub-cent values are real and meaningful; do not round to 2.
  const sign = value < 0 ? "-" : ""
  return `${sign}$${Math.abs(value).toFixed(4)}`
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "0"
  return value.toLocaleString()
}

export function formatLatency(ms: number | undefined | null): string {
  if (ms == null || Number.isNaN(ms)) return "—"
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}

const RTF =
  typeof Intl !== "undefined" && typeof Intl.RelativeTimeFormat !== "undefined"
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    : null

export function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return iso
  const diffMs = ts - Date.now()
  const absSec = Math.abs(diffMs / 1000)

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ]

  for (const [unit, secs] of units) {
    if (absSec >= secs || unit === "second") {
      const value = Math.round(diffMs / 1000 / secs)
      if (RTF) return RTF.format(value, unit)
      const abs = Math.abs(value)
      const suffix = value <= 0 ? "ago" : "from now"
      return `${abs} ${unit}${abs === 1 ? "" : "s"} ${suffix}`
    }
  }
  return iso
}
