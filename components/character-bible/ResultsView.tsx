"use client"

import { ArrowLeft, Plus, Search, User } from "lucide-react"
import { useCharacterBible } from "./CharacterBibleContext"
import { useState } from "react"
import CharacterCard from "./CharacterCard"

export default function ResultsView() {
  const { currentBible, setView, setCurrentBible } = useCharacterBible()
  const [searchTerm, setSearchTerm] = useState("")

  if (!currentBible) {
    return null
  }

  const filteredCharacters = currentBible.characters.filter((char) =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBack = () => {
    setCurrentBible(null)
    setView("list")
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{currentBible.name}</h1>
              <p className="text-white/50 text-sm">
                {currentBible.characters.length} character{currentBible.characters.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Character
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search characters..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Characters Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white/70 mb-2">
              {searchTerm ? "No characters found" : "No characters yet"}
            </h3>
            <p className="text-white/40 text-sm">
              {searchTerm ? "Try a different search term" : "Add characters to this project"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
