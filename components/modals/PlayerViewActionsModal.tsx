"use client"

import { Button } from "@/components/ui/button"
import { X, Trash2, ArrowRightLeft, UserX, Users, Edit, Tag } from "lucide-react"
import { openModal } from "./ModalManager"
import { useCasting } from "@/components/casting/CastingContext"
import { CriticalModalPortal } from "@/components/ui/modal-portal"
import type { Actor } from "@/types/casting"

interface PlayerViewActionsModalProps {
  onClose: () => void
  actor: Actor
  characterId: string
}

export default function PlayerViewActionsModal({ onClose, actor, characterId }: PlayerViewActionsModalProps) {
  const { state, dispatch } = useCasting()

  const handleEditActor = () => {
    onClose()
    openModal("editActor", { actor, characterId })
  }

  const handleManageStatuses = () => {
    onClose()
    openModal("manageStatuses", { actor, characterId })
  }

  const handleMoveToList = () => {
    onClose()
    openModal("moveActor", { actor, characterId })
  }

  const handleMoveToCharacter = () => {
    onClose()
    openModal("moveActorToCharacter", { actor, sourceCharacterId: characterId })
  }

  const handleRemoveFromList = () => {
    // Find the current character name for the confirmation message
    const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
    const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)
    const characterName = currentCharacter?.name || "this character"

    onClose()
    openModal("confirmDelete", {
      title: "Remove Actor from List",
      message: `Are you sure you want to remove ${actor.name} from ${characterName}'s casting lists? This will remove them from all lists for this character only.`,
      onConfirm: () => {
        dispatch({
          type: "DELETE_ACTOR",
          payload: {
            actorId: actor.id,
            characterId: characterId,
          },
        })
      },
    })
  }

  const handleDeleteActor = () => {
    onClose()
    openModal("confirmDelete", {
      title: "Delete Actor",
      message: `Are you sure you want to permanently delete ${actor.name}? This action cannot be undone and will remove the actor from all lists and projects.`,
      onConfirm: () => {
        dispatch({
          type: "DELETE_ACTOR",
          payload: {
            actorId: actor.id,
            characterId,
          },
        })
      },
    })
  }

  return (
    <CriticalModalPortal modalType="playerViewActions" onBackdropClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-4 border-2 border-gray-300 dark:border-gray-600">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actor Actions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{actor.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="p-3">
          <div className="space-y-1">
            {/* Edit Actor */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
              onClick={handleEditActor}
            >
              <Edit className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Edit Actor Details</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Update actor information and media</div>
              </div>
            </Button>

            {/* Manage Statuses */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20 dark:hover:text-purple-300"
              onClick={handleManageStatuses}
            >
              <Tag className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Manage Statuses</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Add or remove actor status tags</div>
              </div>
            </Button>

            <div className="border-t my-2 dark:border-gray-700" />

            {/* Move to Different List */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
              onClick={handleMoveToList}
            >
              <ArrowRightLeft className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Move to Different List</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Change which list this actor is in</div>
              </div>
            </Button>

            {/* Move to Different Character */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
              onClick={handleMoveToCharacter}
            >
              <Users className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Move to Different Character</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Transfer actor to another character in this project
                </div>
              </div>
            </Button>

            {/* Remove from List */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
              onClick={handleRemoveFromList}
            >
              <UserX className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Remove from List</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Move actor back to Long List</div>
              </div>
            </Button>

            <div className="border-t my-2 dark:border-gray-700" />

            {/* Delete Actor */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              onClick={handleDeleteActor}
            >
              <Trash2 className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Delete Actor</div>
                <div className="text-sm text-red-500 dark:text-red-400">Permanently delete this actor</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 dark:bg-gray-800 rounded-b-lg dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Actions performed here will affect the actor across all views
          </p>
        </div>
      </div>
    </CriticalModalPortal>
  )
}
