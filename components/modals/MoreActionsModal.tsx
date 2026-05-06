"use client"

import { Button } from "@/components/ui/button"
import { X, Trash2, ArrowRightLeft, UserX, Flag, Users, Heart, Star, FolderPlus } from "lucide-react"
import { openModal } from "./ModalManager"
import type { Actor } from "@/types/casting"
import { useCasting } from "@/components/casting/CastingContext"

interface MoreActionsModalProps {
  onClose: () => void
  actor: Actor
  characterId: string
}

export default function MoreActionsModal({ onClose, actor, characterId }: MoreActionsModalProps) {
  const { state, dispatch } = useCasting()

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
      message: `Are you sure you want to remove ${actor.name} from ${characterName}'s casting lists? This will remove them from all lists (Long List, Audition, Approval, etc.) for this character only.`,
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
      message: `Are you sure you want to delete ${actor.name}? This action cannot be undone.`,
      onConfirm: () => {
        // Dispatch the DELETE_ACTOR action
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

  const handleReportIssue = () => {
    // TODO: Implement report issue functionality
    alert("Report issue functionality to be implemented")
    onClose()
  }

  const handleSetAllVotes = (vote: "yes" | "no" | "maybe") => {
    if (!state.currentUser) return

    // Set votes for all users to the specified vote
    state.users.forEach((user) => {
      dispatch({
        type: "CAST_VOTE",
        payload: {
          actorId: actor.id,
          characterId: characterId,
          vote,
          userId: user.id,
        },
      })
    })

    onClose()
  }

  const handleAssignToProject = () => {
    onClose()
    openModal("assignToProject", { actor, sourceCharacterId: characterId })
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">More Actions</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-2">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto p-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={handleAssignToProject}
          >
            <FolderPlus className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Assign to Project</div>
              <div className="text-sm text-gray-500">
                Add this actor to another project and optionally to its canvas
              </div>
            </div>
          </Button>

          {/* Voting Actions Section */}
          <div className="border-b pb-2 mb-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-3">Set All Votes</div>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleSetAllVotes("yes")}
            >
              <Heart className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Set All to Yes</div>
                <div className="text-sm text-gray-500">All team members vote Yes for this actor</div>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleSetAllVotes("no")}
            >
              <X className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Set All to No</div>
                <div className="text-sm text-gray-500">All team members vote No for this actor</div>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => handleSetAllVotes("maybe")}
            >
              <Star className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Set All to Maybe</div>
                <div className="text-sm text-gray-500">All team members vote Maybe for this actor</div>
              </div>
            </Button>
          </div>

          {/* Movement Actions */}
          <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3" onClick={handleMoveToList}>
            <ArrowRightLeft className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Move to Different List</div>
              <div className="text-sm text-gray-500">Change which list this actor is in</div>
            </div>
          </Button>

          <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3" onClick={handleMoveToCharacter}>
            <Users className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Move to Different Character</div>
              <div className="text-sm text-gray-500">Transfer actor to another character in this project</div>
            </div>
          </Button>

          <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3" onClick={handleRemoveFromList}>
            <UserX className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Remove from List</div>
              <div className="text-sm text-gray-500">Remove from current list only</div>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto p-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDeleteActor}
          >
            <Trash2 className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Delete Actor</div>
              <div className="text-sm text-red-500">Permanently delete this actor</div>
            </div>
          </Button>

          <div className="border-t my-2" />

          <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3" onClick={handleReportIssue}>
            <Flag className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Report Issue</div>
              <div className="text-sm text-gray-500">Report a problem with this actor</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
