"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ArrowLeft, FileText, Loader2, X, AlertCircle, RefreshCw, PenLine, Download } from "lucide-react"
import { useSceneList } from "./SceneListContext"
import { Scene, SceneProject } from "@/types/scene-list"
import { useImportJob } from "@/hooks/useImportJob"
import type { SceneExtractResult } from "@/types/ai"
import { trackFileUpload, trackExtractClick, trackExtractComplete } from "@/lib/analytics"

export default function SceneUploadView() {
  const { setView, addProject, setCurrentProject } = useSceneList()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Guard so a completed extraction creates its project exactly ONCE (the
  // completion effect re-fires as addProject's identity changes on re-render).
  const createdRef = useRef(false)

  // Same upstream AI service as Character Bible — see `useImportJob` and
  // `app/api/import/[taskType]/route.ts`. No direct Gemini call.
  const { status, message, progress, result, error, run, reset } =
    useImportJob<SceneExtractResult>("scene-extract")

  const isProcessing = status === "uploading" || status === "running"

  // Track whether the percent has stayed unchanged long enough that we should
  // switch to an indeterminate pulse. Non-chunked skills (character-extract,
  // small scenes) emit only `start` (→5%) and then sit silent for 30–90s
  // before the terminal event. Pulsing reassures the user that work is still
  // happening without lying about completion. Resumes determinate the moment
  // a real chunk_processing event arrives.
  const [progressStale, setProgressStale] = useState(false)
  const lastProgressRef = useRef<number | null>(null)
  useEffect(() => {
    if (status !== "running") {
      setProgressStale(false)
      lastProgressRef.current = progress
      return
    }
    if (progress !== lastProgressRef.current) {
      lastProgressRef.current = progress
      setProgressStale(false)
    }
    const t = setTimeout(() => setProgressStale(true), 3000)
    return () => clearTimeout(t)
  }, [progress, status])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && isValidFile(dropped)) setFile(dropped)
  }

  const isValidFile = (f: File) => {
    const okTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (okTypes.includes(f.type)) return true
    // Some browsers (esp. on Windows/Linux) report empty string or
    // "application/octet-stream" for .docx — fall back to extension.
    return /\.(pdf|docx)$/i.test(f.name)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected && isValidFile(selected)) {
      setFile(selected)
      const ext = selected.name.split(".").pop()?.toLowerCase() || "unknown"
      trackFileUpload(ext, "scene-list")
    }
  }

  const handleProcess = async () => {
    if (!file) return
    const ext = file.name.split(".").pop()?.toLowerCase() || "unknown"
    trackExtractClick("scene-list", ext)
    const sourceTitle = file.name.replace(/\.(pdf|docx)$/i, "")
    await run(file, sourceTitle)
  }

  // Map upstream result -> Scene[] -> new project (same pattern as Character Bible)
  useEffect(() => {
    if (status !== "complete" || !result || !file || createdRef.current) return
    createdRef.current = true

    const incoming = Array.isArray(result.scenes) ? result.scenes : []
    const scenes: Scene[] = incoming.map((s, i) => ({
      id: `${Date.now()}-${i}`,
      sceneNumber: typeof s.scene_number === "number" ? s.scene_number : i + 1,
      sceneHeading:
        typeof s.scene_heading === "string" && s.scene_heading
          ? s.scene_heading
          : `Scene ${i + 1}`,
      location: typeof s.location === "string" ? s.location : "",
      timeOfDay: typeof s.time_of_day === "string" ? s.time_of_day : "",
      // The scene-extract skill returns `summary`; fall back to `raw_text` for older payloads.
      rawText:
        typeof s.summary === "string" && s.summary
          ? s.summary
          : typeof s.raw_text === "string"
          ? s.raw_text
          : "",
    }))

    const scriptName =
      file.name.replace(/\.(pdf|docx)$/i, "").toUpperCase() || "Imported Scenes"
    const newProject: SceneProject = {
      id: crypto.randomUUID(),
      name: scriptName,
      scenes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    addProject(newProject)
    setCurrentProject(newProject)
    trackExtractComplete("scene-list", scenes.length)
    setView("results")
  }, [status, result, file, addProject, setCurrentProject, setView])

  const handleRetry = () => {
    reset()
    createdRef.current = false
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeFile = () => {
    setFile(null)
    reset()
    createdRef.current = false
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCreateManually = () => {
    const newProject: SceneProject = {
      id: crypto.randomUUID(),
      name: "New Scene List",
      scenes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    addProject(newProject)
    setCurrentProject(newProject)
    setView("results")
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <button
          onClick={() => setView("projects")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-sans">Back to My Scenes</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-white text-center mb-3 font-sans">
            Break Down Scripts into Scenes
          </h2>
          <p className="text-white/60 text-center mb-8 font-sans">
            Upload your script (PDF or DOCX). AI will parse it into scenes with headings, locations, and time of day.
          </p>

          {/* Sample screenplay download */}
          <div className="flex flex-col items-center -mt-4 mb-8">
            <a
              href="/screenplays/A_Dinner_Party_screenplay.pdf"
              download="A_Dinner_Party_screenplay.pdf"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 hover:text-teal-200 transition-colors font-sans text-sm"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download a sample screenplay</span>
            </a>
            <p className="mt-2 text-white/40 text-xs font-sans text-center max-w-md">
              No script handy? Test the tools with this screenplay — the material is not copyrighted and free to use.
            </p>
          </div>

          <div className="w-full h-px bg-white/10 mb-8" />

          {status === "failed" && error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium font-sans mb-1">Extraction Failed</p>
                <p className="text-red-400/80 text-sm font-sans">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-sans">Retry</span>
              </button>
            </div>
          )}

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl border border-white/10 bg-white/[0.02]">
              <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-6" />
              {(() => {
                // Per the AI service contract, percent is driven by SSE
                // `step` events (mapped in useImportJob). Before the first
                // mapped event arrives we don't have a number — show the
                // bar at 0 with an indeterminate pulse so the user still
                // sees motion. Same treatment when the percent has been
                // stale for >3s (non-chunked skills).
                const hasNumeric = progress !== null
                const pct = hasNumeric ? progress! : 0
                const pulse =
                  status === "uploading" || !hasNumeric || progressStale
                const displayPct = Math.round(pct)

                return (
                  <div className="w-full max-w-md">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative"
                        role="progressbar"
                        aria-label="Scene extraction progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={hasNumeric ? displayPct : undefined}
                      >
                        <div
                          className={`h-full bg-teal-500 rounded-full transition-[width] duration-500 ease-out ${
                            pulse ? "animate-pulse" : ""
                          }`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-white/70 text-sm font-sans tabular-nums w-10 text-right">
                        {displayPct}%
                      </span>
                    </div>
                    {/* Render the backend's message verbatim — it already
                        says things like "4 of 8 parts done". Falls back to
                        a generic line during upload / before first event. */}
                    <p className="mt-3 text-white/60 text-sm text-center font-sans">
                      {message ||
                        (status === "uploading"
                          ? "Uploading file..."
                          : "Starting...")}
                    </p>
                  </div>
                )
              })()}
            </div>
          ) : file && status !== "failed" ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 p-4 bg-[#1a2e23] rounded-xl border border-white/10 mb-6 w-full max-w-md">
                <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-sans font-medium truncate">{file.name}</p>
                  <p className="text-white/50 text-sm font-sans">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button onClick={removeFile} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              <button
                onClick={handleProcess}
                className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors font-sans"
              >
                Extract Scenes
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging
                  ? "border-teal-400 bg-teal-500/10"
                  : "border-white/20 hover:border-white/40 bg-[#1a2e23]/50"
              }`}
            >
              <div className="w-16 h-16 bg-[#2a3f33] rounded-full flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-teal-400" />
              </div>
              <p className="text-white font-sans font-medium mb-1">
                Click to upload or drag a file here
              </p>
              <p className="text-white/50 text-sm font-sans">PDF or DOCX files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Manual Create Option */}
          {!isProcessing && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={handleCreateManually}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-xl transition-colors font-sans"
              >
                <PenLine className="w-4 h-4" />
                Create Scene List Manually
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
