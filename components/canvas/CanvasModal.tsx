"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCcw, Save, Eye, EyeOff, Search, Users, Trash2, Maximize2, ChevronLeft, ChevronRight, Layout, Fullscreen, Grid3x3, List, SortAsc, SortDesc, Calendar, Hash, CheckCircle, Heart, Star, XIcon, Plus, Filter, ChevronDown } from 'lucide-react'
import { useCasting } from "@/components/casting/CastingContext"
import CanvasActorCard from "./CanvasActorCard"
import CanvasContextMenu from "./CanvasContextMenu"
import CanvasGroup from "./CanvasGroup"
import CreateGroupModal from "./CreateGroupModal"
import CanvasChatbot from "./CanvasChatbot"
import { openModal, closeAllModals } from "../modals/ModalManager"

// Helper to sanitize placeholder.svg URLs from loaded data
function sanitizeUrl(url?: string): string {
  if (!url || url.includes("placeholder.svg")) return ""
  return url
}

function sanitizeCanvasActors(actors: any[]): any[] {
  return actors.map((actor) => ({
    ...actor,
    actor: actor.actor ? {
      ...actor.actor,
      headshots: actor.actor.headshots?.map(sanitizeUrl).filter(Boolean) || [],
      photo: sanitizeUrl(actor.actor.photo),
    } : actor.actor,
  }))
}

interface CanvasActor {
  id: string
  actorId: string
  x: number
  y: number
  characterName: string
  actor: any
  groupId?: string
}

interface CanvasGroupProps {
  id: string
  name: string
  color: string
  actorIds: string[]
  x: number
  y: number
  width: number
  height: number
}

interface ContextMenu {
  x: number
  y: number
  actorId: string
  isVisible: boolean
}

interface CanvasModalProps {
  onClose: () => void
}

export default function CanvasModal({ onClose }: CanvasModalProps) {
  const { state, dispatch } = useCasting() // Added dispatch here
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [canvasActors, setCanvasActors] = useState<CanvasActor[]>([])
  const [canvasGroups, setCanvasGroups] = useState<CanvasGroupProps[]>([])
  const [selectedActorIds, setSelectedActorIds] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    x: 0,
    y: 0,
    actorId: "",
    isVisible: false,
  })
  const [showActorNames, setShowActorNames] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [databaseSearchQuery, setDatabaseSearchQuery] = useState("") // Separate search query for database overlay
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isZooming, setIsZooming] = useState(false)
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [savedCanvases, setSavedCanvases] = useState<Array<{ id: string; title: string; timestamp: string }>>([])

  const [actorCardView, setActorCardView] = useState<"standard" | "compact" | "minimal" | "voting">("standard") // Added "voting" view mode
  const [groupSortOption, setGroupSortOption] = useState<"name" | "date" | "actorCount">("name")
  const [groupSortDirection, setGroupSortDirection] = useState<"asc" | "desc">("asc")

  // State for group transfer context menu
  const [groupTransferMenu, setGroupTransferMenu] = useState<{
    show: boolean
    x: number
    y: number
    groupId: string
    actorIds: string[]
  } | null>(null)

  const [showDatabaseOverlay, setShowDatabaseOverlay] = useState(false)
  
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([])
  
  const [canvasFilters, setCanvasFilters] = useState({
    status: [] as string[],
    ageRange: { min: 0, max: 100 },
    location: [] as string[],
  })
  
  // Database overlay has its own independent filters
  const [databaseFilters, setDatabaseFilters] = useState({
    status: [] as string[],
    ageRange: { min: 0, max: 100 },
    location: [] as string[],
  })
  const [showDatabaseFilters, setShowDatabaseFilters] = useState(false)

  // Get all actors from current project
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  
  const allProjectActors = currentProject?.characters.flatMap((char) => {
    const actors: any[] = []

    // Get actors from all lists
    state.tabDefinitions.forEach((tabDef) => {
      if (tabDef.key === "shortLists") {
        char.actors.shortLists.forEach((sl) => {
          actors.push(...sl.actors.map((actor) => ({ ...actor, sourceCharacter: char.name, sourceCharacterId: char.id })))
        })
      } else {
        const listActors = char.actors[tabDef.key] || []
        actors.push(...listActors.map((actor: any) => ({ ...actor, sourceCharacter: char.name, sourceCharacterId: char.id })))
      }
    })

    return actors
  }) || []
  
  const filteredCharacters = currentProject?.characters.filter(char => 
    selectedCharacterIds.length === 0 || selectedCharacterIds.includes(char.id)
  ) || []
  
  const allActors =
    filteredCharacters.flatMap((char) => {
      const actors: any[] = []

      // Get actors from all lists
      state.tabDefinitions.forEach((tabDef) => {
        if (tabDef.key === "shortLists") {
          char.actors.shortLists.forEach((sl) => {
            actors.push(...sl.actors.map((actor) => ({ ...actor, sourceCharacter: char.name, sourceCharacterId: char.id })))
          })
        } else {
          const listActors = char.actors[tabDef.key] || []
          actors.push(...listActors.map((actor: any) => ({ ...actor, sourceCharacter: char.name, sourceCharacterId: char.id })))
        }
      })

      return actors
    }) || []

  // Remove duplicates based on actor ID
  const uniqueActors = allActors.filter((actor, index, self) => index === self.findIndex((a) => a.id === actor.id))
  
  const uniqueDatabaseActors = allProjectActors.filter((actor, index, self) => index === self.findIndex((a) => a.id === actor.id))

  const applyFilters = (actors: any[], filters: typeof canvasFilters) => {
    return actors.filter(actor => {
      // Status filter
      if (filters.status.length > 0) {
        const hasMatchingStatus = actor.statuses?.some((status: any) => 
          filters.status.includes(status.id)
        )
        if (!hasMatchingStatus) return false
      }

      // Age range filter
      if (actor.age) {
        const actorAge = parseInt(actor.age)
        if (!isNaN(actorAge)) {
          if (actorAge < filters.ageRange.min || actorAge > filters.ageRange.max) {
            return false
          }
        }
      }

      // Location filter
      if (filters.location.length > 0) {
        if (!actor.location || !filters.location.includes(actor.location.trim())) {
          return false
        }
      }

      return true
    })
  }

  const getDatabaseLocations = (): string[] => {
    const locations = new Set<string>()
    uniqueDatabaseActors.forEach((actor) => {
      if (actor.location && actor.location.trim()) {
        locations.add(actor.location.trim())
      }
    })
    return Array.from(locations).sort()
  }

  const getUniqueLocations = (): string[] => {
    const locations = new Set<string>()
    uniqueActors.forEach((actor) => {
      if (actor.location && actor.location.trim()) {
        locations.add(actor.location.trim())
      }
    })
    return Array.from(locations).sort()
  }

  const uniqueLocations = getUniqueLocations()
  const databaseLocations = getDatabaseLocations()

  const activeFiltersCount = 
    (canvasFilters.status.length > 0 ? 1 : 0) +
    (canvasFilters.ageRange.min > 0 || canvasFilters.ageRange.max < 100 ? 1 : 0) +
    (canvasFilters.location.length > 0 ? 1 : 0)
  
  const activeDatabaseFiltersCount = 
    (databaseFilters.status.length > 0 ? 1 : 0) +
    (databaseFilters.ageRange.min > 0 || databaseFilters.ageRange.max < 100 ? 1 : 0) +
    (databaseFilters.location.length > 0 ? 1 : 0)

  const filteredActors = applyFilters(uniqueActors.filter(
    (actor) =>
      actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actor.sourceCharacter.toLowerCase().includes(searchQuery.toLowerCase())
  ), canvasFilters)
  
  const filteredDatabaseActors = applyFilters(uniqueDatabaseActors.filter(
    (actor) =>
      actor.name.toLowerCase().includes(databaseSearchQuery.toLowerCase()) ||
      actor.sourceCharacter.toLowerCase().includes(databaseSearchQuery.toLowerCase())
  ), databaseFilters)

  // Enhanced wheel handler for cursor-centered zooming
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()

      if (!canvasRef.current) return

      // Get canvas dimensions and position
      const rect = canvasRef.current.getBoundingClientRect()

      // Calculate mouse position relative to the canvas
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Calculate mouse position in canvas coordinates (accounting for current pan and zoom)
      const mouseCanvasX = (mouseX - pan.x) / zoom
      const mouseCanvasY = (mouseY - pan.y) / zoom

      // Determine zoom direction and calculate new zoom level
      // Use adaptive zoom speed based on current zoom level
      const baseZoomSpeed = 0.05
      const adaptiveZoomSpeed = baseZoomSpeed * (zoom < 1 ? 0.5 : zoom > 2 ? 1.5 : 1)

      // Determine if we're zooming in or out
      const isZoomIn = e.deltaY < 0

      // Calculate zoom delta with momentum for smoother zooming
      const zoomDelta = isZoomIn ? adaptiveZoomSpeed : -adaptiveZoomSpeed

      // Calculate new zoom level with limits
      const newZoom = Math.max(0.1, Math.min(5, zoom * (1 + zoomDelta)))

      if (newZoom !== zoom) {
        // Calculate new pan position to keep the mouse point fixed
        // This is the key to cursor-centered zooming
        const newPanX = mouseX - mouseCanvasX * newZoom
        const newPanY = mouseY - mouseCanvasY * newZoom

        // Update state
        setZoom(newZoom)
        setPan({ x: newPanX, y: newPanY })

        // Set zooming flag for animation control
        setIsZooming(true)

        // Clear any existing timeout
        if (zoomTimeoutRef.current) {
          clearTimeout(zoomTimeoutRef.current)
        }

        // Reset zooming flag after a short delay
        zoomTimeoutRef.current = setTimeout(() => {
          setIsZooming(false)
        }, 150)
      }
    },
    [zoom, pan],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Check if the click is on an actor card, group, or UI element
      const target = e.target as HTMLElement
      const isActorCard = target.closest("[data-actor-card]")
      const isGroup = target.closest("[data-canvas-group]")
      const isUIElement = target.closest("button, input, textarea, select, .ui-element")
      const isNavigationControl = target.closest(".image-navigation")
      const isDatabaseOverlay = target.closest(".database-overlay") // Check if click is inside database overlay

      // Only start canvas dragging if we're not clicking on interactive elements,
      // including the database overlay
      if (!isActorCard && !isGroup && !isUIElement && !isNavigationControl && !isDatabaseOverlay) {
        // Clear selection if clicking on empty canvas
        if (!e.ctrlKey && !e.metaKey) {
          setSelectedActorIds([])
        }
        setIsDragging(true)
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
        e.preventDefault()
      }
    },
    [pan],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Programmatic zoom controls
  const handleZoomIn = () => {
    if (!canvasRef.current) return

    // Get canvas center
    const rect = canvasRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calculate center in canvas coordinates
    const centerCanvasX = (centerX - pan.x) / zoom
    const centerCanvasY = (centerY - pan.y) / zoom

    // Calculate new zoom
    const newZoom = Math.min(5, zoom * 1.2)

    // Calculate new pan to keep center fixed
    const newPanX = centerX - centerCanvasX * newZoom
    const newPanY = centerY - centerCanvasY * newZoom

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  const handleZoomOut = () => {
    if (!canvasRef.current) return

    // Get canvas center
    const rect = canvasRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calculate center in canvas coordinates
    const centerCanvasX = (centerX - pan.x) / zoom
    const centerCanvasY = (centerY - pan.y) / zoom

    // Calculate new zoom
    const newZoom = Math.max(0.1, zoom / 1.2)

    // Calculate new pan to keep center fixed
    const newPanX = centerX - centerCanvasX * newZoom
    const newPanY = centerY - centerCanvasY * newZoom

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Zoom to fit all actors with improved calculation
  const handleZoomToFit = () => {
    if (canvasActors.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()

    // Account for sidebar width in available canvas space
    const sidebarWidth = sidebarCollapsed ? 80 : 320
    const availableWidth = window.innerWidth - sidebarWidth
    const availableHeight = canvasRect.height

    // More accurate card dimensions
    const CARD_WIDTH = 280
    const CARD_HEIGHT = 200 // Approximate height based on content
    const PADDING = 100 // Generous padding around the content

    // Calculate precise bounding box of all actors
    const actorBounds = canvasActors.map((actor) => ({
      left: actor.x,
      top: actor.y,
      right: actor.x + CARD_WIDTH,
      bottom: actor.y + CARD_HEIGHT,
    }))

    const minX = Math.min(...actorBounds.map((b) => b.left))
    const minY = Math.min(...actorBounds.map((b) => b.top))
    const maxX = Math.max(...actorBounds.map((b) => b.right))
    const maxY = Math.max(...actorBounds.map((b) => b.bottom))

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    // Handle edge cases
    if (contentWidth <= 0 || contentHeight <= 0) {
      // Single actor or overlapping actors
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const newZoom = 1
      const newPanX = availableWidth / 2 - centerX * newZoom
      const newPanY = availableHeight / 2 - centerY * newZoom

      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
      return
    }

    // Calculate zoom factors for both dimensions with padding
    const zoomX = (availableWidth - PADDING * 2) / contentWidth
    const zoomY = (availableHeight - PADDING * 2) / contentHeight

    // Use the smaller zoom factor to ensure everything fits
    // Also limit maximum zoom to prevent over-zooming
    const newZoom = Math.min(zoomX, zoomY, 2.0)

    // Ensure minimum zoom level for usability
    const finalZoom = Math.max(newZoom, 0.1)

    // Calculate pan to center the content in the available space
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2

    const newPanX = availableWidth / 2 - contentCenterX * finalZoom
    const newPanY = availableHeight / 2 - contentCenterY * finalZoom

    // Apply zoom and pan with smooth transition
    setZoom(finalZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  // Zoom to fit selected actors
  const handleZoomToSelection = () => {
    if (selectedActorIds.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const selectedActors = canvasActors.filter((actor) => selectedActorIds.includes(actor.id))
    if (selectedActors.length === 0) return

    const canvasRect = canvas.getBoundingClientRect()
    const sidebarWidth = sidebarCollapsed ? 80 : 320
    const availableWidth = window.innerWidth - sidebarWidth
    const availableHeight = canvasRect.height

    const CARD_WIDTH = 280
    const CARD_HEIGHT = 200
    const PADDING = 80 // Slightly less padding for selection zoom

    // Calculate bounding box of selected actors
    const actorBounds = selectedActors.map((actor) => ({
      left: actor.x,
      top: actor.y,
      right: actor.x + CARD_WIDTH,
      bottom: actor.y + CARD_HEIGHT,
    }))

    const minX = Math.min(...actorBounds.map((b) => b.left))
    const minY = Math.min(...actorBounds.map((b) => b.top))
    const maxX = Math.max(...actorBounds.map((b) => b.right))
    const maxY = Math.max(...actorBounds.map((b) => b.bottom))

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    // Handle single actor selection
    if (contentWidth <= 0 || contentHeight <= 0) {
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const newZoom = 1.5 // Zoom in a bit for single actor
      const newPanX = availableWidth / 2 - centerX * newZoom
      const newPanY = availableHeight / 2 - centerY * newZoom

      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
      return
    }

    // Calculate zoom factors
    const zoomX = (availableWidth - PADDING * 2) / contentWidth
    const zoomY = (availableHeight - PADDING * 2) / contentHeight
    const newZoom = Math.min(zoomX, zoomY, 3.0) // Allow higher zoom for selections
    const finalZoom = Math.max(newZoom, 0.2)

    // Center the selection
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2
    const newPanX = availableWidth / 2 - contentCenterX * finalZoom
    const newPanY = availableHeight / 2 - contentCenterY * finalZoom

    setZoom(finalZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const actorId = e.dataTransfer.getData("text/plain")
    const actor = uniqueActors.find((a) => a.id === actorId)

    if (actor && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      const newCanvasActor: CanvasActor = {
        id: `canvas-${Date.now()}-${Math.random()}`,
        actorId: actor.id,
        x,
        y,
        characterName: actor.sourceCharacter || "",
        actor,
      }

      setCanvasActors((prev) => [...prev, newCanvasActor])
    }
  }

  const handleActorSelect = (actorId: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      setSelectedActorIds((prev) => (prev.includes(actorId) ? prev.filter((id) => id !== actorId) : [...prev, actorId]))
    } else {
      setSelectedActorIds([actorId])
    }
  }

  const handleActorDrag = useCallback(
    (canvasActorId: string, deltaX: number, deltaY: number) => {
      // If the dragged actor is selected, move all selected actors
      if (selectedActorIds.includes(canvasActorId)) {
        setCanvasActors((prev) =>
          prev.map((actor) =>
            selectedActorIds.includes(actor.id)
              ? { ...actor, x: actor.x + deltaX / zoom, y: actor.y + deltaY / zoom }
              : actor,
          ),
        )
      } else {
        setCanvasActors((prev) =>
          prev.map((actor) =>
            actor.id === canvasActorId ? { ...actor, x: actor.x + deltaX / zoom, y: actor.y + deltaY / zoom } : actor,
          ),
        )
      }

      // Update groups that contain moved actors
      updateGroupBounds()
    },
    [selectedActorIds, zoom],
  )

  // Handle group dragging
  const handleGroupDrag = useCallback(
    (groupId: string, deltaX: number, deltaY: number) => {
      const group = canvasGroups.find((g) => g.id === groupId)
      if (!group) return

      // Move all actors in the group
      setCanvasActors((prev) =>
        prev.map((actor) =>
          group.actorIds.includes(actor.id)
            ? { ...actor, x: actor.x + deltaX / zoom, y: actor.y + deltaY / zoom }
            : actor,
        ),
      )

      // Update group bounds
      updateGroupBounds()
    },
    [canvasGroups, zoom],
  )

  const handleCharacterNameChange = (canvasActorId: string, newName: string) => {
    setCanvasActors((prev) =>
      prev.map((actor) => (actor.id === canvasActorId ? { ...actor, characterName: newName } : actor)),
    )
  }

  const handleContextMenu = (e: React.MouseEvent, canvasActorId: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      actorId: canvasActorId,
      isVisible: true,
    })
  }

  const handleGroupContextMenu = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const group = canvasGroups.find((g) => g.id === groupId)
    if (!group || group.actorIds.length === 0) return

    // Get all actors in the group
    const groupActors = canvasActors.filter((ca) => group.actorIds.includes(ca.id))
    const actorIds = groupActors.map((ca) => ca.actorId)

    // Show context menu with tab options
    showGroupTransferMenu(e.clientX, e.clientY, groupId, actorIds)
  }

  const showGroupTransferMenu = (x: number, y: number, groupId: string, actorIds: string[]) => {
    setGroupTransferMenu({ show: true, x, y, groupId, actorIds })
  }

  const handleTransferGroupToTab = (tabKey: string) => {
    if (!groupTransferMenu || !currentProject) return

    const { groupId, actorIds } = groupTransferMenu
    const group = canvasGroups.find((g) => g.id === groupId)

    if (!group || actorIds.length === 0) return

    // Determine destination type
    let destinationType: "standard" | "shortlist" | "custom" = "standard"
    let destinationShortlistId: string | undefined

    if (tabKey === "shortLists") {
      destinationType = "shortlist"
      const character = currentProject.characters.find((c) => c.id === state.currentFocus.characterId)
      if (character && character.actors.shortLists.length > 0) {
        destinationShortlistId = character.actors.shortLists[0].id
      }
    } else if (tabKey === "longList" || tabKey === "approval") {
      destinationType = "standard"
    } else {
      destinationType = "custom"
    }

    // Find the character for these actors
    const character = currentProject.characters.find((c) => c.id === state.currentFocus.characterId)

    if (!character) return

    // Dispatch move action for all actors in the group
    dispatch({
      type: "MOVE_MULTIPLE_ACTORS",
      payload: {
        actorIds,
        characterId: character.id,
        sourceLocation: { type: "custom", key: "canvas" },
        destinationType,
        destinationKey: tabKey,
        destinationShortlistId,
        moveReason: "canvas_group_transfer",
      },
    })

    // Show success notification
    const tabName = state.tabDefinitions.find((t) => t.key === tabKey)?.name || tabKey
    const notification = {
      id: `group-transfer-${Date.now()}`,
      type: "system" as const,
      title: "Group Transferred",
      message: `${actorIds.length} actor(s) from "${group.name}" moved to ${tabName}`,
      timestamp: Date.now(),
      read: false,
      priority: "medium" as const,
    }

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: notification,
    })

    setGroupTransferMenu(null)
  }

  const handleRemoveActor = (canvasActorId: string) => {
    setCanvasActors((prev) => prev.filter((actor) => actor.id !== canvasActorId))
    setSelectedActorIds((prev) => prev.filter((id) => id !== canvasActorId))
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
    updateGroupBounds()
  }

  const handleDuplicateActor = (canvasActorId: string) => {
    const actorToDuplicate = canvasActors.find((a) => a.id === canvasActorId)
    if (actorToDuplicate) {
      const newActor: CanvasActor = {
        ...actorToDuplicate,
        id: `canvas-${Date.now()}-${Math.random()}`,
        x: actorToDuplicate.x + 20,
        y: actorToDuplicate.y + 20,
        groupId: undefined, // Don't inherit group membership
      }
      setCanvasActors((prev) => [...prev, newActor])
    }
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
  }

  const handleCreateGroup = (name: string, color: string) => {
    if (selectedActorIds.length === 0) return

    const selectedActors = canvasActors.filter((actor) => selectedActorIds.includes(actor.id))
    const bounds = calculateActorBounds(selectedActors)

    const newGroup: CanvasGroupProps = {
      id: `group-${Date.now()}`,
      name,
      color,
      actorIds: selectedActorIds,
      ...bounds,
    }

    // Update actors to belong to this group
    setCanvasActors((prev) =>
      prev.map((actor) => (selectedActorIds.includes(actor.id) ? { ...actor, groupId: newGroup.id } : actor)),
    )

    setCanvasGroups((prev) => [...prev, newGroup])
    setSelectedActorIds([])
    setShowCreateGroupModal(false)
  }

  const handleDeleteGroup = (groupId: string) => {
    setCanvasGroups((prev) => prev.filter((group) => group.id !== groupId))
    setCanvasActors((prev) =>
      prev.map((actor) => (actor.groupId === groupId ? { ...actor, groupId: undefined } : actor)),
    )
  }

  const handleGroupNameChange = (groupId: string, newName: string) => {
    setCanvasGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, name: newName } : group)))
  }

  const handleAddActorToGroup = (canvasActorId: string, groupId: string) => {
    const actorToAdd = canvasActors.find((a) => a.id === canvasActorId)
    if (!actorToAdd) return

    // Update the actor to belong to the group
    setCanvasActors((prev) => prev.map((actor) => (actor.id === canvasActorId ? { ...actor, groupId } : actor)))

    // Update group bounds to include the new actor
    updateGroupBounds()

    // Close context menu
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
  }

  const handleCreateGroupWithActor = (canvasActorId: string) => {
    setSelectedActorIds([canvasActorId])
    setShowCreateGroupModal(true)
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
  }

  const calculateActorBounds = (actors: CanvasActor[]) => {
    if (actors.length === 0) return { x: 0, y: 0, width: 0, height: 0 }

    const minX = Math.min(...actors.map((a) => a.x))
    const minY = Math.min(...actors.map((a) => a.y))
    const maxX = Math.max(...actors.map((a) => a.x + 280)) // Updated card width
    const maxY = Math.max(...actors.map((a) => a.y + 200)) // Approximate card height

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  const updateGroupBounds = () => {
    setCanvasGroups((prev) =>
      prev.map((group) => {
        const groupActors = canvasActors.filter((actor) => actor.groupId === group.id)
        const bounds = calculateActorBounds(groupActors)
        return { ...group, ...bounds }
      }),
    )
  }

  const handleSelectAll = () => {
    setSelectedActorIds(canvasActors.map((actor) => actor.id))
  }

  const handleClearSelection = () => {
    setSelectedActorIds([])
  }

  const handleDeleteSelected = () => {
    setCanvasActors((prev) => prev.filter((actor) => !selectedActorIds.includes(actor.id)))
    setSelectedActorIds([])
    updateGroupBounds()
  }

  const handleCollectiveVote = (vote: "yes" | "no" | "maybe") => {
    if (!state.currentUser || !currentCharacter || selectedActorIds.length === 0) return

    selectedActorIds.forEach((canvasActorId) => {
      const canvasActor = canvasActors.find((ca) => ca.id === canvasActorId)
      if (canvasActor) {
        dispatch({
          type: "CAST_VOTE",
          payload: {
            actorId: canvasActor.actorId,
            characterId: currentCharacter.id,
            vote,
            userId: state.currentUser.id,
          },
        })
      }
    })

    // Show notification
    const notification = {
      id: `collective-vote-${Date.now()}`,
      type: "system" as const,
      title: "Collective Vote Cast",
      message: `Voted "${vote}" for ${selectedActorIds.length} actor(s)`,
      timestamp: Date.now(),
      read: false,
      priority: "medium" as const,
    }

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: notification,
    })
  }

  const handleCollectiveMove = () => {
    if (selectedActorIds.length === 0) return

    const selectedCanvasActors = canvasActors.filter((ca) => selectedActorIds.includes(ca.id))
    const actorIds = selectedCanvasActors.map((ca) => ca.actorId)

    if (actorIds.length > 0 && currentCharacter) {
      openModal("moveMultipleActors", {
        actorIds,
        characterId: currentCharacter.id,
      })
    }
  }

  const handleSaveCanvas = () => {
    const title = prompt("Enter a title for this canvas:")
    if (!title || !title.trim()) {
      return // User cancelled or entered empty title
    }

    const canvasId = `canvas-${state.currentFocus.currentProjectId}-${Date.now()}`
    const canvasData = {
      id: canvasId,
      title: title.trim(),
      actors: canvasActors,
      groups: canvasGroups,
      zoom,
      pan,
      showActorNames,
      sidebarCollapsed,
      timestamp: new Date().toISOString(),
    }

    // Save the canvas data
    localStorage.setItem(canvasId, JSON.stringify(canvasData))

    // Update the list of saved canvases
    const savedList = JSON.parse(localStorage.getItem(`canvas-list-${state.currentFocus.currentProjectId}`) || "[]")
    savedList.push({
      id: canvasId,
      title: title.trim(),
      timestamp: canvasData.timestamp,
    })
    localStorage.setItem(`canvas-list-${state.currentFocus.currentProjectId}`, JSON.stringify(savedList))

    setSavedCanvases(savedList)

    // Dispatch custom event to notify sidebar of the change
    window.dispatchEvent(
      new CustomEvent("canvasListUpdated", {
        detail: { projectId: state.currentFocus.currentProjectId },
      }),
    )

    alert(`Canvas "${title.trim()}" saved successfully!`)
  }

  const handleLoadSpecificCanvas = (canvasId: string) => {
    const saved = localStorage.getItem(canvasId)
    if (saved) {
      const canvasData = JSON.parse(saved)
      setCanvasActors(sanitizeCanvasActors(canvasData.actors || []))
      setCanvasGroups(canvasData.groups || [])
      setZoom(canvasData.zoom || 1)
      setPan(canvasData.pan || { x: 0, y: 0 })
      setShowActorNames(canvasData.showActorNames ?? true)
      setSidebarCollapsed(canvasData.sidebarCollapsed ?? false)
    }
  }

  const handleDeleteCanvas = (canvasId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    // Remove from localStorage
    localStorage.removeItem(canvasId)

    // Update the list
    const savedList = JSON.parse(localStorage.getItem(`canvas-list-${state.currentFocus.currentProjectId}`) || "[]")
    const updatedList = savedList.filter((c: any) => c.id !== canvasId)
    localStorage.setItem(`canvas-list-${state.currentFocus.currentProjectId}`, JSON.stringify(updatedList))

    setSavedCanvases(updatedList)

    // Dispatch custom event to notify sidebar of the change
    window.dispatchEvent(
      new CustomEvent("canvasListUpdated", {
        detail: { projectId: state.currentFocus.currentProjectId },
      }),
    )
  }

  const handleLoadCanvas = () => {
    const saved = localStorage.getItem(`canvas-${state.currentFocus.currentProjectId}`)
    if (saved) {
      const canvasData = JSON.parse(saved)
      setCanvasActors(sanitizeCanvasActors(canvasData.actors || []))
      setCanvasGroups(canvasData.groups || [])
      setZoom(canvasData.zoom || 1)
      setPan(canvasData.pan || { x: 0, y: 0 })
      setShowActorNames(canvasData.showActorNames ?? true)
      setSidebarCollapsed(canvasData.sidebarCollapsed ?? false)
    }
  }

  const useEffect_handleWheel = () => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false })
      return () => canvas.removeEventListener("wheel", handleWheel)
    }
  }
  useEffect(useEffect_handleWheel, [handleWheel])

  const useEffect_handleClickOutside = () => {
    const handleClickOutside = () => {
      setContextMenu((prev) => ({ ...prev, isVisible: false }))
    }

    if (contextMenu.isVisible) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }
  useEffect(useEffect_handleClickOutside, [contextMenu.isVisible])

  useEffect(() => {
    updateGroupBounds()
  }, [canvasActors])

  // Load canvas on mount
  useEffect(() => {
    handleLoadCanvas()
  }, [])

  useEffect(() => {
    const savedList = JSON.parse(localStorage.getItem(`canvas-list-${state.currentFocus.currentProjectId}`) || "[]")
    setSavedCanvases(savedList)
  }, [state.currentFocus.currentProjectId])

  const handleMoveActorFromContext = (canvasActorId: string) => {
    const canvasActor = canvasActors.find((a) => a.id === canvasActorId)
    if (canvasActor) {
      // Find the character this actor belongs to
      const character = currentProject?.characters.find(
        (char) =>
          char.name === canvasActor.characterName ||
          char.actors.shortLists.some((sl) => sl.actors.some((a) => a.id === canvasActor.actorId)) ||
          state.tabDefinitions.some(
            (tabDef) =>
              tabDef.key !== "shortLists" &&
              (char.actors[tabDef.key] || []).some((a: any) => a.id === canvasActor.actorId),
          ),
      )

      if (character) {
        openModal("moreActions", {
          actor: canvasActor.actor,
          characterId: character.id,
        })
      }
    }
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
  }

  const handleCanvasClose = () => {
    // Close all modals when canvas is closed
    closeAllModals()
    onClose()
  }

  // Enhanced global mouse event listeners for smooth canvas dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPan = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }
        setPan(newPan)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    const handleGlobalWheel = (e: WheelEvent) => {
      // Only handle wheel events when they're on the canvas area
      const target = e.target as HTMLElement
      if (target.closest(".canvas-container")) {
        handleWheel(e)
      }
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)
    }

    // Add global wheel listener for better zoom experience
    document.addEventListener("wheel", handleGlobalWheel, { passive: false })

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
      document.removeEventListener("wheel", handleGlobalWheel)
    }
  }, [isDragging, dragStart, handleWheel])

  // Clean up zoom timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [])

  // Close group transfer menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setGroupTransferMenu(null)
    }

    if (groupTransferMenu) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [groupTransferMenu])

  // Get current character and user details for voting functionality
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

  const handleAddActorToCanvas = (actor: any) => {
    // Check if actor is already on canvas
    const alreadyOnCanvas = canvasActors.some((ca) => ca.actorId === actor.id)
    if (alreadyOnCanvas) {
      alert(`${actor.name} is already on the canvas`)
      return
    }

    // Calculate stacked position (find next available spot)
    const STACK_OFFSET_X = 20
    const STACK_OFFSET_Y = 20
    const START_X = 50
    const START_Y = 50

    let newX = START_X
    let newY = START_Y

    // Find the last positioned actor to stack after it
    if (canvasActors.length > 0) {
      const lastActor = canvasActors[canvasActors.length - 1]
      newX = lastActor.x + STACK_OFFSET_X
      newY = lastActor.y + STACK_OFFSET_Y
    }

    const newCanvasActor: CanvasActor = {
      id: `canvas-${Date.now()}-${Math.random()}`,
      actorId: actor.id,
      x: newX,
      y: newY,
      characterName: actor.sourceCharacter || "",
      actor,
    }

    setCanvasActors((prev) => [...prev, newCanvasActor])
    
    // Show success notification
    const notification = {
      id: `add-actor-canvas-${Date.now()}`,
      type: "system" as const,
      title: "Actor Added to Canvas",
      message: `${actor.name} has been added to the canvas`,
      timestamp: Date.now(),
      read: false,
      priority: "low" as const,
    }

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: notification,
    })
  }

  const handleCharacterToggle = (characterId: string) => {
    setSelectedCharacterIds(prev => 
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    )
  }

  const handleClearCharacterSelection = () => {
    setSelectedCharacterIds([])
  }

  const handleSelectAllCharacters = () => {
    setSelectedCharacterIds(currentProject?.characters.map(c => c.id) || [])
  }

  const handleStatusFilterChange = (statusId: string) => {
    setCanvasFilters(prev => ({
      ...prev,
      status: prev.status.includes(statusId)
        ? prev.status.filter(id => id !== statusId)
        : [...prev.status, statusId]
    }))
  }

  const handleLocationFilterChange = (location: string) => {
    setCanvasFilters(prev => ({
      ...prev,
      location: prev.location.includes(location)
        ? prev.location.filter(loc => loc !== location)
        : [...prev.location, location]
    }))
  }

  const handleAgeRangeChange = (type: 'min' | 'max', value: number) => {
    setCanvasFilters(prev => ({
      ...prev,
      ageRange: {
        ...prev.ageRange,
        [type]: value
      }
    }))
  }

  const handleClearAllFilters = () => {
    setCanvasFilters({
      status: [],
      ageRange: { min: 0, max: 100 },
      location: []
    })
  }

  // Sort groups before rendering
  const sortedGroups = [...canvasGroups].sort((a, b) => {
    if (groupSortOption === "name") {
      return groupSortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (groupSortOption === "date") {
      // Assuming groups have a creation timestamp or similar if you want to sort by date
      // For now, this is a placeholder. You might need to add a 'createdAt' field to CanvasGroupProps.
      const dateA = new Date(a.x) // Placeholder, replace with actual creation date
      const dateB = new Date(b.x) // Placeholder, replace with actual creation date
      return groupSortDirection === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    } else if (groupSortOption === "actorCount") {
      const countA = canvasActors.filter(actor => actor.groupId === a.id).length
      const countB = canvasActors.filter(actor => actor.groupId === b.id).length
      return groupSortDirection === "asc" ? countA - countB : countB - countA
    }
    return 0
  })


  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <Layout className="w-6 h-6" />
            <span>Casting Canvas</span>
          </h2>
          <div className="text-sm text-gray-600">Drag actors from the sidebar to the canvas</div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActorCardView("standard")}
              className={`p-2 rounded transition-colors ${
                actorCardView === "standard" ? "bg-white shadow-sm" : "hover:bg-white/50"
              }`}
              title="Standard View"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActorCardView("compact")}
              className={`p-2 rounded transition-colors ${
                actorCardView === "compact" ? "bg-white shadow-sm" : "hover:bg-white/50"
              }`}
              title="Compact View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActorCardView("minimal")}
              className={`p-2 rounded transition-colors ${
                actorCardView === "minimal" ? "bg-white shadow-sm" : "hover:bg-white/50"
              }`}
              title="Minimal View"
            >
              <Hash className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActorCardView("voting")}
              className={`p-2 rounded transition-colors ${
                actorCardView === "voting" ? "bg-white shadow-sm" : "hover:bg-white/50"
              }`}
              title="Voting View"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>

          {canvasGroups.length > 0 && (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setGroupSortOption("name")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  groupSortOption === "name" ? "bg-white shadow-sm font-medium" : "hover:bg-white/50"
                }`}
                title="Sort Groups by Name"
              >
                Name
              </button>
              <button
                onClick={() => setGroupSortOption("date")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  groupSortOption === "date" ? "bg-white shadow-sm font-medium" : "hover:bg-white/50"
                }`}
                title="Sort Groups by Date Created"
              >
                <Calendar className="w-3 h-3" />
              </button>
              <button
                onClick={() => setGroupSortOption("actorCount")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  groupSortOption === "actorCount" ? "bg-white shadow-sm font-medium" : "hover:bg-white/50"
                }`}
                title="Sort Groups by Actor Count"
              >
                <Users className="w-3 h-3" />
              </button>
              <button
                onClick={() => setGroupSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                title={`Sort ${groupSortDirection === "asc" ? "Descending" : "Ascending"}`}
              >
                {groupSortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          )}

          {selectedActorIds.length > 0 && (
            <div className="flex items-center space-x-1 bg-blue-100 rounded-lg p-1">
              <span className="px-2 text-sm text-blue-800 font-medium">{selectedActorIds.length} selected</span>

              {/* Collective voting buttons */}
              {actorCardView === "voting" && state.currentUser && currentCharacter && (
                <div className="flex items-center space-x-1 border-l border-blue-200 pl-1 ml-1">
                  <button
                    onClick={() => handleCollectiveVote("yes")}
                    className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    title="Vote Yes for all selected"
                  >
                    <Heart className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleCollectiveVote("no")}
                    className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    title="Vote No for all selected"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleCollectiveVote("maybe")}
                    className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    title="Vote Maybe for all selected"
                  >
                    <Star className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                onClick={handleCollectiveMove}
                className="flex items-center space-x-1 px-2 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-xs"
                title="Move all selected actors"
              >
                <span>Move</span>
              </button>

              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="Create Group"
              >
                <Users className="w-4 h-4" />
                <span className="text-sm">Group</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearSelection}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Clear Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actor Names Toggle */}
          <button
            onClick={() => setShowActorNames(!showActorNames)}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
              showActorNames ? "bg-gray-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            title={showActorNames ? "Hide Actor Names" : "Show Actor Names"}
          >
            {showActorNames ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm">Actor Names</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button onClick={handleZoomOut} className="p-2 hover:bg-white rounded transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium min-w-[70px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-white rounded transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            {selectedActorIds.length > 0 && (
              <button
                onClick={handleZoomToSelection}
                className="p-2 hover:bg-white rounded transition-colors text-blue-600"
                title="Zoom to Selected Actors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleZoomToFit}
              className="p-2 hover:bg-white rounded transition-colors"
              title="Zoom to Fit All Actors"
              disabled={canvasActors.length === 0}
            >
              <Fullscreen className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 hover:bg-white rounded transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Save/Load */}
          <button
            onClick={handleSaveCanvas}
            className="flex items-center space-x-1 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          <button
            onClick={() => setShowDatabaseOverlay(!showDatabaseOverlay)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow-md ${
              showDatabaseOverlay
                ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300"
            }`}
            title="Add actors from database to canvas"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add from Database</span>
          </button>

          {/* Close Button */}
          <button
            onClick={handleCanvasClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close Canvas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col bg-gray-100 relative">
        <div className="flex flex-1 overflow-hidden">
          {showDatabaseOverlay && (
            <div className="absolute left-0 top-0 bottom-0 w-96 bg-white border-r border-slate-200 shadow-xl z-40 flex flex-col database-overlay">
              {/* Overlay Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-100">
                <div>
                  <h3 className="font-semibold text-slate-900">Add from Database</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {filteredDatabaseActors.length} actor{filteredDatabaseActors.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <button
                  onClick={() => setShowDatabaseOverlay(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="border-b border-slate-200 bg-white">
                <div className="p-3">
                  <button
                    onClick={() => setShowDatabaseFilters(!showDatabaseFilters)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      showDatabaseFilters || activeDatabaseFiltersCount > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span className="text-sm font-medium">Database Filters</span>
                      {activeDatabaseFiltersCount > 0 && (
                        <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {activeDatabaseFiltersCount}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDatabaseFilters ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Expanded Database Filters Panel */}
                {showDatabaseFilters && (
                  <div className="px-4 pb-4 space-y-4 bg-emerald-50/30">
                    {/* Clear All Filters */}
                    {activeDatabaseFiltersCount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600 font-medium">Active Filters</span>
                        <button
                          onClick={() => {
                            setDatabaseFilters({
                              status: [],
                              ageRange: { min: 0, max: 100 },
                              location: []
                            })
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    )}

                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Status</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto bg-white rounded-lg p-2 border border-slate-200">
                        {state.predefinedStatuses?.map((status) => (
                          <label key={status.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={databaseFilters.status.includes(status.id)}
                              onChange={() => {
                                setDatabaseFilters((prev) => ({
                                  ...prev,
                                  status: prev.status.includes(status.id)
                                    ? prev.status.filter((s) => s !== status.id)
                                    : [...prev.status, status.id],
                                }))
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <span className="text-sm text-slate-700">{status.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Age Range Filter */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Age Range</label>
                      <div className="space-y-2 bg-white rounded-lg p-2 border border-slate-200">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={databaseFilters.ageRange.min}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              setDatabaseFilters((prev) => ({
                                ...prev,
                                ageRange: { ...prev.ageRange, min: value },
                              }))
                            }}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                          <span className="text-slate-500 text-sm">to</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={databaseFilters.ageRange.max}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 100
                              setDatabaseFilters((prev) => ({
                                ...prev,
                                ageRange: { ...prev.ageRange, max: value },
                              }))
                            }}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location Filter */}
                    {databaseLocations.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">Location</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto bg-white rounded-lg p-2 border border-slate-200">
                          {databaseLocations.map((location) => (
                            <label key={location} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={databaseFilters.location.includes(location)}
                                onChange={() => {
                                  setDatabaseFilters((prev) => ({
                                    ...prev,
                                    location: prev.location.includes(location)
                                      ? prev.location.filter((l) => l !== location)
                                      : [...prev.location, location],
                                  }))
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <span className="text-sm text-slate-700">{location}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="p-4 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search actors..."
                    value={databaseSearchQuery}
                    onChange={(e) => setDatabaseSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Actors Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {filteredDatabaseActors.length > 0 ? (
                    filteredDatabaseActors.map((actor) => {
                      const isOnCanvas = canvasActors.some((ca) => ca.actorId === actor.id)
                      return (
                        <div
                          key={actor.id}
                          className={`relative bg-white rounded-lg border-2 transition-all ${
                            isOnCanvas
                              ? 'border-emerald-300 bg-emerald-50 opacity-50'
                              : 'border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer'
                          }`}
                          onClick={() => !isOnCanvas && handleAddActorToCanvas(actor)}
                        >
                          <div className="aspect-[3/4] relative rounded-t-lg overflow-hidden">
                            {actor.headshots?.[0] ? (
                              <img
                                src={actor.headshots[0]}
                                alt={actor.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-xl font-bold">
                                {actor.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                            {isOnCanvas && (
                              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                <div className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                  On Canvas
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <div className="font-medium text-sm text-slate-900 truncate">{actor.name}</div>
                            <div className="text-xs text-slate-500 truncate">{actor.sourceCharacter}</div>
                            {actor.age && <div className="text-xs text-slate-400">Age: {actor.age}</div>}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-2 text-center text-slate-500 py-8">
                      <div className="text-sm">No actors found</div>
                      {databaseSearchQuery && (
                        <button
                          onClick={() => setDatabaseSearchQuery('')}
                          className="text-emerald-600 hover:text-emerald-700 text-sm mt-2"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden bg-gray-100 canvas-container">
            <div
              ref={canvasRef}
              className={`w-full h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-canvas-background="true"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
                willChange: isDragging || isZooming ? "transform" : "auto",
                transition: isDragging || isZooming ? "transform 0s linear" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Grid Pattern */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: "50px 50px",
                }}
              />

              {sortedGroups.map((group) => (
                <CanvasGroup
                  key={group.id}
                  group={group}
                  onNameChange={handleGroupNameChange}
                  onDelete={handleDeleteGroup}
                  onDragGroup={handleGroupDrag}
                  onContextMenu={handleGroupContextMenu} // Added context menu handler for groups
                />
              ))}

              {canvasActors.map((canvasActor) => {
                const group = canvasGroups.find((g) => g.id === canvasActor.groupId)
                return (
                  <CanvasActorCard
                    key={canvasActor.id}
                    canvasActor={canvasActor}
                    showActorName={showActorNames}
                    isSelected={selectedActorIds.includes(canvasActor.id)}
                    isInGroup={!!canvasActor.groupId}
                    groupColor={group?.color}
                    viewMode={actorCardView}
                    onDrag={handleActorDrag}
                    onCharacterNameChange={handleCharacterNameChange}
                    onContextMenu={handleContextMenu}
                    onSelect={handleActorSelect}
                    characterId={currentCharacter?.id}
                    dispatch={dispatch}
                    currentUser={state.currentUser}
                    allUsers={state.users}
                  />
                )
              })}
            </div>

            {canvasActors.length === 0 && !showDatabaseOverlay && ( // Only show instructions if no actors and overlay is closed
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">Drag actors from the sidebar to start</div>
                  <div className="text-sm">
                    • Drag to move actors around
                    <br />• Ctrl/Cmd+Click or tap checkbox to select multiple
                    <br />• Long press (500ms) on touch devices for multi-select
                    <br />• Create groups from selected actors
                    <br />• Apply collective actions to selected actors
                    <br />• Drag group headers to move entire groups
                    <br />• Scroll to zoom in/out at cursor position
                    <br />• Right-click actors for more options
                  </div>
                </div>
              </div>
            )}

            {/* Zoom and Pan Instructions */}
            {canvasActors.length > 0 && selectedActorIds.length === 0 && !showDatabaseOverlay && ( // Only show if actors exist, none selected and overlay closed
              <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg pointer-events-none">
                <div className="text-sm text-gray-600">
                  <div className="font-medium mb-1">Navigation:</div>
                  <div>• Scroll to zoom in/out at cursor position</div>
                  <div>• Click and drag to pan around</div>
                  <div>• Ctrl/Cmd+Click to select multiple actors</div>
                  <div className="mt-2 text-xs text-gray-500">Zoom: {Math.round(zoom * 100)}%</div>
                </div>
              </div>
            )}

            <CanvasChatbot
              selectedActorCount={selectedActorIds.length}
              totalActorCount={canvasActors.length}
              isDisabled={canvasActors.length === 0}
            />
          </div>

          {/* Collapsible Right Sidebar with Actors */}
          <div
            className={`bg-white border-l border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${
              sidebarCollapsed ? "w-20" : "w-80"
            }`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              {!sidebarCollapsed && (
                <>
                  <h3 className="font-semibold text-gray-800">Canvas Actors</h3>
                  {canvasActors.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                      title="Select All Actors"
                    >
                      Select All
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {!sidebarCollapsed && (
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('character-dropdown')
                      if (dropdown) {
                        dropdown.classList.toggle('hidden')
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-lg hover:border-indigo-400 transition-colors"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">
                        {selectedCharacterIds.length === 0
                          ? 'All Characters'
                          : selectedCharacterIds.length === currentProject?.characters.length
                          ? 'All Characters'
                          : `${selectedCharacterIds.length} Character${selectedCharacterIds.length !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>

                  <div
                    id="character-dropdown"
                    className="hidden absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                  >
                    <div className="p-2 border-b border-slate-200 flex items-center justify-between">
                      <button
                        onClick={handleSelectAllCharacters}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Select All
                      </button>
                      {selectedCharacterIds.length > 0 && (
                        <button
                          onClick={handleClearCharacterSelection}
                          className="text-xs text-slate-600 hover:text-slate-700 font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {currentProject?.characters.map((char) => (
                      <label
                        key={char.id}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCharacterIds.includes(char.id)}
                          onChange={() => handleCharacterToggle(char.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span className="text-sm text-slate-700 flex-1">{char.name}</span>
                        <span className="text-xs text-slate-500">
                          {allActors.filter(a => a.sourceCharacterId === char.id).length}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!sidebarCollapsed && (
              <div className="border-b border-slate-200">
                {/* Filters Toggle Button */}
                <div className="p-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                      showFilters
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span className="text-sm font-medium">Filters</span>
                      {activeFiltersCount > 0 && (
                        <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Expanded Filters Panel */}
                {showFilters && (
                  <div className="px-4 pb-4 space-y-4 bg-slate-50">
                    {/* Clear All Filters */}
                    {activeFiltersCount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600 font-medium">Active Filters</span>
                        <button
                          onClick={() => {
                            setCanvasFilters({
                              status: [],
                              ageRange: { min: 0, max: 100 },
                              location: []
                            })
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    )}

                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Status</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {state.predefinedStatuses?.map((status) => (
                          <label key={status.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={canvasFilters.status.includes(status.id)}
                              onChange={() => {
                                setCanvasFilters((prev) => ({
                                  ...prev,
                                  status: prev.status.includes(status.id)
                                    ? prev.status.filter((s) => s !== status.id)
                                    : [...prev.status, status.id],
                                }))
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-sm text-slate-700">{status.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Age Range Filter */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Age Range</label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={canvasFilters.ageRange.min}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              setCanvasFilters((prev) => ({
                                ...prev,
                                ageRange: { ...prev.ageRange, min: value },
                              }))
                            }}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                          <span className="text-slate-500 text-sm">to</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={canvasFilters.ageRange.max}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 100
                              setCanvasFilters((prev) => ({
                                ...prev,
                                ageRange: { ...prev.ageRange, max: value },
                              }))
                            }}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location Filter */}
                    {uniqueLocations.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">Location</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {uniqueLocations.map((location) => (
                            <label key={location} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={canvasFilters.location.includes(location)}
                                onChange={() => {
                                  setCanvasFilters((prev) => ({
                                    ...prev,
                                    location: prev.location.includes(location)
                                      ? prev.location.filter((l) => l !== location)
                                      : [...prev.location, location],
                                  }))
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                              />
                              <span className="text-sm text-slate-700">{location}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!sidebarCollapsed && savedCanvases.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Saved Canvases</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {savedCanvases.map((canvas) => (
                    <div
                      key={canvas.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => handleLoadSpecificCanvas(canvas.id)}
                        className="flex-1 text-left text-sm text-gray-700 hover:text-emerald-600 truncate"
                        title={`Load "${canvas.title}"`}
                      >
                        {canvas.title}
                      </button>
                      <button
                        onClick={() => handleDeleteCanvas(canvas.id, canvas.title)}
                        className="ml-2 p-1 text-red-400 hover:text-red-600 transition-colors"
                        title={`Delete "${canvas.title}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search (only when expanded) */}
            {!sidebarCollapsed && (
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search actors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  />
                </div>
                {searchQuery && (
                  <div className="mt-2 text-xs text-gray-500">
                    {filteredActors.length} of {uniqueActors.length} actors
                  </div>
                )}
              </div>
            )}

            {/* Actors List */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className={`space-y-2 ${sidebarCollapsed ? "space-y-1" : ""}`}>
                {filteredActors.length > 0
                  ? filteredActors.map((actor) => (
                      <div
                        key={actor.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", actor.id)
                        }}
                        className={`bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors border border-gray-200 hover:border-emerald-300 ${
                          sidebarCollapsed ? "p-1" : "p-3"
                        }`}
                      >
                        {sidebarCollapsed ? (
                          // Collapsed view: Just thumbnail
                          <div className="flex justify-center">
                            {actor.headshots?.[0] ? (
                              <img
                                src={actor.headshots[0]}
                                alt={actor.name}
                                className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                title={`${actor.name} - From: ${actor.sourceCharacter}`}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 font-bold border border-gray-200" title={`${actor.name} - From: ${actor.sourceCharacter}`}>
                                {actor.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                          </div>
                        ) : (
                          // Expanded view: Full details
                          <div className="flex items-center space-x-3">
                            {actor.headshots?.[0] ? (
                              <img
                                src={actor.headshots[0]}
                                alt={actor.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 font-bold border border-gray-200">
                                {actor.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 truncate">{actor.name}</div>
                              <div className="text-xs text-gray-500 truncate">From: {actor.sourceCharacter}</div>
                              {actor.age && <div className="text-xs text-gray-400">Age: {actor.age}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  : !sidebarCollapsed && (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-sm">
                          {searchQuery ? "No actors found matching your search" : "No actors available"}
                        </div>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="text-emerald-600 hover:text-emerald-700 text-sm mt-2"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    )}
              </div>
            </div>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu.isVisible && (
          <CanvasContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            availableGroups={canvasGroups}
            onRemove={() => handleRemoveActor(contextMenu.actorId)}
            onDuplicate={() => handleDuplicateActor(contextMenu.actorId)}
            onMoveActor={() => handleMoveActorFromContext(contextMenu.actorId)}
            onAddToGroup={(groupId) => handleAddActorToGroup(contextMenu.actorId, groupId)}
            onCreateNewGroup={() => handleCreateGroupWithActor(contextMenu.actorId)}
            onClose={() => setContextMenu((prev) => ({ ...prev, isVisible: false }))}
          />
        )}

        {groupTransferMenu && (
          <div
            className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl z-50 py-2 min-w-[200px]"
            style={{
              left: groupTransferMenu.x,
              top: groupTransferMenu.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">Transfer Group To:</h4>
              <p className="text-xs text-gray-500 mt-1">{groupTransferMenu.actorIds.length} actor(s) will be moved</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {state.tabDefinitions.map((tab) => {
                // Skip shortLists tab as it's handled differently
                if (tab.key === "shortLists") return null

                // Determine icon based on tab key
                let Icon: React.ComponentType<React.ComponentProps<"svg">> | null = null
                if (tab.key === "longList") Icon = List
                if (tab.key === "approval") Icon = CheckCircle

                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTransferGroupToTab(tab.key)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                    <span>{tab.name}</span>
                    {tab.key === "approval" && (
                      <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Final</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroupModal && (
          <CreateGroupModal
            selectedActorIds={selectedActorIds}
            onCreateGroup={handleCreateGroup}
            onClose={() => {
              setShowCreateGroupModal(false)
              setSelectedActorIds([])
            }}
          />
        )}
      </div>
    </div>
  )
}
