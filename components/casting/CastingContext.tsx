"use client"

import type React from "react"
import { createContext, type ReactNode, useReducer, useEffect, useContext } from "react"
import type { CastingState, CastingAction, User } from "@/types/casting"
import { saveToLocalStorage, clearLocalStorage, loadFromLocalStorage } from "@/utils/localStorage"
import { MOCK_SCHEDULE_ENTRIES, MOCK_SCENES, MOCK_PRODUCTION_PHASES } from "@/data/mockScriptAndSchedule"

const CastingContext = createContext<{
  state: CastingState
  dispatch: React.Dispatch<CastingAction>
} | null>(null)

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
    ],
    currentUser: null,
    projects: [],
    notifications: [],
    tabDefinitions: [
      { key: "longList", name: "Long List", isCustom: false },
      { key: "audition", name: "Audition", isCustom: false },
      { key: "approval", name: "Approval", isCustom: false },
    ],
    predefinedStatuses: [
      { id: "available", label: "Available", bgColor: "bg-green-200", textColor: "text-green-700", category: "availability" },
      { id: "busy", label: "Busy", bgColor: "bg-yellow-200", textColor: "text-yellow-700", category: "availability" },
      { id: "unavailable", label: "Unavailable", bgColor: "bg-red-200", textColor: "text-red-700", category: "availability" },
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
        showFilters: false,
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
    ],
    terminology: {
      actor: { singular: "Actor", plural: "Actors" },
      character: { singular: "Character", plural: "Characters" },
    },
    tabDisplayNames: {},
    scheduleEntries: MOCK_SCHEDULE_ENTRIES,
    scenes: MOCK_SCENES,
    productionPhases: MOCK_PRODUCTION_PHASES,
  }
}

function castingReducer(state: CastingState, action: CastingAction): CastingState {
  let newState = state

  switch (action.type) {
    case "LOAD_FROM_STORAGE":
      return { ...getInitialState(), ...action.payload }

    case "CLEAR_CACHE":
      clearLocalStorage()
      const initialState = getInitialState()
      return {
        ...initialState,
        currentUser: initialState.users[0],
        notifications: [{
          id: `cache-cleared-${Date.now()}`,
          type: "system",
          title: "Cache Cleared",
          message: "All cached data has been cleared.",
          timestamp: Date.now(),
          read: false,
          priority: "medium",
        }],
      }

    case "LOAD_DEMO_DATA":
      newState = { ...getInitialState(), ...action.payload }
      break

    case "SET_CURRENT_USER":
      newState = { ...state, currentUser: action.payload }
      break

    case "UPDATE_USER":
      const updatedUsers = state.users.map((user) =>
        user.id === action.payload.userId ? { ...user, ...action.payload.updates } : user
      )
      newState = {
        ...state,
        users: updatedUsers,
        currentUser: state.currentUser?.id === action.payload.userId
          ? { ...state.currentUser, ...action.payload.updates }
          : state.currentUser,
      }
      break

    case "SELECT_PROJECT":
      newState = {
        ...state,
        currentFocus: { ...state.currentFocus, currentProjectId: action.payload },
      }
      break

    case "SELECT_CHARACTER":
      newState = {
        ...state,
        currentFocus: { ...state.currentFocus, characterId: action.payload },
      }
      break

    case "SELECT_TAB":
      newState = {
        ...state,
        currentFocus: { ...state.currentFocus, activeTabKey: action.payload },
      }
      break

    case "SET_SEARCH_TERM":
      newState = {
        ...state,
        currentFocus: { ...state.currentFocus, searchTerm: action.payload },
      }
      break

    case "SET_VIEW_MODE":
      newState = {
        ...state,
        currentFocus: { ...state.currentFocus, cardDisplayMode: action.payload },
      }
      break

    case "SET_SORT_OPTION":
      newState = {
        ...state,
        currentFocus: { ...state.currentFocus, currentSortOption: action.payload },
      }
      break

    case "CREATE_PROJECT":
      newState = {
        ...state,
        projects: [...state.projects, action.payload],
      }
      break

    case "UPDATE_PROJECT":
      newState = {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      }
      break

    case "DELETE_PROJECT":
      newState = {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
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
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      }
      break

    case "MARK_ALL_NOTIFICATIONS_READ":
      newState = {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }
      break

    case "UPDATE_TAB_DEFINITIONS":
      newState = { ...state, tabDefinitions: action.payload }
      break

    default:
      return state
  }

  // Save to localStorage after state changes
  saveToLocalStorage(newState)
  return newState
}

export function CastingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(castingReducer, getInitialState())

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = loadFromLocalStorage()
    if (savedState) {
      dispatch({ type: "LOAD_FROM_STORAGE", payload: savedState as CastingState })
    } else {
      // Set default user if no saved state
      dispatch({ type: "SET_CURRENT_USER", payload: getInitialState().users[0] })
    }
  }, [])

  // Set current user if not set
  useEffect(() => {
    if (!state.currentUser && state.users.length > 0) {
      dispatch({ type: "SET_CURRENT_USER", payload: state.users[0] })
    }
  }, [state.currentUser, state.users])

  return (
    <CastingContext.Provider value={{ state, dispatch }}>
      {children}
    </CastingContext.Provider>
  )
}

export function useCasting() {
  const context = useContext(CastingContext)
  if (!context) {
    throw new Error("useCasting must be used within a CastingProvider")
  }
  return context
}
