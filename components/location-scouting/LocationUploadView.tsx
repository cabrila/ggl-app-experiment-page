"use client"

import { useState, useRef } from "react"
import { ArrowLeft, Upload, FileText, Loader2, Sparkles } from "lucide-react"
import { useLocationScouting } from "./LocationScoutingContext"
import { LocationProject, Location } from "@/types/location-scouting"

export default function LocationUploadView() {
  const { setView, addProject, setCurrentProject } = useLocationScouting()
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

  const handleAnalyze = async () => {
    if (!file || !projectName.trim()) return

    setIsProcessing(true)

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // Generate mock locations
    const mockLocations: Location[] = [
      { id: "1", name: "JUNGLE - HOLDING PEN", type: "EXT", timeOfDay: "NIGHT", description: "A dense, dark jungle clearing with a massive holding pen.", scoutingNotes: "Requires large clearing for heavy machinery." },
      { id: "2", name: "VISITOR CENTER - MAIN HALL", type: "INT", timeOfDay: "DAY", description: "A grand atrium with dinosaur skeletons and interactive exhibits.", scoutingNotes: "Museum or convention center with high ceilings." },
      { id: "3", name: "CONTROL ROOM", type: "INT", timeOfDay: "NIGHT", description: "A high-tech control room with multiple monitors and workstations.", scoutingNotes: "Modern office or data center set." },
      { id: "4", name: "T-REX PADDOCK", type: "EXT", timeOfDay: "NIGHT", description: "A massive fenced enclosure with electrified fences.", scoutingNotes: "Open field with ability to build fence structures." },
      { id: "5", name: "KITCHEN - INDUSTRIAL", type: "INT", timeOfDay: "DAY", description: "A commercial kitchen with stainless steel surfaces.", scoutingNotes: "Restaurant or hotel kitchen." },
    ]

    const newProject: LocationProject = {
      id: Date.now().toString(),
      name: projectName,
      locations: mockLocations,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    addProject(newProject)
    setCurrentProject(newProject)
    setIsProcessing(false)
    setView("results")
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView("projects")}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">New Location Project</h1>
          <p className="text-white/50 text-sm">
            Upload a script to generate location descriptions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
        {/* Project Name */}
        <div className="w-full mb-6">
          <label className="block text-sm font-medium text-white/70 mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
        </div>

        {/* Upload Area */}
        <div
          className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive
              ? "border-amber-400 bg-amber-500/10"
              : file
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-white/20 hover:border-white/30"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-amber-400" />
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
                Drop your script here
              </p>
              <p className="text-white/50 text-sm mb-4">
                or click to browse (PDF, TXT, Fountain)
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
            accept=".pdf,.txt,.fountain"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!file || !projectName.trim() || isProcessing}
          className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/30 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing script...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze Locations
            </>
          )}
        </button>
      </div>
    </div>
  )
}
