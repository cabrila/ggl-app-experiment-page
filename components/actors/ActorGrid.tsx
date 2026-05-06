"use client"

import type React from "react"
import { useActorGrid } from "./ActorGridContext"
import { useCasting } from "@/components/casting/CastingContext"
import type { Character, Actor } from "@/types/casting"
import { useState, useCallback, useEffect, useRef } from "react"
import { ArrowRightCircle, Mail, Crown, List, CheckCircle, MapPin, Phone, Calendar, Check } from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"
import ActorCard from "@/components/actors/ActorCard"

interface ActorGridProps {
  character: Character
}

export default function ActorGrid({ character }: ActorGridProps) {
  const { state, dispatch } = useCasting()
  const { selectedActorIds, setSelectedActorIds, lastSelectedId, setLastSelectedId, clearSelection } = useActorGrid()
  const { activeTabKey, searchTerm, currentSortOption, cardDisplayMode, searchTags, filters } = state.currentFocus

  // Enhanced drag and drop state with better cleanup
  const [draggedActor, setDraggedActor] = useState<Actor | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [isDragOverGrid, setIsDragOverGrid] = useState(false)
  const [draggedActorIds, setDraggedActorIds] = useState<Set<string>>(new Set())
  const [isMultiDragging, setIsMultiDragging] = useState(false)

  const [showFilters, setShowFilters] = useState(false)
  // Removed local state for filters:
  // const [statusFilter, setStatusFilter] = useState<string[]>([])
  // const [ageRangeFilter, setAgeRangeFilter] = useState<{ min: number; max: number }>({ min: 0, max: 100 })
  // const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [voteFilter, setVoteFilter] = useState<string>("") // Corrected: Declared voteFilter

  // Drag cleanup timeout ref
  const dragCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dragStateRef = useRef({
    isDragging: false,
    draggedActorId: null as string | null,
    draggedActorIds: new Set<string>(),
  })

  // Enhanced drag state cleanup function
  const cleanupDragState = useCallback(() => {
    console.log("🧹 ActorGrid: Cleaning up drag state")

    // Clear all drag-related state
    setDraggedActor(null)
    setDropTarget(null)
    setIsDragOverGrid(false)
    setDraggedActorIds(new Set())
    setIsMultiDragging(false)

    // Update ref state
    dragStateRef.current = {
      isDragging: false,
      draggedActorId: null,
      draggedActorIds: new Set(),
    }

    // Clear any pending cleanup timeouts
    if (dragCleanupTimeoutRef.current) {
      clearTimeout(dragCleanupTimeoutRef.current)
      dragCleanupTimeoutRef.current = null
    }

    console.log("✅ ActorGrid: Drag state cleaned up")
  }, [])

  // Scheduled cleanup with timeout fallback
  const scheduleDragCleanup = useCallback(
    (delay = 100) => {
      if (dragCleanupTimeoutRef.current) {
        clearTimeout(dragCleanupTimeoutRef.current)
      }

      dragCleanupTimeoutRef.current = setTimeout(() => {
        cleanupDragState()
      }, delay)
    },
    [cleanupDragState],
  )

  // Clear selection when changing tabs or characters
  useEffect(() => {
    setSelectedActorIds(new Set())
    setLastSelectedId(null)
    cleanupDragState() // Also cleanup drag state when switching contexts
  }, [activeTabKey, character.id, cleanupDragState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragCleanupTimeoutRef.current) {
        clearTimeout(dragCleanupTimeoutRef.current)
      }
    }
  }, [])

  // Handle keyboard events for selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key clears selection and drag state
      if (e.key === "Escape") {
        setSelectedActorIds(new Set())
        setLastSelectedId(null)
        cleanupDragState()
      }

      // Ctrl+A or Cmd+A selects all visible actors
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault()
        const actors = filterAndSortActors(getActorsForTab())
        const allIds = new Set(actors.map((actor) => actor.id))
        setSelectedActorIds(allIds)
        setLastSelectedId(actors.length > 0 ? actors[actors.length - 1].id : null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeTabKey, character.id, cleanupDragState])

  // Utility function to check if drag contains image files
  const hasImageFiles = (dataTransfer: DataTransfer): boolean => {
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      return Array.from(dataTransfer.files).some((file) => file.type.startsWith("image/"))
    }

    const types = Array.from(dataTransfer.types)
    return types.some((type) => type.includes("image") || type === "Files" || type === "application/x-moz-file")
  }

  // Utility function to check if drag contains actor data
  const hasActorData = (dataTransfer: DataTransfer): boolean => {
    const textData = dataTransfer.getData("text/plain")
    const jsonData = dataTransfer.getData("application/json")

    if (textData && textData.startsWith("actor-")) {
      return true
    }

    if (jsonData) {
      try {
        const data = JSON.parse(jsonData)
        return data.dragType === "actor" || data.actorId || data.sourceTabKey
      } catch {
        return false
      }
    }

    return false
  }

  const getActorsForTab = (): Actor[] => {
    if (activeTabKey === "shortLists") {
      return character.actors.shortLists.flatMap((sl) => sl.actors)
    }

    const actors = character.actors[activeTabKey as keyof typeof character.actors]
    return Array.isArray(actors) ? actors : []
  }

  const matchesSearch = (actor: Actor, searchTerm: string, searchTags: any[] = []): boolean => {
    // If no search criteria, show all actors
    if (!searchTerm && (!searchTags || searchTags.length === 0)) return true

    let matchesText = true
    let matchesTags = true

    // Check text search if provided
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      matchesText = false // Start with false, need to find a match

      // Core fields
      if (actor.name?.toLowerCase().includes(search)) matchesText = true
      if (actor.gender?.toLowerCase().includes(search)) matchesText = true
      if (actor.ethnicity?.toLowerCase().includes(search)) matchesText = true
      if (actor.location?.toLowerCase().includes(search)) matchesText = true
      if (actor.agent?.toLowerCase().includes(search)) matchesText = true

      // Skills & Abilities
      if (actor.skills?.some((skill) => skill.toLowerCase().includes(search))) matchesText = true

      // Additional fields from the enhanced actor data
      if ((actor as any).language?.toLowerCase().includes(search)) matchesText = true
      if ((actor as any).height?.toLowerCase().includes(search)) matchesText = true
      if ((actor as any).bodyType?.toLowerCase().includes(search)) matchesText = true
      if ((actor as any).shoeSize?.toLowerCase().includes(search)) matchesText = true
      if ((actor as any).hairColor?.toLowerCase().includes(search)) matchesText = true
      if ((actor as any).eyeColor?.toLowerCase().includes(search)) matchesText = true
      if ((actor as any).nakednessLevel?.toLowerCase().includes(search)) matchesText = true

      // Past Productions - search through array of productions
      if ((actor as any).pastProductions?.some((production: string) => production.toLowerCase().includes(search)))
        matchesText = true

      // IMDB URL (might contain searchable text)
      if ((actor as any).imdbUrl?.toLowerCase().includes(search)) matchesText = true
    }

    // Check tag search if provided
    if (searchTags && searchTags.length > 0) {
      matchesTags = searchTags.every((tag) => {
        const tagText = tag.text.toLowerCase()

        // Check all the same fields as text search for each tag
        return (
          actor.name?.toLowerCase().includes(tagText) ||
          actor.gender?.toLowerCase().includes(tagText) ||
          actor.ethnicity?.toLowerCase().includes(tagText) ||
          actor.location?.toLowerCase().includes(tagText) ||
          actor.agent?.toLowerCase().includes(tagText) ||
          actor.skills?.some((skill) => skill.toLowerCase().includes(tagText)) ||
          (actor as any).language?.toLowerCase().includes(tagText) ||
          (actor as any).height?.toLowerCase().includes(tagText) ||
          (actor as any).bodyType?.toLowerCase().includes(tagText) ||
          (actor as any).shoeSize?.toLowerCase().includes(tagText) ||
          (actor as any).hairColor?.toLowerCase().includes(tagText) ||
          (actor as any).eyeColor?.toLowerCase().includes(tagText) ||
          (actor as any).nakednessLevel?.toLowerCase().includes(tagText) ||
          (actor as any).pastProductions?.some((production: string) => production.toLowerCase().includes(tagText)) ||
          (actor as any).imdbUrl?.toLowerCase().includes(tagText)
        )
      })
    }

    // Both text and tags must match (AND logic)
    return matchesText && matchesTags
  }

  const filterAndSortActors = (actors: Actor[]): Actor[] => {
    // For Approval list, show ALL actors including greenlit ones
    // For other lists, filter out greenlit actors
    let filtered = activeTabKey === "approval" ? actors : actors.filter((actor) => !actor.isGreenlit)

    if (searchTerm || (searchTags && searchTags.length > 0)) {
      filtered = filtered.filter((actor) => matchesSearch(actor, searchTerm, searchTags))
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter((actor) => actor.statuses?.some((status) => filters.status.includes(status.id)))
    }

    if (filters.ageRange.min > 0 || filters.ageRange.max < 100) {
      filtered = filtered.filter((actor) => {
        // Try to parse age from actor.age or actor.playingAge
        let actorAge: number | null = null

        if (actor.age) {
          actorAge = Number.parseInt(actor.age)
        } else if (actor.playingAge) {
          // Parse playing age range like "25-30" and use the midpoint
          const match = actor.playingAge.match(/(\d+)-(\d+)/)
          if (match) {
            const min = Number.parseInt(match[1])
            const max = Number.parseInt(match[2])
            actorAge = Math.floor((min + max) / 2)
          } else {
            // Try to parse as single number
            actorAge = Number.parseInt(actor.playingAge)
          }
        }

        if (actorAge === null || isNaN(actorAge)) {
          return false // Exclude actors without valid age data
        }

        return actorAge >= filters.ageRange.min && actorAge <= filters.ageRange.max
      })
    }

    if (filters.location.length > 0) {
      filtered = filtered.filter((actor) => {
        if (!actor.location) return false
        return filters.location.includes(actor.location.trim())
      })
    }

    // Apply vote filter
    if (voteFilter) {
      filtered = filtered.filter((actor) => {
        const votes = Object.values(actor.userVotes || {})
        switch (voteFilter) {
          case "unanimous_yes":
            return votes.length === state.users.length && votes.every((v) => v === "yes")
          case "unanimous_no":
            return votes.length === state.users.length && votes.every((v) => v === "no")
          case "mixed":
            return votes.length > 0 && new Set(votes).size > 1
          case "no_votes":
            return votes.length === 0
          default:
            return true
        }
      })
    }

    // Apply sorting
    const hasCustomOrder = filtered.some((actor) => typeof actor.sortOrder === "number")

    if (currentSortOption === "custom" || hasCustomOrder) {
      filtered.sort((a, b) => {
        const aOrder = a.sortOrder ?? 999999
        const bOrder = b.sortOrder ?? 999999
        return aOrder - bOrder
      })
    } else {
      filtered.sort((a, b) => {
        switch (currentSortOption) {
          case "alphabetical":
            return a.name.localeCompare(b.name)
          case "consensus":
            const aVotes = Object.values(a.userVotes || {})
            const bVotes = Object.values(b.userVotes || {})
            const aYesVotes = aVotes.filter((v) => v === "yes").length
            const bYesVotes = bVotes.filter((v) => v === "yes").length
            const aVoteCount = aVotes.length
            const bVoteCount = bVotes.length

            const aRatio = aVoteCount > 0 ? aYesVotes / aVoteCount : 0
            const bRatio = bVoteCount > 0 ? bYesVotes / bVoteCount : 0

            if (aRatio !== bRatio) {
              return bRatio - aRatio
            }
            return bVoteCount - aVoteCount
          case "status":
            const aStatus = a.statuses?.[0]?.name || "zzz"
            const bStatus = b.statuses?.[0]?.name || "zzz"
            return aStatus.localeCompare(bStatus)
          case "dateAdded":
            const aDate = a.dateAdded || 0
            const bDate = b.dateAdded || 0
            return bDate - aDate
          case "age":
            const aAge = Number.parseInt(a.age || "999")
            const bAge = Number.parseInt(b.age || "999")
            return aAge - bAge
          case "notes":
            const aNotes = a.notes?.length || 0
            const bNotes = b.notes?.length || 0
            return bNotes - aNotes
          default:
            return 0
        }
      })
    }

    // For Approval list, sort cast/greenlit actors to the top
    if (activeTabKey === "approval") {
      filtered.sort((a, b) => {
        if (a.isCast && !b.isCast) return -1
        if (!a.isCast && b.isCast) return 1
        if (a.isGreenlit && !b.isGreenlit) return -1
        if (!a.isGreenlit && b.isGreenlit) return 1
        return 0
      })
    }

    // Move soft rejected to end for long list
    if (activeTabKey === "longList") {
      filtered.sort((a, b) => {
        if (a.isSoftRejected === b.isSoftRejected) return 0
        return a.isSoftRejected ? 1 : -1
      })
    }

    return filtered
  }

  // Enhanced validation for actor movement
  const validateActorMovement = (
    actorIds: string[],
    destinationKey: string,
  ): { valid: boolean; warnings: string[] } => {
    const warnings: string[] = []
    const valid = true

    const actorsToMove = getSelectedActors(actorIds)

    if (destinationKey === "approval") {
      const actorsWithoutVotes = actorsToMove.filter(
        (actor) => !actor.userVotes || Object.keys(actor.userVotes).length === 0,
      )

      if (actorsWithoutVotes.length > 0) {
        warnings.push(`${actorsWithoutVotes.length} actor(s) have no votes yet. Consider getting team input first.`)
      }

      const actorsFromLongList = actorsToMove.filter((actor) => actor.currentListKey === "longList")
      if (actorsFromLongList.length > 0) {
        warnings.push(
          `${actorsFromLongList.length} actor(s) are moving directly from Long List to Approval. This skips the audition stage.`,
        )
      }
    }

    if (destinationKey === "longList") {
      const actorsFromApproval = actorsToMove.filter((actor) => actor.currentListKey === "approval")
      if (actorsFromApproval.length > 0) {
        warnings.push(
          `${actorsFromApproval.length} actor(s) are moving back from Approval. Their voting history will be preserved.`,
        )
      }

      const greenlitActors = actorsToMove.filter((actor) => actor.isGreenlit || actor.isCast)
      if (greenlitActors.length > 0) {
        warnings.push(
          `${greenlitActors.length} greenlit/cast actor(s) are being moved back to Long List. This will reset their cast status.`,
        )
      }
    }

    return { valid, warnings }
  }

  // Get selected actors from IDs
  const getSelectedActors = (actorIds: string[]): Actor[] => {
    const allActors: Actor[] = []

    for (const listKey of ["longList", "audition", "approval"]) {
      const list = character.actors[listKey as keyof typeof character.actors] as Actor[]
      if (Array.isArray(list)) {
        allActors.push(...list.filter((a) => actorIds.includes(a.id)))
      }
    }

    for (const shortlist of character.actors.shortLists) {
      allActors.push(...shortlist.actors.filter((a) => actorIds.includes(a.id)))
    }

    for (const [key, actors] of Object.entries(character.actors)) {
      if (!["longList", "audition", "approval", "shortLists"].includes(key) && Array.isArray(actors)) {
        allActors.push(...(actors as Actor[]).filter((a) => actorIds.includes(a.id)))
      }
    }

    return allActors
  }

  // Selection handlers
  const handleActorSelect = useCallback(
    (actorId: string, e: React.MouseEvent) => {
      e.preventDefault()

      const actors = filterAndSortActors(getActorsForTab())

      if (e.shiftKey && lastSelectedId) {
        const currentIndex = actors.findIndex((a) => a.id === actorId)
        const lastIndex = actors.findIndex((a) => a.id === lastSelectedId)

        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex)
          const end = Math.max(currentIndex, lastIndex)

          const newSelection = new Set(selectedActorIds)
          for (let i = start; i <= end; i++) {
            newSelection.add(actors[i].id)
          }

          setSelectedActorIds(newSelection)
          setLastSelectedId(actorId)
        }
      } else if (e.ctrlKey || e.metaKey) {
        const newSelection = new Set(selectedActorIds)
        if (newSelection.has(actorId)) {
          newSelection.delete(actorId)
        } else {
          newSelection.add(actorId)
        }

        setSelectedActorIds(newSelection)
        setLastSelectedId(actorId)
      } else {
        setSelectedActorIds(new Set([actorId]))
        setLastSelectedId(actorId)
      }
    },
    [lastSelectedId, selectedActorIds, activeTabKey, character.id],
  )

  // Enhanced drag and drop handlers with better state management
  const handleDragStart = useCallback(
    (e: React.DragEvent, actor: Actor) => {
      console.log("🎯 ActorGrid: Drag start for actor:", actor.name)

      if (hasImageFiles(e.dataTransfer)) {
        console.log("🚫 ActorGrid: Image files detected, aborting actor drag")
        return
      }

      // Ensure actor is selected
      if (!selectedActorIds.has(actor.id)) {
        setSelectedActorIds(new Set([actor.id]))
        setLastSelectedId(actor.id)
      }

      // Update drag state
      const selectedIds = Array.from(selectedActorIds.has(actor.id) ? selectedActorIds : new Set([actor.id]))
      const isMultiDrag = selectedIds.length > 1

      setDraggedActor(actor)
      setDraggedActorIds(new Set(selectedIds))
      setIsMultiDragging(isMultiDrag)

      // Update ref state for tracking
      dragStateRef.current = {
        isDragging: true,
        draggedActorId: actor.id,
        draggedActorIds: new Set(selectedIds),
      }

      e.dataTransfer.effectAllowed = "move"

      const actorDataId = `actor-${actor.id}`
      e.dataTransfer.setData("text/plain", actorDataId)

      let sourceLocation: any = null

      if (activeTabKey === "shortLists") {
        for (const shortlist of character.actors.shortLists) {
          if (shortlist.actors.some((a) => a.id === actor.id)) {
            sourceLocation = { type: "shortlist", shortlistId: shortlist.id }
            break
          }
        }
      } else if (["longList", "audition", "approval"].includes(activeTabKey)) {
        sourceLocation = { type: "standard", key: activeTabKey }
      } else {
        sourceLocation = { type: "custom", key: activeTabKey }
      }

      const dragData = {
        sourceTabKey: activeTabKey,
        sourceLocation,
        actorName: actor.name,
        actorId: actor.id,
        selectedActorIds: selectedIds,
        isMultiDrag,
        dragType: "actor",
      }

      e.dataTransfer.setData("application/json", JSON.stringify(dragData))

      if (isMultiDrag) {
        const dragPreview = document.createElement("div")
        dragPreview.className = "bg-white rounded-xl shadow-2xl p-4 border-2 border-emerald-500 backdrop-blur-sm"
        dragPreview.innerHTML = `
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div>
            <div class="font-bold text-emerald-700 text-lg">${selectedIds.length} actors selected</div>
            <div class="text-sm text-emerald-600">Ready to move</div>
          </div>
        </div>
      `
        dragPreview.style.position = "absolute"
        dragPreview.style.top = "-1000px"
        dragPreview.style.opacity = "0.95"
        dragPreview.style.transform = "scale(1.05)"
        document.body.appendChild(dragPreview)

        e.dataTransfer.setDragImage(dragPreview, 100, 40)

        setTimeout(() => {
          if (document.body.contains(dragPreview)) {
            document.body.removeChild(dragPreview)
          }
        }, 0)
      }

      console.log("✅ ActorGrid: Drag start completed")
    },
    [activeTabKey, character.actors.shortLists, selectedActorIds],
  )

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      console.log("🏁 ActorGrid: Drag end triggered")

      // Schedule cleanup with a small delay to ensure drop handlers complete first
      scheduleDragCleanup(50)
    },
    [scheduleDragCleanup],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetActor: Actor) => {
      if (hasImageFiles(e.dataTransfer)) {
        return
      }

      if (!draggedActor || draggedActor.id === targetActor.id) return

      e.preventDefault()
      e.dataTransfer.dropEffect = "move"

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      const position = e.clientY < midpoint ? "before" : "after"

      setDropTarget(targetActor.id)

      // Store position for visual feedback (if needed in future)
      console.log(`[v0] Drag over ${targetActor.name}, position: ${position}`)
    },
    [draggedActor],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, targetActor: Actor) => {
      console.log("💧 ActorGrid: Drop on actor:", targetActor.name)

      e.preventDefault()

      if (hasImageFiles(e.dataTransfer)) {
        console.log("🚫 ActorGrid: Image files detected, aborting actor drop")
        scheduleDragCleanup(0)
        return
      }

      if (!draggedActor || !dropTarget || draggedActor.id === targetActor.id) {
        console.log("🚫 ActorGrid: Invalid drop conditions")
        scheduleDragCleanup(0)
        return
      }

      const draggedActorData = e.dataTransfer.getData("application/json")
      let sourceInfo
      try {
        sourceInfo = JSON.parse(draggedActorData)
      } catch {
        console.log("🚫 ActorGrid: Failed to parse drag data")
        scheduleDragCleanup(0)
        return
      }

      if (sourceInfo.sourceTabKey === activeTabKey) {
        let listType: "standard" | "shortlist" | "custom" = "standard"
        let listKey = activeTabKey
        let shortlistId: string | undefined

        if (activeTabKey === "shortLists") {
          listType = "shortlist"
          for (const shortlist of character.actors.shortLists) {
            const hasDragged = shortlist.actors.some((a) => a.id === draggedActor.id)
            const hasTarget = shortlist.actors.some((a) => a.id === targetActor.id)
            if (hasDragged && hasTarget) {
              shortlistId = shortlist.id
              listKey = "shortLists"
              break
            }
          }

          if (!shortlistId) {
            console.log("🚫 ActorGrid: Shortlist not found")
            scheduleDragCleanup(0)
            return
          }
        } else if (!["longList", "audition", "approval"].includes(activeTabKey)) {
          listType = "custom"
        }

        if (sourceInfo.isMultiDrag && sourceInfo.selectedActorIds) {
          dispatch({
            type: "REORDER_MULTIPLE_ACTORS",
            payload: {
              characterId: character.id,
              listType,
              listKey,
              shortlistId,
              actorIds: sourceInfo.selectedActorIds,
              targetActorId: targetActor.id,
              insertPosition: "after", // Assuming "after" as default for simplicity
            },
          })
        } else {
          dispatch({
            type: "REORDER_ACTORS",
            payload: {
              characterId: character.id,
              listType,
              listKey,
              shortlistId,
              draggedActorId: draggedActor.id,
              targetActorId: targetActor.id,
              insertPosition: "after", // Assuming "after" as default for simplicity
            },
          })
        }

        if (currentSortOption !== "custom") {
          dispatch({
            type: "SET_SORT_OPTION",
            payload: "custom",
          })
        }

        console.log("✅ ActorGrid: Reorder completed")
      }

      // Clean up immediately after successful drop
      scheduleDragCleanup(0)
    },
    [
      draggedActor,
      dropTarget,
      activeTabKey,
      character.id,
      character.actors.shortLists,
      dispatch,
      currentSortOption,
      scheduleDragCleanup,
    ],
  )

  // Handle dropping on empty grid area
  const handleGridDragOver = useCallback(
    (e: React.DragEvent) => {
      if (hasImageFiles(e.dataTransfer)) {
        return
      }

      if (!hasActorData(e.dataTransfer)) {
        return
      }

      e.preventDefault()
      setIsDragOverGrid(true)
    },
    [activeTabKey],
  )

  const handleGridDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!isDragOverGrid) {
        return
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setIsDragOverGrid(false)
      }
    },
    [isDragOverGrid],
  )

  const handleGridDrop = useCallback(
    (e: React.DragEvent) => {
      console.log("💧 ActorGrid: Grid drop triggered")

      e.preventDefault()
      e.stopPropagation()
      setIsDragOverGrid(false)

      if (hasImageFiles(e.dataTransfer)) {
        console.log("🚫 ActorGrid: Image files detected, aborting grid drop")
        scheduleDragCleanup(0)
        return
      }

      if (!hasActorData(e.dataTransfer)) {
        console.log("🚫 ActorGrid: No actor data detected")
        scheduleDragCleanup(0)
        return
      }

      const draggedActorData = e.dataTransfer.getData("application/json")
      const draggedActorId = e.dataTransfer.getData("text/plain")

      if (!draggedActorData || !draggedActorId) {
        console.log("🚫 ActorGrid: Missing drag data")
        scheduleDragCleanup(0)
        return
      }

      const actualActorId = draggedActorId.startsWith("actor-") ? draggedActorId.replace("actor-", "") : draggedActorId

      let sourceInfo
      try {
        sourceInfo = JSON.parse(draggedActorData)
      } catch (error) {
        console.log("🚫 ActorGrid: Failed to parse drag data")
        scheduleDragCleanup(0)
        return
      }

      if (sourceInfo.sourceTabKey === activeTabKey) {
        console.log("🔄 ActorGrid: Same tab drop, cleaning up")
        scheduleDragCleanup(0)
        return
      }

      const actorIds = sourceInfo.selectedActorIds || [actualActorId]
      const validation = validateActorMovement(actorIds, activeTabKey)

      if (validation.warnings.length > 0) {
        const warningMessage = validation.warnings.join("\n")
        if (!confirm(`Warning:\n\n${warningMessage}\n\nDo you want to continue with the move?`)) {
          scheduleDragCleanup(0)
          return
        }
      }

      let destinationType: "standard" | "shortlist" | "custom" = "standard"
      const destinationKey = activeTabKey
      let destinationShortlistId: string | undefined

      if (activeTabKey === "shortLists") {
        destinationType = "shortlist"
        if (character.actors.shortLists.length > 0) {
          destinationShortlistId = character.actors.shortLists[0].id
        }
      } else if (["longList", "approval"].includes(activeTabKey)) {
        destinationType = "standard"
      } else if (!["audition"].includes(activeTabKey)) {
        destinationType = "custom"
      }

      const movePayload = {
        actorIds: sourceInfo.selectedActorIds || [actualActorId],
        characterId: character.id,
        sourceLocation: sourceInfo.sourceLocation,
        destinationType,
        destinationKey,
        destinationShortlistId,
        moveReason: activeTabKey === "longList" ? "reset" : activeTabKey === "approval" ? "final_review" : "standard",
      }

      if (sourceInfo.isMultiDrag && sourceInfo.selectedActorIds && sourceInfo.selectedActorIds.length > 0) {
        dispatch({
          type: "MOVE_MULTIPLE_ACTORS",
          payload: movePayload,
        })
      } else {
        dispatch({
          type: "MOVE_ACTOR",
          payload: {
            actorId: actualActorId,
            characterId: character.id,
            sourceLocation: sourceInfo.sourceLocation,
            destinationType,
            destinationKey,
            destinationShortlistId,
            moveReason: movePayload.moveReason,
          },
        })
      }

      // Clear selection after successful move
      setSelectedActorIds(new Set())
      setLastSelectedId(null)

      const actorCount = sourceInfo.isMultiDrag ? sourceInfo.selectedActorIds.length : 1
      const actorText = actorCount > 1 ? `${actorCount} actors` : sourceInfo.actorName

      let notificationMessage = `${actorText} moved to ${activeTabKey}`
      let notificationTitle = "Actor Moved Successfully"
      let notificationPriority: "low" | "medium" | "high" = "low"

      if (activeTabKey === "approval") {
        notificationMessage = `${actorText} moved to Approval for final review and casting decisions`
        notificationTitle = "Moved to Approval"
        notificationPriority = "medium"
      } else if (activeTabKey === "longList") {
        notificationMessage = `${actorText} moved to Long List. Status and progress have been reset for fresh evaluation.`
        notificationTitle = "Moved to Long List"
        notificationPriority = "low"
      }

      const notification = {
        id: `drag-success-${Date.now()}`,
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

      console.log("✅ ActorGrid: Grid drop completed successfully")

      // Clean up immediately after successful drop
      scheduleDragCleanup(0)
    },
    [activeTabKey, character.actors.shortLists, character.id, dispatch, scheduleDragCleanup],
  )

  // Handle opening modals
  const handleMoveToList = useCallback(() => {
    if (selectedActorIds.size === 0) return

    openModal("moveMultipleActors", {
      actorIds: Array.from(selectedActorIds),
      characterId: character.id,
    })
  }, [selectedActorIds, character.id])

  const handleContactActors = useCallback(() => {
    if (selectedActorIds.size === 0) return

    openModal("contactActor", {
      actorIds: Array.from(selectedActorIds),
      characterId: character.id,
    })
  }, [selectedActorIds, character.id])

  // Quick move functions
  const handleQuickMoveToLongList = useCallback(() => {
    if (selectedActorIds.size === 0) return

    const actorIds = Array.from(selectedActorIds)
    const validation = validateActorMovement(actorIds, "longList")

    if (validation.warnings.length > 0) {
      const warningMessage = validation.warnings.join("\n")
      if (!confirm(`Warning:\n\n${warningMessage}\n\nDo you want to continue moving to Long List?`)) {
        return
      }
    }

    const selectedActors = getSelectedActors(actorIds)
    let sourceLocation: any = null

    if (selectedActors.length > 0) {
      const firstActor = selectedActors[0]
      if (activeTabKey === "shortLists") {
        for (const shortlist of character.actors.shortLists) {
          if (shortlist.actors.some((a) => a.id === firstActor.id)) {
            sourceLocation = { type: "shortlist", shortlistId: shortlist.id }
            break
          }
        }
      } else if (["longList", "audition", "approval"].includes(activeTabKey)) {
        sourceLocation = { type: "standard", key: activeTabKey }
      } else {
        sourceLocation = { type: "custom", key: activeTabKey }
      }
    }

    dispatch({
      type: "MOVE_MULTIPLE_ACTORS",
      payload: {
        actorIds,
        characterId: character.id,
        sourceLocation,
        destinationType: "standard",
        destinationKey: "longList",
        moveReason: "reset",
      },
    })

    clearSelection()

    const notification = {
      id: `quick-move-longlist-${Date.now()}`,
      type: "system" as const,
      title: "Moved to Long List",
      message: `${actorIds.length} actor${actorIds.length > 1 ? "s" : ""} moved to Long List for fresh evaluation`,
      timestamp: Date.now(),
      read: false,
      priority: "low" as const,
    }

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: notification,
    })
  }, [selectedActorIds, character.id, activeTabKey, character.actors.shortLists, dispatch, clearSelection])

  const handleQuickMoveToApproval = useCallback(() => {
    if (selectedActorIds.size === 0) return

    const actorIds = Array.from(selectedActorIds)
    const validation = validateActorMovement(actorIds, "approval")

    if (validation.warnings.length > 0) {
      const warningMessage = validation.warnings.join("\n")
      if (!confirm(`Warning:\n\n${warningMessage}\n\nDo you want to continue moving to Approval?`)) {
        return
      }
    }

    const selectedActors = getSelectedActors(actorIds)
    let sourceLocation: any = null

    if (selectedActors.length > 0) {
      const firstActor = selectedActors[0]
      if (activeTabKey === "shortLists") {
        for (const shortlist of character.actors.shortLists) {
          if (shortlist.actors.some((a) => a.id === firstActor.id)) {
            sourceLocation = { type: "shortlist", shortlistId: shortlist.id }
            break
          }
        }
      } else if (["longList", "audition", "approval"].includes(activeTabKey)) {
        sourceLocation = { type: "standard", key: activeTabKey }
      } else {
        sourceLocation = { type: "custom", key: activeTabKey }
      }
    }

    dispatch({
      type: "MOVE_MULTIPLE_ACTORS",
      payload: {
        actorIds,
        characterId: character.id,
        sourceLocation,
        destinationType: "standard",
        destinationKey: "approval",
        moveReason: "final_review",
      },
    })

    clearSelection()

    const notification = {
      id: `quick-move-approval-${Date.now()}`,
      type: "system" as const,
      title: "Moved to Approval",
      message: `${actorIds.length} actor${actorIds.length > 1 ? "s" : ""} moved to Approval for final review and casting decisions`,
      timestamp: Date.now(),
      read: false,
      priority: "medium" as const,
    }

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: notification,
    })
  }, [selectedActorIds, character.id, activeTabKey, character.actors.shortLists, dispatch, clearSelection])

  // Add this function after the existing handlers
  const handleGridClick = useCallback((e: React.MouseEvent) => {
    // Only clear selection if clicking directly on the grid background, not on actor cards
    if (e.target === e.currentTarget) {
      setSelectedActorIds(new Set())
      setLastSelectedId(null)
    }
  }, [])

  const actors = filterAndSortActors(getActorsForTab())

  // Special messages for Long List and Approval tabs
  const isLongListTab = activeTabKey === "longList"
  const isApprovalTab = activeTabKey === "approval"

  const longListMessage = isLongListTab
    ? "Starting point for actor evaluation - all actors begin their journey here"
    : null
  const approvalMessage = isApprovalTab ? "Final approval stage - actors here are ready for casting decisions" : null

  const getGridClasses = () => {
    switch (cardDisplayMode) {
      case "row":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full" // Added row view grid layout
      case "list-view":
        return "flex flex-col gap-4 w-full" // Vertical stack with consistent gaps
      case "simple":
        return "grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 w-full justify-items-start" // Auto-fit grid with minimum card width
      default: // detailed view
        return "grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4 w-full justify-items-start" // Auto-fit grid with 350px minimum
    }
  }

  const MiniatureActorCard = ({ actor }: { actor: Actor }) => {
    const [imageError, setImageError] = useState(false)
    const actorImage = actor.headshots && actor.headshots.length > 0 ? actor.headshots[0] : null

    const statusColor =
      actor.consensusAction?.type === "yes"
        ? "text-green-600"
        : actor.consensusAction?.type === "no"
          ? "text-red-600"
          : actor.consensusAction?.type === "stay"
            ? "text-blue-600"
            : "text-slate-400"
    const statusText =
      actor.consensusAction?.type === "yes"
        ? "Yes"
        : actor.consensusAction?.type === "no"
          ? "No"
          : actor.consensusAction?.type === "stay"
            ? "Maybe"
            : "Unvoted"

    const voteCount = actor.userVotes ? Object.keys(actor.userVotes).length : 0
    const totalUsers = state.users.length

    return (
      <div
        className={`relative bg-white rounded-lg border-2 transition-all duration-200 overflow-hidden cursor-pointer ${
          selectedActorIds.has(actor.id)
            ? "border-emerald-500 shadow-lg ring-2 ring-emerald-200"
            : "border-slate-200 hover:border-emerald-300 hover:shadow-md"
        }`}
        onClick={(e) => handleActorSelect(actor.id, e)}
      >
        <div
          className="absolute top-2 left-2 z-10 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            const syntheticEvent = {
              ...e,
              ctrlKey: true, // Force independent toggle
              preventDefault: () => e.preventDefault(),
              stopPropagation: () => e.stopPropagation(),
            } as React.MouseEvent
            handleActorSelect(actor.id, syntheticEvent)
          }}
        >
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all duration-200 backdrop-blur-sm ${
              selectedActorIds.has(actor.id)
                ? "bg-emerald-500 border-emerald-600 shadow-lg scale-110"
                : "bg-white/95 border-slate-400 hover:border-emerald-500 hover:bg-emerald-50 hover:scale-110 shadow-md"
            }`}
          >
            {selectedActorIds.has(actor.id) && <Check className="w-3 h-3 text-white stroke-[3]" />}
          </div>
        </div>
        {/* </CHANGE> */}

        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            {actorImage && !imageError ? (
              <img
                src={actorImage}
                alt={actor.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold bg-gradient-to-br from-slate-100 to-slate-200">
                {actor.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-sm">{actor.name}</h3>

            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              {actor.age && <span>{actor.age} yrs</span>}
              {actor.age && actor.gender && <span>•</span>}
              {actor.gender && <span>{actor.gender}</span>}
            </div>

            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
              {voteCount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">
                    {voteCount}/{totalUsers} votes
                  </span>
                </>
              )}
            </div>

            {/* Contact Info */}
            {(actor.contactEmail || actor.contactPhone) && (
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                {actor.contactEmail && (
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{actor.contactEmail}</span>
                  </div>
                )}
                {actor.contactPhone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    <span>{actor.contactPhone}</span>
                  </div>
                )}
              </div>
            )}

            {actor.location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{actor.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none mx-auto px-4 space-y-6">
      {selectedActorIds.size > 0 ? (
        <div className="bg-gradient-to-r from-emerald-50 via-emerald-100 to-emerald-50 border-2 border-emerald-400 rounded-xl p-4 shadow-lg animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-emerald-600 shadow-md">
                  {selectedActorIds.size}
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-800">
                  {selectedActorIds.size} Actor{selectedActorIds.size > 1 ? "s" : ""} Selected
                </div>
                <div className="text-xs text-emerald-600 hidden sm:block">Shift+Click for range • Escape to clear</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  dispatch({
                    type: "OPEN_MODAL",
                    payload: {
                      type: "bookAudition",
                      data: {
                        selectedCharacters: character ? [character.id] : [],
                        preselectedActors: Array.from(selectedActorIds),
                      },
                    },
                  })
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Audition</span>
              </button>

              <button
                onClick={handleMoveToList}
                className="flex items-center space-x-2 px-3 py-2.5 bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 rounded-lg font-medium transition-all duration-200 shadow-sm text-sm"
              >
                <ArrowRightCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Move</span>
              </button>

              <button
                onClick={handleContactActors}
                className="flex items-center space-x-2 px-3 py-2.5 bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 rounded-lg font-medium transition-all duration-200 shadow-sm text-sm"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Contact</span>
              </button>

              <button
                onClick={() => {
                  clearSelection()
                }}
                className="px-3 py-2.5 bg-white border-2 border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 rounded-lg font-semibold transition-all duration-200 shadow-sm text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Original Starting Point message - shown when no actors are selected
        longListMessage && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
            <List className="w-5 h-5 text-blue-600" />
            <div className="text-sm text-blue-700 font-medium">{longListMessage}</div>
          </div>
        )
      )}

      {approvalMessage && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
          <Crown className="w-5 h-5 text-emerald-600" />
          <div className="text-sm text-emerald-700 font-medium">{approvalMessage}</div>
        </div>
      )}

      {/* Actor Grid */}
      <div
        className={`${getGridClasses()} ${
          isDragOverGrid
            ? isApprovalTab
              ? "bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 rounded-2xl p-6 border-2 border-emerald-300 shadow-xl"
              : isLongListTab
                ? "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 rounded-2xl p-6 border-2 border-blue-300 shadow-xl"
                : "bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg"
            : ""
        }`}
        onDragOver={handleGridDragOver}
        onDragLeave={handleGridDragLeave}
        onDrop={handleGridDrop}
        onClick={handleGridClick}
      >
        {actors.map((actor) => {
          if (cardDisplayMode === "row") {
            return (
              <div
                key={actor.id}
                className={`relative transition-all duration-200 ${
                  draggedActorIds.has(actor.id)
                    ? "opacity-50 transform scale-95 ring-2 ring-emerald-400 ring-opacity-50"
                    : ""
                } ${dropTarget === actor.id ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, actor)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, actor)}
                onDrop={(e) => handleDrop(e, actor)}
              >
                <MiniatureActorCard actor={actor} />
              </div>
            )
          }

          // Existing card rendering for other views
          return (
            <div
              key={actor.id}
              className={`relative transition-all duration-200 ${
                dropTarget === actor.id ? "border-b-4 border-emerald-500 pb-2" : ""
              } ${
                draggedActorIds.has(actor.id)
                  ? "opacity-50 transform scale-95 ring-2 ring-emerald-400 ring-opacity-50"
                  : ""
              } ${dropTarget === actor.id ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, actor)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, actor)}
              onDrop={(e) => handleDrop(e, actor)}
            >
              <ActorCard
                actor={actor}
                character={character}
                isSelected={selectedActorIds.has(actor.id)}
                onSelect={handleActorSelect}
                viewMode={cardDisplayMode}
                isDragging={draggedActorIds.has(actor.id)}
                isDropTarget={dropTarget === actor.id}
                dropPosition={dropTarget === actor.id ? "after" : null}
                onDragStart={(e) => handleDragStart(e, actor)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, actor)}
                onDrop={(e) => handleDrop(e, actor)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
