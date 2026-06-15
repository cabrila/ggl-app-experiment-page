"use client"

import { useLocationScouting } from "./LocationScoutingContext"
import LocationProjectsList from "./LocationProjectsList"
import LocationUploadView from "./LocationUploadView"
import LocationResultsView from "./LocationResultsView"
import FeatureLayout from "@/components/layout/FeatureLayout"

type ActiveView = "character-bible" | "location-overview" | "actor-database" | "public-casting" | "prop-list" | "scene-list"

interface LocationScoutingScreenProps {
  onBack: () => void
  onSignOut?: () => void
  activeView?: ActiveView
  onNavigate?: (view: string) => void
}

function LocationScoutingContent({ onBack, onSignOut, activeView, onNavigate }: LocationScoutingScreenProps) {
  const { view } = useLocationScouting()

  return (
    <FeatureLayout onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate as (view: ActiveView) => void}>
      <div className="h-full flex flex-col overflow-hidden">
        {view === "projects" && <LocationProjectsList />}
        {view === "upload" && <LocationUploadView />}
        {view === "results" && <LocationResultsView />}
      </div>
    </FeatureLayout>
  )
}

export default function LocationScoutingScreen({ onBack, onSignOut, activeView, onNavigate }: LocationScoutingScreenProps) {
  // Provider mounted once at the app root (app/page.tsx).
  return <LocationScoutingContent onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate} />
}
