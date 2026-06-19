"use client"

// Polling-based import job tracker. Replaces the previous SSE implementation
// (see deleted app/api/import/[taskType]/[taskId]/progress/route.ts) — the
// upstream AI service never emitted SSE frames over the long-poll endpoint,
// so we now read task.progress.percent directly from the Firestore-mirrored
// task document at a 2s cadence.

import { useState, useRef, useCallback, useEffect } from "react"
import { auth, waitForAuth } from "@/lib/firebase"

export type ImportJobStatus =
  | "idle"
  | "uploading"
  | "running"
  | "complete"
  | "failed"

interface ImportJobState<T> {
  status: ImportJobStatus
  message: string
  /**
   * Numeric progress 0..100 read from the task document's `progress.percent`.
   * `null` while we don't have a real number yet — UI should treat that as
   * indeterminate. Pinned at 100 once the job completes.
   */
  progress: number | null
  result: T | null
  error: string | null
  taskId: string | null
  run: (file: File, sourceTitle?: string) => Promise<void>
  reset: () => void
}

/** Shape of `GET /api/import/:taskType/:taskId`, matching the AI service. */
interface TaskDocument {
  id: string
  skill: string
  status: "received" | "running" | "complete" | "failed"
  progress?: {
    percent?: number
    message?: string
    step?: string
    current?: number
    total?: number
  }
  result?: unknown
  error?: string
}

const POLL_INTERVAL_MS = 2000
// Bounded retry on consecutive *transport* failures only. Per-call status
// errors (4xx/5xx returned by our proxy) abort immediately. 10 misses at
// 2s = 20s of dead air before giving up — long enough to ride out a
// dropped wifi association, short enough that a truly broken backend
// doesn't pin a spinner forever.
const MAX_CONSECUTIVE_NETWORK_FAILURES = 10

export function useImportJob<T>(taskType: string): ImportJobState<T> {
  const [status, setStatus] = useState<ImportJobStatus>("idle")
  const [message, setMessage] = useState("")
  const [progress, setProgress] = useState<number | null>(null)
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)

  // The polling loop is keyed by taskId via a useEffect below; this ref
  // lets the run() callback signal "abandon any in-flight loop" when the
  // user kicks off a new run or calls reset() before the effect cleanup
  // would naturally fire.
  const cancelRef = useRef(false)

  const reset = useCallback(() => {
    cancelRef.current = true
    setStatus("idle")
    setMessage("")
    setProgress(null)
    setResult(null)
    setError(null)
    setTaskId(null)
  }, [])

  const run = useCallback(
    async (file: File, sourceTitle?: string) => {
      // Stop any prior polling loop before starting a new one.
      cancelRef.current = true

      setStatus("uploading")
      setMessage("Uploading file...")
      setProgress(null)
      setError(null)
      setResult(null)

      try {
        // 1. Submit task — proxy requires a Firebase ID token so the AI
        //    service can attribute usage to the signed-in user.
        await waitForAuth()
        const current = auth.currentUser
        if (!current) {
          throw new Error("You need to be signed in to run AI extractions.")
        }
        const idToken = await current.getIdToken()

        const form = new FormData()
        form.append("file", file)
        if (sourceTitle) {
          form.append("sourceTitle", sourceTitle)
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''
        const res = await fetch(`${backendUrl}/api/import/${taskType}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: form,
        })

        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => ({ error: "Upload failed" }))
          throw new Error(errorData.error || "Failed to submit task")
        }

        const { taskId: newTaskId } = await res.json()

        // 2. Hand off to the polling loop (driven by the useEffect below).
        cancelRef.current = false
        setStatus("running")
        setMessage("Processing...")
        setTaskId(newTaskId)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
        setStatus("failed")
      }
    },
    [taskType]
  )

  // Polling effect — runs whenever taskId becomes a string. The auth token
  // is refreshed for each poll so a 1-hour extract doesn't get killed by
  // an expired ID token. Returns to idle on cleanup so re-mounting (e.g.
  // strict mode / fast refresh) doesn't double-poll.
  useEffect(() => {
    if (!taskId) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let consecutiveFailures = 0

    async function pollOnce(): Promise<void> {
      if (cancelled || cancelRef.current) return

      try {
        const user = auth.currentUser
        const idToken = user ? await user.getIdToken() : null
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''
        const res = await fetch(`${backendUrl}/api/import/${taskType}/${taskId}`, {
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
          cache: "no-store",
        })

        if (!res.ok) {
          // Non-2xx from our proxy is a real, surfaced error — not a
          // transient transport blip. Stop polling and report.
          const body = (await res.json().catch(() => ({}))) as {
            error?: string
          }
          if (cancelled || cancelRef.current) return
          setError(body.error || `Task fetch failed (HTTP ${res.status})`)
          setStatus("failed")
          return
        }

        const task = (await res.json()) as TaskDocument
        if (cancelled || cancelRef.current) return

        consecutiveFailures = 0

        if (task.progress) {
          if (typeof task.progress.percent === "number") {
            const pct = clampPercent(task.progress.percent)
            // Never let progress go backwards — server may briefly emit
            // an earlier-stage progress doc on retry.
            setProgress((prev) => (prev === null ? pct : Math.max(prev, pct)))
          }
          if (typeof task.progress.message === "string") {
            setMessage(task.progress.message)
          }
        }

        if (task.status === "complete") {
          setResult(task.result as T)
          setProgress(100)
          setMessage("Complete")
          setStatus("complete")
          return
        }

        if (task.status === "failed") {
          setError(task.error || "Extraction failed")
          setStatus("failed")
          return
        }

        // status === 'received' or 'running' — keep polling.
        timer = setTimeout(pollOnce, POLL_INTERVAL_MS)
      } catch (err) {
        // Transient network failure (offline, DNS hiccup, mid-flight
        // abort). Retry up to MAX_CONSECUTIVE_NETWORK_FAILURES before
        // giving up — but DON'T flip to "failed" while we're retrying.
        // The point of polling is exactly that brief blips are invisible.
        consecutiveFailures += 1
        if (consecutiveFailures >= MAX_CONSECUTIVE_NETWORK_FAILURES) {
          if (cancelled || cancelRef.current) return
          setError(
            err instanceof Error
              ? `Lost connection to server: ${err.message}`
              : "Lost connection to server"
          )
          setStatus("failed")
          return
        }
        timer = setTimeout(pollOnce, POLL_INTERVAL_MS)
      }
    }

    void pollOnce()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [taskId, taskType])

  return { status, message, progress, result, error, taskId, run, reset }
}

function clampPercent(v: number): number {
  if (!Number.isFinite(v)) return 0
  if (v < 0) return 0
  if (v > 100) return 100
  return v
}
