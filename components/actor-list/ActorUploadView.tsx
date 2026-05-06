"use client"

import { useState, useRef } from "react"
import { Upload, ArrowLeft, FileText, X, Loader2 } from "lucide-react"
import { useActorList } from "./ActorListContext"
import { Actor } from "@/types/actor-list"

export default function ActorUploadView() {
  const { createProject, goBack } = useActorList()
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
    }
  }

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)

    // Simulate AI processing with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 300)

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    clearInterval(interval)
    setProgress(100)

    // Generate demo actors from "extracted" data
    const extractedActors: Actor[] = [
      {
        id: Date.now().toString() + "-1",
        name: "Sarah Mitchell",
        age: 28,
        playingAge: "22-32",
        phone: "+1-555-0201",
        email: "sarah.m@actors.com",
        headshotUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
        notes: "Trained in classical theater, strong dramatic range",
      },
      {
        id: Date.now().toString() + "-2",
        name: "Marcus Chen",
        age: 35,
        playingAge: "28-40",
        phone: "+1-555-0202",
        email: "marcus.c@actors.com",
        headshotUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        notes: "Action specialist, stunt training certified",
      },
      {
        id: Date.now().toString() + "-3",
        name: "Elena Rodriguez",
        age: 42,
        playingAge: "35-50",
        phone: "+1-555-0203",
        email: "elena.r@actors.com",
        headshotUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        notes: "Bilingual (Spanish/English), experienced in telenovelas",
      },
      {
        id: Date.now().toString() + "-4",
        name: "David Park",
        age: 31,
        playingAge: "25-35",
        phone: "+1-555-0204",
        email: "david.p@actors.com",
        headshotUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        notes: "Comedy background, improv trained at UCB",
      },
    ]

    // Create project with extracted actors
    const projectName = file.name.replace(/\.[^/.]+$/, "")
    createProject(projectName, extractedActors)
  }

  const removeFile = () => {
    setFile(null)
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

          {isProcessing ? (
            /* Processing State */
            <div className="p-12 rounded-2xl border border-white/10 bg-[#1a2e23] text-center">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2 font-sans">
                Extracting Actor Data...
              </h3>
              <p className="text-white/50 text-sm mb-4 font-sans">
                AI is analyzing the file and structuring actor information
              </p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-white/40 text-xs mt-2 font-sans">
                {Math.round(Math.min(progress, 100))}% complete
              </p>
            </div>
          ) : file ? (
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
        </div>
      </div>
    </div>
  )
}
