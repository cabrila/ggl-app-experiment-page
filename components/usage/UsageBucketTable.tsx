"use client"

import type { UsageBucket } from "@/types/usage"
import { formatCostUsd, formatNumber } from "./format"

interface UsageBucketTableProps {
  keyHeader: string
  buckets?: Record<string, UsageBucket>
  loading: boolean
}

export default function UsageBucketTable({
  keyHeader,
  buckets,
  loading,
}: UsageBucketTableProps) {
  // Sort by cost descending.
  const rows = Object.entries(buckets ?? {}).sort(
    (a, b) => (b[1]?.costUsd ?? 0) - (a[1]?.costUsd ?? 0)
  )

  if (!loading && rows.length === 0) {
    return (
      <div className="px-4 py-6 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 font-sans">
        No AI calls in this range yet
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
            <th className="px-4 py-2 text-right font-medium">Tokens in</th>
            <th className="px-4 py-2 text-right font-medium">Tokens out</th>
            <th className="px-4 py-2 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <span className="block h-4 w-full max-w-[120px] rounded bg-white/10 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map(([key, bucket]) => (
                <tr key={key} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-white/90">{key}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatNumber(bucket.calls)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatNumber(bucket.tokensIn)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatNumber(bucket.tokensOut)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCostUsd(bucket.costUsd)}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
