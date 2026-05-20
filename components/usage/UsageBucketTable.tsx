"use client"

import type { UsageBucket } from "@/types/usage"
import { formatCostUsd, formatDuration, formatNumber } from "./format"

interface UsageBucketTableProps {
  keyHeader: string
  buckets?: Record<string, UsageBucket>
  loading: boolean
  /** When true (e.g. for the "By user" table), render the row key as plain
   *  text instead of monospace, since emails read better in proportional. */
  keyAsText?: boolean
  /** Inline message shown when there are no rows but the table heading
   *  should still render (e.g. "no attributed extracts in this range"). */
  emptyMessage?: string
}

export default function UsageBucketTable({
  keyHeader,
  buckets,
  loading,
  keyAsText,
  emptyMessage,
}: UsageBucketTableProps) {
  // Sort by cost descending.
  const rows = Object.entries(buckets ?? {}).sort(
    (a, b) => (b[1]?.costUsd ?? 0) - (a[1]?.costUsd ?? 0)
  )

  if (!loading && rows.length === 0) {
    return (
      <div className="px-4 py-6 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 font-sans">
        {emptyMessage ?? "No AI calls in this range yet"}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <table className="w-full text-sm font-sans">
        <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2 text-left font-medium">{keyHeader}</th>
            <th className="px-4 py-2 text-right font-medium">Calls</th>
            <th
              className="px-4 py-2 text-right font-medium"
              title="Underlying AI calls — usually equal to extracts, but higher when chunking or repair retries kicked in."
            >
              AI calls
            </th>
            <th className="px-4 py-2 text-right font-medium">Tokens in</th>
            <th className="px-4 py-2 text-right font-medium">Tokens out</th>
            <th
              className="px-4 py-2 text-right font-medium"
              title="Total user-perceived wait across all extracts in this bucket. Hover a cell to see summed AI compute time."
            >
              Wait time
            </th>
            <th className="px-4 py-2 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <span className="block h-4 w-full max-w-[120px] rounded bg-white/10 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map(([key, bucket]) => {
                // Older records won't have aiCallCount — fall back to calls
                // so the column never reads as "0" for legacy data.
                const aiCalls = bucket.aiCallCount ?? bucket.calls
                return (
                  <tr key={key} className="border-t border-white/5 hover:bg-white/5">
                    <td
                      className={`px-4 py-3 text-white/90 ${
                        keyAsText ? "text-sm" : "font-mono text-xs"
                      }`}
                      title={key}
                    >
                      {key}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(bucket.calls)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(aiCalls)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(bucket.tokensIn)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(bucket.tokensOut)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {/* Bucket totals: summed wallTimeMs (user-perceived
                          wait). Tooltip surfaces summed AI compute when it
                          differs (parallel chunked extracts). Older buckets
                          without wallTimeMs render "—". */}
                      {(() => {
                        const wall = bucket.wallTimeMs
                        const compute = bucket.latencyMs
                        if (wall == null) {
                          return <span className="text-white/40">—</span>
                        }
                        const showTooltip =
                          typeof compute === "number" && compute !== wall
                        return (
                          <span
                            title={
                              showTooltip
                                ? `AI compute: ${formatDuration(compute)}`
                                : undefined
                            }
                            className={
                              showTooltip
                                ? "underline decoration-dotted decoration-white/30 underline-offset-2 cursor-help"
                                : undefined
                            }
                          >
                            {formatDuration(wall)}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCostUsd(bucket.costUsd)}
                    </td>
                  </tr>
                )
              })}
        </tbody>
      </table>
    </div>
  )
}
