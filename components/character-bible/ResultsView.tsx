"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Plus, FileJson, Download, Trash2, FileSpreadsheet } from "lucide-react"
import { useCharacterBible } from "./CharacterBibleContext"
import CharacterCard from "./CharacterCard"
import { Character } from "@/types/character-bible"
import { exportCharactersAsJSON, exportCharactersAsPDF, exportCharactersAsExcel } from "@/lib/character-export"
import SearchBar from "@/components/ui/SearchBar"

export default function ResultsView() {
  const { currentBible, setView, setCurrentBible, updateCharacter, deleteCharacter, addCharacter, deleteBible } = useCharacterBible()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const gridRef = useRef<HTMLDivElement>(null)

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

  const filteredCharacters = currentBible.characters.filter((character) =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    character.castingNotes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (character.ethnicity && character.ethnicity.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddCharacter = () => {
    const id = crypto.randomUUID()
    const newCharacter: Character = {
      id,
      name: "New Character",
      age: "",
      gender: "",
      ethnicity: "Not specified",
      scenes: 0,
      castingNotes: "",
    }
    addCharacter(currentBible.id, newCharacter)
    setNewItemId(id)
  }

  const handleExportJSON = () => {
    exportCharactersAsJSON(currentBible.characters, currentBible.name)
  }

  const handleExportPDF = () => {
    exportCharactersAsPDF(currentBible.characters, currentBible.name)
  }

  const handleExportExcel = () => {
    exportCharactersAsExcel(currentBible.characters, currentBible.name)
  }

  const handleDeleteList = () => {
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
            <span className="text-sm font-sans">Back to Projects</span>
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
            <button
              onClick={handleAddCharacter}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Add Character"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-sans hidden sm:inline">Add Character</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Export as JSON"
            >
              <FileJson className="w-4 h-4" />
              <span className="text-sm font-sans hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Export as Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-sm font-sans hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-sans hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
              title="Delete List"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-sans hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search characters..."
          />
        </div>
      </div>

      {/* Characters Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredCharacters.map((character) => (
            <div key={character.id} data-character-id={character.id} className="transition-all duration-300 rounded-xl">
              <CharacterCard
                character={character}
                onUpdate={(updates) => updateCharacter(currentBible.id, character.id, updates)}
                onDelete={() => deleteCharacter(currentBible.id, character.id)}
              />
            </div>
          ))}
        </div>

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
    </div>
  )
}
