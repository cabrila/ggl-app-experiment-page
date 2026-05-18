"use client"

import { PropListProvider, usePropList } from "./PropListContext"
import PropProjectsList from "./PropProjectsList"
import PropUploadView from "./PropUploadView"
import PropResultsView from "./PropResultsView"
import FeatureLayout from "@/components/layout/FeatureLayout"

type ActiveView =
  | "character-bible"
  | "location-overview"
  | "actor-database"
  | "public-casting"
  | "prop-list"
  | "scene-list"

interface PropListScreenProps {
  onBack: () => void
  onSignOut?: () => void
  activeView?: ActiveView
  onNavigate?: (view: string) => void
}

function PropListContent({ onBack, onSignOut, activeView, onNavigate }: PropListScreenProps) {
  const { view } = usePropList()

  return (
    <FeatureLayout
      onBack={onBack}
      onSignOut={onSignOut}
      activeView={activeView}
      onNavigate={onNavigate as (view: ActiveView) => void}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {view === "projects" && <PropProjectsList />}
        {view === "upload" && <PropUploadView />}
        {view === "results" && <PropResultsView />}
      </div>
    </FeatureLayout>
  )
}

export default function PropListScreen({ onBack, onSignOut, activeView, onNavigate }: PropListScreenProps) {
  return (
    <PropListProvider>
      <PropListContent onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate} />
    </PropListProvider>
  )
}
