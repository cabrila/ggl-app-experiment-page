"use client"

import type { UsageBucket } from "@/types/usage"
import { formatCostUsd, formatNumber } from "./format"

interface UsageTotalsStripProps {
  totals?: UsageBucket
  loading: boolean
}

interface StatCardProps {
  label: string
  value: string
  loading: boolean
}

function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 rounded-xl bg-white/5 border border-white/10 min-w-0">
      <span className="text-xs uppercase tracking-wide text-white/50 font-sans">{label}</span>
      {loading ? (
        <span className="block h-7 w-24 rounded bg-white/10 animate-pulse" aria-hidden />
      ) : (
        <span className="text-2xl font-semibold font-sans truncate">{value}</span>
      )}
    </div>
  )
}

export default function UsageTotalsStrip({ totals, loading }: UsageTotalsStripProps) {
  const totalTokens = (totals?.tokensIn ?? 0) + (totals?.tokensOut ?? 0)
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      aria-label="Usage totals"
    >
      <StatCard label="Total cost" value={formatCostUsd(totals?.costUsd)} loading={loading} />
      <StatCard label="Total calls" value={formatNumber(totals?.calls)} loading={loading} />
      <StatCard label="Total tokens" value={formatNumber(totalTokens)} loading={loading} />
      <StatCard
        label="Total input pages"
        value={formatNumber(totals?.inputPagesEstimate)}
        loading={loading}
      />
    </section>
  )
}
