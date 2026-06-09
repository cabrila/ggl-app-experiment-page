"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ArrowLeft, FileText, Loader2, X, AlertCircle, RefreshCw, PenLine } from "lucide-react"
import { useLocationScouting } from "./LocationScoutingContext"
import { Location, LocationProject } from "@/types/location-scouting"
import { useImportJob } from "@/hooks/useImportJob"
import type { LocationOverviewResult } from "@/types/ai"
import { trackFileUpload, trackExtractClick, trackExtractComplete } from "@/lib/analytics"

export default function LocationUploadView() {
  const { setView, addProject, setCurrentProject } = useLocationScouting()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the AI service integration hook
  const { status, message, result, error, run, reset } = useImportJob<LocationOverviewResult>("location-overview")

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
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    ]
    return validTypes.includes(file.type)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile)
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown'
      trackFileUpload(fileExt, "location-overview")
    }
  }

  const handleProcess = async () => {
    if (!file) return

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown'
    trackExtractClick("location-overview", fileExt)
    
    const sourceTitle = file.name.replace(/\.(pdf|docx)$/i, "")
    await run(file, sourceTitle)
  }

  // Handle successful extraction - use useEffect to avoid setState during render
  useEffect(() => {
    if (status === "complete" && result && file) {
      // Map AI service result to our Location type
      const locations: Location[] = result.locations.map((loc, index) => ({
        id: `${Date.now()}-${index}`,
        name: loc.name,
        type: loc.type === "INT/EXT" ? "INT" : (loc.type === "unknown" ? "INT" : loc.type) || "EXT",
        timeOfDay: loc.time_of_day === "unknown" ? "DAY" : loc.time_of_day || "DAY",
        description: loc.description || "",
        scoutingNotes: loc.scouting_notes || "",
      }))

      // Create new project with extracted locations
      const newProject: LocationProject = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.(pdf|docx)$/i, "").toUpperCase() || "Imported Locations",
        locations,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addProject(newProject)
      setCurrentProject(newProject)
      trackExtractComplete("location-overview", locations.length)
      setView("results")
    }
  }, [status, result, file, addProject, setCurrentProject, setView])

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

  const handleCreateManually = () => {
    const newProject: LocationProject = {
      id: crypto.randomUUID(),
      name: "New Location List",
      locations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    addProject(newProject)
    setCurrentProject(newProject)
    setView("results")
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <button
          onClick={() => setView("projects")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-sans">Back to My Locations</span>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Title */}
          <h2 className="text-3xl font-bold text-white text-center mb-3 font-sans">
            Scout Locations from Scripts
          </h2>
          <p className="text-white/60 text-center mb-8 font-sans">
            Upload your script (PDF or DOCX). AI will scan for scenes to create a detailed Location Scouting List.
          </p>

          <div className="w-full h-px bg-white/10 mb-8" />

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
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/10 bg-white/[0.02]">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
              <p className="text-white font-sans mb-2">
                {status === "uploading" ? "Uploading file..." : "Analyzing script for locations..."}
              </p>
              <p className="text-white/50 text-sm mb-4 font-sans">
                {message || "Extracting location details from your script"}
              </p>
              <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500 animate-pulse"
                  style={{ width: status === "uploading" ? "30%" : "70%" }}
                />
              </div>
            </div>
          ) : file && status !== "failed" ? (
            /* File Selected State */
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 p-4 bg-[#1a2e23] rounded-xl border border-white/10 mb-6 w-full max-w-md">
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-sans font-medium truncate">{file.name}</p>
                  <p className="text-white/50 text-sm font-sans">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              <button
                onClick={handleProcess}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors font-sans"
              >
                Extract Locations
              </button>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                ${isDragging
                  ? "border-amber-400 bg-amber-500/10"
                  : "border-white/20 hover:border-white/40 bg-[#1a2e23]/50"
                }
              `}
            >
              <div className="w-16 h-16 bg-[#2a3f33] rounded-full flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-white font-sans font-medium mb-1">
                Click to upload or drag a file here
              </p>
              <p className="text-white/50 text-sm font-sans">PDF or DOCX files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.docx"
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
                Create Location List Manually
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
