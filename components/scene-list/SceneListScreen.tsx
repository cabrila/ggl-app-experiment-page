"use client"

import { useSceneList } from "./SceneListContext"
import SceneProjectsList from "./SceneProjectsList"
import SceneUploadView from "./SceneUploadView"
import SceneResultsView from "./SceneResultsView"
import FeatureLayout from "@/components/layout/FeatureLayout"

type ActiveView =
  | "character-bible"
  | "location-overview"
  | "actor-database"
  | "public-casting"
  | "prop-list"
  | "scene-list"

interface SceneListScreenProps {
  onBack: () => void
  onSignOut?: () => void
  activeView?: ActiveView
  onNavigate?: (view: string) => void
}

function SceneListContent({ onBack, onSignOut, activeView, onNavigate }: SceneListScreenProps) {
  const { view } = useSceneList()
  return (
    <FeatureLayout
      onBack={onBack}
      onSignOut={onSignOut}
      activeView={activeView}
      onNavigate={onNavigate as (view: ActiveView) => void}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {view === "projects" && <SceneProjectsList />}
        {view === "upload" && <SceneUploadView />}
        {view === "results" && <SceneResultsView />}
      </div>
    </FeatureLayout>
  )
}

export default function SceneListScreen({ onBack, onSignOut, activeView, onNavigate }: SceneListScreenProps) {
  // Provider mounted once at the app root (app/page.tsx).
  return <SceneListContent onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate} />
}
