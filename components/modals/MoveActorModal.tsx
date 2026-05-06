"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { Button } from "@/components/ui/button"
import { X, Users, Star, CheckCircle, List, Folder } from "lucide-react"
import { CriticalModalPortal } from "@/components/ui/modal-portal"
import type { Actor } from "@/types/casting"

interface MoveActorModalProps {
  onClose: () => void
  actor: Actor
  characterId: string
}

export default function MoveActorModal({ onClose, actor, characterId }: MoveActorModalProps) {
  const { state, dispatch } = useCasting()
  const [selectedDestination, setSelectedDestination] = useState<string>("")

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)

  if (!currentCharacter) {
    onClose()
    return null
  }

  // Get current location of the actor
  const getCurrentLocation = () => {
    // Check standard lists
    if (currentCharacter.actors.longList.some((a) => a.id === actor.id)) {
      return { type: "standard", key: "longList", name: "Long List" }
    }
    if (currentCharacter.actors.audition.some((a) => a.id === actor.id)) {
      return { type: "standard", key: "audition", name: "Audition" }
    }
    if (currentCharacter.actors.approval.some((a) => a.id === actor.id)) {
      return { type: "standard", key: "approval", name: "Approval" }
    }

    // Check shortlists
    for (const shortlist of currentCharacter.actors.shortLists) {
      if (shortlist.actors.some((a) => a.id === actor.id)) {
        return { type: "shortlist", key: "shortLists", name: shortlist.name, shortlistId: shortlist.id }
      }
    }

    // Check custom tabs
    for (const [key, actors] of Object.entries(currentCharacter.actors)) {
      if (!["longList", "audition", "approval", "shortLists"].includes(key) && Array.isArray(actors)) {
        if (actors.some((a: any) => a.id === actor.id)) {
          const tabDef = state.tabDefinitions.find((t) => t.key === key)
          return { type: "custom", key, name: tabDef?.name || key }
        }
      }
    }

    return null
  }

  const currentLocation = getCurrentLocation()

  // Get available destinations (excluding current location)
  const getAvailableDestinations = () => {
    const destinations = []

    // Standard tabs
    const standardTabs = [
      { key: "longList", name: "Long List", icon: List },
      { key: "audition", name: "Audition", icon: Users },
      { key: "approval", name: "Approval", icon: CheckCircle },
    ]

    for (const tab of standardTabs) {
      if (currentLocation?.key !== tab.key) {
        destinations.push({
          type: "standard",
          key: tab.key,
          name: tab.name,
          icon: tab.icon,
          count: currentCharacter.actors[tab.key as keyof typeof currentCharacter.actors]?.length || 0,
        })
      }
    }

    // Shortlists
    for (const shortlist of currentCharacter.actors.shortLists) {
      if (currentLocation?.shortlistId !== shortlist.id) {
        destinations.push({
          type: "shortlist",
          key: "shortLists",
          shortlistId: shortlist.id,
          name: shortlist.name,
          icon: Star,
          count: shortlist.actors.length,
        })
      }
    }

    // Custom tabs
    for (const tabDef of state.tabDefinitions) {
      if (!["longList", "audition", "approval", "shortLists"].includes(tabDef.key)) {
        if (currentLocation?.key !== tabDef.key) {
          const actors = currentCharacter.actors[tabDef.key as keyof typeof currentCharacter.actors]
          destinations.push({
            type: "custom",
            key: tabDef.key,
            name: tabDef.name,
            icon: Folder,
            count: Array.isArray(actors) ? actors.length : 0,
          })
        }
      }
    }

    return destinations
  }

  const availableDestinations = getAvailableDestinations()

  const handleMove = () => {
    if (!selectedDestination) return

    const destination = availableDestinations.find((d) =>
      d.type === "shortlist" ? d.shortlistId === selectedDestination : d.key === selectedDestination,
    )

    if (!destination) return

    dispatch({
      type: "MOVE_ACTOR",
      payload: {
        actorId: actor.id,
        characterId,
        sourceLocation: currentLocation,
        destinationType: destination.type,
        destinationKey: destination.key,
        destinationShortlistId: destination.type === "shortlist" ? destination.shortlistId : undefined,
      },
    })

    onClose()
  }

  const getDestinationIcon = (destination: any) => {
    const IconComponent = destination.icon
    return <IconComponent className="w-5 h-5" />
  }

  return (
    <CriticalModalPortal modalType="moveActor" onBackdropClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Move Actor</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Current Location */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Location</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {actor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{actor.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Currently in: <span className="font-medium">{currentLocation?.name}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Destination Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Move to</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableDestinations.map((destination) => (
                <label
                  key={destination.type === "shortlist" ? destination.shortlistId : destination.key}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedDestination ===
                    (destination.type === "shortlist" ? destination.shortlistId : destination.key)
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-400"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="destination"
                    value={destination.type === "shortlist" ? destination.shortlistId : destination.key}
                    checked={
                      selectedDestination ===
                      (destination.type === "shortlist" ? destination.shortlistId : destination.key)
                    }
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        selectedDestination ===
                        (destination.type === "shortlist" ? destination.shortlistId : destination.key)
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {getDestinationIcon(destination)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{destination.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {destination.count} actor{destination.count !== 1 ? "s" : ""}
                        {destination.type === "shortlist" && " in this shortlist"}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {availableDestinations.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No other lists available to move to.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleMove} disabled={!selectedDestination}>
              Move Actor
            </Button>
          </div>
        </div>
      </div>
    </CriticalModalPortal>
  )
}
