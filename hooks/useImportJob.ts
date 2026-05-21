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
  // Tracks whether we've already reached a terminal state (`complete` or
  // an AI-emitted `error` frame). After `complete`, the server closes the
  // SSE stream cleanly, which causes EventSource to fire its native
  // `error` event — without this guard we'd flip a successful run to
  // "failed" milliseconds after showing 100%.
  const terminalRef = useRef(false)

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
    terminalRef.current = false
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
      terminalRef.current = false

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

        es.addEventListener("progress", (e) => {
          try {
            const data = JSON.parse(e.data)
            if (typeof data.message === "string") setMessage(data.message)
            const pct = parseProgress(data)
            if (pct !== null) {
              // Never let progress go backwards mid-run — backends sometimes
              // re-emit earlier-stage events.
              setProgress((prev) => (prev === null ? pct : Math.max(prev, pct)))
            }
          } catch {
            // Ignore parse errors — a malformed event shouldn't crash the run.
          }
        })

        es.addEventListener("state_change", (e) => {
          try {
            const data = JSON.parse(e.data)
            if (data.status === "running") {
              setStatus("running")
            }
            const pct = parseProgress(data)
            if (pct !== null) {
              setProgress((prev) => (prev === null ? pct : Math.max(prev, pct)))
            }
          } catch {
            // Ignore parse errors
          }
        })

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
          // Mark terminal BEFORE closing — closing triggers EventSource's
          // native onerror, which would otherwise flip status back to failed.
          terminalRef.current = true
          es.close()
          sourceRef.current = null
        })

        es.addEventListener("error", (e) => {
          // The AI service emits a named `error` event with JSON payload
          // when a skill genuinely fails. EventSource also reuses the same
          // event type for transport-level errors (no `data`). After a
          // clean `complete`, the server closes the stream and the native
          // error fires — that path must NOT mark the run as failed.
          if (terminalRef.current) {
            es.close()
            sourceRef.current = null
            return
          }
          try {
            const messageEvent = e as MessageEvent
            if (messageEvent.data) {
              const data = JSON.parse(messageEvent.data)
              setError(data.message || "Task failed")
            } else {
              // Transport error before a terminal frame arrived.
              setError("Connection lost. The task may still be processing.")
            }
          } catch {
            setError("Connection lost")
          }
          setStatus("failed")
          terminalRef.current = true
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
