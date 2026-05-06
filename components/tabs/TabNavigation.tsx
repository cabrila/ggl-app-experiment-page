"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useCasting, getTabDisplayName } from "@/components/casting/CastingContext"
import { Plus, Edit2, Trash2, GripVertical, Crown, Check, X, RotateCcw, List, CheckCircle } from "lucide-react"
import AddTabModal from "@/components/modals/AddTabModal"
import RenameTabModal from "@/components/modals/RenameTabModal"
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal"

export default function TabNavigation() {
  const { state, dispatch } = useCasting()
  const [showAddTabModal, setShowAddTabModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [tabToDelete, setTabToDelete] = useState<{ key: string; name: string } | null>(null)
  const [selectedTab, setSelectedTab] = useState<{ key: string; name: string } | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    tabKey: string
    tabName: string
    isCustom: boolean
  } | null>(null)
  const [dragOverTab, setDragOverTab] = useState<string | null>(null)
  const [draggedTab, setDraggedTab] = useState<string | null>(null)
  const [keyboardFocusedTab, setKeyboardFocusedTab] = useState<string | null>(null)
  const [keyboardSelectedTab, setKeyboardSelectedTab] = useState<string | null>(null)
  const [editingTab, setEditingTab] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const editInputRef = useRef<HTMLInputElement>(null)

  const currentCharacter = state.projects
    .find((p) => p.id === state.currentFocus.currentProjectId)
    ?.characters.find((c) => c.id === state.currentFocus.characterId)

  // Handle click outside to close context menu
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null)
    }

    if (contextMenu) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu])

  // Focus input when editing starts
  useEffect(() => {
    if (editingTab && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingTab])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!keyboardFocusedTab) return

      const reorderableTabs = state.tabDefinitions.filter((tab) => tab.key !== "longList" && tab.key !== "approval")
      const currentIndex = reorderableTabs.findIndex((tab) => tab.key === keyboardFocusedTab)

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          if (currentIndex > 0) {
            const prevTab = reorderableTabs[currentIndex - 1]
            setKeyboardFocusedTab(prevTab.key)
            tabRefs.current[prevTab.key]?.focus()
          }
          break
        case "ArrowRight":
          e.preventDefault()
          if (currentIndex < reorderableTabs.length - 1) {
            const nextTab = reorderableTabs[currentIndex + 1]
            setKeyboardFocusedTab(nextTab.key)
            tabRefs.current[nextTab.key]?.focus()
          }
          break
        case " ":
        case "Enter":
          e.preventDefault()
          if (keyboardSelectedTab === keyboardFocusedTab) {
            setKeyboardSelectedTab(null)
          } else {
            setKeyboardSelectedTab(keyboardFocusedTab)
          }
          break
        case "Escape":
          e.preventDefault()
          setKeyboardSelectedTab(null)
          setKeyboardFocusedTab(null)
          break
        case "ArrowUp":
          e.preventDefault()
          if (keyboardSelectedTab && currentIndex > 0) {
            const targetTab = reorderableTabs[currentIndex - 1]
            dispatch({
              type: "REORDER_TABS",
              payload: {
                draggedTabKey: keyboardSelectedTab,
                targetTabKey: targetTab.key,
                insertPosition: "before",
              },
            })
          }
          break
        case "ArrowDown":
          e.preventDefault()
          if (keyboardSelectedTab && currentIndex < reorderableTabs.length - 1) {
            const targetTab = reorderableTabs[currentIndex + 1]
            dispatch({
              type: "REORDER_TABS",
              payload: {
                draggedTabKey: keyboardSelectedTab,
                targetTabKey: targetTab.key,
                insertPosition: "after",
              },
            })
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [keyboardFocusedTab, keyboardSelectedTab, state.tabDefinitions, dispatch])

  const getTabCount = (tabKey: string) => {
    if (!currentCharacter) return 0

    if (tabKey === "shortLists") {
      return currentCharacter.actors.shortLists.reduce(
        (sum, sl) => sum + sl.actors.filter((a) => !a.isSoftRejected && !a.isGreenlit).length,
        0,
      )
    }

    const actors = currentCharacter.actors[tabKey as keyof typeof currentCharacter.actors]
    if (Array.isArray(actors)) {
      // For approval tab, show all actors including greenlit ones
      if (tabKey === "approval") {
        return actors.length
      }
      // For other tabs, exclude greenlit actors from count
      return actors.filter((a) => !a.isSoftRejected && !a.isGreenlit).length
    }

    return 0
  }

  const getTabIcon = (tabKey: string) => {
    switch (tabKey) {
      case "longList":
        return <List className="w-4 h-4" />
      case "approval":
        return <CheckCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const handleRightClick = (e: React.MouseEvent, tab: { key: string; name: string; isCustom?: boolean }) => {
    e.preventDefault()
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      tabKey: tab.key,
      tabName: tab.name,
      isCustom: tab.isCustom || false,
    })
  }

  const handleRename = () => {
    if (contextMenu) {
      setSelectedTab({ key: contextMenu.tabKey, name: contextMenu.tabName })
      setShowRenameModal(true)
      setContextMenu(null)
    }
  }

  const handleInlineEdit = (tabKey: string) => {
    const displayName = getTabDisplayName(state, tabKey)
    setEditingTab(tabKey)
    setEditingValue(displayName)
    setContextMenu(null)
  }

  const handleSaveEdit = () => {
    if (editingTab && editingValue.trim()) {
      dispatch({
        type: "UPDATE_TAB_DISPLAY_NAME",
        payload: {
          tabKey: editingTab,
          displayName: editingValue.trim(),
        },
      })
    }
    setEditingTab(null)
    setEditingValue("")
  }

  const handleCancelEdit = () => {
    setEditingTab(null)
    setEditingValue("")
  }

  const handleResetDisplayName = (tabKey: string) => {
    dispatch({
      type: "RESET_TAB_DISPLAY_NAME",
      payload: { tabKey },
    })
    setContextMenu(null)
  }

  const handleDeleteClick = () => {
    if (contextMenu) {
      const displayName = getTabDisplayName(state, contextMenu.tabKey)
      setTabToDelete({
        key: contextMenu.tabKey,
        name: displayName,
      })
      setShowDeleteConfirmation(true)
      setContextMenu(null)
    }
  }

  const handleConfirmDelete = () => {
    if (!tabToDelete) return

    console.log("🗑️ TabNavigation: Confirming deletion of tab:", tabToDelete.key)

    try {
      // Check if we're deleting the currently active tab
      const isActiveTab = state.currentFocus.activeTabKey === tabToDelete.key

      // Get the count of actors in the tab to be deleted
      const actorCount = getTabCount(tabToDelete.key)

      // If deleting the active tab, switch to Long List first
      if (isActiveTab) {
        console.log("🔄 TabNavigation: Switching to Long List before deletion")
        dispatch({ type: "SELECT_TAB", payload: "longList" })
      }

      // Dispatch the delete action
      dispatch({
        type: "DELETE_TAB",
        payload: { tabKey: tabToDelete.key },
      })

      // Create success notification
      const deleteNotification = {
        id: `tab-deleted-${Date.now()}-${Math.random()}`,
        type: "system" as const,
        title: "Tab Deleted Successfully",
        message: `Tab "${tabToDelete.name}" has been permanently removed${actorCount > 0 ? ` (${actorCount} actors were moved to Long List)` : ""}`,
        timestamp: Date.now(),
        read: false,
        priority: "medium" as const,
      }

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: deleteNotification,
      })

      console.log("✅ TabNavigation: Tab deletion completed successfully")
    } catch (error) {
      console.error("❌ TabNavigation: Error during tab deletion:", error)

      // Create error notification
      const errorNotification = {
        id: `tab-delete-error-${Date.now()}-${Math.random()}`,
        type: "system" as const,
        title: "Tab Deletion Failed",
        message: `Failed to delete tab "${tabToDelete.name}". Please try again.`,
        timestamp: Date.now(),
        read: false,
        priority: "high" as const,
      }

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: errorNotification,
      })
    } finally {
      // Clean up state
      setTabToDelete(null)
      setShowDeleteConfirmation(false)
    }
  }

  const handleCancelDelete = () => {
    console.log("❌ TabNavigation: Tab deletion cancelled")
    setTabToDelete(null)
    setShowDeleteConfirmation(false)
  }

  const handleDoubleClick = (tabKey: string) => {
    // Don't allow editing system tabs
    if (tabKey === "longList" || tabKey === "approval") return
    handleInlineEdit(tabKey)
  }

  // Mouse drag and drop handlers for tabs
  const handleTabDragStart = (e: React.DragEvent, tabKey: string) => {
    // Don't allow dragging of longList or approval tabs
    if (tabKey === "longList" || tabKey === "approval") {
      e.preventDefault()
      return
    }

    setDraggedTab(tabKey)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", tabKey)

    // Add visual feedback
    const target = e.target as HTMLElement
    target.style.opacity = "0.5"
  }

  const handleTabDragEnd = (e: React.DragEvent) => {
    setDraggedTab(null)
    setDragOverTab(null)

    // Reset visual feedback
    const target = e.target as HTMLElement
    target.style.opacity = "1"
  }

  const handleTabDragOver = (e: React.DragEvent, tabKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    console.log("🎯 TabNavigation: Drag over tab:", tabKey)

    // Check if this is an actor being dragged
    const draggedData = e.dataTransfer.getData("text/plain")
    const isActorDrag = draggedData.startsWith("actor-")

    if (isActorDrag) {
      // Allow dropping actors on any tab including approval
      console.log("🎭 TabNavigation: Actor drag over tab:", tabKey)
      setDragOverTab(tabKey)
    } else {
      // For tab reordering, don't allow dropping on longList or approval tabs
      if (tabKey === "longList" || tabKey === "approval") {
        console.log("🚫 TabNavigation: Cannot reorder system tab:", tabKey)
        return
      }
      setDragOverTab(tabKey)
    }
  }

  const handleTabDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverTab(null)
    }
  }

  const handleTabDrop = (e: React.DragEvent, targetTabKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverTab(null)

    console.log("💧 TabNavigation: Tab drop event on:", targetTabKey)

    const draggedData = e.dataTransfer.getData("text/plain")
    const draggedActorData = e.dataTransfer.getData("application/json")

    console.log("📥 TabNavigation: Drop data:", { draggedData, draggedActorData })

    if (!draggedData || !currentCharacter) {
      console.warn("⚠️ TabNavigation: Missing data or character, aborting")
      return
    }

    // Handle actor drops (enhanced functionality with approval support)
    if (draggedData.startsWith("actor-")) {
      console.log("🎭 TabNavigation: Actor drop detected on tab:", targetTabKey)

      const draggedActorId = draggedData.replace("actor-", "")
      console.log("🔍 TabNavigation: Extracted actor ID:", draggedActorId)

      let sourceInfo
      try {
        sourceInfo = JSON.parse(draggedActorData)
        console.log("📋 TabNavigation: Parsed source info:", sourceInfo)
      } catch (error) {
        console.error("❌ TabNavigation: Failed to parse actor data:", error)
        return
      }

      if (sourceInfo.sourceTabKey === targetTabKey) {
        console.log("🔄 TabNavigation: Same tab drop, ignoring")
        return
      }

      console.log("🎯 TabNavigation: Cross-tab move:", sourceInfo.sourceTabKey, "→", targetTabKey)

      // Enhanced destination type detection with approval support
      let destinationType: "standard" | "shortlist" | "custom" = "standard"
      const destinationKey = targetTabKey
      let destinationShortlistId: string | undefined

      if (targetTabKey === "shortLists") {
        destinationType = "shortlist"
        if (currentCharacter.actors.shortLists.length > 0) {
          destinationShortlistId = currentCharacter.actors.shortLists[0].id
          console.log("📝 TabNavigation: Using shortlist:", destinationShortlistId)
        }
      } else if (targetTabKey === "approval") {
        // Special handling for approval tab
        destinationType = "standard"
        console.log("📝 TabNavigation: Moving to Approval tab")
      } else if (targetTabKey === "longList" || targetTabKey === "audition") {
        // Standard tabs
        destinationType = "standard"
        console.log("📝 TabNavigation: Standard destination:", targetTabKey)
      } else {
        // Custom tabs
        destinationType = "custom"
        console.log("📝 TabNavigation: Custom destination:", targetTabKey)
      }

      const movePayload = {
        characterId: currentCharacter.id,
        sourceLocation: sourceInfo.sourceLocation,
        destinationType,
        destinationKey,
        destinationShortlistId,
      }

      console.log("🚀 TabNavigation: Dispatching move action with payload:", movePayload)

      // Handle both single and multi-actor moves
      if (sourceInfo.isMultiDrag && sourceInfo.selectedActorIds) {
        console.log("👥 TabNavigation: Multi-actor move to", targetTabKey)
        dispatch({
          type: "MOVE_MULTIPLE_ACTORS",
          payload: {
            ...movePayload,
            actorIds: sourceInfo.selectedActorIds,
          },
        })
      } else {
        console.log("👤 TabNavigation: Single actor move to", targetTabKey)
        dispatch({
          type: "MOVE_ACTOR",
          payload: {
            ...movePayload,
            actorId: draggedActorId,
          },
        })
      }

      // Show success notification with special message for approval
      const targetTab = state.tabDefinitions.find((tab) => tab.key === targetTabKey)
      const actorCount = sourceInfo.isMultiDrag ? sourceInfo.selectedActorIds.length : 1
      const actorText = actorCount > 1 ? `${actorCount} actors` : sourceInfo.actorName

      let notificationMessage = `${actorText} moved to ${getTabDisplayName(state, targetTabKey)}`
      let notificationTitle = "Actor Moved"

      if (targetTabKey === "approval") {
        notificationMessage = `${actorText} moved to Approval for final review${actorCount > 1 ? " (batch operation)" : ""}`
        notificationTitle = actorCount > 1 ? "Batch Moved to Approval" : "Moved to Approval"
      }

      const notification = {
        id: `tab-drop-success-${Date.now()}`,
        type: "system" as const,
        title: notificationTitle,
        message: notificationMessage,
        timestamp: Date.now(),
        read: false,
        priority: targetTabKey === "approval" ? ("medium" as const) : ("low" as const),
      }

      console.log("📢 TabNavigation: Adding success notification:", notification)
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: notification,
      })

      console.log("✅ TabNavigation: Actor drop completed successfully")
      return
    }

    // Handle tab reordering (existing functionality)
    console.log("📑 TabNavigation: Tab reorder detected")

    if (draggedData === targetTabKey) {
      console.log("🔄 TabNavigation: Same tab reorder, ignoring")
      return
    }

    // Don't allow reordering longList or approval tabs
    if (
      draggedData === "longList" ||
      draggedData === "approval" ||
      targetTabKey === "longList" ||
      targetTabKey === "approval"
    ) {
      console.log("🚫 TabNavigation: Cannot reorder system tabs")
      return
    }

    // Determine insert position based on mouse position
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const insertPosition = mouseX < rect.width / 2 ? "before" : "after"

    console.log("🔄 TabNavigation: Reordering tabs:", draggedData, insertPosition, targetTabKey)

    dispatch({
      type: "REORDER_TABS",
      payload: {
        draggedTabKey: draggedData,
        targetTabKey,
        insertPosition,
      },
    })

    // Show success notification
    const notification = {
      id: `tab-reorder-success-${Date.now()}`,
      type: "system" as const,
      title: "Tab Reordered",
      message: `Tab moved ${insertPosition} ${getTabDisplayName(state, targetTabKey)}`,
      timestamp: Date.now(),
      read: false,
      priority: "low" as const,
    }

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: notification,
    })

    console.log("✅ TabNavigation: Tab reorder completed")
  }

  const canDragTab = (tabKey: string) => {
    return tabKey !== "longList" && tabKey !== "approval"
  }

  const canDropOnTab = (tabKey: string, isActorDrag = false) => {
    if (isActorDrag) {
      // Actors can be dropped on any tab including approval
      return true
    }
    // Tab reordering cannot happen on system tabs
    return tabKey !== "longList" && tabKey !== "approval"
  }

  const hasCustomDisplayName = (tabKey: string) => {
    return state.tabDisplayNames && state.tabDisplayNames[tabKey]
  }

  const getTabNotificationCount = (tabKey: string): number => {
    const currentUserId = state.currentUser?.id
    const currentCharacterId = state.currentFocus.characterId

    if (!currentUserId || !currentCharacterId) return 0

    // Get notifications from the per-user tabNotifications system
    const userNotifications = state.tabNotifications?.[currentUserId] || []
    const notification = userNotifications.find((n) => n.tabKey === tabKey && n.characterId === currentCharacterId)

    return notification?.unreadCount || 0
  }

  return (
    <>
      <nav
        className="bg-gradient-to-r from-white via-slate-50 to-white border-b border-slate-200/60 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10"
        role="tablist"
        aria-label="Character casting tabs"
      >
        <div className="flex items-center px-6 py-2 space-x-3 overflow-x-auto scrollbar-hide">
          {state.tabDefinitions.map((tab, index) => {
            const count = getTabCount(tab.key)
            const notificationCount = getTabNotificationCount(tab.key)
            const isActive = state.currentFocus.activeTabKey === tab.key
            const isDragOver = dragOverTab === tab.key
            const isDragging = draggedTab === tab.key
            const isKeyboardFocused = keyboardFocusedTab === tab.key
            const isKeyboardSelected = keyboardSelectedTab === tab.key
            const isDraggable = canDragTab(tab.key)
            const isEditing = editingTab === tab.key
            const displayName = getTabDisplayName(state, tab.key)
            const isCustomName = hasCustomDisplayName(tab.key)
            const tabIcon = getTabIcon(tab.key)

            // Special styling for approval tab when being dragged over
            const isApprovalDragOver = isDragOver && tab.key === "approval"

            // Retrieve draggedData from the event during drag operations
            const draggedData = "" // Initialize draggedData

            return (
              <div key={tab.key} className="relative">
                {isEditing ? (
                  // Inline editing mode
                  <div className="flex items-center space-x-1 px-3 py-2 bg-white border-2 border-blue-400 rounded-xl shadow-lg">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveEdit()
                        } else if (e.key === "Escape") {
                          handleCancelEdit()
                        }
                      }}
                      className="text-sm font-medium bg-transparent border-none outline-none min-w-[80px] max-w-[120px]"
                      placeholder="Tab name"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                      title="Save"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  // Normal tab display
                  <button
                    ref={(el) => (tabRefs.current[tab.key] = el)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tab.key}`}
                    tabIndex={isKeyboardFocused ? 0 : -1}
                    draggable={isDraggable}
                    onClick={() => dispatch({ type: "SELECT_TAB", payload: tab.key })}
                    onDoubleClick={() => handleDoubleClick(tab.key)}
                    onContextMenu={(e) => handleRightClick(e, tab)}
                    onDragStart={(e) => handleTabDragStart(e, tab.key)}
                    onDragEnd={handleTabDragEnd}
                    onDragOver={(e) => handleTabDragOver(e, tab.key)}
                    onDragLeave={handleTabDragLeave}
                    onDrop={(e) => handleTabDrop(e, tab.key)}
                    onFocus={() => setKeyboardFocusedTab(tab.key)}
                    onBlur={() => {
                      if (keyboardFocusedTab === tab.key) {
                        setKeyboardFocusedTab(null)
                      }
                    }}
                    className={`relative px-6 py-2 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-gray-200 to-gray-300 text-slate-700 shadow-lg transform scale-105"
                        : "bg-gray-100 text-slate-600 hover:text-slate-800 hover:bg-gray-200 hover:shadow-md"
                    } ${
                      isApprovalDragOver
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl transform scale-110 ring-4 ring-emerald-300 ring-opacity-50"
                        : isDragOver && !draggedData.startsWith("actor-")
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl transform scale-110 ring-4 ring-purple-300 ring-opacity-50"
                          : isDragOver
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl transform scale-110 ring-4 ring-blue-300 ring-opacity-50"
                            : ""
                    } ${isDragging ? "opacity-50 transform rotate-2 scale-95" : ""} ${
                      isKeyboardFocused ? "ring-2 ring-blue-400 ring-offset-2" : ""
                    } ${isKeyboardSelected ? "ring-2 ring-green-400 ring-offset-2 bg-green-50" : ""} ${
                      !isDraggable ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                    }`}
                    title={
                      tab.key === "approval"
                        ? "Final approval stage - drag actors here for final review"
                        : tab.key === "longList"
                          ? "Long List - fixed position, cannot be reordered"
                          : tab.isCustom
                            ? "Right-click to rename or delete. Drag to reorder. Double-click to edit name. Use arrow keys and space to reorder."
                            : isDraggable
                              ? "Drag to reorder. Double-click to edit name. Use arrow keys and space to reorder."
                              : "Fixed position, cannot be reordered"
                    }
                    aria-describedby={`tab-instructions-${tab.key}`}
                  >
                    <div className="flex items-center space-x-2">
                      {isDraggable && (
                        <GripVertical
                          className={`w-3 h-3 text-slate-400 transition-opacity ${
                            isKeyboardSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      {tabIcon && <span className={`${isCustomName ? "text-blue-700" : ""}`}>{tabIcon}</span>}
                      <span className={isCustomName ? "text-blue-700 font-semibold" : ""}>{displayName}</span>
                      {isCustomName && <div className="w-1 h-1 bg-blue-500 rounded-full" title="Custom name" />}
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                          isActive
                            ? "bg-white/40 text-slate-700"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        } ${isApprovalDragOver ? "bg-white/30 text-white" : ""}`}
                      >
                        {count}
                      </div>

                      {notificationCount > 0 && (
                        <div
                          className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg border-2 border-white animate-pulse"
                          title={`${notificationCount} unread notification${notificationCount > 1 ? "s" : ""}`}
                          aria-label={`${notificationCount} unread notification${notificationCount > 1 ? "s" : ""}`}
                        >
                          {notificationCount}
                        </div>
                      )}
                    </div>

                    {/* Enhanced drop indicators */}
                    {isApprovalDragOver && (
                      <div className="absolute inset-0 border-2 border-emerald-400 border-dashed rounded-xl pointer-events-none bg-emerald-50/30 backdrop-blur-sm">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs px-3 py-2 rounded-full font-bold shadow-xl flex items-center space-x-2 animate-pulse">
                            <Crown className="w-3 h-3" />
                            <span>DROP FOR APPROVAL</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isDragOver && !isApprovalDragOver && (
                      <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-xl pointer-events-none bg-blue-50/20"></div>
                    )}

                    {isKeyboardSelected && (
                      <div className="absolute inset-0 border-2 border-green-400 border-dashed rounded-xl pointer-events-none bg-green-50/20"></div>
                    )}

                    {/* Screen reader instructions */}
                    <span id={`tab-instructions-${tab.key}`} className="sr-only">
                      {tab.key === "approval"
                        ? "Approval tab - actors can be dragged here for final review"
                        : isDraggable &&
                          "Press space to select for reordering, then use arrow keys to move. Press escape to cancel. Double-click to edit name."}
                    </span>
                  </button>
                )}
              </div>
            )
          })}

          <button
            onClick={() => setShowAddTabModal(true)}
            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Add New Tab"
            aria-label="Add new custom tab"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Keyboard instructions */}
        {keyboardFocusedTab && (
          <div className="sr-only" aria-live="polite">
            {keyboardSelectedTab
              ? `Tab ${getTabDisplayName(state, keyboardSelectedTab)} selected for reordering. Use arrow keys to move, space to deselect, or escape to cancel.`
              : `Focused on ${getTabDisplayName(state, keyboardFocusedTab)} tab. Press space to select for reordering, double-click to edit name.`}
          </div>
        )}
      </nav>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 min-w-[160px] backdrop-blur-md"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
          aria-label="Tab options"
        >
          <button
            onClick={() => handleInlineEdit(contextMenu.tabKey)}
            className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center space-x-3 transition-colors"
            role="menuitem"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Edit Name</span>
          </button>
          <button
            onClick={handleRename}
            className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center space-x-3 transition-colors"
            role="menuitem"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Rename Tab (Change ID)</span>
          </button>
          {hasCustomDisplayName(contextMenu.tabKey) && (
            <button
              onClick={() => handleResetDisplayName(contextMenu.tabKey)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center space-x-3 transition-colors"
              role="menuitem"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset to Original</span>
            </button>
          )}
          {contextMenu.tabKey !== "longList" && contextMenu.tabKey !== "approval" && (
            <button
              onClick={handleDeleteClick}
              className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-3 transition-colors"
              role="menuitem"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Tab</span>
            </button>
          )}
        </div>
      )}

      {/* Confirmation Dialog for Tab Deletion */}
      {showDeleteConfirmation && tabToDelete && (
        <ConfirmDeleteModal
          onClose={handleCancelDelete}
          title="Delete Tab"
          message={`Are you sure you want to delete the "${tabToDelete.name}" tab? This action cannot be undone. ${
            getTabCount(tabToDelete.key) > 0
              ? `All ${getTabCount(tabToDelete.key)} actors in this tab will be moved to the Long List.`
              : ""
          }`}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Modals */}
      {showAddTabModal && <AddTabModal onClose={() => setShowAddTabModal(false)} />}
      {showRenameModal && selectedTab && (
        <RenameTabModal
          show={showRenameModal}
          onHide={() => {
            setShowRenameModal(false)
            setSelectedTab(null)
          }}
          tabKey={selectedTab.key}
          tabName={selectedTab.name}
          onRename={(oldKey, newKey, newName) => {
            dispatch({
              type: "RENAME_TAB",
              payload: { oldKey, newKey, newName },
            })
          }}
        />
      )}
    </>
  )
}
