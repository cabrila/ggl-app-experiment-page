"use client"

import { useState } from "react"
import { PublicCastingProvider } from "./PublicCastingContext"
import { ActorListProvider } from "@/components/actor-list/ActorListContext"
import CastingCallsList from "./CastingCallsList"
import CastingCallSetup from "./CastingCallSetup"
import SubmissionsList from "./SubmissionsList"
import FeatureLayout from "@/components/layout/FeatureLayout"
import { CastingCall, PublicCastingProject } from "@/types/public-casting"

type View = "list" | "setup" | "submissions"
type ActiveView = "character-bible" | "location-overview" | "actor-database" | "public-casting" | "prop-list" | "scene-list"

interface PublicCastingScreenProps {
  onBack: () => void
  onSignOut?: () => void
  activeView?: ActiveView
  onNavigate?: (view: string) => void
}

interface EditingState {
  castingCall: CastingCall
  project: PublicCastingProject
}

function PublicCastingContent({ onBack, onSignOut, activeView, onNavigate }: PublicCastingScreenProps) {
  const [view, setView] = useState<View>("list")
  const [editingState, setEditingState] = useState<EditingState | null>(null)
  const [submissionsFormFilter, setSubmissionsFormFilter] = useState<string | undefined>(undefined)

  const handleNewCastingCall = () => {
    setEditingState(null)
    setView("setup")
  }

  const handleEditCastingCall = (castingCall: CastingCall, project: PublicCastingProject) => {
    setEditingState({ castingCall, project })
    setView("setup")
  }

  const handleBackToList = () => {
    setEditingState(null)
    setView("list")
  }

  const handleViewSubmissions = (formFilter?: string) => {
    setSubmissionsFormFilter(formFilter)
    setView("submissions")
  }

  const renderContent = () => {
    switch (view) {
      case "list":
        return (
          <CastingCallsList
            onNewCastingCall={handleNewCastingCall}
            onViewSubmissions={handleViewSubmissions}
            onEditCastingCall={handleEditCastingCall}
          />
        )
      case "setup":
        return (
          <CastingCallSetup
            onBack={handleBackToList}
            onSuccess={handleBackToList}
            editingCastingCall={editingState?.castingCall}
            editingProject={editingState?.project}
          />
        )
      case "submissions":
        return <SubmissionsList onBack={() => setView("list")} initialFormFilter={submissionsFormFilter} />
      default:
        return null
    }
  }

  return (
    <FeatureLayout onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate as (view: ActiveView) => void}>
      <div className="h-full flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </FeatureLayout>
  )
}

export default function PublicCastingScreen({ onBack, onSignOut, activeView, onNavigate }: PublicCastingScreenProps) {
  return (
    <PublicCastingProvider>
      <ActorListProvider>
        <PublicCastingContent onBack={onBack} onSignOut={onSignOut} activeView={activeView} onNavigate={onNavigate} />
      </ActorListProvider>
    </PublicCastingProvider>
  )
}
