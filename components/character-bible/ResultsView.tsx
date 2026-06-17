"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Plus, Trash2, Share2, User, Pencil, X } from "lucide-react"
import { useCharacterBible } from "./CharacterBibleContext"
import CharacterCard from "./CharacterCard"
import { Character } from "@/types/character-bible"
import { exportCharactersAsJSON, exportCharactersAsPDF, exportCharactersAsExcel } from "@/lib/character-export"
import SearchBar from "@/components/ui/SearchBar"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"
import AddItemDropdown from "@/components/ui/AddItemDropdown"
import DownloadDropdown from "@/components/ui/DownloadDropdown"
import AddViaUploadModal, { FoundEntry } from "@/components/ui/AddViaUploadModal"
import type { CharacterExtractResult } from "@/types/ai"
import { trackAddItem, trackExport, trackDelete } from "@/lib/analytics"
import ShareModal from "@/components/modals/ShareModal"

// Character.gender is free-text from the script ("unknown", "Male", "she/her"…),
// so bucket it for grouping/filtering. Female is checked before Male because
// "female" contains the substring "male".
const GENDER_GROUPS = ["Male", "Female", "Other", "Unspecified"] as const
function genderBucket(gender?: string): (typeof GENDER_GROUPS)[number] {
  const g = (gender || "").toLowerCase().trim()
  if (!g || g === "unknown") return "Unspecified"
  if (g.includes("female") || g.includes("woman") || g === "f") return "Female"
  if (g.includes("male") || g.includes("man") || g === "m") return "Male"
  return "Other"
}

export default function ResultsView() {
  const { currentBible, setView, setCurrentBible, updateCharacter, deleteCharacter, addCharacter, deleteBible } = useCharacterBible()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [genderFilter, setGenderFilter] = useState<"all" | (typeof GENDER_GROUPS)[number]>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("full")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailEdit, setDetailEdit] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const openDetail = (id: string) => {
    setDetailId(id)
    setDetailEdit(false)
  }
  const openEdit = (id: string) => {
    setDetailId(id)
    setDetailEdit(true)
  }
  const closeDetail = () => {
    setDetailId(null)
    setDetailEdit(false)
  }

  // Scroll to newly added item
  useEffect(() => {
    if (newItemId && gridRef.current) {
      const newElement = gridRef.current.querySelector(`[data-character-id="${newItemId}"]`)
      if (newElement) {
        newElement.scrollIntoView({ behavior: "smooth", block: "center" })
        // Add a brief highlight effect
        newElement.classList.add("ring-2", "ring-emerald-500", "ring-offset-2", "ring-offset-[#0f1f17]")
        setTimeout(() => {
          newElement.classList.remove("ring-2", "ring-emerald-500", "ring-offset-2", "ring-offset-[#0f1f17]")
          setNewItemId(null)
        }, 2000)
      }
    }
  }, [newItemId, currentBible?.characters])

  if (!currentBible) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/60 font-sans">No Character Bible selected</p>
      </div>
    )
  }

  const filteredCharacters = currentBible.characters.filter((character) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      character.name.toLowerCase().includes(query) ||
      character.description?.toLowerCase().includes(query) ||
      character.gender?.toLowerCase().includes(query) ||
      character.ageRange?.toLowerCase().includes(query) ||
      (character.aliases?.some((alias) => alias.toLowerCase().includes(query)))
    const matchesGender = genderFilter === "all" || genderBucket(character.gender) === genderFilter
    return matchesSearch && matchesGender
  })

  const handleAddCharacter = () => {
    const id = crypto.randomUUID()
    const newCharacter: Character = {
      id,
      source: "manual",
      name: "New Character",
      aliases: [],
      gender: "",
      ageRange: "",
      description: "",
      sceneAppearances: [],
    }
    addCharacter(currentBible.id, newCharacter)
    trackAddItem("character-bible", "character")
    setNewItemId(id)
  }

  // Map the AI extraction result into selectable entries for the modal.
  const mapCharacterResult = (result: CharacterExtractResult): FoundEntry<Character>[] =>
    (result.characters || []).map((char) => ({
      item: {
        id: char.id || crypto.randomUUID(),
        source: "ai" as const,
        name: char.name,
        aliases: char.aliases || [],
        gender: char.gender || "",
        ageRange: char.age_range || "",
        description: char.description || "",
        sceneAppearances: (char.scene_appearances || []).map((sa) => ({
          sceneHeading: sa.scene_heading,
          citation: sa.citation,
        })),
      },
      label: char.name || "Unnamed character",
      sublabel: [char.gender, char.age_range].filter((v) => v && v !== "unknown").join(" • "),
    }))

  const handleAddUploaded = (items: Character[]) => {
    if (items.length === 0) return
    addCharacter(currentBible.id, items)
    items.forEach(() => {
      trackAddItem("character-bible", "character")
    })
    const lastId = items[items.length - 1]?.id
    if (lastId) setNewItemId(lastId)
  }

  const handleExportJSON = () => {
    trackExport("character-bible", "json")
    exportCharactersAsJSON(currentBible.characters, currentBible.name)
  }

  const handleExportPDF = () => {
    trackExport("character-bible", "pdf")
    exportCharactersAsPDF(currentBible.characters, currentBible.name)
  }

  const handleExportExcel = () => {
    trackExport("character-bible", "excel")
    exportCharactersAsExcel(currentBible.characters, currentBible.name)
  }

  const handleDeleteList = () => {
    trackDelete("character-bible", "list")
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteBible(currentBible.id)
    setShowDeleteConfirm(false)
  }

  const handleBack = () => {
    setCurrentBible(null)
    setView("list")
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10">
        {/* Back Navigation */}
        <div className="px-6 py-3 border-b border-white/5">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-sans">Back to My Characters</span>
          </button>
        </div>

        {/* Title and Actions */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-sans">
              {currentBible.name}
            </h1>
            <p className="text-white/50 text-sm font-sans">
              Character Bible &bull; Found {currentBible.characters.length} items.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <AddItemDropdown
              label="Add Character"
              onAddManually={handleAddCharacter}
              onAddViaUpload={() => setShowUploadModal(true)}
              triggerClassName="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
            />
            <DownloadDropdown
              onDownloadJSON={handleExportJSON}
              onDownloadExcel={handleExportExcel}
              onDownloadPDF={handleExportPDF}
              triggerClassName="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              labelClassName="text-sm font-sans hidden sm:inline"
            />
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors"
              title="Share via Email"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-sans hidden sm:inline">Share</span>
            </button>
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
              title="Delete List"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-sans hidden sm:inline">Delete</span>
            </button>

            {/* View Mode Toggle */}
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Search Bar + Filter */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search characters..."
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as "all" | (typeof GENDER_GROUPS)[number])}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 focus:border-emerald-500/50 focus:outline-none font-sans"
          >
            <option value="all">All genders</option>
            {GENDER_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Characters Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Full View - unchanged card grid */}
        {viewMode === "full" && (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredCharacters.map((character) => (
              <div key={character.id} data-character-id={character.id} className="transition-all duration-300 rounded-xl">
                <CharacterCard
                  character={character}
                  onUpdate={(updates) => updateCharacter(currentBible.id, character.id, updates)}
                  onDelete={() => deleteCharacter(currentBible.id, character.id)}
                  onNameClick={() => openDetail(character.id)}
                  onEditClick={() => openEdit(character.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Minimal View - condensed cards */}
        {viewMode === "minimal" && (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredCharacters.map((character) => (
              <div
                key={character.id}
                data-character-id={character.id}
                className="group relative p-3 rounded-lg border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors"
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(character.id)}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteCharacter(currentBible.id, character.id)}
                    className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex-shrink-0 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => openDetail(character.id)} className="text-left max-w-full" title="View full character details">
                      <h3 className="text-sm font-semibold text-white truncate hover:text-emerald-300 transition-colors cursor-pointer">{character.name}</h3>
                    </button>
                    <p className="text-xs text-white/50 truncate">
                      {character.ageRange && character.ageRange !== "unknown" ? character.ageRange : ""}
                      {character.gender && character.gender !== "unknown" ? ` • ${character.gender}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View - grouped by gender */}
        {viewMode === "list" && (
          <div ref={gridRef} className="space-y-6">
            {GENDER_GROUPS.map((gender) => {
              const groupChars = filteredCharacters.filter((c) => genderBucket(c.gender) === gender)
              if (groupChars.length === 0) return null
              return (
                <div key={gender} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                      {gender} ({groupChars.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {groupChars.map((character) => (
                      <div
                        key={character.id}
                        data-character-id={character.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex-shrink-0 flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="w-40 sm:w-48 md:w-56 min-w-0 flex-shrink-0">
                          <button onClick={() => openDetail(character.id)} className="text-left max-w-full" title="View full character details">
                            <h4 className="text-sm font-semibold text-white truncate hover:text-emerald-300 transition-colors cursor-pointer">{character.name}</h4>
                          </button>
                          <p className="text-xs text-white/50 truncate">
                            {character.ageRange && character.ageRange !== "unknown" ? `Age: ${character.ageRange}` : ""}
                          </p>
                        </div>
                        {character.description && (
                          <div className="hidden lg:block flex-1 text-xs text-white/40 truncate">
                            {character.description}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => openEdit(character.id)}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCharacter(currentBible.id, character.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filteredCharacters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-white/50 font-sans mb-4">
              {searchQuery ? "No characters match your search." : "No characters yet. Add your first character to get started."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddCharacter}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-sans">Add Character</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Character Detail Modal - full card, fully expanded */}
      {detailId && (() => {
        const detailCharacter = currentBible.characters.find((c) => c.id === detailId)
        if (!detailCharacter) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
            onMouseDown={(e) => { if (e.target === e.currentTarget) closeDetail() }}
          >
            <div className="relative w-full max-w-xl my-auto">
              <button
                onClick={closeDetail}
                className="absolute -top-2 -right-2 z-10 p-2 bg-[#1a2e23] hover:bg-white/20 border border-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <CharacterCard
                key={`${detailCharacter.id}-${detailEdit}`}
                character={detailCharacter}
                onUpdate={(updates) => updateCharacter(currentBible.id, detailCharacter.id, updates)}
                onDelete={() => {
                  deleteCharacter(currentBible.id, detailCharacter.id)
                  closeDetail()
                }}
                forceExpanded
                startInEdit={detailEdit}
              />
            </div>
          </div>
        )
      })()}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a2e23] border border-white/10 rounded-xl p-6 max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-2 font-sans">
              Delete Character Bible?
            </h2>
            <p className="text-white/60 text-sm mb-6 font-sans">
              Are you sure you want to delete &quot;{currentBible.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          toolType="character-bible"
          projectName={currentBible.name}
          data={currentBible.characters}
        />
      )}

      {/* Add via Upload Modal */}
      {showUploadModal && (
        <AddViaUploadModal<Character, CharacterExtractResult>
          title="Characters"
          taskType="character-extract"
          accept=".pdf,.docx"
          acceptLabel="PDF or DOCX files"
          accent="emerald"
          mapResult={mapCharacterResult}
          onAddSelected={handleAddUploaded}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}
