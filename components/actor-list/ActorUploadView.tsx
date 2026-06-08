"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ArrowLeft, FileText, X, Loader2, AlertCircle, RefreshCw, PenLine } from "lucide-react"
import { useActorList } from "./ActorListContext"
import { Actor } from "@/types/actor-list"
import { useImportJob } from "@/hooks/useImportJob"
import type { ActorExtractResult } from "@/types/ai"
import { trackFileUpload, trackExtractClick, trackExtractComplete } from "@/lib/analytics"

export default function ActorUploadView() {
  const { createProject, goBack } = useActorList()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the AI service integration hook
  const { status, message, result, error, run, reset } = useImportJob<ActorExtractResult>("actor-extract")

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
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile)
    }
  }

  const isValidFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    return validTypes.includes(file.type) || file.name.endsWith(".csv") || file.name.endsWith(".xlsx") || file.name.endsWith(".pdf")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile)
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown'
      trackFileUpload(fileExt, "actor-list")
    }
  }

  const handleProcess = async () => {
    if (!file) return

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown'
    trackExtractClick("actor-list", fileExt)
    
    const sourceTitle = file.name.replace(/\.[^/.]+$/, "")
    await run(file, sourceTitle)
  }

  // Handle successful extraction - use useEffect to avoid setState during render
  useEffect(() => {
    if (status === "complete" && result && file) {
      // Map AI service result to our Actor type
      const actors: Actor[] = result.actors.map((actor, index) => ({
        id: `${Date.now()}-${index}`,
        name: actor.name,
        age: actor.age || 0,
        playingAge: actor.playing_age || "Unknown",
        phone: actor.phone || "",
        email: actor.email || "",
        headshotUrl: actor.headshot_url || "",
        notes: actor.notes || "",
      }))

      // Create project with extracted actors
      const projectName = file.name.replace(/\.[^/.]+$/, "") || "Imported Actors"
      trackExtractComplete("actor-list", actors.length)
      createProject(projectName, actors)
    }
  }, [status, result, file, createProject])

  const handleRetry = () => {
    reset()
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = () => {
    setFile(null)
    reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Back Button */}
      <div className="px-6 py-4 border-b border-white/10">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-sans">Back to Projects</span>
        </button>
      </div>

      {/* Upload Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3 font-sans">
              Import Actor Lists
            </h1>
            <p className="text-white/50 font-sans">
              Upload an Actor list (PDF, CSV, Excel). AI will extract and structure the actors details.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 mb-8" />

          {/* Error State */}
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
            /* Processing State */
            <div className="p-12 rounded-2xl border border-white/10 bg-[#1a2e23] text-center">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2 font-sans">
                {status === "uploading" ? "Uploading file..." : "Extracting Actor Data..."}
              </h3>
              <p className="text-white/50 text-sm mb-4 font-sans">
                {message || "AI is analyzing the file and structuring actor information"}
              </p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500 animate-pulse"
                  style={{ width: status === "uploading" ? "30%" : "70%" }}
                />
              </div>
            </div>
          ) : file && status !== "failed" ? (
            /* File Selected State */
            <div className="p-8 rounded-2xl border border-white/10 bg-[#1a2e23]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate font-sans">{file.name}</p>
                  <p className="text-white/40 text-sm font-sans">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/40 hover:text-white" />
                </button>
              </div>
              <button
                onClick={handleProcess}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors font-sans"
              >
                Extract Actors with AI
              </button>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-white/20 hover:border-white/40 bg-[#1a2e23]/50"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#1a2e23] flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-medium mb-2 font-sans">
                  Click to upload or drag a file here
                </p>
                <p className="text-white/40 text-sm font-sans">
                  Supports .CSV, .XLSX, and .PDF
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Manual Create Option */}
          {!isProcessing && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => createProject("New Actor List", [])}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-xl transition-colors font-sans"
              >
                <PenLine className="w-4 h-4" />
                Create Actor List Manually
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
