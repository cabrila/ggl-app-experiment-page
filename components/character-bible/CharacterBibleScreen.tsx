"use client"

import { CharacterBibleProvider, useCharacterBible } from "./CharacterBibleContext"
import ProjectsList from "./ProjectsList"
import UploadView from "./UploadView"
import ResultsView from "./ResultsView"
import FeatureLayout from "@/components/layout/FeatureLayout"

type ActiveView = "character-bible" | "location-overview" | "actor-database" | "public-casting"

interface CharacterBibleScreenProps {
  onBack: () => void
  onSignOut?: () => void
  activeView?: ActiveView
  onNavigate?: (view: string) => void
}

function CharacterBibleContent({ onBack, onSignOut, activeView, onNavigate }: CharacterBibleScreenProps) {
  const { view } = useCharacterBible()

  return (
    <FeatureLayout onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate as (view: ActiveView) => void}>
      <div className="h-full flex flex-col overflow-hidden">
        {view === "list" && <ProjectsList />}
        {view === "upload" && <UploadView />}
        {view === "results" && <ResultsView />}
      </div>
    </FeatureLayout>
  )
}

export default function CharacterBibleScreen({ onBack, onSignOut, activeView, onNavigate }: CharacterBibleScreenProps) {
  return (
    <CharacterBibleProvider>
      <CharacterBibleContent onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate} />
    </CharacterBibleProvider>
  )
}
