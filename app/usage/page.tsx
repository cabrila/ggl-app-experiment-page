"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { auth, waitForAuth } from "@/lib/firebase"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import type { User } from "firebase/auth"
import type { UsageResponse } from "@/types/usage"
import UsageHeader from "@/components/usage/UsageHeader"
import UsageRangeSelector, { type RangeKey } from "@/components/usage/UsageRangeSelector"
import UsageTotalsStrip from "@/components/usage/UsageTotalsStrip"
import UsageBucketTable from "@/components/usage/UsageBucketTable"
import UsageRecentCallsTable from "@/components/usage/UsageRecentCallsTable"

function rangeToParams(range: RangeKey): { from?: string; to?: string } {
  const now = new Date()
  if (range === "today") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    return { from: start.toISOString(), to: now.toISOString() }
  }
  if (range === "7d") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { from: start.toISOString(), to: now.toISOString() }
  }
  if (range === "30d") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return { from: start.toISOString(), to: now.toISOString() }
  }
  // "all" — explicit far-past date so the API doesn't default to today.
  return { from: "2020-01-01T00:00:00Z", to: now.toISOString() }
}

export default function UsagePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [range, setRange] = useState<RangeKey>("today")
  const [data, setData] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to auth — server is the load-bearing check; this is for UX
  // (so we can show a friendly state while auth resolves).
  useEffect(() => {
    let mounted = true
    const unsub = subscribeToAuthStateChanges((u) => {
      if (!mounted) return
      setUser(u)
      setAuthReady(true)
    })
    return () => {
      mounted = false
      unsub()
    }
  }, [])

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await waitForAuth()
      const current = auth.currentUser
      if (!current) {
        // In dev, useFirebaseUser fakes an internal user so the button is
        // visible — but /api/usage still requires a real ID token. Fail
        // loudly instead of redirecting so the developer knows why.
        if (process.env.NODE_ENV === "development") {
          throw new Error(
            "No Firebase user signed in. /api/usage requires a real ID token; sign in with a @gogreenlight.ai account to see live data."
          )
        }
        router.replace("/")
        return
      }
      const idToken = await current.getIdToken()
      const { from, to } = rangeToParams(range)
      const qs = new URLSearchParams()
      if (from) qs.set("from", from)
      if (to) qs.set("to", to)

      const res = await fetch(`/api/usage?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      })

      if (res.status === 401 || res.status === 403) {
        const body = await res.text()
        throw new Error(`Auth rejected (${res.status}): ${body}`)
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed: ${res.status}`)
      }

      const ct = res.headers.get("content-type") || ""
      if (!ct.includes("application/json")) {
        const text = await res.text()
        throw new Error(
          `Expected JSON but got ${ct || "unknown"}. First 200 chars: ${text.slice(0, 200)}`
        )
      }

      const json = (await res.json()) as UsageResponse
      setData(json)
    } catch (err) {
      console.error("[v0] /usage fetch failed:", err)
      setError(err instanceof Error ? err.message : "Failed to load usage")
    } finally {
      setLoading(false)
    }
  }, [range, router])

  // Fetch on mount and on range change.
  useEffect(() => {
    if (!authReady) return
    if (!user && process.env.NODE_ENV !== "development") {
      router.replace("/")
      return
    }
    fetchUsage()
  }, [authReady, user, fetchUsage, router])

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "linear-gradient(180deg, #2d6b3f 0%, #1a4a2a 30%, #0f3520 55%, #0a2618 80%, #061a10 100%)",
      }}
    >
      <UsageHeader onHome={() => router.push("/")} />

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold font-sans">AI Usage &amp; Cost</h1>
            <p className="text-sm text-white/60 font-sans">
              {data ? (
                <>Range: {new Date(data.from).toLocaleString()} – {new Date(data.to).toLocaleString()}</>
              ) : (
                "Loading range…"
              )}
            </p>
          </div>
          <UsageRangeSelector value={range} onChange={setRange} />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-200 font-sans whitespace-pre-wrap">
            {error}
          </div>
        )}

        <UsageTotalsStrip totals={data?.totals} loading={loading && !data} />

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold font-sans">By skill</h2>
          <UsageBucketTable
            keyHeader="Skill"
            buckets={data?.bySkill}
            loading={loading && !data}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold font-sans">By model</h2>
          <UsageBucketTable
            keyHeader="Model"
            buckets={data?.byModel}
            loading={loading && !data}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold font-sans">Recent calls</h2>
          <UsageRecentCallsTable calls={data?.recentCalls} loading={loading && !data} />
        </section>
      </main>
    </div>
  )
}
