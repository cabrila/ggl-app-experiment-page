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
  /**
   * When the backend reports chunked progress, the index of the chunk
   * currently being processed (or just finished). 1-based. `null` when the
   * backend hasn't reported chunk info yet.
   */
  currentChunk: number | null
  /** Total number of chunks the script was split into (from backend). */
  totalChunks: number | null
  result: T | null
  error: string | null
  taskId: string | null
  run: (file: File, sourceTitle?: string) => Promise<void>
  reset: () => void
}

/**
 * Try to extract a 0..100 progress number from a backend SSE event payload.
 *
 * The AI service hasn't standardised a single field name, so we accept the
 * shapes we've seen: explicit `progress`/`percent`, fractional `progress`
 * in 0..1, or pairs like `current/total` or `chunk/total_chunks`. Returns
 * `null` when nothing usable is present so callers can keep their previous
 * value instead of snapping to zero.
 */
function parseProgress(data: unknown): number | null {
  if (!data || typeof data !== "object") return null
  const d = data as Record<string, unknown>

  const direct = d.progress ?? d.percent ?? d.percentage
  if (typeof direct === "number" && Number.isFinite(direct)) {
    // Accept either 0..1 or 0..100 — if it's clearly a fraction, scale it.
    const v = direct <= 1 ? direct * 100 : direct
    return clampPercent(v)
  }

  const current = numberOrNull(d.current ?? d.chunk ?? d.completed)
  const total = numberOrNull(d.total ?? d.total_chunks ?? d.totalChunks)
  if (current !== null && total !== null && total > 0) {
    return clampPercent((current / total) * 100)
  }

  return null
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
  const [currentChunk, setCurrentChunk] = useState<number | null>(null)
  const [totalChunks, setTotalChunks] = useState<number | null>(null)
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
    setCurrentChunk(null)
    setTotalChunks(null)
    setResult(null)
    setError(null)
    setTaskId(null)
  }, [])

  // Read chunk indicators out of an SSE payload. Same field-name tolerance as
  // parseProgress — keep the two in sync.
  const updateChunkInfo = useCallback((d: Record<string, unknown>) => {
    const cur = numberOrNull(d.current ?? d.chunk ?? d.completed)
    const tot = numberOrNull(d.total ?? d.total_chunks ?? d.totalChunks)
    if (cur !== null) setCurrentChunk((prev) => (prev === null ? cur : Math.max(prev, cur)))
    if (tot !== null) setTotalChunks(tot)
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
      setCurrentChunk(null)
      setTotalChunks(null)
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

        console.log("[v0] import: POST start", { taskType, file: file.name, size: file.size })
        const postStart = performance.now()
        const res = await fetch(`/api/import/${taskType}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: form,
        })
        console.log("[v0] import: POST returned", res.status, `${Math.round(performance.now() - postStart)}ms`)

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Upload failed" }))
          throw new Error(errorData.error || "Failed to submit task")
        }

        const { taskId: newTaskId } = await res.json()
        console.log("[v0] import: taskId", newTaskId)
        setTaskId(newTaskId)

        // 2. Open SSE stream
        setStatus("running")
        setMessage("Processing...")

        const es = new EventSource(`/api/import/${taskType}/${newTaskId}/progress`)
        sourceRef.current = es

        es.addEventListener("progress", (e) => {
          try {
            const data = JSON.parse(e.data)
            console.log("[v0] sse progress event", data)
            if (typeof data.message === "string") setMessage(data.message)
            updateChunkInfo(data)
            const pct = parseProgress(data)
            if (pct !== null) {
              // Never let progress go backwards mid-run — backends sometimes
              // re-emit earlier-stage events.
              setProgress((prev) => (prev === null ? pct : Math.max(prev, pct)))
            }
          } catch (err) {
            console.log("[v0] sse progress parse error", err)
          }
        })

        es.addEventListener("state_change", (e) => {
          try {
            const data = JSON.parse(e.data)
            console.log("[v0] sse state_change event", data)
            if (data.status === "running") {
              setStatus("running")
            }
            updateChunkInfo(data)
            const pct = parseProgress(data)
            if (pct !== null) {
              setProgress((prev) => (prev === null ? pct : Math.max(prev, pct)))
            }
          } catch (err) {
            console.log("[v0] sse state_change parse error", err)
          }
        })

        es.addEventListener("complete", (e) => {
          try {
            const data = JSON.parse(e.data)
            console.log("[v0] sse complete event", data)
            setResult(data.result as T)
            setStatus("complete")
            setMessage("Complete")
            setProgress(100)
          } catch (err) {
            console.log("[v0] sse complete parse error", err)
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

  return { status, message, progress, currentChunk, totalChunks, result, error, taskId, run, reset }
}
