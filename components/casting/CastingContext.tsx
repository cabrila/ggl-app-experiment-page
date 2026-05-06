"use client"

import type React from "react"
import { createContext, type ReactNode, useReducer, useEffect, useContext } from "react"
import type { CastingState, CastingAction, Actor, Notification } from "@/types/casting"
import { saveToLocalStorage, clearLocalStorage, loadFromLocalStorage, saveToLocalStorageImmediate } from "@/utils/localStorage"
import { MOCK_SCHEDULE_ENTRIES, MOCK_SCENES, MOCK_PRODUCTION_PHASES } from "@/data/mockScriptAndSchedule"

// --- helper ---------------------------------------------
function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : []
}
// ---------------------------------------------------------

const CastingContext = createContext<{
  state: CastingState
  dispatch: React.Dispatch<CastingAction>
} | null>(null)

// Define the complete initial state structure to ensure consistency
function getInitialState(): CastingState {
  return {
    users: [
      {
        id: "1",
        name: "John Doe",
        initials: "JD",
        email: "john@example.com",
        role: "Casting Director",
        bgColor: "#3B82F6",
        color: "#FFFFFF",
      },
      {
        id: "2",
        name: "Jane Smith",
        initials: "JS",
        email: "jane@example.com",
        role: "Producer",
        bgColor: "#10B981",
        color: "#FFFFFF",
      },
      {
        id: "3",
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike@example.com",
        role: "Director",
        bgColor: "#F59E0B",
        color: "#FFFFFF",
      },
    ],
    currentUser: null, // Will be set to first user in provider
    projects: [],
    notifications: [],
    tabDefinitions: [
      { key: "longList", name: "Long List", isCustom: false },
      { key: "audition", name: "Audition", isCustom: false },
      { key: "approval", name: "Approval", isCustom: false },
    ],
    predefinedStatuses: [
      {
        id: "available",
        label: "Available",
        bgColor: "bg-green-200",
        textColor: "text-green-700",
        category: "availability",
      },
      {
        id: "busy",
        label: "Busy",
        bgColor: "bg-yellow-200",
        textColor: "text-yellow-700",
        category: "availability",
      },
      {
        id: "unavailable",
        label: "Unavailable",
        bgColor: "bg-red-200",
        textColor: "text-red-700",
        category: "availability",
      },
      {
        id: "interested",
        label: "Interested",
        bgColor: "bg-blue-200",
        textColor: "text-blue-700",
        category: "interest",
      },
      {
        id: "not-interested",
        label: "Not Interested",
        bgColor: "bg-gray-200",
        textColor: "text-gray-700",
        category: "interest",
      },
      {
        id: "contact-audition",
        label: "Audition Invite Sent",
        bgColor: "bg-purple-200",
        textColor: "text-purple-700",
        category: "contact",
      },
      {
        id: "contact-callback",
        label: "Callback Invite Sent",
        bgColor: "bg-pink-200",
        textColor: "text-pink-700",
        category: "contact",
      },
      {
        id: "contact-rejection",
        label: "Rejection Sent",
        bgColor: "bg-red-200",
        textColor: "text-red-700",
        category: "contact",
      },
      {
        id: "contact-offer",
        label: "Offer Sent",
        bgColor: "bg-green-200",
        textColor: "text-green-700",
        category: "contact",
      },
      {
        id: "contact-general",
        label: "General Contact",
        bgColor: "bg-gray-200",
        textColor: "text-gray-700",
        category: "contact",
      },
    ],
    permissionLevels: [
      { id: "admin", label: "Admin", description: "Full access to all features" },
      { id: "editor", label: "Editor", description: "Can edit actors and vote" },
      { id: "viewer", label: "Viewer", description: "Can view and vote only" },
    ],
    currentFocus: {
      currentProjectId: null,
      characterId: null,
      activeTabKey: "longList",
      cardDisplayMode: "detailed",
      currentSortOption: "alphabetical",
      searchTerm: "",
      searchTags: [],
      savedSearches: [],
      filters: {
        showFilters: false, // Add showFilters property to filters initial state
        status: [],
        ageRange: { min: 0, max: 100 },
        location: [],
      },
      playerView: {
        isOpen: false,
        currentIndex: 0,
        currentHeadshotIndex: 0,
      },
    },
    modals: {},
    cardViewSettings: {
      age: true,
      playingAge: true,
      location: true,
      agent: true,
      imdbUrl: true,
      status: true,
      skills: true,
      notes: true,
      showVotes: true,
      showActionButtons: true,
      mediaAndNotes: true,
      showProgress: true,
      showTags: true,
    },
    sortOptionDefinitions: [
      { key: "alphabetical", label: "Alphabetical (A-Z)" },
      { key: "consensus", label: "Consensus (Most Voted)" },
      { key: "status", label: "Status" },
      { key: "dateAdded", label: "Date Added (Newest)" },
      { key: "age", label: "Age (Youngest)" },
      { key: "custom", label: "Custom Order" },
    ],
    // Global default terminology (fallback)
    terminology: {
      actor: {
        singular: "Actor",
        plural: "Actors",
      },
      character: {
        singular: "Character",
        plural: "Characters",
      },
    },
    // New: Front-end only tab display names
    tabDisplayNames: {},
    scheduleEntries: MOCK_SCHEDULE_ENTRIES,
    scenes: MOCK_SCENES,
    productionPhases: MOCK_PRODUCTION_PHASES,
    filters: {
      status: [],
      ageRange: { min: 0, max: 100 },
      location: [],
      showFilters: false,
    },
    canvasActors: [], // Add canvasActors to initial state
    tabNotifications: {}, // userId -> TabNotification[]
  }
}

// Helper function to get default terminology
function getDefaultTerminology() {
  return {
    actor: {
      singular: "Actor",
      plural: "Actors",
    },
    character: {
      singular: "Character",
      plural: "Characters",
    },
  }
}

// Helper function to get current project's terminology or fallback to global
function getCurrentTerminology(state: CastingState) {
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  if (currentProject?.terminology) {
    return currentProject.terminology
  }

  return state.terminology
}

// Helper function to get display name for a tab
function getTabDisplayName(state: CastingState, tabKey: string): string {
  // Check if there's a custom display name
  if (state.tabDisplayNames && state.tabDisplayNames[tabKey]) {
    return state.tabDisplayNames[tabKey]
  }

  // Fall back to the original tab name
  const tab = state.tabDefinitions.find((t) => t.key === tabKey)
  return tab?.name || tabKey
}

// Helper function to ensure state has all required properties
function validateAndCompleteState(state: any): CastingState {
  const initialState = getInitialState()

  return {
    // Ensure all arrays exist and are valid
    users: Array.isArray(state.users) && state.users.length > 0 ? state.users : initialState.users,
    projects: Array.isArray(state.projects)
      ? state.projects.map((project: any) => ({
          ...project,
          // Ensure each project has terminology (either existing or default)
          terminology: project.terminology || getDefaultTerminology(),
          // Ensure each character has proper actors structure
          characters: Array.isArray(project.characters)
            ? project.characters.map((character: any) => ({
                ...character,
                actors: {
                  longList: Array.isArray(character.actors?.longList) ? character.actors.longList : [],
                  audition: Array.isArray(character.actors?.audition) ? character.actors.audition : [],
                  approval: Array.isArray(character.actors?.approval) ? character.actors.approval : [],
                  shortLists: Array.isArray(character.actors?.shortLists) ? character.actors.shortLists : [],
                  // Preserve any custom tabs while ensuring they're arrays
                  ...Object.fromEntries(
                    Object.entries(character.actors || {})
                      .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                      .map(([key, value]) => [key, Array.isArray(value) ? value : []]),
                  ),
                },
              }))
            : [],
          // Ensure canvasActors is an array
          canvasActors: Array.isArray(project.canvasActors) ? project.canvasActors : [],
          // Ensure prop/location inventories survive reload
          props: Array.isArray(project.props) ? project.props : [],
          locations: Array.isArray(project.locations) ? project.locations : [],
          propInventory: Array.isArray(project.propInventory) ? project.propInventory : [],
          propPurchaseRequests: Array.isArray(project.propPurchaseRequests) ? project.propPurchaseRequests : [],
          locationInventory: Array.isArray(project.locationInventory) ? project.locationInventory : [],
          // Ensure costumes data is structurally valid
          costumes: project.costumes && typeof project.costumes === "object" ? {
            actorSpecs: project.costumes.actorSpecs && typeof project.costumes.actorSpecs === "object" ? project.costumes.actorSpecs : {},
            inventory: Array.isArray(project.costumes.inventory) ? project.costumes.inventory : [],
            looks: Array.isArray(project.costumes.looks) ? project.costumes.looks : [],
            shoppingList: Array.isArray(project.costumes.shoppingList) ? project.costumes.shoppingList : [],
          } : undefined,
          // Ensure script data is structurally valid
          script: project.script && typeof project.script === "object" ? {
            blocks: Array.isArray(project.script.blocks) ? project.script.blocks : [],
            locked: !!project.script.locked,
            lockedSceneSuffixes: project.script.lockedSceneSuffixes || {},
            currentRevision: project.script.currentRevision || "white",
            lastModified: project.script.lastModified || Date.now(),
            beats: Array.isArray(project.script.beats) ? project.script.beats : [],
          } : undefined,
        }))
      : initialState.projects,
    notifications: Array.isArray(state.notifications) ? state.notifications : initialState.notifications,
    tabDefinitions:
      Array.isArray(state.tabDefinitions) && state.tabDefinitions.length > 0
        ? state.tabDefinitions
        : initialState.tabDefinitions,
    predefinedStatuses:
      Array.isArray(state.predefinedStatuses) && state.predefinedStatuses.length > 0
        ? state.predefinedStatuses
        : initialState.predefinedStatuses,
    permissionLevels:
      Array.isArray(state.permissionLevels) && state.permissionLevels.length > 0
        ? state.permissionLevels
        : initialState.permissionLevels,

    // Ensure currentUser exists
    currentUser:
      state.currentUser ||
      (Array.isArray(state.users) && state.users.length > 0 ? state.users[0] : initialState.users[0]),

    // Ensure currentFocus has all required properties
    currentFocus: {
      currentProjectId: state.currentFocus?.currentProjectId || null,
      characterId: state.currentFocus?.characterId || null,
      activeTabKey: state.currentFocus?.activeTabKey || "longList",
      cardDisplayMode: state.currentFocus?.cardDisplayMode || "detailed",
      currentSortOption: state.currentFocus?.currentSortOption || "alphabetical",
      searchTerm: state.currentFocus?.searchTerm || "",
      playerView: {
        isOpen: false,
        currentIndex: 0,
        currentHeadshotIndex: 0,
        ...state.currentFocus?.playerView,
      },
      searchTags: state.currentFocus?.searchTags || [],
      savedSearches: state.currentFocus?.savedSearches || [],
      // Ensure filters object exists and has default values
      filters: {
        showFilters: state.currentFocus?.filters?.showFilters || false, // Ensure showFilters property is loaded
        status: state.currentFocus?.filters?.status || [],
        ageRange: state.currentFocus?.filters?.ageRange || { min: 0, max: 100 },
        location: state.currentFocus?.filters?.location || [],
      },
    },

    // Ensure modals object exists
    modals: state.modals || {},

    // Ensure cardViewSettings has all required properties
    cardViewSettings: {
      ...initialState.cardViewSettings,
      ...state.cardViewSettings,
    },

    // Ensure sortOptionDefinitions exists
    sortOptionDefinitions:
      Array.isArray(state.sortOptionDefinitions) && state.sortOptionDefinitions.length > 0
        ? state.sortOptionDefinitions
        : initialState.sortOptionDefinitions,

    // Ensure global terminology exists (fallback)
    terminology: state.terminology || initialState.terminology,

    // Ensure tabDisplayNames exists
    tabDisplayNames: state.tabDisplayNames || {},

    // Always use fresh mock schedule/scenes/phases so updates to mock data are reflected
    scheduleEntries: MOCK_SCHEDULE_ENTRIES,
    scenes: MOCK_SCENES,
    productionPhases: MOCK_PRODUCTION_PHASES,

    // Ensure filters exists
    filters: state.filters || initialState.filters,

    tabNotifications: state.tabNotifications || {},
  }
}

function castingReducer(state: CastingState, action: CastingAction): CastingState {
  let newState = state

  switch (action.type) {
    case "UPDATE_TAB_DEFINITIONS": {
      console.log("🔧 CastingContext: Updating tab definitions:", action.payload)

      newState = {
        ...state,
        tabDefinitions: action.payload,
      }
      break
    }
    // New action for updating tab display names (front-end only)
    case "UPDATE_TAB_DISPLAY_NAME":
      newState = {
        ...state,
        tabDisplayNames: {
          ...state.tabDisplayNames,
          [action.payload.tabKey]: action.payload.displayName,
        },
      }
      break

    // New action for resetting tab display name to original
    case "RESET_TAB_DISPLAY_NAME":
      const updatedDisplayNames = { ...state.tabDisplayNames }
      delete updatedDisplayNames[action.payload.tabKey]
      newState = {
        ...state,
        tabDisplayNames: updatedDisplayNames,
      }
      break

    case "REORDER_TABS": {
      const { draggedTabKey, targetTabKey, insertPosition } = action.payload

      // Don't allow reordering of system tabs
      if (
        draggedTabKey === "longList" ||
        draggedTabKey === "approval" ||
        targetTabKey === "longList" ||
        targetTabKey === "approval"
      ) {
        console.log("🚫 CastingContext: Cannot reorder system tabs")
        return state
      }

      // Create a copy of tab definitions
      const updatedTabDefinitions = [...state.tabDefinitions]

      // Find the indices of the dragged and target tabs
      const draggedIndex = updatedTabDefinitions.findIndex((tab) => tab.key === draggedTabKey)
      const targetIndex = updatedTabDefinitions.findIndex((tab) => tab.key === targetTabKey)

      if (draggedIndex === -1 || targetIndex === -1) {
        console.log("🚫 CastingContext: Tab not found for reordering")
        return state
      }

      // Remove the dragged tab from its current position
      const [draggedTab] = updatedTabDefinitions.splice(draggedIndex, 1)

      // Calculate the new target index after removal
      const newTargetIndex = updatedTabDefinitions.findIndex((tab) => tab.key === targetTabKey)
      if (newTargetIndex === -1) {
        console.log("🚫 CastingContext: Target tab not found after removal")
        return state
      }

      // Insert the dragged tab at the new position
      const insertIndex = insertPosition === "before" ? newTargetIndex : newTargetIndex + 1
      updatedTabDefinitions.splice(insertIndex, 0, draggedTab)

      // Create notification about the reorder
      const reorderNotification = {
        id: `tab-reorder-${Date.now()}-${Math.random()}`,
        type: "system" as const,
        title: "Tab Reordered",
        message: `Tab "${draggedTab.name}" was moved ${insertPosition} "${updatedTabDefinitions.find((t) => t.key === targetTabKey)?.name}"`,
        timestamp: Date.now(),
        read: false,
        priority: "low" as const,
      }

      console.log("✅ CastingContext: Tab reorder completed successfully")

      newState = {
        ...state,
        tabDefinitions: updatedTabDefinitions,
        notifications: [reorderNotification, ...state.notifications],
      }
      break
    }

    // Update terminology for current project
    case "UPDATE_PROJECT_TERMINOLOGY":
      const currentProjectId = state.currentFocus.currentProjectId
      if (!currentProjectId) {
        console.warn("No current project selected for terminology update")
        return state
      }

      newState = {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id === currentProjectId) {
            const updatedTerminology = {
              ...(project.terminology || getDefaultTerminology()),
              [action.payload.type]: {
                ...(project.terminology?.[action.payload.type] || getDefaultTerminology()[action.payload.type]),
                [action.payload.form]: action.payload.value,
              },
            }

            return {
              ...project,
              terminology: updatedTerminology,
              modifiedDate: Date.now(),
            }
          }
          return project
        }),
      }
      break

    // Legacy global terminology update (kept for backward compatibility)
    case "UPDATE_TERMINOLOGY":
      newState = {
        ...state,
        terminology: {
          ...state.terminology,
          [action.payload.type]: {
            ...state.terminology[action.payload.type],
            [action.payload.form]: action.payload.value,
          },
        },
      }
      break

    case "LOAD_FROM_STORAGE":
      // Validate and complete the loaded state
      return validateAndCompleteState(action.payload)

    case "CLEAR_CACHE":
      clearLocalStorage()
      // Return to complete initial state with notification
      const initialState = getInitialState()
      return {
        ...initialState,
        currentUser: initialState.users[0], // Ensure currentUser is set
        notifications: [
          {
            id: `cache-cleared-${Date.now()}`,
            type: "system" as const,
            title: "Cache Cleared",
            message:
              "All cached data has been cleared. Application has been reset to initial state with default users and settings.",
            timestamp: Date.now(),
            read: false,
            priority: "medium" as const,
          },
        ],
      }

    case "LOAD_DEMO_DATA":
      // Validate the demo data before loading
      const validatedDemoData = validateAndCompleteState(action.payload)

      // Create notification about loading demo data
      const demoDataNotification = {
        id: `demo-data-loaded-${Date.now()}`,
        type: "system" as const,
        title: "Demo Data Loaded",
        message: "Application has been reset to demo data. All previous data has been replaced.",
        timestamp: Date.now(),
        read: false,
        priority: "medium" as const,
      }

      newState = {
        ...validatedDemoData,
        notifications: [demoDataNotification, ...(validatedDemoData.notifications || [])],
      }
      break

    case "SET_CURRENT_USER":
      newState = { ...state, currentUser: action.payload }
      break

    case "UPDATE_USER":
      const { userId, updates } = action.payload

      // Update the user in the users array
      const updatedUsers = state.users.map((user) => (user.id === userId ? { ...user, ...updates } : user))

      // Update current user if it's the one being updated
      const updatedCurrentUser =
        state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser

      // Update all notifications that reference this user
      const updatedNotifications = state.notifications.map((notification) => {
        if (notification.userId === userId && updates.name) {
          // Update notification messages that contain the old user name
          const oldUser = state.users.find((u) => u.id === userId)
          if (oldUser && notification.message.includes(oldUser.name)) {
            return {
              ...notification,
              message: notification.message.replace(oldUser.name, updates.name),
            }
          }
        }
        return notification
      })

      // Update all notes across all projects that were created by this user
      const updatedProjectsWithNotes = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => ({
          ...character,
          actors: {
            ...character.actors,
            longList: character.actors.longList.map((actor) => ({
              ...actor,
              notes: (actor.notes || []).map((note) =>
                note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
              ),
            })),
            audition: character.actors.audition.map((actor) => ({
              ...actor,
              notes: (actor.notes || []).map((note) =>
                note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
              ),
            })),
            approval: character.actors.approval.map((actor) => ({
              ...actor,
              notes: (actor.notes || []).map((note) =>
                note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
              ),
            })),
            shortLists: character.actors.shortLists.map((sl) => ({
              ...sl,
              actors: sl.actors.map((actor) => ({
                ...actor,
                notes: (actor.notes || []).map((note) =>
                  note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
                ),
              })),
            })),
            // Handle custom tabs
            ...Object.fromEntries(
              Object.entries(character.actors)
                .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                .map(([key, actors]) => [
                  key,
                  Array.isArray(actors)
                    ? actors.map((actor) => ({
                        ...actor,
                        notes: (actor.notes || []).map((note) =>
                          note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
                        ),
                      }))
                    : actors,
                ]),
            ),
          },
        })),
      }))

      // Create notification about the user update
      const updateNotification = {
        id: `user-updated-${Date.now()}-${Math.random()}`,
        type: "system" as const,
        title: "User Profile Updated",
        message: `User profile has been updated${updates.name ? ` - now known as "${updates.name}"` : ""}${updates.email ? ` with email "${updates.email}"` : ""}`,
        timestamp: Date.now(),
        read: false,
        priority: "low" as const,
        userId: userId,
      }

      newState = {
        ...state,
        users: updatedUsers,
        currentUser: updatedCurrentUser,
        notifications: [updateNotification, ...updatedNotifications],
        projects: updatedProjectsWithNotes,
      }
      break

    case "SELECT_PROJECT":
      const project = state.projects.find((p) => p.id === action.payload)
      if (!project) return state
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          currentProjectId: action.payload,
          characterId: project.characters[0]?.id || null,
          activeTabKey: "longList",
          searchTerm: "", // Clear search when switching projects
          playerView: { ...state.currentFocus.playerView, isOpen: false },
        },
      }
      break

    case "SELECT_CHARACTER":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          characterId: action.payload,
          activeTabKey: "longList",
          searchTerm: "", // Clear search when switching characters
          playerView: { ...state.currentFocus.playerView, isOpen: false },
        },
      }
      break

    case "SELECT_TAB": {
      console.log("📑 CastingContext: Selecting tab:", action.payload)

      const currentUserId = state.currentUser?.id
      const currentCharacterId = state.currentFocus.characterId

      if (currentUserId && currentCharacterId) {
        const userNotifications = state.tabNotifications[currentUserId] || []
        const updatedNotifications = userNotifications.filter(
          (notif) => !(notif.tabKey === action.payload && notif.characterId === currentCharacterId),
        )

        newState = {
          ...state,
          currentFocus: {
            ...state.currentFocus,
            activeTabKey: action.payload,
          },
          tabNotifications: {
            ...state.tabNotifications,
            [currentUserId]: updatedNotifications,
          },
        }
      } else {
        newState = {
          ...state,
          currentFocus: {
            ...state.currentFocus,
            activeTabKey: action.payload,
          },
        }
      }
      break
    }

    case "SET_SEARCH_TERM":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTerm: action.payload,
        },
      }
      break

    case "SET_SEARCH_TAGS":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTags: action.payload,
        },
      }
      break

    case "ADD_SEARCH_TAG":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTags: [...state.currentFocus.searchTags, action.payload],
        },
      }
      break

    case "REMOVE_SEARCH_TAG":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTags: state.currentFocus.searchTags.filter((tag) => tag.id !== action.payload),
        },
      }
      break

    case "CLEAR_SEARCH_TAGS":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTags: [],
        },
      }
      break

    case "SAVE_CURRENT_SEARCH": {
      const { name, isGlobal = false } = action.payload
      const newSavedSearch = {
        id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        tags: [...state.currentFocus.searchTags],
        searchTerm: state.currentFocus.searchTerm,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isGlobal,
      }

      console.log("[v0] Creating saved search:", newSavedSearch)

      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          savedSearches: [...state.currentFocus.savedSearches, newSavedSearch],
        },
      }

      console.log("[v0] Total saved searches after save:", newState.currentFocus.savedSearches.length)
      break
    }

    case "LOAD_SAVED_SEARCH": {
      const savedSearch = state.currentFocus.savedSearches.find((search) => search.id === action.payload)
      if (savedSearch) {
        // Update last used timestamp
        const updatedSavedSearches = state.currentFocus.savedSearches.map((search) =>
          search.id === action.payload ? { ...search, lastUsed: Date.now() } : search,
        )

        newState = {
          ...state,
          currentFocus: {
            ...state.currentFocus,
            searchTerm: savedSearch.searchTerm,
            searchTags: [...savedSearch.tags],
            savedSearches: updatedSavedSearches,
          },
        }
      } else {
        newState = state
      }
      break
    }

    case "DELETE_SAVED_SEARCH":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          savedSearches: state.currentFocus.savedSearches.filter((search) => search.id !== action.payload),
        },
      }
      break

    case "UPDATE_SAVED_SEARCH": {
      const { id, updates } = action.payload
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          savedSearches: state.currentFocus.savedSearches.map((search) =>
            search.id === id ? { ...search, ...updates } : search,
          ),
        },
      }
      break
    }

    case "SET_VIEW_MODE":
      if (action.payload === "player") {
        newState = {
          ...state,
          currentFocus: {
            ...state.currentFocus,
            cardDisplayMode: action.payload,
            playerView: {
              ...state.currentFocus.playerView,
              isOpen: true,
              currentIndex: 0,
              currentHeadshotIndex: 0,
            },
          },
        }
      } else {
        newState = {
          ...state,
          currentFocus: {
            ...state.currentFocus,
            cardDisplayMode: action.payload,
            playerView: { ...state.currentFocus.playerView, isOpen: false },
          },
        }
      }
      break

    case "SET_SORT_OPTION":
      console.log("Setting sort option to:", action.payload) // Debug log
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          currentSortOption: action.payload,
        },
      }
      break

    case "OPEN_PLAYER_VIEW":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          cardDisplayMode: "player",
          playerView: {
            ...state.currentFocus.playerView,
            isOpen: true,
            currentIndex: action.payload?.actorIndex || 0,
            currentHeadshotIndex: 0,
          },
        },
      }
      break

    case "CLOSE_PLAYER_VIEW":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          cardDisplayMode: "detailed",
          playerView: {
            ...state.currentFocus.playerView,
            isOpen: false,
          },
        },
      }
      break

    case "NAVIGATE_PLAYER_VIEW":
      const currentList = getCurrentPlayerViewList(state)
      const newIndex = Math.max(
        0,
        Math.min(state.currentFocus.playerView.currentIndex + action.payload, currentList.length - 1),
      )
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          playerView: {
            ...state.currentFocus.playerView,
            currentIndex: newIndex,
            currentHeadshotIndex: 0,
          },
        },
      }
      break

    case "SET_PLAYER_HEADSHOT":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          playerView: {
            ...state.currentFocus.playerView,
            currentHeadshotIndex: action.payload,
          },
        },
      }
      break

    case "CAST_VOTE":
      const { actorId, characterId, vote, userId: votingUserId } = action.payload

      // Find the actor and character names for the notification
      const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
      const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)
      const votingUser = state.users.find((u) => u.id === votingUserId)

      let actorName = "Unknown Actor"
      const characterName = currentCharacter?.name || "Unknown Character"

      // Find actor in all lists
      if (currentCharacter) {
        const allActors = [
          ...currentCharacter.actors.longList,
          ...currentCharacter.actors.audition,
          ...currentCharacter.actors.approval,
          ...currentCharacter.actors.shortLists.flatMap((sl) => sl.actors),
        ]
        const actor = allActors.find((a) => a.id === actorId)
        if (actor) actorName = actor.name
      }

      // Create notification for the vote
      const voteNotification = {
        id: `vote-${Date.now()}-${Math.random()}`,
        type: "vote" as const,
        title: "New Vote Cast",
        message: `${votingUser?.name || "Someone"} voted '${vote.charAt(0).toUpperCase() + vote.slice(1)}' on ${actorName} for ${characterName}`,
        timestamp: Date.now(),
        read: false,
        priority: "medium" as const,
        actorId,
        characterId,
        userId: votingUserId,
      }

      // Initialize notifications array with the vote notification
      let newNotifications = [voteNotification, ...state.notifications]

      // Process the vote and update projects
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => {
          if (character.id !== characterId) return character

          const updateActorVote = (actor: any) => {
            if (actor.id !== actorId) return actor
            const newVotes = { ...actor.userVotes }
            if (newVotes[votingUserId] === vote) {
              delete newVotes[votingUserId]
            } else {
              newVotes[votingUserId] = vote
            }

            // Calculate consensus with special handling for Approval list
            const totalUsers = state.users.length
            const yesVotes = Object.values(newVotes).filter((v) => v === "yes").length
            const noVotes = Object.values(newVotes).filter((v) => v === "no").length
            const maybeVotes = Object.values(newVotes).filter((v) => v === "maybe").length

            let consensusAction = null
            let isSoftRejected = false
            let isGreenlit = false
            let isCast = false

            // Special handling for Approval list - gogreenlight when ALL users vote Yes
            if (actor.currentListKey === "approval" && yesVotes === totalUsers && totalUsers > 0) {
              consensusAction = { type: "yes", isGreenlit: true }
              isGreenlit = true
              isCast = true

              // Create gogreenlight notification and add it to the notifications array
              const gogreenlightNotification = {
                id: `gogreenlight-${Date.now()}-${Math.random()}`,
                type: "system" as const,
                title: "Actor Greenlit!",
                message: `🎉 ${actorName} has been officially cast as ${characterName}! All team members voted Yes.`,
                timestamp: Date.now(),
                read: false,
                priority: "high" as const,
                actorId,
                characterId,
              }

              newNotifications = [gogreenlightNotification, ...newNotifications]
            } else if (yesVotes === totalUsers && actor.currentListKey !== "approval" && totalUsers > 0) {
              const currentTabIndex = state.tabDefinitions.findIndex((t) => t.key === actor.currentListKey)
              const nextTab = state.tabDefinitions[currentTabIndex + 1]
              if (nextTab && nextTab.key !== "shortLists") {
                consensusAction = { type: "yes", targetKey: nextTab.key, targetName: nextTab.name }
              } else {
                consensusAction = { type: "yes", targetKey: "approval", targetName: "Approval" }
              }
            } else if (noVotes === totalUsers && totalUsers > 0) {
              if (actor.currentListKey !== "approval") {
                consensusAction = { type: "no", targetKey: "longList", targetName: "Long List" }
                isSoftRejected = true
              }
            } else if (yesVotes + noVotes + maybeVotes === totalUsers && totalUsers > 0) {
              consensusAction = { type: "stay" }
            }

            return {
              ...actor,
              userVotes: newVotes,
              consensusAction,
              isSoftRejected,
              isGreenlit,
              isCast,
            }
          }

          return {
            ...character,
            actors: {
              ...character.actors,
              longList: character.actors.longList.map(updateActorVote),
              audition: character.actors.audition.map(updateActorVote),
              approval: character.actors.approval.map(updateActorVote),
              shortLists: character.actors.shortLists.map((sl) => ({
                ...sl,
                actors: sl.actors.map(updateActorVote),
              })),
              ...Object.fromEntries(
                Object.entries(character.actors)
                  .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                  .map(([key, actors]) => [key, Array.isArray(actors) ? actors.map(updateActorVote) : actors]),
              ),
            },
          }
        }),
      }))

      newState = {
        ...state,
        notifications: newNotifications,
        projects: updatedProjects,
      }
      break

    case "ADD_CONTACT_STATUS": {
      const { actorIds, characterId, contactType, templateName, timestamp } = action.payload

      // Create a contact status based on the template type
      const getContactStatusFromTemplate = (type: string, name: string) => {
        const statusId = `contact-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

        switch (type) {
          case "audition":
            return {
              id: statusId,
              label: "Audition Invite Sent",
              bgColor: "bg-purple-200",
              textColor: "text-purple-700",
              category: "contact",
              isCustom: false,
              timestamp,
              templateUsed: name,
            }
          case "callback":
            return {
              id: statusId,
              label: "Callback Invite Sent",
              bgColor: "bg-pink-200",
              textColor: "text-pink-700",
              category: "contact",
              isCustom: false,
              timestamp,
              templateUsed: name,
            }
          case "rejection":
            return {
              id: statusId,
              label: "Rejection Sent",
              bgColor: "bg-red-200",
              textColor: "text-red-700",
              category: "contact",
              isCustom: false,
              timestamp,
              templateUsed: name,
            }
          case "offer":
            return {
              id: statusId,
              label: "Offer Sent",
              bgColor: "bg-green-200",
              textColor: "text-green-700",
              category: "contact",
              isCustom: false,
              timestamp,
              templateUsed: name,
            }
          case "general":
          default:
            return {
              id: statusId,
              label: "General Contact",
              bgColor: "bg-blue-200",
              textColor: "text-blue-700",
              category: "contact",
              isCustom: false,
              timestamp,
              templateUsed: name,
            }
        }
      }

      const contactStatus = getContactStatusFromTemplate(contactType, templateName)

      // Build message history entry from the email that was sent
      const emailSubject = action.payload.emailSubject || `${templateName} - ${contactType}`
      const emailBody = action.payload.emailBody || ""
      const senderName = state.currentUser?.name || "Casting Team"
      const senderRole = state.currentUser?.role || "Casting Director"
      const charName = (() => {
        for (const p of state.projects) {
          const ch = p.characters.find((c) => c.id === characterId)
          if (ch) return ch.name
        }
        return undefined
      })()

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            const updateActorWithContactStatus = (actors: any[]) =>
              actors.map((actor) => {
                if (actorIds.includes(actor.id)) {
                  // Remove any existing contact statuses of the same type to avoid duplicates
                  const existingStatuses = actor.statuses || []
                  const filteredStatuses = existingStatuses.filter(
                    (status: any) => !(status.category === "contact" && status.label === contactStatus.label),
                  )

                  // Append to messageHistory
                  const existingMessages = actor.messageHistory || []
                  const newMessage = {
                    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    direction: "outgoing" as const,
                    senderName,
                    senderRole,
                    subject: emailSubject.replace(/\{\{.*?\}\}/g, "").trim() || templateName,
                    body: emailBody,
                    timestamp,
                    templateUsed: templateName,
                    characterName: charName,
                  }

                  return {
                    ...actor,
                    statuses: [...filteredStatuses, contactStatus],
                    lastContactDate: timestamp,
                    lastContactType: contactType,
                    messageHistory: [...existingMessages, newMessage],
                  }
                }
                return actor
              })

            return {
              ...character,
              actors: {
                ...character.actors,
                longList: updateActorWithContactStatus(character.actors.longList),
                audition: updateActorWithContactStatus(character.actors.audition),
                approval: updateActorWithContactStatus(character.actors.approval),
                shortLists: character.actors.shortLists.map((sl) => ({
                  ...sl,
                  actors: updateActorWithContactStatus(sl.actors),
                })),
                // Handle custom tabs
                ...Object.fromEntries(
                  Object.entries(character.actors)
                    .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                    .map(([key, actors]) => [
                      key,
                      Array.isArray(actors) ? updateActorWithContactStatus(actors) : actors,
                    ]),
                ),
              },
            }
          }),
        })),
      }
      break
    }

    case "ADD_ACTOR":
      const addActorProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
      const addActorCharacter = addActorProject?.characters.find((c) => c.id === action.payload.characterId)

      // Enhanced notification for form submissions
      const isFormSubmission = action.payload.actor.submissionSource === "form"
      const addActorNotification = {
        id: `actor-added-${Date.now()}-${Math.random()}`,
        type: isFormSubmission ? ("system" as const) : ("user" as const),
        title: isFormSubmission ? "New Form Submission Processed" : "New Actor Added",
        message: isFormSubmission
          ? `${action.payload.actor.name} submitted their information via form and has been automatically added to ${addActorCharacter?.name || "Unknown Character"}`
          : `${action.payload.actor.name} was added to ${addActorCharacter?.name || "Unknown Character"}`,
        timestamp: Date.now(),
        priority: isFormSubmission ? ("medium" as const) : ("low" as const),
        actorId: action.payload.actor.id,
        characterId: action.payload.characterId,
        metadata: isFormSubmission
          ? {
              submissionId: action.payload.actor.submissionId,
              source: "form_submission",
              hasPhotos: action.payload.actor.headshots?.length > 0,
              hasVideos: action.payload.actor.submissionVideos?.length > 0,
            }
          : undefined,
      }

      newState = {
        ...state,
        notifications: [addActorNotification, ...state.notifications],
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== action.payload.characterId) return character

            // Ensure actors object exists and has proper structure
            const safeActors = character.actors || {
              longList: [],
              audition: [],
              approval: [],
              shortLists: [],
            }

            // Ensure longList is always an array
            const currentLongList = safeArray(safeActors.longList)

            return {
              ...character,
              actors: {
                ...safeActors,
                longList: [action.payload.actor, ...currentLongList],
              },
            }
          }),
        })),
      }
      break

    case "ADD_CHARACTER":
      const addCharacterNotification = {
        id: `character-added-${Date.now()}-${Math.random()}`,
        type: "user" as const,
        title: "New Character Added",
        message: `Character "${action.payload.character.name}" was added to the project`,
        timestamp: Date.now(),
        read: false,
        priority: "medium" as const,
        characterId: action.payload.character.id,
      }

      newState = {
        ...state,
        notifications: [addCharacterNotification, ...state.notifications],
        projects: state.projects.map((project) => {
          if (project.id !== action.payload.projectId) return project

          const updatedProject = {
            ...project,
            characters: [...project.characters, action.payload.character],
            modifiedDate: Date.now(),
          }

          return updatedProject
        }),
        // Auto-select the new character if it's the first one or if no character is currently selected
        currentFocus: {
          ...state.currentFocus,
          characterId: state.currentFocus.characterId || action.payload.character.id,
        },
      }
      break

    case "DELETE_CHARACTER":
      newState = {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id !== state.currentFocus.currentProjectId) return project

          const updatedCharacters = project.characters.filter((char) => char.id !== action.payload)
          const updatedProject = {
            ...project,
            characters: updatedCharacters,
            modifiedDate: Date.now(),
          }

          return updatedProject
        }),
        // If deleting current character, switch to first available character
        currentFocus:
          state.currentFocus.characterId === action.payload
            ? {
                ...state.currentFocus,
                characterId:
                  state.projects
                    .find((p) => p.id === state.currentFocus.currentProjectId)
                    ?.characters.filter((char) => char.id !== action.payload)[0]?.id || null,
                activeTabKey: "longList",
              }
            : state.currentFocus,
      }
      break

    case "UPDATE_CHARACTER":
      newState = {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id !== action.payload.projectId) return project

          const updatedProject = {
            ...project,
            characters: project.characters.map((character) =>
              character.id === action.payload.character.id ? action.payload.character : character,
            ),
            modifiedDate: Date.now(),
          }

          return updatedProject
        }),
      }
      break

    case "UPDATE_ACTOR":
      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== action.payload.characterId) return character

            const updateActorInList = (actors: any[]) =>
              actors.map((actor) =>
                actor.id === action.payload.actorId ? { ...actor, ...action.payload.updates } : actor,
              )

            // Update actor in all lists
            const updatedActors = { ...character.actors }

            // Update in standard lists
            updatedActors.longList = updateActorInList(character.actors.longList)
            updatedActors.audition = updateActorInList(character.actors.audition)
            updatedActors.approval = updateActorInList(character.actors.approval)

            // Update in shortlists
            updatedActors.shortLists = character.actors.shortLists.map((sl) => ({
              ...sl,
              actors: updateActorInList(sl.actors),
            }))

            // Update in custom tabs
            Object.keys(character.actors).forEach((key) => {
              if (
                !["longList", "audition", "approval", "shortLists"].includes(key) &&
                Array.isArray(character.actors[key])
              ) {
                updatedActors[key] = updateActorInList(character.actors[key] as any[])
              }
            })

            return {
              ...character,
              actors: updatedActors,
            }
          }),
        })),
      }
      break

    case "MOVE_ACTOR": {
      console.log("🔄 CastingContext: MOVE_ACTOR action received:", action.payload)

      const {
        actorId,
        sourceLocation,
        destinationType,
        destinationKey,
        destinationShortlistId,
        characterId,
        moveReason,
      } = action.payload

      // Find the current project and character for context
      const moveProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
      const moveCharacter = moveProject?.characters.find((c) => c.id === characterId)

      if (!moveCharacter) {
        console.error("❌ CastingContext: Character not found:", characterId)
        return state
      }

      console.log("📍 CastingContext: Found character:", moveCharacter.name)

      // Find the actor to move and determine source list name
      let actorToMove: any = null
      let sourceListName = ""
      let destinationListName = ""

      console.log("🔍 CastingContext: Searching for actor in source location:", sourceLocation)

      // First, find the actor and determine source list name
      if (sourceLocation?.type === "standard") {
        const sourceList = safeArray(
          moveCharacter.actors[sourceLocation.key as keyof typeof moveCharacter.actors] as any[],
        )
        actorToMove = sourceList.find((a: any) => a.id === actorId)
        const sourceTab = state.tabDefinitions.find((tab) => tab.key === sourceLocation.key)
        sourceListName = sourceTab?.name || sourceLocation.key
        console.log("📋 CastingContext: Found in standard list:", sourceListName, "Actor:", actorToMove?.name)
      } else if (sourceLocation?.type === "shortlist") {
        const sourceShortlist = moveCharacter.actors.shortLists.find((sl) => sl.id === sourceLocation.shortlistId)
        if (sourceShortlist) {
          actorToMove = sourceShortlist.actors.find((a) => a.id === actorId)
          sourceListName = `shortlist "${sourceShortlist.name}"`
          console.log("📋 CastingContext: Found in shortlist:", sourceListName, "Actor:", actorToMove?.name)
        }
      } else if (sourceLocation?.type === "custom") {
        const sourceList = safeArray(
          moveCharacter.actors[sourceLocation.key as keyof typeof moveCharacter.actors] as any[],
        )
        actorToMove = sourceList.find((a: any) => a.id === actorId)
        sourceListName = sourceLocation.key
        console.log("📋 CastingContext: Found in custom list:", sourceListName, "Actor:", actorToMove?.name)
      }

      if (!actorToMove) {
        console.error("❌ CastingContext: Actor not found:", actorId)
        return state
      }

      console.log("✅ CastingContext: Actor found:", actorToMove.name)

      // Determine destination list name
      if (destinationType === "standard") {
        const destTab = state.tabDefinitions.find((tab) => tab.key === destinationKey)
        destinationListName = destTab?.name || destinationKey
      } else if (destinationType === "shortlist") {
        const destShortlist = moveCharacter.actors.shortLists.find((sl) => sl.id === destinationShortlistId)
        destinationListName = destShortlist ? `shortlist "${destShortlist.name}"` : "shortlist"
      } else if (destinationType === "custom") {
        destinationListName = destinationKey
      }

      console.log("🎯 CastingContext: Moving from", sourceListName, "to", destinationListName)

      const moveNotification: Notification = {
        id: `move-${Date.now()}-${Math.random()}`,
        type: "casting",
        title: "Actor Moved",
        message: `${actorToMove.name} moved to ${getTabDisplayName(newState, destinationKey)}`,
        timestamp: Date.now(),
        read: false,
        priority: "low",
        relatedTabKey: destinationKey,
        relatedActorId: actorId,
        relatedCharacterId: characterId,
      }

      // Enhanced notification messages based on move reason and destination
      let notificationMessage = `${actorToMove?.name || "Actor"} was moved from ${sourceListName} to ${destinationListName} for ${moveCharacter.name}`
      let notificationTitle = "Actor Moved"
      let notificationPriority: "low" | "medium" | "high" = "low"

      if (destinationKey === "approval") {
        notificationMessage = `${actorToMove?.name || "Actor"} was moved to Approval for final review on ${moveCharacter.name}`
        notificationTitle = "Moved to Approval"
        notificationPriority = "medium"
      } else if (destinationKey === "longList") {
        notificationMessage = `${actorToMove?.name || "Actor"} was moved to Long List for fresh evaluation on ${moveCharacter.name}`
        notificationTitle = "Moved to Long List"
        notificationPriority = "low"
      }

      const moveActorNotification = {
        id: `move-actor-${Date.now()}-${Math.random()}`,
        type: "user" as const,
        title: notificationTitle,
        message: notificationMessage,
        timestamp: Date.now(),
        read: false,
        priority: notificationPriority,
        actorId: actorId,
        characterId: characterId,
        userId: state.currentUser?.id,
      }

      // Update the projects with the actor move
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => {
          if (character.id !== characterId) return character

          console.log("🔧 CastingContext: Updating character:", character.name)

          // Find the actor to move
          let actorToMove: any = null
          const updatedActors = { ...character.actors }

          // Remove actor from source location
          if (sourceLocation?.type === "standard") {
            const sourceList = safeArray(updatedActors[sourceLocation.key as keyof typeof updatedActors] as any[])
            actorToMove = sourceList.find((a: any) => a.id === actorId)
            updatedActors[sourceLocation.key as keyof typeof updatedActors] = sourceList.filter(
              (a: any) => a.id !== actorId,
            )
            console.log("➖ CastingContext: Removed from standard list:", sourceLocation.key)
          } else if (sourceLocation?.type === "shortlist") {
            updatedActors.shortLists = updatedActors.shortLists.map((sl) => {
              if (sl.id === sourceLocation.shortlistId) {
                actorToMove = sl.actors.find((a) => a.id === actorId)
                console.log("➖ CastingContext: Removed from shortlist:", sl.name)
                return { ...sl, actors: sl.actors.filter((a) => a.id !== actorId) }
              }
              return sl
            })
          } else if (sourceLocation?.type === "custom") {
            const sourceList = safeArray(updatedActors[sourceLocation.key as keyof typeof updatedActors] as any[])
            actorToMove = sourceList.find((a: any) => a.id === actorId)
            updatedActors[sourceLocation.key as keyof typeof updatedActors] = sourceList.filter(
              (a: any) => a.id !== actorId,
            )
            console.log("➖ CastingContext: Removed from custom list:", sourceLocation.key)
          }

          if (!actorToMove) {
            console.error("❌ CastingContext: Actor not found during removal")
            return character
          }

          // Enhanced state reset logic based on destination and move reason
          const resetActor = {
            ...actorToMove,
            currentListKey: destinationKey,
            currentShortlistId: destinationType === "shortlist" ? destinationShortlistId : undefined,
          }

          // Apply different reset strategies based on destination
          if (destinationKey === "longList" && moveReason === "reset") {
            // Complete reset for Long List moves
            console.log("🔄 CastingContext: Complete reset for Long List move")
            resetActor.userVotes = {}
            resetActor.consensusAction = null
            resetActor.isSoftRejected = false
            resetActor.isGreenlit = false
            resetActor.isCast = false
            resetActor.statuses = resetActor.statuses?.filter((s: any) => s.category !== "contact") || []
            resetActor.lastContactDate = undefined
            resetActor.lastContactType = undefined
          } else if (destinationKey === "approval" && moveReason === "final_review") {
            // Preserve voting data for Approval moves but reset cast status
            console.log("👑 CastingContext: Preserving data for Approval move")
            resetActor.userVotes = actorToMove.userVotes || {}
            resetActor.consensusAction = null
            resetActor.isSoftRejected = false
            resetActor.isGreenlit = false
            resetActor.isCast = false
            resetActor.readyForApproval = true
            resetActor.approvalMoveDate = Date.now()
          } else {
            // Standard reset for other moves
            console.log("🔄 CastingContext: Standard reset for move")
            resetActor.userVotes = {}
            resetActor.consensusAction = null
            resetActor.isSoftRejected = false
            resetActor.isGreenlit = false
            resetActor.isCast = false
          }

          console.log("🔄 CastingContext: Applied reset logic based on destination and reason")

          // Add actor to destination
          if (destinationType === "standard") {
            const destList = safeArray(updatedActors[destinationKey as keyof typeof updatedActors] as any[])
            updatedActors[destinationKey as keyof typeof updatedActors] = [resetActor, ...destList]
            console.log("➕ CastingContext: Added to standard list:", destinationKey)
          } else if (destinationType === "shortlist") {
            updatedActors.shortLists = updatedActors.shortLists.map((sl) => {
              if (sl.id === destinationShortlistId) {
                console.log("➕ CastingContext: Added to shortlist:", sl.name)
                return { ...sl, actors: [resetActor, ...sl.actors] }
              }
              return sl
            })
          } else if (destinationType === "custom") {
            const destList = safeArray(updatedActors[destinationKey as keyof typeof updatedActors] as any[])
            updatedActors[destinationKey as keyof typeof updatedActors] = [resetActor, ...destList]
            console.log("➕ CastingContext: Added to custom list:", destinationKey)
          }

          console.log("✅ CastingContext: Actor move completed for character")

          return {
            ...character,
            actors: updatedActors,
          }
        }),
      }))

      console.log("✅ CastingContext: MOVE_ACTOR action completed successfully")

      newState = {
        ...state,
        notifications: [moveActorNotification, moveNotification, ...state.notifications],
        projects: updatedProjects,
      }
      break
    }

    case "MOVE_MULTIPLE_ACTORS": {
      console.log("🔄🔄 CastingContext: MOVE_MULTIPLE_ACTORS action received:", action.payload)
      const {
        actorIds,
        sourceLocation,
        destinationType,
        destinationKey,
        destinationShortlistId,
        characterId,
        moveReason,
      } = action.payload

      if (!actorIds || actorIds.length === 0) return state

      // Find the current project and character for context
      const moveProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
      const moveCharacter = moveProject?.characters.find((c) => c.id === characterId)

      if (!moveCharacter) return state

      const batchMoveNotification: Notification = {
        id: `batch-move-${Date.now()}-${Math.random()}`,
        type: "casting",
        title: `Batch Move Complete`,
        message: `${actorIds.length} actor${actorIds.length > 1 ? "s" : ""} moved to ${getTabDisplayName(newState, destinationKey)}`,
        timestamp: Date.now(),
        read: false,
        priority: "medium",
        relatedTabKey: destinationKey,
        relatedCharacterId: characterId,
      }

      // Enhanced notification messages based on move reason and destination
      let notificationMessage = `${actorIds.length} actors were moved to ${destinationType === "shortlist" ? "a shortlist" : destinationKey} for ${moveCharacter.name}`
      let notificationTitle = "Multiple Actors Moved"
      let notificationPriority: "low" | "medium" | "high" = "medium"

      if (destinationKey === "approval") {
        notificationMessage = `${actorIds.length} actors were moved to Approval for final review on ${moveCharacter.name}`
        notificationTitle = "Multiple Actors Moved to Approval"
        notificationPriority = "medium"
      } else if (destinationKey === "longList") {
        notificationMessage = `${actorIds.length} actors were moved to Long List for fresh evaluation on ${moveCharacter.name}`
        notificationTitle = "Multiple Actors Moved to Long List"
        notificationPriority = "low"
      }

      const moveActorNotification = {
        id: `move-actor-${Date.now()}-${Math.random()}`,
        type: "user" as const,
        title: notificationTitle,
        message: notificationMessage,
        timestamp: Date.now(),
        read: false,
        priority: notificationPriority,
        characterId: characterId,
        userId: state.currentUser?.id,
      }

      // Update the projects with the actor moves
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => {
          if (character.id !== characterId) return character

          // Find all actors to move
          const actorsToMove: any[] = []
          const updatedActors = { ...character.actors }

          // Remove actors from source location
          if (sourceLocation?.type === "standard") {
            const sourceList = safeArray(updatedActors[sourceLocation.key as keyof typeof updatedActors] as any[])
            const foundActors = sourceList.filter((a: any) => actorIds.includes(a.id))
            actorsToMove.push(...foundActors)
            updatedActors[sourceLocation.key as keyof typeof updatedActors] = sourceList.filter(
              (a: any) => !actorIds.includes(a.id),
            )
          } else if (sourceLocation?.type === "shortlist") {
            updatedActors.shortLists = updatedActors.shortLists.map((sl) => {
              if (sl.id === sourceLocation.shortlistId) {
                const foundActors = sl.actors.filter((a) => actorIds.includes(a.id))
                actorsToMove.push(...foundActors)
                return { ...sl, actors: sl.actors.filter((a) => !actorIds.includes(a.id)) }
              }
              return sl
            })
          } else if (sourceLocation?.type === "custom") {
            const sourceList = safeArray(updatedActors[sourceLocation.key as keyof typeof updatedActors] as any[])
            const foundActors = sourceList.filter((a: any) => actorIds.includes(a.id))
            actorsToMove.push(...foundActors)
            updatedActors[sourceLocation.key as keyof typeof updatedActors] = sourceList.filter(
              (a: any) => !actorIds.includes(a.id),
            )
          }

          if (actorsToMove.length === 0) return character

          // Enhanced state reset logic based on destination and move reason
          const resetActors = actorsToMove.map((actor) => {
            const resetActor = {
              ...actor,
              currentListKey: destinationKey,
              currentShortlistId: destinationType === "shortlist" ? destinationShortlistId : undefined,
            }

            // Apply different reset strategies based on destination
            if (destinationKey === "longList" && moveReason === "reset") {
              // Complete reset for Long List moves
              resetActor.userVotes = {}
              resetActor.consensusAction = null
              resetActor.isSoftRejected = false
              resetActor.isGreenlit = false
              resetActor.isCast = false
              resetActor.statuses = resetActor.statuses?.filter((s: any) => s.category !== "contact") || []
              resetActor.lastContactDate = undefined
              resetActor.lastContactType = undefined
            } else if (destinationKey === "approval" && moveReason === "final_review") {
              // Preserve voting data for Approval moves but reset cast status
              resetActor.userVotes = actor.userVotes || {}
              resetActor.consensusAction = null
              resetActor.isSoftRejected = false
              resetActor.isGreenlit = false
              resetActor.isCast = false
              resetActor.readyForApproval = true
              resetActor.approvalMoveDate = Date.now()
            } else {
              // Standard reset for other moves
              resetActor.userVotes = {}
              resetActor.consensusAction = null
              resetActor.isSoftRejected = false
              resetActor.isGreenlit = false
              resetActor.isCast = false
            }

            return resetActor
          })

          // Add actors to destination
          if (destinationType === "standard") {
            const destList = safeArray(updatedActors[destinationKey as keyof typeof updatedActors] as any[])
            updatedActors[destinationKey as keyof typeof updatedActors] = [...resetActors, ...destList]
          } else if (destinationType === "shortlist") {
            updatedActors.shortLists = updatedActors.shortLists.map((sl) => {
              if (sl.id === destinationShortlistId) {
                return { ...sl, actors: [...resetActors, ...sl.actors] }
              }
              return sl
            })
          } else if (destinationType === "custom") {
            const destList = safeArray(updatedActors[destinationKey as keyof typeof updatedActors] as any[])
            updatedActors[destinationKey as keyof typeof updatedActors] = [...resetActors, ...destList]
          }

          return {
            ...character,
            actors: updatedActors,
          }
        }),
      }))

      newState = {
        ...state,
        notifications: [moveActorNotification, batchMoveNotification, ...state.notifications],
        projects: updatedProjects,
      }
      break
    }

    case "REORDER_MULTIPLE_ACTORS": {
      const { characterId, listType, listKey, shortlistId, actorIds, targetActorId, insertPosition } = action.payload

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            const updatedActors = { ...character.actors }

            // Get the appropriate list
            let targetList: any[] = []
            if (listType === "shortlist" && shortlistId) {
              const shortlistIndex = updatedActors.shortLists.findIndex((sl) => sl.id === shortlistId)
              if (shortlistIndex === -1) return character
              targetList = [...updatedActors.shortLists[shortlistIndex].actors]
            } else if (listType === "standard" || listType === "custom") {
              targetList = [...safeArray(updatedActors[listKey as keyof typeof updatedActors] as any[])]
            } else {
              return character
            }

            // Find target index
            const targetIndex = targetList.findIndex((a) => a.id === targetActorId)
            if (targetIndex === -1) return character

            // Remove all selected actors from the list
            const actorsToMove = targetList.filter((a) => actorIds.includes(a.id))
            const remainingActors = targetList.filter((a) => !actorIds.includes(a.id))

            // Find new target index after removal
            const newTargetIndex = remainingActors.findIndex((a) => a.id === targetActorId)
            if (newTargetIndex === -1) return character

            // Insert actors at new position
            const insertIndex = insertPosition === "before" ? newTargetIndex : newTargetIndex + 1
            remainingActors.splice(insertIndex, 0, ...actorsToMove)

            // Update sort order for all actors in the list
            remainingActors.forEach((actor, index) => {
              actor.sortOrder = index
            })

            // Update the appropriate list
            if (listType === "shortlist" && shortlistId) {
              const shortlistIndex = updatedActors.shortLists.findIndex((sl) => sl.id === shortlistId)
              updatedActors.shortLists[shortlistIndex] = {
                ...updatedActors.shortLists[shortlistIndex],
                actors: remainingActors,
              }
            } else if (listType === "standard" || listType === "custom") {
              updatedActors[listKey as keyof typeof updatedActors] = remainingActors as any
            }

            return {
              ...character,
              actors: updatedActors,
            }
          }),
        })),
      }
      break
    }

    case "UPDATE_CARD_SETTINGS":
      newState = {
        ...state,
        cardViewSettings: {
          ...state.cardViewSettings,
          [action.payload.field]: action.payload.value,
        },
      }
      break

    case "CREATE_PROJECT":
      // Ensure new projects have default terminology
      const newProject = {
        ...action.payload,
        terminology: getDefaultTerminology(),
      }

      newState = {
        ...state,
        projects: [newProject, ...state.projects],
      }
      break

    case "UPDATE_PROJECT":
      newState = {
        ...state,
        projects: state.projects.map((project) => (project.id === action.payload.id ? action.payload : project)),
      }
      break

    case "SET_PROJECT_PROPS":
      newState = {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, props: action.payload.props }
            : project
        ),
      }
      break

    case "SET_PROJECT_LOCATIONS":
      newState = {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, locations: action.payload.locations }
            : project
        ),
      }
      break

    case "SET_PROP_PURCHASE_REQUESTS":
      newState = {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, propPurchaseRequests: action.payload.requests }
            : project
        ),
      }
      break

    case "SET_PROJECT_COSTUMES":
      newState = {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, costumes: action.payload.costumes }
            : project
        ),
      }
      break

    case "SET_PROJECT_PROP_INVENTORY":
      newState = {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, propInventory: action.payload.inventory }
            : project
        ),
      }
      break

    case "SET_PROJECT_LOCATION_INVENTORY":
      newState = {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, locationInventory: action.payload.inventory }
            : project
        ),
      }
      break

    case "SET_PROJECT_SCRIPT":
      newState = {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, script: action.payload.script }
            : project
        ),
      }
      break

    case "DELETE_PROJECT":
      newState = {
        ...state,
        projects: state.projects.filter((project) => project.id !== action.payload),
        // If deleting current project, switch to first available project
        currentFocus:
          state.currentFocus.currentProjectId === action.payload
            ? {
                ...state.currentFocus,
                currentProjectId: state.projects.find((p) => p.id !== action.payload)?.id || null,
                characterId: null,
                activeTabKey: "longList",
              }
            : state.currentFocus,
      }
      break

    case "OPEN_MODAL":
      newState = {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.type]: {
            isOpen: true,
            props: action.payload.props || {},
          },
        },
      }
      break

    case "CLOSE_MODAL":
      newState = {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: {
            isOpen: false,
            props: {},
          },
        },
      }
      break

    case "ADD_NOTIFICATION":
      newState = {
        ...state,
        notifications: [action.payload, ...state.notifications],
      }
      break

    case "MARK_NOTIFICATION_READ":
      newState = {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload ? { ...notification, read: true } : notification,
        ),
      }
      break

    case "MARK_ALL_NOTIFICATIONS_READ":
      newState = {
        ...state,
        notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
      }
      break

    case "DELETE_NOTIFICATION":
      newState = {
        ...state,
        notifications: state.notifications.filter((notification) => notification.id !== action.payload),
      }
      break

    case "DELETE_SELECTED_NOTIFICATIONS":
      newState = {
        ...state,
        notifications: state.notifications.filter((notification) => !action.payload.includes(notification.id)),
      }
      break

    case "MOVE_ACTOR_TO_CHARACTER": {
      const { actorId, sourceCharacterId, destinationCharacterId } = action.payload

      // Find the actor to move from the source character
      let actorToMove: any = null
      let sourceLocation: any = null

      const updatedProjects = state.projects.map((project) => {
        const updatedCharacters = project.characters.map((character) => {
          if (character.id === sourceCharacterId) {
            // Find and remove actor from source character
            const updatedActors = { ...character.actors }

            // Check all possible locations for the actor
            // Standard lists
            for (const listKey of ["longList", "audition", "approval"]) {
              const list = safeArray(updatedActors[listKey as keyof typeof updatedActors] as any[])
              const actorIndex = list.findIndex((a) => a.id === actorId)
              if (actorIndex !== -1) {
                actorToMove = list[actorIndex]
                sourceLocation = { type: "standard", key: listKey }
                updatedActors[listKey as keyof typeof updatedActors] = list.filter((a) => a.id !== actorId)
                break
              }
            }

            // Check shortlists if not found in standard lists
            if (!actorToMove) {
              updatedActors.shortLists = updatedActors.shortLists.map((sl) => {
                const actorIndex = sl.actors.findIndex((a) => a.id === actorId)
                if (actorIndex !== -1) {
                  actorToMove = sl.actors[actorIndex]
                  sourceLocation = { type: "shortlist", shortlistId: sl.id }
                  return { ...sl, actors: sl.actors.filter((a) => a.id !== actorId) }
                }
                return sl
              })
            }

            // Check custom tabs if not found elsewhere
            if (!actorToMove) {
              Object.keys(updatedActors).forEach((key) => {
                if (
                  !["longList", "audition", "approval", "shortLists"].includes(key) &&
                  Array.isArray(updatedActors[key])
                ) {
                  const list = safeArray(updatedActors[key] as any[])
                  const actorIndex = list.findIndex((a) => a.id === actorId)
                  if (actorIndex !== -1) {
                    actorToMove = list[actorIndex]
                    sourceLocation = { type: "custom", key }
                    updatedActors[key] = list.filter((a) => a.id !== actorId)
                  }
                }
              })
            }

            return {
              ...character,
              actors: updatedActors,
            }
          } else if (character.id === destinationCharacterId && actorToMove) {
            // Add actor to destination character's long list
            const resetActor = {
              ...actorToMove,
              currentListKey: "longList",
              currentShortlistId: undefined,
              userVotes: {}, // Reset votes for new character
              consensusAction: null,
              isSoftRejected: false,
              isGreenlit: false,
              isCast: false,
            }

            return {
              ...character,
              actors: {
                ...character.actors,
                longList: [resetActor, ...character.actors.longList],
              },
            }
          }
          return character
        })

        return {
          ...project,
          characters: updatedCharacters,
        }
      })

      if (actorToMove) {
        // Find character names for notification
        const sourceCharacter = state.projects.flatMap((p) => p.characters).find((c) => c.id === sourceCharacterId)
        const destinationCharacter = state.projects
          .flatMap((p) => p.characters)
          .find((c) => c.id === destinationCharacterId)

        const moveNotification = {
          id: `move-character-${Date.now()}-${Math.random()}`,
          type: "user" as const,
          title: "Actor Moved to Different Character",
          message: `${actorToMove.name} was moved from ${sourceCharacter?.name || "Unknown"} to ${destinationCharacter?.name || "Unknown"}`,
          timestamp: Date.now(),
          read: false,
          priority: "medium" as const,
          actorId: actorId,
          characterId: destinationCharacterId,
        }

        newState = {
          ...state,
          notifications: [moveNotification, ...state.notifications],
          projects: updatedProjects,
        }
      } else {
        newState = state
      }
      break
    }

    case "DELETE_ACTOR": {
      const { actorId, characterId } = action.payload

      // Find the actor name for the notification
      let actorName = "Unknown Actor"
      const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
      const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)

      if (currentCharacter) {
        const allActors = [
          ...currentCharacter.actors.longList,
          ...currentCharacter.actors.audition,
          ...currentCharacter.actors.approval,
          ...currentCharacter.actors.shortLists.flatMap((sl) => sl.actors),
        ]
        const actor = allActors.find((a) => a.id === actorId)
        if (actor) actorName = actor.name
      }

      const deleteNotification = {
        id: `delete-actor-${Date.now()}-${Math.random()}`,
        type: "user" as const,
        title: "Actor Deleted",
        message: `${actorName} was removed from ${currentCharacter?.name || "Unknown Character"}`,
        timestamp: Date.now(),
        read: false,
        priority: "low" as const,
        characterId: characterId,
      }

      newState = {
        ...state,
        notifications: [deleteNotification, ...state.notifications],
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            const removeActorFromList = (actors: any[]) => actors.filter((actor) => actor.id !== actorId)

            return {
              ...character,
              actors: {
                ...character.actors,
                longList: removeActorFromList(character.actors.longList),
                audition: removeActorFromList(character.actors.audition),
                approval: removeActorFromList(character.actors.approval),
                shortLists: character.actors.shortLists.map((sl) => ({
                  ...sl,
                  actors: removeActorFromList(sl.actors),
                })),
                // Handle custom tabs
                ...Object.fromEntries(
                  Object.entries(character.actors)
                    .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                    .map(([key, actors]) => [key, Array.isArray(actors) ? removeActorFromList(actors) : actors]),
                ),
              },
            }
          }),
        })),
      }
      break
    }

    case "ADD_NOTE": {
      const { actorId, characterId, note } = action.payload

      console.log("📝 CastingContext: ADD_NOTE action received:", { actorId, characterId, note })

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            const updateActorNotes = (actors: any[]) =>
              actors.map((actor) => {
                if (actor.id === actorId) {
                  const updatedActor = { ...actor, notes: [...(actor.notes || []), note] }
                  console.log(
                    "✅ CastingContext: Added note to actor:",
                    updatedActor.name,
                    "Notes count:",
                    updatedActor.notes.length,
                  )
                  return updatedActor
                }
                return actor
              })

            return {
              ...character,
              actors: {
                ...character.actors,
                longList: updateActorNotes(character.actors.longList),
                audition: updateActorNotes(character.actors.audition),
                approval: updateActorNotes(character.actors.approval),
                shortLists: character.actors.shortLists.map((sl) => ({
                  ...sl,
                  actors: updateActorNotes(sl.actors),
                })),
                // Handle custom tabs
                ...Object.fromEntries(
                  Object.entries(character.actors)
                    .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                    .map(([key, actors]) => [key, Array.isArray(actors) ? updateActorNotes(actors) : actors]),
                ),
              },
            }
          }),
        })),
      }
      break
    }

    case "UPDATE_NOTE": {
      const { actorId, characterId, noteId, text } = action.payload

      console.log("📝 CastingContext: UPDATE_NOTE action received:", { actorId, characterId, noteId, text })

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            const updateActorNotes = (actors: any[]) =>
              actors.map((actor) => {
                if (actor.id === actorId) {
                  const updatedActor = {
                    ...actor,
                    notes: (actor.notes || []).map((note: any) => (note.id === noteId ? { ...note, text } : note)),
                  }
                  console.log("✅ CastingContext: Updated note for actor:", updatedActor.name)
                  return updatedActor
                }
                return actor
              })

            return {
              ...character,
              actors: {
                ...character.actors,
                longList: updateActorNotes(character.actors.longList),
                audition: updateActorNotes(character.actors.audition),
                approval: updateActorNotes(character.actors.approval),
                shortLists: character.actors.shortLists.map((sl) => ({
                  ...sl,
                  actors: updateActorNotes(sl.actors),
                })),
                // Handle custom tabs
                ...Object.fromEntries(
                  Object.entries(character.actors)
                    .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                    .map(([key, actors]) => [key, Array.isArray(actors) ? updateActorNotes(actors) : actors]),
                ),
              },
            }
          }),
        })),
      }
      break
    }

    case "DELETE_NOTE": {
      const { actorId, characterId, noteId } = action.payload

      console.log("📝 CastingContext: DELETE_NOTE action received:", { actorId, characterId, noteId })

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            const updateActorNotes = (actors: any[]) =>
              actors.map((actor) => {
                if (actor.id === actorId) {
                  const updatedActor = {
                    ...actor,
                    notes: (actor.notes || []).filter((note: any) => note.id !== noteId),
                  }
                  console.log(
                    "✅ CastingContext: Deleted note from actor:",
                    updatedActor.name,
                    "Notes count:",
                    updatedActor.notes.length,
                  )
                  return updatedActor
                }
                return actor
              })

            return {
              ...character,
              actors: {
                ...character.actors,
                longList: updateActorNotes(character.actors.longList),
                audition: updateActorNotes(character.actors.audition),
                approval: updateActorNotes(character.actors.approval),
                shortLists: character.actors.shortLists.map((sl) => ({
                  ...sl,
                  actors: updateActorNotes(sl.actors),
                })),
                // Handle custom tabs
                ...Object.fromEntries(
                  Object.entries(character.actors)
                    .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                    .map(([key, actors]) => [key, Array.isArray(actors) ? updateActorNotes(actors) : actors]),
                ),
              },
            }
          }),
        })),
      }
      break
    }

    case "REORDER_ACTORS": {
      const { characterId, listType, listKey, shortlistId, draggedActorId, targetActorId, insertPosition } =
        action.payload

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            const updatedActors = { ...character.actors }

            // Get the appropriate list
            let targetList: any[] = []
            if (listType === "shortlist" && shortlistId) {
              const shortlistIndex = updatedActors.shortLists.findIndex((sl) => sl.id === shortlistId)
              if (shortlistIndex === -1) return character
              targetList = [...updatedActors.shortLists[shortlistIndex].actors]
            } else if (listType === "standard" || listType === "custom") {
              targetList = [...safeArray(updatedActors[listKey as keyof typeof updatedActors] as any[])]
            } else {
              return character
            }

            // Find indices
            const draggedIndex = targetList.findIndex((a) => a.id === draggedActorId)
            const targetIndex = targetList.findIndex((a) => a.id === targetActorId)

            if (draggedIndex === -1 || targetIndex === -1) return character

            // Remove dragged actor
            const draggedActor = targetList[draggedIndex]
            targetList.splice(draggedIndex, 1)

            // Recalculate target index after removal
            const newTargetIndex = targetList.findIndex((a) => a.id === targetActorId)
            if (newTargetIndex === -1) return character

            // Insert at new position
            const insertIndex = insertPosition === "before" ? newTargetIndex : newTargetIndex + 1
            targetList.splice(insertIndex, 0, draggedActor)

            // Update sort order for all actors in the list
            targetList.forEach((actor, index) => {
              actor.sortOrder = index
            })

            // Update the appropriate list
            if (listType === "shortlist" && shortlistId) {
              const shortlistIndex = updatedActors.shortLists.findIndex((sl) => sl.id === shortlistId)
              updatedActors.shortLists[shortlistIndex] = {
                ...updatedActors.shortLists[shortlistIndex],
                actors: targetList,
              }
            } else if (listType === "standard" || listType === "custom") {
              updatedActors[listKey as keyof typeof updatedActors] = targetList
            }

            return {
              ...character,
              actors: updatedActors,
            }
          }),
        })),
      }
      break
    }

    case "ADD_SHORTLIST": {
      const { characterId, group } = action.payload

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            return {
              ...character,
              actors: {
                ...character.actors,
                shortLists: [...character.actors.shortLists, group],
              },
            }
          }),
        })),
      }
      break
    }

    case "DELETE_SHORTLIST": {
      const { characterId, groupId } = action.payload

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            return {
              ...character,
              actors: {
                ...character.actors,
                shortLists: character.actors.shortLists.filter((sl) => sl.id !== groupId),
              },
            }
          }),
        })),
      }
      break
    }

    case "RENAME_SHORTLIST": {
      const { characterId, groupId, updates } = action.payload

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            return {
              ...character,
              actors: {
                ...character.actors,
                shortLists: character.actors.shortLists.map((sl) => (sl.id === groupId ? { ...sl, ...updates } : sl)),
              },
            }
          }),
        })),
      }
      break
    }

    case "ADD_TAB": {
      const { tabKey, tabName } = action.payload

      // Add to tab definitions - insert before "Approval" tab
      const newTabDefinition = {
        key: tabKey,
        name: tabName,
        isCustom: true,
      }

      // Find the index of the "Approval" tab
      const approvalIndex = state.tabDefinitions.findIndex((tab) => tab.key === "approval")

      let updatedTabDefinitions
      if (approvalIndex !== -1) {
        // Insert before the "Approval" tab
        updatedTabDefinitions = [
          ...state.tabDefinitions.slice(0, approvalIndex),
          newTabDefinition,
          ...state.tabDefinitions.slice(approvalIndex),
        ]
      } else {
        // If "Approval" tab not found, add at the end
        updatedTabDefinitions = [...state.tabDefinitions, newTabDefinition]
      }

      // Add empty list to all characters in all projects
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => ({
          ...character,
          actors: {
            ...character.actors,
            [tabKey]: [],
          },
        })),
      }))

      newState = {
        ...state,
        tabDefinitions: updatedTabDefinitions,
        projects: updatedProjects,
      }
      break
    }

    case "RENAME_TAB": {
      const { oldKey, newKey, newName } = action.payload

      // Update tab definitions
      const updatedTabDefinitions = state.tabDefinitions.map((tab) =>
        tab.key === oldKey ? { ...tab, key: newKey, name: newName } : tab,
      )

      // Update all characters in all projects
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => {
          const updatedActors = { ...character.actors }

          // If the key changed, move the actors to the new key
          if (oldKey !== newKey && updatedActors[oldKey]) {
            updatedActors[newKey] = updatedActors[oldKey]
            delete updatedActors[oldKey]
          }

          return {
            ...character,
            actors: updatedActors,
          }
        }),
      }))

      // Update current focus if necessary
      const updatedCurrentFocus = {
        ...state.currentFocus,
        activeTabKey: state.currentFocus.activeTabKey === oldKey ? newKey : state.currentFocus.activeTabKey,
      }

      newState = {
        ...state,
        tabDefinitions: updatedTabDefinitions,
        projects: updatedProjects,
        currentFocus: updatedCurrentFocus,
      }
      break
    }

    case "DELETE_TAB": {
      const { tabKey } = action.payload

      // Don't allow deletion of system tabs
      if (tabKey === "longList" || tabKey === "approval") {
        console.warn("Cannot delete system tabs")
        return state
      }

      // Remove from tab definitions
      const updatedTabDefinitions = state.tabDefinitions.filter((tab) => tab.key !== tabKey)

      // Move all actors from the deleted tab to Long List and remove the tab from all characters
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => {
          const updatedActors = { ...character.actors }

          // Get actors from the tab being deleted
          const actorsToMove = updatedActors[tabKey] || []

          // Move actors to Long List if there are any
          if (Array.isArray(actorsToMove) && actorsToMove.length > 0) {
            // Reset actor states when moving to Long List
            const resetActors = actorsToMove.map((actor: any) => ({
              ...actor,
              currentListKey: "longList",
              currentShortlistId: undefined,
              userVotes: {},
              consensusAction: null,
              isSoftRejected: false,
              isGreenlit: false,
              isCast: false,
            }))

            updatedActors.longList = [...updatedActors.longList, ...resetActors]
          }

          // Remove the deleted tab
          delete updatedActors[tabKey]

          return {
            ...character,
            actors: updatedActors,
          }
        }),
      }))

      // Update current focus if necessary
      const updatedCurrentFocus = {
        ...state.currentFocus,
        activeTabKey: state.currentFocus.activeTabKey === tabKey ? "longList" : state.currentFocus.activeTabKey,
      }

      // Remove custom display name if it exists
      const updatedDisplayNames = { ...state.tabDisplayNames }
      delete updatedDisplayNames[tabKey]

      newState = {
        ...state,
        tabDefinitions: updatedTabDefinitions,
        projects: updatedProjects,
        currentFocus: updatedCurrentFocus,
        tabDisplayNames: updatedDisplayNames,
      }
      break
    }

    case "CREATE_GROUP": {
      const { characterId, group } = action.payload

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            return {
              ...character,
              actors: {
                ...character.actors,
                shortLists: [...character.actors.shortLists, group],
              },
            }
          }),
        })),
      }
      break
    }

    case "UPDATE_GROUP": {
      const { characterId, groupId, updates } = action.payload

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            return {
              ...character,
              actors: {
                ...character.actors,
                shortLists: character.actors.shortLists.map((sl) => (sl.id === groupId ? { ...sl, ...updates } : sl)),
              },
            }
          }),
        })),
      }
      break
    }

    case "DELETE_GROUP": {
      const { characterId, groupId } = action.payload

      newState = {
        ...state,
        projects: state.projects.map((project) => ({
          ...project,
          characters: project.characters.map((character) => {
            if (character.id !== characterId) return character

            return {
              ...character,
              actors: {
                ...character.actors,
                shortLists: character.actors.shortLists.filter((sl) => sl.id !== groupId),
              },
            }
          }),
        })),
      }
      break
    }

    case "ADD_SCHEDULE_ENTRY": {
      newState = {
        ...state,
        scheduleEntries: [...state.scheduleEntries, action.payload],
      }
      break
    }

    case "UPDATE_SCHEDULE_ENTRY": {
      newState = {
        ...state,
        scheduleEntries: state.scheduleEntries.map((entry) =>
          entry.id === action.payload.id ? { ...entry, ...action.payload.updates } : entry,
        ),
      }
      break
    }

    case "DELETE_SCHEDULE_ENTRY": {
      newState = {
        ...state,
        scheduleEntries: state.scheduleEntries.filter((entry) => entry.id !== action.payload),
      }
      break
    }

    case "ADD_SCENE": {
      newState = {
        ...state,
        scenes: [...state.scenes, action.payload],
      }
      break
    }

    case "UPDATE_SCENE": {
      newState = {
        ...state,
        scenes: state.scenes.map((scene) =>
          scene.id === action.payload.id ? { ...scene, ...action.payload.updates } : scene,
        ),
      }
      break
    }

    case "DELETE_SCENE": {
      newState = {
        ...state,
        scenes: state.scenes.filter((scene) => scene.id !== action.payload),
      }
      break
    }

    case "REORDER_SCENES": {
      newState = {
        ...state,
        scenes: action.payload,
      }
      break
    }

    // </CHANGE> Add reducer cases for actor project-character assignments
    case "ASSIGN_ACTOR_TO_PROJECT_CHARACTER": {
      const { actorId, projectId, projectName, characterId, characterName } = action.payload

      // Update all instances of this actor across all projects
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => {
          // Update actor in all lists
          const updateActorInList = (actors: Actor[]) =>
            actors.map((actor) => {
              if (actor.id === actorId) {
                const existingAssignments = actor.projectAssignments || []
                // Check if assignment already exists
                const assignmentExists = existingAssignments.some(
                  (a) => a.projectId === projectId && a.characterId === characterId,
                )

                if (!assignmentExists) {
                  return {
                    ...actor,
                    projectAssignments: [
                      ...existingAssignments,
                      {
                        projectId,
                        projectName,
                        characterId,
                        characterName,
                        assignedDate: Date.now(),
                      },
                    ],
                  }
                }
              }
              return actor
            })

          return {
            ...character,
            actors: {
              ...character.actors,
              longList: Array.isArray(character.actors.longList)
                ? updateActorInList(character.actors.longList)
                : character.actors.longList,
              audition: Array.isArray(character.actors.audition)
                ? updateActorInList(character.actors.audition)
                : character.actors.audition,
              approval: Array.isArray(character.actors.approval)
                ? updateActorInList(character.actors.approval)
                : character.actors.approval,
              shortLists: Array.isArray(character.actors.shortLists)
                ? character.actors.shortLists.map((shortlist) => ({
                    ...shortlist,
                    actors: Array.isArray(shortlist.actors) ? updateActorInList(shortlist.actors) : shortlist.actors,
                  }))
                : character.actors.shortLists,
            },
          }
        }),
      }))

      newState = {
        ...state,
        projects: updatedProjects,
      }
      break
    }

    case "REMOVE_ACTOR_ASSIGNMENT": {
      const { actorId, projectId, characterId } = action.payload

      // Update all instances of this actor across all projects
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => {
          // Update actor in all lists
          const updateActorInList = (actors: Actor[]) =>
            actors.map((actor) => {
              if (actor.id === actorId && actor.projectAssignments) {
                return {
                  ...actor,
                  projectAssignments: actor.projectAssignments.filter(
                    (a) => !(a.projectId === projectId && a.characterId === characterId),
                  ),
                }
              }
              return actor
            })

          return {
            ...character,
            actors: {
              ...character.actors,
              longList: Array.isArray(character.actors.longList)
                ? updateActorInList(character.actors.longList)
                : character.actors.longList,
              audition: Array.isArray(character.actors.audition)
                ? updateActorInList(character.actors.audition)
                : character.actors.audition,
              approval: Array.isArray(character.actors.approval)
                ? updateActorInList(character.actors.approval)
                : character.actors.approval,
              shortLists: Array.isArray(character.actors.shortLists)
                ? character.actors.shortLists.map((shortlist) => ({
                    ...shortlist,
                    actors: Array.isArray(shortlist.actors) ? updateActorInList(shortlist.actors) : shortlist.actors,
                  }))
                : character.actors.shortLists,
            },
          }
        }),
      }))

      newState = {
        ...state,
        projects: updatedProjects,
      }
      break
    }

    case "SET_STATUS_FILTER":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          filters: {
            ...state.currentFocus.filters,
            status: action.payload,
          },
        },
      }
      break

    case "SET_AGE_RANGE_FILTER":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          filters: {
            ...state.currentFocus.filters,
            ageRange: action.payload,
          },
        },
      }
      break

    case "SET_LOCATION_FILTER":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          filters: {
            ...state.currentFocus.filters,
            location: action.payload,
          },
        },
      }
      break

    case "CLEAR_ALL_FILTERS":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          filters: {
            ...state.currentFocus.filters, // Keep existing properties like showFilters
            status: [],
            ageRange: { min: 0, max: 100 },
            location: [],
          },
        },
      }
      break

    // </CHANGE> Add TOGGLE_FILTERS action to toggle filter panel visibility
    case "TOGGLE_FILTERS":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          filters: {
            ...state.currentFocus.filters,
            showFilters: !state.currentFocus.filters.showFilters,
          },
        },
      }
      break

    case "ADD_PRODUCTION_PHASE":
      newState = {
        ...state,
        productionPhases: [...state.productionPhases, action.payload],
      }
      break

    case "UPDATE_PRODUCTION_PHASE":
      newState = {
        ...state,
        productionPhases: state.productionPhases.map((phase) =>
          phase.id === action.payload.id ? { ...phase, ...action.payload.updates } : phase,
        ),
      }
      break

    case "DELETE_PRODUCTION_PHASE":
      newState = {
        ...state,
        productionPhases: state.productionPhases.filter((phase) => phase.id !== action.payload),
        // Also remove any schedule entries associated with this phase
        scheduleEntries: state.scheduleEntries.filter((entry) => entry.phaseId !== action.payload),
      }
      break

    case "SET_SCHEDULE_ENTRIES":
      newState = { ...state, scheduleEntries: action.payload }
      break

    case "SET_SCENES":
      newState = { ...state, scenes: action.payload }
      break

    case "SET_PRODUCTION_PHASES":
      newState = { ...state, productionPhases: action.payload }
      break

    case "ADD_CANVAS_ACTOR": {
      const { projectId, canvasActor } = action.payload

      newState = {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id === projectId) {
            const existingCanvasActors = project.canvasActors || []
            // Check if actor already exists on canvas
            const alreadyOnCanvas = existingCanvasActors.some((ca) => ca.actorId === canvasActor.actorId)

            if (!alreadyOnCanvas) {
              return {
                ...project,
                canvasActors: [...existingCanvasActors, canvasActor],
              }
            }
          }
          return project
        }),
      }
      break
    }

    case "INCREMENT_TAB_NOTIFICATION": {
      const { tabKey, characterId, count = 1 } = action.payload
      const currentUserId = state.currentUser?.id

      if (!currentUserId) {
        newState = state
        break
      }

      const userNotifs = state.tabNotifications[currentUserId] || []
      const existingNotif = userNotifs.find((n) => n.tabKey === tabKey && n.characterId === characterId)

      if (existingNotif) {
        newState = {
          ...state,
          tabNotifications: {
            ...state.tabNotifications,
            [currentUserId]: userNotifs.map((n) =>
              n.tabKey === tabKey && n.characterId === characterId
                ? { ...n, unreadCount: n.unreadCount + count, lastUpdate: Date.now() }
                : n,
            ),
          },
        }
      } else {
        newState = {
          ...state,
          tabNotifications: {
            ...state.tabNotifications,
            [currentUserId]: [
              ...userNotifs,
              {
                tabKey,
                characterId,
                unreadCount: count,
                lastUpdate: Date.now(),
              },
            ],
          },
        }
      }
      break
    }

    case "CLEAR_TAB_NOTIFICATION": {
      const { tabKey, characterId } = action.payload
      const currentUserId = state.currentUser?.id

      if (!currentUserId) {
        newState = state
        break
      }

      const userNotifs = state.tabNotifications[currentUserId] || []
      newState = {
        ...state,
        tabNotifications: {
          ...state.tabNotifications,
          [currentUserId]: userNotifs.filter((n) => !(n.tabKey === tabKey && n.characterId === characterId)),
        },
      }
      break
    }

    case "CLEAR_ALL_TAB_NOTIFICATIONS": {
      const { characterId } = action.payload
      const currentUserId = state.currentUser?.id

      if (!currentUserId) {
        newState = state
        break
      }

      const userNotifs = state.tabNotifications[currentUserId] || []
      newState = {
        ...state,
        tabNotifications: {
          ...state.tabNotifications,
          [currentUserId]: userNotifs.filter((n) => n.characterId !== characterId),
        },
      }
      break
    }

    // </CHANGE> Add handler for UPDATE_CHARACTER_CONCEPT_ART action
    case "UPDATE_CHARACTER_CONCEPT_ART": {
      const { characterId, conceptArt } = action.payload
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((char) => (char.id === characterId ? { ...char, conceptArt } : char)),
      }))
      newState = {
        ...state,
        projects: updatedProjects,
      }
      break
    }

    default:
      newState = state
  }

  // Save to localStorage after every state change (except LOAD_FROM_STORAGE)
  if (action.type !== "LOAD_FROM_STORAGE") {
    if (typeof window !== "undefined") {
      saveToLocalStorage(newState)
    }
  }

  return newState
}

// Helper function to get current player view list
function getCurrentPlayerViewList(state: CastingState) {
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

  if (!currentCharacter) return []

  const { activeTabKey } = state.currentFocus

  if (activeTabKey === "shortLists") {
    return currentCharacter.actors.shortLists.flatMap((sl) => sl.actors)
  }

  return currentCharacter.actors[activeTabKey] || []
}

export function CastingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(castingReducer, getInitialState())

// Load from localStorage on mount
  useEffect(() => {
  const savedState = loadFromLocalStorage()
  if (savedState) {
  dispatch({ type: "LOAD_FROM_STORAGE", payload: savedState })
  } else {
  // If no saved state, ensure currentUser is set
  const initialState = getInitialState()
  dispatch({ type: "SET_CURRENT_USER", payload: initialState.users[0] })
  }
  }, [])

  // Save immediately before page unload to ensure no data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToLocalStorageImmediate(state)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [state])

  return <CastingContext.Provider value={{ state, dispatch }}>{children}</CastingContext.Provider>
}

export function useCasting() {
  const context = useContext(CastingContext)
  if (!context) {
    throw new Error("useCasting must be used within a CastingProvider")
  }
  return context
}

// Export helper functions
export { getCurrentTerminology, getTabDisplayName }
