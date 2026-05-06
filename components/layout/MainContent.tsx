"use client"

import { useCasting } from "@/components/casting/CastingContext"
import CharacterHeader from "@/components/character/CharacterHeader"
import TabNavigation from "@/components/tabs/TabNavigation"
import ViewControls from "@/components/views/ViewControls"
import ActorGrid from "@/components/actors/ActorGrid"

export default function MainContent() {
  const { state } = useCasting()
  const currentCharacter = state.projects
    .find((p) => p.id === state.currentFocus.currentProjectId)
    ?.characters.find((c) => c.id === state.currentFocus.characterId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Character Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white">
        <CharacterHeader character={currentCharacter} />
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white">
        <TabNavigation />
      </div>

      {/* View Controls */}
      <div className="flex-shrink-0 bg-gray-50 px-6 py-3">
        <ViewControls />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-full mx-auto">
          {currentCharacter ? (
            <ActorGrid character={currentCharacter} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-xl font-semibold text-slate-600 mb-2">No Character Selected</div>
                <div className="text-slate-500">Please select a character to view actors</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
