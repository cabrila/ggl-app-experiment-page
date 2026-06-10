"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ArrowLeft, Loader2, FileText, X, AlertCircle, RefreshCw, PenLine, Download } from "lucide-react"
import { useCharacterBible } from "./CharacterBibleContext"
import { Character, CharacterBible } from "@/types/character-bible"
import { useImportJob } from "@/hooks/useImportJob"
import type { CharacterExtractResult } from "@/types/ai"
import { trackFileUpload, trackExtractClick, trackExtractComplete } from "@/lib/analytics"

export default function UploadView() {
  const { setView, setCurrentBible, addBible } = useCharacterBible()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the AI service integration hook
  const { status, message, result, error, run, reset } = useImportJob<CharacterExtractResult>("character-extract")

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
    if (droppedFile && isValidFileType(droppedFile)) {
      setFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isValidFileType(selectedFile)) {
      setFile(selectedFile)
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown'
      trackFileUpload(fileExt, "character-bible")
    }
  }

  const isValidFileType = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    ]
    if (validTypes.includes(file.type)) return true
    // Some browsers (esp. on Windows/Linux) report empty string or
    // "application/octet-stream" for .docx — fall back to extension.
    return /\.(pdf|docx)$/i.test(file.name)
  }

  const handleProcess = async () => {
    if (!file) return

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown'
    trackExtractClick("character-bible", fileExt)
    
    const sourceTitle = file.name.replace(/\.(pdf|docx)$/i, "")
    await run(file, sourceTitle)
  }

  // Handle successful extraction - use useEffect to avoid setState during render
  useEffect(() => {
    if (status === "complete" && result) {
      const scriptName = file?.name.replace(/\.(pdf|docx)$/i, "").toUpperCase() || "SCRIPT"

      // Map AI service result to our Character type. The skill returns
      // snake_case fields; we normalise to camelCase here so the rest of
      // the app only sees one convention.
      const characters: Character[] = result.characters.map((char) => ({
        id: char.id || crypto.randomUUID(),
        source: "ai" as const,
        name: char.name,
        aliases: char.aliases || [],
        gender: char.gender || "unknown",
        ageRange: char.age_range || "unknown",
        description: char.description || "",
        sceneAppearances: (char.scene_appearances || []).map((sa) => ({
          sceneHeading: sa.scene_heading,
          citation: sa.citation,
        })),
      }))

      const newBible: CharacterBible = {
        id: crypto.randomUUID(),
        name: `${scriptName} Script`,
        characters,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addBible(newBible)
      setCurrentBible(newBible)
      trackExtractComplete("character-bible", characters.length)
      setView("results")
    }
  }, [status, result, file, addBible, setCurrentBible, setView])

  const handleRetry = () => {
    reset()
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCreateManually = () => {
    const newBible: CharacterBible = {
      id: crypto.randomUUID(),
      name: "New Character Bible",
      characters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    addBible(newBible)
    setCurrentBible(newBible)
    setView("results")
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
          <span className="text-sm font-sans">Back to My Characters</span>
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
              Upload your film or TV script (PDF or DOCX). AI will analyze the text to extract characters and casting notes.
            </p>

            {/* Sample screenplay download */}
            <a
              href="/screenplays/A_Dinner_Party_screenplay.pdf"
              download="A_Dinner_Party_screenplay.pdf"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors font-sans text-sm"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download a sample screenplay</span>
            </a>
            <p className="mt-2 text-white/40 text-xs font-sans max-w-md mx-auto">
              No script handy? Test the tools with this screenplay — the material is not copyrighted and free to use.
            </p>
          </div>

          {/* Divider */}
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
                  accept=".pdf,.docx"
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
                        reset()
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
                    <p className="text-white/50 text-sm font-sans">PDF or DOCX files (DOCX recommended)</p>
                  </>
                )}
              </div>

              {/* Process Button */}
              {file && status !== "failed" && (
                <button
                  onClick={handleProcess}
                  className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors font-sans"
                >
                  Extract Characters
                </button>
              )}

              {/* Manual Create Option */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={handleCreateManually}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-xl transition-colors font-sans"
                >
                  <PenLine className="w-4 h-4" />
                  Create Character Bible Manually
                </button>
              </div>
            </>
          ) : (
            /* Processing State */
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/10 bg-white/[0.02]">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
              <p className="text-white font-medium font-sans mb-2">
                {status === "uploading" ? "Uploading file..." : "Analyzing script..."}
              </p>
              <p className="text-white/50 text-sm font-sans mb-4">
                {message || "Extracting characters and casting notes"}
              </p>
              <div className="w-full max-w-xs bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 animate-pulse"
                  style={{ width: status === "uploading" ? "30%" : "70%" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
