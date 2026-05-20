"use client"

import type { RecentCall } from "@/types/usage"
import { formatCostUsd, formatDuration, formatNumber, formatRelativeTime } from "./format"

interface UsageRecentCallsTableProps {
  calls?: RecentCall[]
  loading: boolean
}

export default function UsageRecentCallsTable({ calls, loading }: UsageRecentCallsTableProps) {
  const rows = (calls ?? []).slice(0, 100)

  if (!loading && rows.length === 0) {
    return (
      <div className="px-4 py-6 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 font-sans">
        No AI calls in this range yet
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 overflow-x-auto">
      <table className="w-full text-sm font-sans min-w-[1100px]">
        <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Time</th>
            {/* New: user attribution. Rendered before existing columns so
                it's the first thing the eye lands on. */}
            <th className="px-4 py-2 text-left font-medium min-w-[220px]">User</th>
            <th
              className="px-4 py-2 text-right font-medium"
              title="Underlying AI calls for this extract. Usually 1; higher (e.g. 4–6) for chunked scene-extract on long screenplays."
            >
              AI calls
            </th>
            <th className="px-4 py-2 text-left font-medium">Skill</th>
            <th className="px-4 py-2 text-left font-medium">Model</th>
            <th className="px-4 py-2 text-left font-medium">Phase</th>
            <th className="px-4 py-2 text-left font-medium">Input size</th>
            <th className="px-4 py-2 text-right font-medium">Tokens</th>
            <th className="px-4 py-2 text-right font-medium">Cost</th>
            <th
              className="px-4 py-2 text-right font-medium"
              title="User-perceived wait time from start of extract to result delivered. Hover a cell to see total AI compute time."
            >
              Wait time
            </th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <span className="block h-4 w-full max-w-[140px] rounded bg-white/10 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((call, idx) => {
                const isRepair = call.phase === "repair_call"
                // Older records may not have aiCallCount — treat as 1.
                const aiCalls = call.aiCallCount ?? 1
                const isChunked = aiCalls > 1
                return (
                  <tr
                    key={`${call.taskId}-${call.timestamp}-${idx}`}
                    className={`border-t border-white/5 hover:bg-white/5 ${isRepair ? "text-white/60" : ""}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap" title={call.timestamp}>
                      {formatRelativeTime(call.timestamp)}
                    </td>
                    <td
                      className="px-4 py-3 max-w-[260px] truncate"
                      title={call.userEmail || "Unattributed (older record)"}
                    >
                      {call.userEmail ? (
                        call.userEmail
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {formatNumber(aiCalls)}
                      {isChunked && (
                        <span
                          className="ml-1.5 text-[10px] text-white/40 font-sans"
                          title="Multiple AI calls under the hood — normal for long screenplays in scene-extract."
                        >
                          (chunked)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{call.skillId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{call.model}</td>
                    <td className="px-4 py-3">
                      {isRepair ? (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-amber-500/15 border border-amber-400/40 text-amber-200"
                          title="Validation failed first try; this is a retry that costs extra."
                        >
                          repair
                        </span>
                      ) : (
                        <span className="text-xs text-white/50">model</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatNumber(call.inputPagesEstimate)} pages ·{" "}
                      {formatNumber(call.inputWords)} words
                      {call.inputLettersEstimated && (
                        <span className="ml-1 text-xs text-white/40">(est.)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {formatNumber(call.tokensIn)} → {formatNumber(call.tokensOut)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCostUsd(call.costUsd)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {/* "Wait time" = wallTimeMs (user-perceived). Older
                          records lack the field entirely — render "—" so
                          they're visually distinct from real 0-second rows.
                          The tooltip surfaces summed AI compute time, which
                          can be much higher when chunks ran in parallel.
                          Skipped when the two values are equal (no
                          parallelization benefit to show). */}
                      {(() => {
                        const wall = call.wallTimeMs
                        const compute = call.latencyMs
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
                  </tr>
                )
              })}
        </tbody>
      </table>
    </div>
  )
}
