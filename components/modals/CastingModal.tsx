"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import CharacterHeader from "@/components/character/CharacterHeader"
import TabNavigation from "@/components/tabs/TabNavigation"
import ViewControls from "@/components/views/ViewControls"
import ActorGrid from "@/components/actors/ActorGrid"
import CharactersSidebar from "@/components/layout/CharactersSidebar"
import EmbeddedCoPilot from "@/components/copilot/EmbeddedCoPilot"

interface CastingModalProps {
  onClose: () => void
}

export default function CastingModal({ onClose }: CastingModalProps) {
  const { state } = useCasting()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const currentCharacter = state.projects
    .find((p) => p.id === state.currentFocus.currentProjectId)
    ?.characters.find((c) => c.id === state.currentFocus.characterId)

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50 pl-14">
      {/* Slim Sidebar Strip / Expandable Drawer */}
      <FloatingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentModal="casting"
      />

      {/* Modal Header */}
      <ModalHeader
        title="Casting"
        titleColor="bg-emerald-600"
        onClose={onClose}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
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

          {/* Main Content Area - Actor Grid */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-full mx-auto">
              {currentCharacter ? (
                <ActorGrid character={currentCharacter} />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-slate-600 mb-2">
                      No Character Selected
                    </div>
                    <div className="text-slate-500">
                      Please select a character from the right panel to view actors
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Right Sidebar - Characters */}
        <CharactersSidebar />
      </div>

      {/* Embedded CoPilot - Fixed position in lower right corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <EmbeddedCoPilot context="casting" />
      </div>
    </div>
  )
}
