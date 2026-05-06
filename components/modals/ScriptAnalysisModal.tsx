"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X, Upload, FileText, Sparkles, Loader2, Edit3, Check, UserPlus, BookOpen, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { openModal } from "./ModalManager"

interface ScriptAnalysisModalProps {
  onClose: () => void
}

interface ExtractedCharacter {
  id: string
  name: string
  description: string
  castingNotes: string
  gender: string
  ageRange: string
  importance: "lead" | "supporting" | "recurring" | "minor"
  sceneCount: number
  isEditing: boolean
  isInserted: boolean
}

// Simulated AI extraction - in production this would call an actual AI service
const simulateAIExtraction = (fileName: string): Promise<ExtractedCharacter[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulated characters extracted from a script
      const characters: ExtractedCharacter[] = [
        {
          id: "ext-1",
          name: "SARAH CHEN",
          description:
            "A brilliant but reclusive quantum physicist in her late 30s. Haunted by a past experiment gone wrong, she now lives in isolation, working on theoretical equations that could change the fabric of reality.",
          castingNotes:
            "Looking for an actor with strong dramatic range who can convey both intellectual intensity and emotional vulnerability. Must be comfortable with technical dialogue. Asian or Asian-American preferred to match character background.",
          gender: "Female",
          ageRange: "35-42",
          importance: "lead",
          sceneCount: 47,
          isEditing: false,
          isInserted: false,
        },
        {
          id: "ext-2",
          name: "MARCUS WEBB",
          description:
            "Sarah's former research partner and ex-husband. Charismatic and ambitious, now a high-profile science communicator. Still carries guilt about their shared past and secretly hopes to reconnect.",
          castingNotes:
            "Need someone with natural charisma who can play likeable yet morally ambiguous. Chemistry read with Sarah essential. Open ethnicity, 38-48.",
          gender: "Male",
          ageRange: "38-48",
          importance: "lead",
          sceneCount: 32,
          isEditing: false,
          isInserted: false,
        },
        {
          id: "ext-3",
          name: "DR. ELENA VASQUEZ",
          description:
            "The new head of the quantum research division. A no-nonsense administrator who sees potential in Sarah's work but doesn't fully trust her methods. Has her own hidden agenda.",
          castingNotes:
            "Strong presence required. Character is authoritative but not villainous - she believes she's doing right. Latina actress preferred, 45-55.",
          gender: "Female",
          ageRange: "45-55",
          importance: "supporting",
          sceneCount: 18,
          isEditing: false,
          isInserted: false,
        },
        {
          id: "ext-4",
          name: "JAMIE CHEN",
          description:
            "Sarah's younger sibling, a graduate student in marine biology. Provides emotional grounding and comic relief. Deeply loyal to Sarah despite their complicated relationship.",
          castingNotes:
            "Fresh face preferred. Must have comedic timing but able to handle emotional scenes in Act 3. Gender flexible - can be played as any gender. Asian or Asian-American, 24-30.",
          gender: "Non-binary",
          ageRange: "24-30",
          importance: "supporting",
          sceneCount: 14,
          isEditing: false,
          isInserted: false,
        },
        {
          id: "ext-5",
          name: "THE OBSERVER",
          description:
            "A mysterious figure who appears at key moments throughout the story. May be a hallucination, a time traveler, or something else entirely. Always calm, speaks in riddles.",
          castingNotes:
            "Ethereal quality needed. Actor must have distinctive voice and commanding presence with minimal dialogue. Any ethnicity, appears ageless (could be 30-60).",
          gender: "Ambiguous",
          ageRange: "30-60",
          importance: "recurring",
          sceneCount: 8,
          isEditing: false,
          isInserted: false,
        },
        {
          id: "ext-6",
          name: "SECURITY GUARD RICK",
          description:
            "Night security at the research facility. Former military, now approaching retirement. Develops an unlikely friendship with Sarah during her late-night work sessions.",
          castingNotes:
            "Character actor type. Warm, grandfatherly energy. Brief but memorable role - potential scene-stealer. Any ethnicity, 55-65.",
          gender: "Male",
          ageRange: "55-65",
          importance: "minor",
          sceneCount: 5,
          isEditing: false,
          isInserted: false,
        },
      ]
      resolve(characters)
    }, 3000) // Simulate 3 second processing time
  })
}

export default function ScriptAnalysisModal({ onClose }: ScriptAnalysisModalProps) {
  const { state, dispatch } = useCasting()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [extractedCharacters, setExtractedCharacters] = useState<ExtractedCharacter[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file")
        return
      }
      setUploadedFile(file)
      setError(null)
      setExtractedCharacters([])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file")
        return
      }
      setUploadedFile(file)
      setError(null)
      setExtractedCharacters([])
    }
  }

  const handleAnalyze = async () => {
    if (!uploadedFile) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setError(null)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 400)

    try {
      const characters = await simulateAIExtraction(uploadedFile.name)
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      setTimeout(() => {
        setExtractedCharacters(characters)
        setIsAnalyzing(false)
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)
      setError("Failed to analyze script. Please try again.")
      setIsAnalyzing(false)
    }
  }

  const handleEditCharacter = (id: string) => {
    setExtractedCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, isEditing: true } : c)))
  }

  const handleSaveEdit = (id: string) => {
    setExtractedCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, isEditing: false } : c)))
  }

  const handleUpdateField = (id: string, field: keyof ExtractedCharacter, value: string) => {
    setExtractedCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleInsertCharacter = (character: ExtractedCharacter) => {
    if (!currentProject) return

    const newCharacter = {
      id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: character.name,
      description: `${character.description}\n\nCasting Notes: ${character.castingNotes}\n\nAge Range: ${character.ageRange} | Gender: ${character.gender} | Importance: ${character.importance}`,
      actors: {
        longList: [],
        audition: [],
        approval: [],
        shortLists: [],
      },
    }

    dispatch({
      type: "ADD_CHARACTER",
      payload: {
        character: newCharacter,
        projectId: currentProject.id,
      },
    })

    setExtractedCharacters((prev) => prev.map((c) => (c.id === character.id ? { ...c, isInserted: true } : c)))
  }

  const handleInsertAll = () => {
    extractedCharacters
      .filter((c) => !c.isInserted)
      .forEach((character) => {
        handleInsertCharacter(character)
      })
  }

  const handleReturnToCharacters = () => {
    onClose()
    setTimeout(() => {
      openModal("characters")
    }, 100)
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "lead":
        return "bg-success-100 text-success-700 border-success-200"
      case "supporting":
        return "bg-info-100 text-info-700 border-info-200"
      case "recurring":
        return "bg-amber-100 text-amber-700 border-amber-200"
      default:
        return "bg-slate-100 text-slate-600 border-slate-200"
    }
  }

  const insertedCount = extractedCharacters.filter((c) => c.isInserted).length
  const totalCount = extractedCharacters.length

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-info-500 to-info-600 flex items-center justify-center shadow-lg shadow-info-500/25">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Character Bible</h2>
                <p className="text-sm text-slate-500">Upload a script to extract characters with AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {extractedCharacters.length > 0 && (
                <Button
                  onClick={handleReturnToCharacters}
                  variant="outline"
                  className="rounded-xl px-4 py-2 flex items-center gap-2 bg-transparent"
                >
                  Back to Characters
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Section */}
          {!extractedCharacters.length && !isAnalyzing && (
            <div className="max-w-2xl mx-auto">
              <div
                className={`
                  border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
                  ${uploadedFile ? "border-success-300 bg-success-50" : "border-slate-300 hover:border-info-400 hover:bg-slate-50"}
                `}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

                {uploadedFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-success-100 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-success-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{uploadedFile.name}</p>
                      <p className="text-sm text-slate-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadedFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                        className="rounded-xl"
                      >
                        Remove
                      </Button>
                      <Button
                        onClick={handleAnalyze}
                        className="bg-info-500 hover:bg-info-600 text-white rounded-xl gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Analyze Script
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Upload your script</p>
                      <p className="text-sm text-slate-500">Drag and drop a PDF file here, or click to browse</p>
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-xl">
                      Select PDF
                    </Button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-error-50 border border-error-200 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-error-500" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">How it works</h3>
                <ol className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-info-100 text-info-600 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Upload your screenplay or script in PDF format</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-info-100 text-info-600 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>
                      AI analyzes the document to identify all characters with their descriptions and casting notes
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-info-100 text-info-600 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>Review and edit each character's details as needed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-info-100 text-info-600 flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <span>Insert characters into your project with one click</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {isAnalyzing && (
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-info-100 flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-info-500 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Script</h3>
              <p className="text-slate-500 mb-6">
                AI is reading through your script and extracting character information...
              </p>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-info-400 to-info-600 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-sm text-slate-400 mt-2">{Math.round(analysisProgress)}% complete</p>
            </div>
          )}

          {/* Results */}
          {extractedCharacters.length > 0 && !isAnalyzing && (
            <div className="max-w-6xl mx-auto">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{totalCount} Characters Found</h3>
                  <p className="text-sm text-slate-500">
                    {insertedCount} of {totalCount} inserted into project
                  </p>
                </div>
                {insertedCount < totalCount && (
                  <Button
                    onClick={handleInsertAll}
                    className="bg-success-500 hover:bg-success-600 text-white rounded-xl gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Insert All Remaining
                  </Button>
                )}
              </div>

              {/* Character Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {extractedCharacters.map((character) => (
                  <div
                    key={character.id}
                    className={`
                      rounded-2xl border-2 transition-all duration-200
                      ${
                        character.isInserted
                          ? "border-success-200 bg-success-50/50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      }
                    `}
                  >
                    <div className="p-5">
                      {/* Character Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {character.isEditing ? (
                            <Input
                              value={character.name}
                              onChange={(e) => handleUpdateField(character.id, "name", e.target.value)}
                              className="text-lg font-bold mb-2"
                            />
                          ) : (
                            <h4 className="text-lg font-bold text-slate-900">{character.name}</h4>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getImportanceColor(character.importance)}`}
                            >
                              {character.importance.charAt(0).toUpperCase() + character.importance.slice(1)}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {character.gender}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {character.ageRange}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {character.sceneCount} scenes
                            </span>
                          </div>
                        </div>
                        {character.isInserted && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                            <Check className="w-4 h-4 text-success-600" />
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Description
                        </label>
                        {character.isEditing ? (
                          <Textarea
                            value={character.description}
                            onChange={(e) => handleUpdateField(character.id, "description", e.target.value)}
                            className="mt-1 min-h-[80px]"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-slate-700 leading-relaxed">{character.description}</p>
                        )}
                      </div>

                      {/* Casting Notes */}
                      <div className="mb-4">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Casting Notes
                        </label>
                        {character.isEditing ? (
                          <Textarea
                            value={character.castingNotes}
                            onChange={(e) => handleUpdateField(character.id, "castingNotes", e.target.value)}
                            className="mt-1 min-h-[80px]"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-slate-600 leading-relaxed italic">{character.castingNotes}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        {character.isEditing ? (
                          <Button
                            onClick={() => handleSaveEdit(character.id)}
                            size="sm"
                            className="bg-info-500 hover:bg-info-600 text-white rounded-lg gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleEditCharacter(character.id)}
                              variant="outline"
                              size="sm"
                              className="rounded-lg gap-1.5"
                              disabled={character.isInserted}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                            {!character.isInserted && (
                              <Button
                                onClick={() => handleInsertCharacter(character)}
                                size="sm"
                                className="bg-success-500 hover:bg-success-600 text-white rounded-lg gap-1.5"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Insert into Project
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Action Bar */}
              {insertedCount > 0 && (
                <div className="mt-8 p-4 rounded-2xl bg-success-50 border border-success-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-success-900">
                        {insertedCount} character{insertedCount !== 1 ? "s" : ""} added to project
                      </p>
                      <p className="text-sm text-success-700">Return to the Characters modal to start casting</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleReturnToCharacters}
                    className="bg-success-600 hover:bg-success-700 text-white rounded-xl"
                  >
                    View Characters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
