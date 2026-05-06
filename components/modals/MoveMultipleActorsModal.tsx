"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, ArrowRightCircle, List, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import type { Actor } from "@/types/casting"

interface MoveMultipleActorsModalProps {
  onClose: () => void
  actorIds: string[]
  characterId: string
}

interface DestinationOption {
  type: "standard" | "shortlist" | "custom"
  key?: string
  shortlistId?: string
  name: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  isSpecial?: boolean
}

export default function MoveMultipleActorsModal({ onClose, actorIds, characterId }: MoveMultipleActorsModalProps) {
  const { state, dispatch } = useCasting()
  const [selectedDestination, setSelectedDestination] = useState<DestinationOption | null>(null)
  const [destinations, setDestinations] = useState<DestinationOption[]>([])
  const [actorNames, setActorNames] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [isMoving, setIsMoving] = useState(false)

  // Get the current character
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const character = currentProject?.characters.find((c) => c.id === characterId)

  // Enhanced validation for actor movement
  const validateActorMovement = (
    actorIds: string[],
    destinationKey: string,
  ): { valid: boolean; warnings: string[] } => {
    const warnings: string[] = []
    const valid = true

    // Get actors to validate
    const actorsToMove = getSelectedActors(actorIds)

    if (destinationKey === "approval") {
      // Check if actors have sufficient progress for approval
      const actorsWithoutVotes = actorsToMove.filter(
        (actor) => !actor.userVotes || Object.keys(actor.userVotes).length === 0,
      )

      if (actorsWithoutVotes.length > 0) {
        warnings.push(`${actorsWithoutVotes.length} actor(s) have no votes yet. Consider getting team input first.`)
      }

      // Check if actors are coming from early stages
      const actorsFromLongList = actorsToMove.filter((actor) => actor.currentListKey === "longList")
      if (actorsFromLongList.length > 0) {
        warnings.push(
          `${actorsFromLongList.length} actor(s) are moving directly from Long List to Approval. This skips the audition stage.`,
        )
      }

      // Check for actors with negative consensus
      const actorsWithNegativeConsensus = actorsToMove.filter((actor) => {
        const votes = Object.values(actor.userVotes || {})
        const noVotes = votes.filter((v) => v === "no").length
        const totalVotes = votes.length
        return totalVotes > 0 && noVotes > totalVotes / 2
      })

      if (actorsWithNegativeConsensus.length > 0) {
        warnings.push(
          `${actorsWithNegativeConsensus.length} actor(s) have more "No" votes than "Yes" votes. Consider reviewing their status.`,
        )
      }
    }

    if (destinationKey === "longList") {
      // Check if actors are being moved backwards from approval
      const actorsFromApproval = actorsToMove.filter((actor) => actor.currentListKey === "approval")
      if (actorsFromApproval.length > 0) {
        warnings.push(
          `${actorsFromApproval.length} actor(s) are moving back from Approval. Their voting history will be preserved but they'll need to restart the process.`,
        )
      }

      // Check for greenlit actors
      const greenlitActors = actorsToMove.filter((actor) => actor.isGreenlit || actor.isCast)
      if (greenlitActors.length > 0) {
        warnings.push(
          `${greenlitActors.length} greenlit/cast actor(s) are being moved back to Long List. This will reset their cast status and require re-evaluation.`,
        )
      }

      // Check for actors with significant progress
      const actorsWithProgress = actorsToMove.filter((actor) => {
        const votes = Object.values(actor.userVotes || {})
        return votes.length >= state.users.length / 2 // More than half the team has voted
      })

      if (actorsWithProgress.length > 0) {
        warnings.push(
          `${actorsWithProgress.length} actor(s) have significant voting progress that will be reset when moved to Long List.`,
        )
      }
    }

    return { valid, warnings }
  }

  // Get selected actors from IDs
  const getSelectedActors = (actorIds: string[]): Actor[] => {
    if (!character) return []

    const allActors: Actor[] = []

    // Check standard lists
    for (const listKey of ["longList", "audition", "approval"]) {
      const list = character.actors[listKey as keyof typeof character.actors] as Actor[]
      if (Array.isArray(list)) {
        allActors.push(...list.filter((a) => actorIds.includes(a.id)))
      }
    }

    // Check shortlists
    for (const shortlist of character.actors.shortLists) {
      allActors.push(...shortlist.actors.filter((a) => actorIds.includes(a.id)))
    }

    // Check custom tabs
    for (const [key, actors] of Object.entries(character.actors)) {
      if (!["longList", "audition", "approval", "shortLists"].includes(key) && Array.isArray(actors)) {
        allActors.push(...(actors as Actor[]).filter((a) => actorIds.includes(a.id)))
      }
    }

    return allActors
  }

  // Find actor names for display
  useEffect(() => {
    if (!character) return

    const selectedActors = getSelectedActors(actorIds)
    setActorNames(selectedActors.map((actor) => actor.name))
  }, [character, actorIds])

  // Build destination options with enhanced descriptions
  useEffect(() => {
    if (!character) return

    const options: DestinationOption[] = []

    // Add standard tabs as destinations with enhanced descriptions
    state.tabDefinitions.forEach((tab) => {
      if (tab.key !== "shortLists") {
        let description = ""
        let icon = undefined
        let isSpecial = false

        if (tab.key === "longList") {
          description = "Reset actors for fresh evaluation from the beginning"
          icon = List
          isSpecial = true
        } else if (tab.key === "approval") {
          description = "Final review stage for casting decisions"
          icon = CheckCircle
          isSpecial = true
        } else if (tab.key === "audition") {
          description = "Actors ready for audition scheduling"
        }

        options.push({
          type: "standard",
          key: tab.key,
          name: tab.name,
          description,
          icon,
          isSpecial,
        })
      }
    })

    // Add shortlists as destinations
    character.actors.shortLists.forEach((shortlist) => {
      options.push({
        type: "shortlist",
        shortlistId: shortlist.id,
        name: `Shortlist: ${shortlist.name}`,
        description: `Move to the "${shortlist.name}" shortlist`,
      })
    })

    setDestinations(options)
  }, [character, state.tabDefinitions])

  // Update warnings when destination changes
  useEffect(() => {
    if (selectedDestination && selectedDestination.key) {
      const validation = validateActorMovement(actorIds, selectedDestination.key)
      setWarnings(validation.warnings)
    } else {
      setWarnings([])
    }
  }, [selectedDestination, actorIds])

  // Enhanced source location determination
  const determineSourceLocation = () => {
    if (!character) return null

    // Track locations where actors are found
    const locationCounts = new Map()

    // Check all possible locations for each actor
    actorIds.forEach((actorId) => {
      // Check standard lists
      for (const tabDef of state.tabDefinitions) {
        if (tabDef.key === "shortLists") continue

        const actors = character.actors[tabDef.key as keyof typeof character.actors]
        if (Array.isArray(actors) && actors.some((a) => a.id === actorId)) {
          const locationKey = `standard-${tabDef.key}`
          locationCounts.set(locationKey, (locationCounts.get(locationKey) || 0) + 1)
        }
      }

      // Check shortlists
      for (const shortlist of character.actors.shortLists) {
        if (shortlist.actors.some((a) => a.id === actorId)) {
          const locationKey = `shortlist-${shortlist.id}`
          locationCounts.set(locationKey, (locationCounts.get(locationKey) || 0) + 1)
        }
      }
    })

    // Find the most common location
    let maxCount = 0
    let primaryLocation = null

    locationCounts.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count
        const [type, id] = key.split("-")

        if (type === "standard") {
          primaryLocation = { type: "standard", key: id }
        } else if (type === "shortlist") {
          primaryLocation = { type: "shortlist", shortlistId: id }
        }
      }
    })

    return primaryLocation
  }

  const handleMove = async () => {
    if (!selectedDestination) return

    setIsMoving(true)

    try {
      // Determine source location using enhanced method
      const sourceLocation = determineSourceLocation()

      if (!sourceLocation) {
        console.error("Could not determine source location for actors")
        setIsMoving(false)
        return
      }

      // Dispatch move action with enhanced payload
      dispatch({
        type: "MOVE_MULTIPLE_ACTORS",
        payload: {
          actorIds,
          characterId,
          sourceLocation,
          destinationType: selectedDestination.type,
          destinationKey: selectedDestination.key,
          destinationShortlistId: selectedDestination.shortlistId,
          moveReason:
            selectedDestination.key === "longList"
              ? "reset"
              : selectedDestination.key === "approval"
                ? "final_review"
                : "standard",
        },
      })

      // Add enhanced notification
      const actorCount = actorIds.length
      const actorText = actorCount > 1 ? `${actorCount} actors` : actorNames[0] || "Actor"

      let notificationMessage = `${actorText} moved to ${selectedDestination.name}`
      let notificationTitle = "Actors Moved Successfully"
      let notificationPriority: "low" | "medium" | "high" = "low"

      if (selectedDestination.key === "approval") {
        notificationMessage = `${actorText} moved to Approval for final review and casting decisions`
        notificationTitle = "Moved to Approval"
        notificationPriority = "medium"
      } else if (selectedDestination.key === "longList") {
        notificationMessage = `${actorText} moved to Long List. Status and progress have been reset for fresh evaluation.`
        notificationTitle = "Moved to Long List"
        notificationPriority = "low"
      }

      const notification = {
        id: `move-success-${Date.now()}`,
        type: "system" as const,
        title: notificationTitle,
        message: notificationMessage,
        timestamp: Date.now(),
        read: false,
        priority: notificationPriority,
      }

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: notification,
      })

      // Small delay to show the moving state
      setTimeout(() => {
        setIsMoving(false)
        onClose()
      }, 500)
    } catch (error) {
      console.error("Error moving actors:", error)
      setIsMoving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Move {actorIds.length} Actor{actorIds.length > 1 ? "s" : ""}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isMoving}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Selected Actors Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Selected actors:</h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
              {actorNames.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {actorNames.map((name, index) => (
                    <div key={index} className="text-sm bg-white px-3 py-2 rounded border">
                      • {name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No actors selected</p>
              )}
            </div>
          </div>

          {/* Destination Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Move to:</h3>
            <div className="space-y-3">
              {destinations.map((dest) => {
                const IconComponent = dest.icon
                return (
                  <div
                    key={`${dest.type}-${dest.key || dest.shortlistId}`}
                    className={`p-4 rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                      selectedDestination &&
                      selectedDestination.type === dest.type &&
                      (
                        (dest.type === "shortlist" && selectedDestination.shortlistId === dest.shortlistId) ||
                          (dest.type !== "shortlist" && selectedDestination.key === dest.key)
                      )
                        ? dest.isSpecial
                          ? dest.key === "approval"
                            ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                            : "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedDestination(dest)}
                  >
                    <div className="flex items-start space-x-3">
                      {IconComponent && (
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            dest.key === "approval"
                              ? "bg-emerald-100 text-emerald-600"
                              : dest.key === "longList"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{dest.name}</div>
                        {dest.description && <div className="text-sm text-gray-600 mt-1">{dest.description}</div>}
                        {dest.isSpecial && (
                          <div
                            className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                              dest.key === "approval" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {dest.key === "approval" ? "Final Stage" : "Starting Point"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Warnings Section */}
          {warnings.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Please Review:</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-amber-600">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Special Information for Long List and Approval */}
          {selectedDestination?.key === "longList" && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Moving to Long List</h4>
                  <p className="text-sm text-blue-700">
                    Actors will be reset to the beginning of the evaluation process. Their voting history will be
                    preserved but they'll start fresh in the casting pipeline.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedDestination?.key === "approval" && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-emerald-800 mb-1">Moving to Approval</h4>
                  <p className="text-sm text-emerald-700">
                    Actors will be ready for final casting decisions. Team members can vote, and unanimous approval will
                    automatically cast the actor in the role.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isMoving}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedDestination || actorIds.length === 0 || isMoving}
            className={`${
              selectedDestination?.key === "approval"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : selectedDestination?.key === "longList"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-600 hover:bg-gray-700"
            } text-white transition-colors`}
          >
            {isMoving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Moving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ArrowRightCircle className="h-4 w-4" />
                <span>
                  Move {actorIds.length} Actor{actorIds.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
