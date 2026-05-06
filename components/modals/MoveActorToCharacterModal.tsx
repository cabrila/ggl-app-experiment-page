"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Users, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { CriticalModalPortal } from "@/components/ui/modal-portal"
import type { Actor } from "@/types/casting"

interface MoveActorToCharacterModalProps {
  onClose: () => void
  actor: Actor
  sourceCharacterId: string
}

export default function MoveActorToCharacterModal({
  onClose,
  actor,
  sourceCharacterId,
}: MoveActorToCharacterModalProps) {
  const { state, dispatch } = useCasting()
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("")
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferStatus, setTransferStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // Get current project and available characters
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const availableCharacters = currentProject?.characters.filter((c) => c.id !== sourceCharacterId) || []
  const sourceCharacter = currentProject?.characters.find((c) => c.id === sourceCharacterId)
  const selectedCharacter = availableCharacters.find((c) => c.id === selectedCharacterId)

  const handleTransfer = async () => {
    if (!selectedCharacterId || !selectedCharacter) {
      setErrorMessage("Please select a destination character")
      setTransferStatus("error")
      return
    }

    setIsTransferring(true)
    setTransferStatus("idle")
    setErrorMessage("")

    try {
      // Simulate transfer delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Dispatch the move action
      dispatch({
        type: "MOVE_ACTOR_TO_CHARACTER",
        payload: {
          actorId: actor.id,
          sourceCharacterId,
          destinationCharacterId: selectedCharacterId,
        },
      })

      setTransferStatus("success")

      // Auto-close after showing success message
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      setErrorMessage("Failed to transfer actor. Please try again.")
      setTransferStatus("error")
    } finally {
      setIsTransferring(false)
    }
  }

  const handleCancel = () => {
    if (!isTransferring) {
      onClose()
    }
  }

  return (
    <CriticalModalPortal modalType="moveActorToCharacter" onBackdropClick={handleCancel}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Move Actor to Character</h2>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isTransferring}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Actor Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                {(() => {
                  const imgSrc = actor.headshots?.[actor.currentCardHeadshotIndex] || actor.headshots?.[0]
                  return imgSrc && !imgSrc.includes("placeholder.svg") ? (
                    <img
                      src={imgSrc}
                      alt={actor.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-gray-400" />
                  )
                })()}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{actor.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  From: {sourceCharacter?.name || "Unknown Character"}
                </p>
              </div>
            </div>
          </div>

          {/* Transfer Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>

          {/* Character Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Destination Character
            </label>
            {availableCharacters.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No other characters available in this project</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableCharacters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => setSelectedCharacterId(character.id)}
                    disabled={isTransferring}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCharacterId === character.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    } ${isTransferring ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{character.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {character.description || "No description"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Messages */}
          {transferStatus === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">
                Successfully moved {actor.name} to {selectedCharacter?.name}!
              </span>
            </div>
          )}

          {transferStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleCancel} disabled={isTransferring} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedCharacterId || isTransferring || availableCharacters.length === 0}
              className="flex-1"
            >
              {isTransferring ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Moving...
                </>
              ) : (
                "Move Actor"
              )}
            </Button>
          </div>

          {/* Transfer Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="font-medium mb-1">Transfer Details:</p>
            <ul className="space-y-1">
              <li>• Actor will be moved to the "Long List" of the selected character</li>
              <li>• All votes and consensus data will be reset</li>
              <li>• A notification will be sent to team members</li>
            </ul>
          </div>
        </div>
      </div>
    </CriticalModalPortal>
  )
}
