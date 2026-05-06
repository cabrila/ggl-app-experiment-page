"use client"

import { useState, useRef } from "react"
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, Plus } from "lucide-react"
import { useActorList } from "./ActorListContext"
import { Actor } from "@/types/actor-list"

export default function ActorUploadView() {
  const { setView, createProject } = useActorList()
  const [file, setFile] = useState<File | null>(null)
  const [projectName, setProjectName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      if (!projectName) {
        setProjectName(droppedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      if (!projectName) {
        setProjectName(selectedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleImport = async () => {
    if (!projectName.trim()) return

    setIsProcessing(true)

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate mock actors
    const mockActors: Actor[] = [
      { id: "1", name: "Alex Rivera", age: 32, playingAge: "25-35", phone: "+1-555-0001", email: "alex@email.com", headshotUrl: "", notes: "Lead actor experience" },
      { id: "2", name: "Jordan Lee", age: 28, playingAge: "22-30", phone: "+1-555-0002", email: "jordan@email.com", headshotUrl: "", notes: "Comedy specialist" },
      { id: "3", name: "Taylor Morgan", age: 45, playingAge: "40-50", phone: "+1-555-0003", email: "taylor@email.com", headshotUrl: "", notes: "Drama and action" },
    ]

    createProject(projectName, file ? mockActors : [])
    setIsProcessing(false)
  }

  const handleCreateEmpty = async () => {
    if (!projectName.trim()) return

    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    createProject(projectName, [])
    setIsProcessing(false)
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView("list")}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">New Actor List</h1>
          <p className="text-white/50 text-sm">
            Create a new list or import from CSV/Excel
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
        {/* Project Name */}
        <div className="w-full mb-6">
          <label className="block text-sm font-medium text-white/70 mb-2">
            List Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter list name"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
          />
        </div>

        {/* Upload Area */}
        <div
          className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive
              ? "border-sky-400 bg-sky-500/10"
              : file
              ? "border-sky-500/50 bg-sky-500/5"
              : "border-white/20 hover:border-white/30"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8 text-sky-400" />
              </div>
              <p className="text-white font-medium mb-1">{file.name}</p>
              <p className="text-white/50 text-sm mb-4">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-white/50 hover:text-white underline"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white font-medium mb-1">
                Drop your file here (optional)
              </p>
              <p className="text-white/50 text-sm mb-4">
                or click to browse (CSV, Excel)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm transition-colors"
              >
                Browse Files
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-6 flex flex-col gap-3">
          {file ? (
            <button
              onClick={handleImport}
              disabled={!projectName.trim() || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-4 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/30 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Import Actors
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleCreateEmpty}
              disabled={!projectName.trim() || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-4 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/30 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Empty List
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
