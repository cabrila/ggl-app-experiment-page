"use client"

import { useState, useRef, useCallback } from "react"
import { auth, waitForAuth } from "@/lib/firebase"

export type ImportJobStatus = "idle" | "uploading" | "running" | "complete" | "failed"

interface ImportJobState<T> {
  status: ImportJobStatus
  message: string
  result: T | null
  error: string | null
  taskId: string | null
  run: (file: File, sourceTitle?: string) => Promise<void>
  reset: () => void
}

export function useImportJob<T>(taskType: string): ImportJobState<T> {
  const [status, setStatus] = useState<ImportJobStatus>("idle")
  const [message, setMessage] = useState("")
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
    setResult(null)
    setError(null)
    setTaskId(null)
  }, [])

  const run = useCallback(async (file: File, sourceTitle?: string) => {
    // Close any existing EventSource
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }

    setStatus("uploading")
    setMessage("Uploading file...")
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

      es.addEventListener("progress", (e) => {
        try {
          const data = JSON.parse(e.data)
          setMessage(data.message || "Processing...")
        } catch {
          // Ignore parse errors
        }
      })

      es.addEventListener("state_change", (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.status === "running") {
            setStatus("running")
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
  }, [taskType])

  return { status, message, result, error, taskId, run, reset }
}
