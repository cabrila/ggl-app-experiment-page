"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ArrowLeft, FileText, Loader2, X, AlertCircle, RefreshCw } from "lucide-react"
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

  // Same upstream AI service as Character Bible — see `useImportJob` and
  // `app/api/import/[taskType]/route.ts`. No direct Gemini call.
  const { status, message, result, error, run, reset } =
    useImportJob<SceneExtractResult>("scene-extract")

  const isProcessing = status === "uploading" || status === "running"

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
    if (status !== "complete" || !result || !file) return

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
      rawText: typeof s.raw_text === "string" ? s.raw_text : "",
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
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeFile = () => {
    setFile(null)
    reset()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <button
          onClick={() => setView("projects")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-sans">Back to Projects</span>
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
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/10 bg-white/[0.02]">
              <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-4" />
              <p className="text-white font-sans mb-2">
                {status === "uploading" ? "Uploading file..." : "Parsing script into scenes..."}
              </p>
              <p className="text-white/50 text-sm mb-4 font-sans">
                {message || "This can take 30s+ on a feature-length script."}
              </p>
              <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-500 animate-pulse"
                  style={{ width: status === "uploading" ? "30%" : "70%" }}
                />
              </div>
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
        </div>
      </div>
    </div>
  )
}
