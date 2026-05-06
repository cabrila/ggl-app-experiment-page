"use client"

import { useState, useRef } from "react"
import { Upload, ArrowLeft, Loader2, FileText, X } from "lucide-react"
import { useCharacterBible } from "./CharacterBibleContext"
import { Character, CharacterBible } from "@/types/character-bible"

export default function UploadView() {
  const { setView, setCurrentBible, addBible } = useCharacterBible()
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

  const handleProcess = async () => {
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

      const response = await fetch("/api/analyze-characters", {
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

      if (!data.characters || !Array.isArray(data.characters)) {
        throw new Error("Invalid response format from AI")
      }

      const scriptName = file.name.replace(".pdf", "").toUpperCase()
      const newBible: CharacterBible = {
        id: crypto.randomUUID(),
        name: `${scriptName} Script`,
        characters: data.characters,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addBible(newBible)
      setCurrentBible(newBible)
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
    <div className="flex flex-col h-full">
      {/* Back Button */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-sans">Back to Projects</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 font-sans">
              Extract Character Bibles
            </h1>
            <p className="text-white/60 text-base font-sans max-w-lg mx-auto">
              Upload your film or TV script (PDF). AI will analyze the text to extract characters and casting notes.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/10 mb-8" />

          {/* Upload Zone */}
          {!isProcessing ? (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-sky-400 bg-sky-500/10"
                    : file
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-white/20 hover:border-white/40 bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-white font-medium font-sans mb-1">{file.name}</p>
                    <p className="text-white/50 text-sm font-sans">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-sky-400" />
                    </div>
                    <p className="text-white font-medium font-sans mb-1">
                      Click to upload or drag a file here
                    </p>
                    <p className="text-white/50 text-sm font-sans">PDF files only</p>
                  </>
                )}
              </div>

              {/* Process Button */}
              {file && (
                <button
                  onClick={handleProcess}
                  className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors font-sans"
                >
                  Extract Characters
                </button>
              )}
            </>
          ) : (
            /* Processing State */
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/10 bg-white/[0.02]">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
              <p className="text-white font-medium font-sans mb-2">
                Analyzing script...
              </p>
              <p className="text-white/50 text-sm font-sans mb-4">
                Extracting characters and casting notes
              </p>
              <div className="w-full max-w-xs bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
