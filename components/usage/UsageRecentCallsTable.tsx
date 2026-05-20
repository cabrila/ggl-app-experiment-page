"use client"

import type { RecentCall } from "@/types/usage"
import { formatCostUsd, formatLatency, formatNumber, formatRelativeTime } from "./format"

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
      <table className="w-full text-sm font-sans min-w-[900px]">
        <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Time</th>
            <th className="px-4 py-2 text-left font-medium">Skill</th>
            <th className="px-4 py-2 text-left font-medium">Model</th>
            <th className="px-4 py-2 text-left font-medium">Phase</th>
            <th className="px-4 py-2 text-left font-medium">Input size</th>
            <th className="px-4 py-2 text-right font-medium">Tokens</th>
            <th className="px-4 py-2 text-right font-medium">Cost</th>
            <th className="px-4 py-2 text-right font-medium">Latency</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <span className="block h-4 w-full max-w-[140px] rounded bg-white/10 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((call, idx) => {
                const isRepair = call.phase === "repair_call"
                return (
                  <tr
                    key={`${call.taskId}-${call.timestamp}-${idx}`}
                    className={`border-t border-white/5 hover:bg-white/5 ${isRepair ? "text-white/60" : ""}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap" title={call.timestamp}>
                      {formatRelativeTime(call.timestamp)}
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
                      {formatLatency(call.latencyMs)}
                    </td>
                  </tr>
                )
              })}
        </tbody>
      </table>
    </div>
  )
}
