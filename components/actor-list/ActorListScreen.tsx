"use client"

import { useActorList } from "./ActorListContext"
import ActorProjectsList from "./ActorProjectsList"
import ActorUploadView from "./ActorUploadView"
import ActorResultsView from "./ActorResultsView"
import AllActorsView from "./AllActorsView"
import FeatureLayout from "@/components/layout/FeatureLayout"

type ActiveView = "character-bible" | "location-overview" | "actor-database" | "public-casting" | "prop-list" | "scene-list"

interface ActorListScreenProps {
  onBack: () => void
  onSignOut?: () => void
  activeView?: ActiveView
  onNavigate?: (view: string) => void
}

function ActorListContent({ onBack, onSignOut, activeView, onNavigate }: ActorListScreenProps) {
  const { view } = useActorList()

  return (
    <FeatureLayout onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate as (view: ActiveView) => void}>
      <div className="h-full flex flex-col overflow-hidden">
        {view === "list" && <ActorProjectsList />}
        {view === "upload" && <ActorUploadView />}
        {view === "results" && <ActorResultsView />}
        {view === "all-actors" && <AllActorsView />}
      </div>
    </FeatureLayout>
  )
}

export default function ActorListScreen({ onBack, onSignOut, activeView, onNavigate }: ActorListScreenProps) {
  // Provider is mounted once at the app root (app/page.tsx) so data persists
  // across navigation and loads from the splash — no per-screen remount.
  return <ActorListContent onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate} />
}
