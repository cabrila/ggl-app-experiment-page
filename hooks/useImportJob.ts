"use client"

import { useState, useRef, useCallback } from "react"
import { auth, waitForAuth } from "@/lib/firebase"

export type ImportJobStatus = "idle" | "uploading" | "running" | "complete" | "failed"

interface ImportJobState<T> {
  status: ImportJobStatus
  message: string
  /**
   * Numeric progress 0..100 parsed from backend SSE events.
   * `null` while we don't have a real number yet — UI should treat that as
   * indeterminate. Stays at 100 once the job completes.
   */
  progress: number | null
  result: T | null
  error: string | null
  taskId: string | null
  run: (file: File, sourceTitle?: string) => Promise<void>
  reset: () => void
}

/**
 * Map a backend SSE `progress`/`state_change` event payload to a 0..100
 * percent according to the AI service's documented contract.
 *
 * Spec (see docs/ai-progress-events.md):
 *   step                | percent
 *   --------------------|--------
 *   start               | 5
 *   chunking_start      | 10
 *   parallel_start      | 15
 *   chunk_processing    | 15 + (current/total) * 75   (90 when all done)
 *   merging             | 95
 *   (complete event)    | 100  — handled by the caller, not here
 *
 * Returns `null` for unknown / missing steps so the caller can keep the
 * previous percent rather than snapping the bar backwards on early
 * "Running skill..." events that have no `step`.
 */
function parseProgress(data: unknown): number | null {
  if (!data || typeof data !== "object") return null
  const d = data as Record<string, unknown>

  const step = typeof d.step === "string" ? d.step : null
  switch (step) {
    case "start":
      return 5
    case "chunking_start":
      return 10
    case "parallel_start":
      return 15
    case "chunk_processing": {
      const current = numberOrNull(d.current)
      const total = numberOrNull(d.total)
      if (current !== null && total !== null && total > 0) {
        return clampPercent(15 + (current / total) * 75)
      }
      return null
    }
    case "merging":
      return 95
    default:
      return null
  }
}

function numberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null
}

function clampPercent(v: number): number {
  if (v < 0) return 0
  if (v > 100) return 100
  return v
}

export function useImportJob<T>(taskType: string): ImportJobState<T> {
  const [status, setStatus] = useState<ImportJobStatus>("idle")
  const [message, setMessage] = useState("")
  const [progress, setProgress] = useState<number | null>(null)
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const sourceRef = useRef<EventSource | null>(null)

  const reset = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }
    setStatus("idle")
    setMessage("")
    setProgress(null)
    setResult(null)
    setError(null)
    setTaskId(null)
  }, [])

  const run = useCallback(
    async (file: File, sourceTitle?: string) => {
      // Close any existing EventSource
      if (sourceRef.current) {
        sourceRef.current.close()
        sourceRef.current = null
      }

      setStatus("uploading")
      setMessage("Uploading file...")
      setProgress(null)
      setError(null)
      setResult(null)

      try {
        // 1. Submit task — proxy now requires a Firebase ID token so the
        //    AI service can attribute usage to the signed-in user.
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

        const res = await fetch(`/api/import/${taskType}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: form,
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Upload failed" }))
          throw new Error(errorData.error || "Failed to submit task")
        }

        const { taskId: newTaskId } = await res.json()
        setTaskId(newTaskId)

        // 2. Open SSE stream
        setStatus("running")
        setMessage("Processing...")

        const es = new EventSource(`/api/import/${taskType}/${newTaskId}/progress`)
        sourceRef.current = es
        console.log("[v0] SSE EventSource opened for task:", newTaskId)

        es.onopen = () => {
          console.log("[v0] SSE connection established (readyState=OPEN)")
        }

        es.addEventListener("progress", (e) => {
          console.log("[v0] SSE progress event raw:", e.data)
          try {
            const data = JSON.parse(e.data)
            console.log("[v0] SSE progress parsed:", data)
            if (typeof data.message === "string") setMessage(data.message)
            const pct = parseProgress(data)
            console.log("[v0] SSE progress -> percent:", pct)
            if (pct !== null) {
              // Never let progress go backwards mid-run — backends sometimes
              // re-emit earlier-stage events.
              setProgress((prev) => {
                const next = prev === null ? pct : Math.max(prev, pct)
                console.log("[v0] progress state:", prev, "->", next)
                return next
              })
            }
          } catch (err) {
            console.log("[v0] SSE progress parse error:", err)
            // Ignore parse errors — a malformed event shouldn't crash the run.
          }
        })

        es.addEventListener("state_change", (e) => {
          console.log("[v0] SSE state_change raw:", e.data)
          try {
            const data = JSON.parse(e.data)
            console.log("[v0] SSE state_change parsed:", data)
            if (data.status === "running") {
              setStatus("running")
            }
            const pct = parseProgress(data)
            console.log("[v0] SSE state_change -> percent:", pct)
            if (pct !== null) {
              setProgress((prev) => (prev === null ? pct : Math.max(prev, pct)))
            }
          } catch (err) {
            console.log("[v0] SSE state_change parse error:", err)
            // Ignore parse errors
          }
        })

        // Catch-all generic message handler so we can see ANY event whose
        // `event:` line is missing or has an unexpected name. EventSource
        // delivers these via `onmessage` (event type "message").
        es.onmessage = (e) => {
          console.log("[v0] SSE generic message:", e.data)
        }

        es.addEventListener("complete", (e) => {
          try {
            const data = JSON.parse(e.data)
            setResult(data.result as T)
            setStatus("complete")
            setMessage("Complete")
            setProgress(100)
          } catch {
            setError("Failed to parse result")
            setStatus("failed")
          }
          es.close()
          sourceRef.current = null
        })

        es.addEventListener("error", (e) => {
          // EventSource also fires this for connection errors (no e.data)
          try {
            const messageEvent = e as MessageEvent
            if (messageEvent.data) {
              const data = JSON.parse(messageEvent.data)
              setError(data.message || "Task failed")
            } else {
              // Connection error - try to recover by polling
              setError("Connection lost. The task may still be processing.")
            }
          } catch {
            setError("Connection lost")
          }
          setStatus("failed")
          es.close()
          sourceRef.current = null
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
        setStatus("failed")
      }
    },
    [taskType],
  )

  return { status, message, progress, result, error, taskId, run, reset }
}
