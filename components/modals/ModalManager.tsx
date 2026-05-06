"use client"

import { useState, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import AddActorModal from "./AddActorModal"
import EditActorModal from "./EditActorModal"
import AddCharacterModal from "./AddCharacterModal"
import EditCharacterModal from "./EditCharacterModal"
import AddShortlistModal from "./AddShortlistModal"
import ProjectManagerModal from "./ProjectManagerModal"
import CastingBreakdownModal from "./CastingBreakdownModal"
import TeamSuggestionsModal from "./TeamSuggestionsModal"
import UserPermissionsModal from "./UserPermissionsModal"
import NotificationsModal from "./NotificationsModal"
import ManageStatusesModal from "./ManageStatusesModal"
import PlayerViewModal from "./PlayerViewModal"
import MoreActionsModal from "./MoreActionsModal"
import MoveActorModal from "./MoveActorModal"
import MoveActorToCharacterModal from "./MoveActorToCharacterModal"
import MoveMultipleActorsModal from "./MoveMultipleActorsModal"
import ConfirmDeleteModal from "./ConfirmDeleteModal"
import UploadCSVModal from "./UploadCSVModal"
import UploadCharactersModal from "./UploadCharactersModal"
import ClearCacheModal from "./ClearCacheModal"
import NoCharacterWarningModal from "./NoCharacterWarningModal"
import CanvasModal from "../canvas/CanvasModal"
import ContactActorModal from "./ContactActorModal"
import HelpWizardModal from "./HelpWizardModal"
import CharacterDetailsModal from "./CharacterDetailsModal"
import UploadActorsMenuModal from "./UploadActorsMenuModal"
import CreateActorFormModal from "./CreateActorFormModal"
import SplashScreenModal from "./SplashScreenModal"
import BookAuditionModal from "./BookAuditionModal"
import ScheduleModal from "./ScheduleModal"
import DatabaseModal from "./DatabaseModal"
import AssignToProjectModal from "./AssignToProjectModal"
import CharactersModal from "./CharactersModal"
import ScriptAnalysisModal from "./ScriptAnalysisModal"
import AddFromDatabaseModal from "./AddFromDatabaseModal"
import PropsModal from "./PropsModal"
import LocationsModal from "./LocationsModal"
import CostumesModal from "./CostumesModal"
import ScriptModal from "./ScriptModal"
import ProductionDesignModal from "./ProductionDesignModal"
import CastingForTVModal from "./CastingForTVModal"
import CastingModal from "./CastingModal"

export interface ModalState {
  type: string | null
  data?: any
}

// Stack to manage multiple modals
let globalModalStack: ModalState[] = []
let globalSetModalStack: ((stack: ModalState[]) => void) | null = null

export function openModal(type: string, data?: any) {
  if (globalSetModalStack) {
    const newModal = { type, data }
    globalSetModalStack([...globalModalStack, newModal])
  }
}

export function closeModal() {
  if (globalSetModalStack && globalModalStack.length > 0) {
    const newStack = [...globalModalStack]
    newStack.pop()
    globalSetModalStack(newStack)
  }
}

export function closeAllModals() {
  if (globalSetModalStack) {
    globalSetModalStack([])
  }
}

// Replace current modal with a new one - opens new modal first, then removes the previous one
// This prevents flicker/flash of underlying content during modal transitions
// Special case: replacing with "splashScreen" closes all modals to show the base SplashScreen
export function replaceModal(type: string, data?: any) {
  if (globalSetModalStack) {
    // If replacing with splash screen, just close all modals
    // The base SplashScreen component is always rendered in page.tsx
    if (type === "splashScreen") {
      globalSetModalStack([])
      return
    }
    
    // For other modals, replace the current modal
    const newModal = { type, data }
    // First, add the new modal on top of the stack
    const stackWithNewModal = [...globalModalStack, newModal]
    globalSetModalStack(stackWithNewModal)
    
    // After a brief delay for the new modal to render, remove the previous modal
    setTimeout(() => {
      if (globalSetModalStack && globalModalStack.length > 0) {
        // Remove the second-to-last item (the old modal) keeping the new one on top
        const currentStack = [...globalModalStack]
        if (currentStack.length >= 2) {
          currentStack.splice(currentStack.length - 2, 1)
          globalSetModalStack(currentStack)
        }
      }
    }, 50)
  }
}

// Navigate to a modal, closing all others - useful for main navigation
// Special case: navigating to "splashScreen" closes all modals to show the base SplashScreen component
export function navigateToModal(type: string, data?: any) {
  if (globalSetModalStack) {
    // If navigating to splash screen, just close all modals
    // The base SplashScreen component is always rendered in page.tsx
    if (type === "splashScreen") {
      globalSetModalStack([])
      return
    }
    
    // For other modals, replace the entire stack with just this modal
    globalSetModalStack([{ type, data }])
  }
}

export default function ModalManager() {
  const [modalStack, setModalStack] = useState<ModalState[]>([])
  const { state, dispatch } = useCasting()

  useEffect(() => {
    globalModalStack = modalStack
    globalSetModalStack = setModalStack
  }, [modalStack])

  const handleClose = () => {
    closeModal()
  }

  const handleCloseAll = () => {
    closeAllModals()
  }

  // Check if Player View should be open - this is the key fix
  const isPlayerViewOpen = state.currentFocus.playerView.isOpen

  // Check if any modals are open in the CastingContext
  const hasOpenContextModals = state.modals && Object.values(state.modals).some((modal) => modal.isOpen)

  // Render Player View separately since it's controlled by state, not modal system
  if (isPlayerViewOpen) {
    return <PlayerViewModal onClose={() => dispatch({ type: "CLOSE_PLAYER_VIEW" })} />
  }

  if (modalStack.length === 0 && !hasOpenContextModals) return null

  // Render modals from CastingContext (these take precedence)
  if (hasOpenContextModals && state.modals) {
    if (state.modals.addActor?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AddActorModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "addActor" })}
            characterId={state.modals.addActor.props.characterId}
          />
        </div>
      )
    }

    if (state.modals.editActor?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <EditActorModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "editActor" })}
            {...state.modals.editActor.props}
          />
        </div>
      )
    }

    if (state.modals.moveActor?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <MoveActorModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "moveActor" })}
            {...state.modals.moveActor.props}
          />
        </div>
      )
    }

    if (state.modals.moveActorToCharacter?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <MoveActorToCharacterModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "moveActorToCharacter" })}
            {...state.modals.moveActorToCharacter.props}
          />
        </div>
      )
    }

    if (state.modals.bookAudition?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <BookAuditionModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "bookAudition" })}
            {...state.modals.bookAudition.props}
          />
        </div>
      )
    }

    if (state.modals.database?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <DatabaseModal onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "database" })} />
        </div>
      )
    }

    if (state.modals.scriptAnalysis?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ScriptAnalysisModal onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "scriptAnalysis" })} />
        </div>
      )
    }

    if (state.modals.addFromDatabase?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AddFromDatabaseModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "addFromDatabase" })}
            characterId={state.modals.addFromDatabase.props.characterId}
          />
        </div>
      )
    }
  }

  // Render modal stack
  const renderModalAtIndex = (modal: ModalState, index: number) => {
    const isTopModal = index === modalStack.length - 1
    const zIndex = 50 + index * 10 // Increase z-index for each stacked modal

    const modalContent = (() => {
      switch (modal.type) {
        case "addActor":
          return <AddActorModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "editActor":
          return <EditActorModal onClose={handleClose} {...modal.data} />
        case "addCharacter":
          return <AddCharacterModal onClose={handleClose} />
        case "editCharacter":
          return <EditCharacterModal onClose={handleClose} {...modal.data} />
        case "addShortlist":
          return <AddShortlistModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "projectManager":
          return <ProjectManagerModal onClose={handleClose} />
        case "castingBreakdown":
          return <CastingBreakdownModal onClose={handleClose} />
        case "teamSuggestions":
          return <TeamSuggestionsModal onClose={handleClose} />
        case "userPermissions":
          return <UserPermissionsModal onClose={handleClose} />
        case "notifications":
          return <NotificationsModal onClose={handleClose} />
        case "manageStatuses":
          return <ManageStatusesModal onClose={handleClose} {...modal.data} />
        case "playerView":
          return <PlayerViewModal onClose={handleClose} />
        case "moreActions":
          return <MoreActionsModal onClose={handleClose} {...modal.data} />
        case "moveActor":
          return <MoveActorModal onClose={handleClose} {...modal.data} />
        case "moveActorToCharacter":
          return <MoveActorToCharacterModal onClose={handleClose} {...modal.data} />
        case "moveMultipleActors":
          return <MoveMultipleActorsModal onClose={handleClose} {...modal.data} />
        case "confirmDelete":
          return <ConfirmDeleteModal onClose={handleClose} {...modal.data} />
        case "uploadCSV":
          return <UploadCSVModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "uploadCharacters":
          return <UploadCharactersModal onClose={handleClose} />
        case "clearCache":
          return <ClearCacheModal onClose={handleClose} />
        case "noCharacterWarning":
          return <NoCharacterWarningModal onClose={handleClose} {...modal.data} />
        case "canvas":
          return <CanvasModal onClose={handleClose} />
        case "contactActor":
          return <ContactActorModal onClose={handleClose} {...modal.data} />
        case "helpWizard":
          return <HelpWizardModal onClose={handleClose} />
        case "characterDetails":
          return <CharacterDetailsModal onClose={handleClose} {...modal.data} />
        case "uploadActorsMenu":
          return <UploadActorsMenuModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "createActorForm":
          return <CreateActorFormModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "splashScreen":
          return <SplashScreenModal onClose={handleClose} />
        case "bookAudition":
          return <BookAuditionModal onClose={handleClose} {...modal.data} />
        case "schedule":
          return <ScheduleModal onClose={handleClose} />
        case "database":
          return <DatabaseModal onClose={handleClose} />
        case "assignToProject":
          return <AssignToProjectModal onClose={handleClose} {...modal.data} />
        case "characters":
          return <CharactersModal onClose={handleClose} />
        case "scriptAnalysis":
          return <ScriptAnalysisModal onClose={handleClose} />
        case "addFromDatabase":
          return <AddFromDatabaseModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "props":
          return <PropsModal onClose={handleClose} />
        case "locations":
          return <LocationsModal onClose={handleClose} />
        case "costumes":
          return <CostumesModal onClose={handleClose} />
        case "script":
          return <ScriptModal onClose={handleClose} />
        case "productionDesign":
          return <ProductionDesignModal onClose={handleClose} />
        case "castingForTV":
          return <CastingForTVModal onClose={handleClose} />
        case "casting":
          return <CastingModal onClose={handleClose} />
        default:
          return null
      }
    })()

    if (!modalContent) return null

    // For splash screen, canvas, and characters modal, don't add the backdrop wrapper since they have their own
    if (
      modal.type === "splashScreen" ||
      modal.type === "canvas" ||
      modal.type === "characters" ||
      modal.type === "addFromDatabase" ||
      modal.type === "props" ||
      modal.type === "locations" ||
      modal.type === "costumes" ||
      modal.type === "script" ||
      modal.type === "schedule" ||
      modal.type === "productionDesign" ||
      modal.type === "castingForTV" ||
      modal.type === "casting"
    ) {
      return <div key={`modal-${index}`}>{modalContent}</div>
    }

    // For other modals, add backdrop only if it's the bottom modal or if the modal below is canvas/splash
    const shouldShowBackdrop = index === 0 || ["canvas", "splashScreen"].includes(modalStack[index - 1]?.type)
    const backdropOpacity = shouldShowBackdrop ? "bg-opacity-50" : "bg-opacity-20"

    return (
      <div
        key={`modal-${index}`}
        className={`fixed inset-0 bg-black ${backdropOpacity} flex items-center justify-center p-4`}
        style={{ zIndex }}
      >
        {modalContent}
      </div>
    )
  }

  return <>{modalStack.map((modal, index) => renderModalAtIndex(modal, index))}</>
}
