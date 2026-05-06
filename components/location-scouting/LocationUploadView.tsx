"use client"

import { useState, useRef } from "react"
import { Upload, ArrowLeft, FileText, Loader2, X } from "lucide-react"
import { useLocationScouting } from "./LocationScoutingContext"
import { LocationProject } from "@/types/location-scouting"

export default function LocationUploadView() {
  const { setView, addProject, setCurrentProject } = useLocationScouting()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile?.type === "application/pdf") {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)

    // Simulate progress while API processes
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval)
          return 85
        }
        return prev + Math.random() * 10
      })
    }, 800)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/analyze-locations", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze script")
      }

      const data = await response.json()
      setProgress(100)

      if (!data.locations || !Array.isArray(data.locations)) {
        throw new Error("Invalid response format from AI")
      }

      // Create new project with extracted locations
      const newProject: LocationProject = {
        id: crypto.randomUUID(),
        name: file.name.replace(".pdf", "").toUpperCase(),
        locations: data.locations,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addProject(newProject)
      setCurrentProject(newProject)

      // Small delay before transitioning
      await new Promise((resolve) => setTimeout(resolve, 500))
      setIsProcessing(false)
      setView("results")
    } catch (error) {
      clearInterval(progressInterval)
      console.error("Error processing script:", error)
      alert(error instanceof Error ? error.message : "Failed to process script. Please try again.")
      setIsProcessing(false)
      setProgress(0)
    }
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
          <span className="text-sm font-sans">Back to Projects</span>
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
            Upload your script (PDF). AI will scan for scenes to create a detailed Location Scouting List.
          </p>

          <div className="w-full h-px bg-white/10 mb-8" />

          {isProcessing ? (
            /* Processing State */
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
              <p className="text-white font-sans mb-2">Analyzing script for locations...</p>
              <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white/50 text-sm mt-2 font-sans">{Math.round(progress)}%</p>
            </div>
          ) : file ? (
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
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              <button
                onClick={handleUpload}
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
              <p className="text-white/50 text-sm font-sans">PDF files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
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
