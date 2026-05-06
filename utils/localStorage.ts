const STORAGE_KEY = "gogreenlight-casting-state"

// Debounce timer for saving to localStorage
let saveTimeout: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_DELAY = 500 // milliseconds

export function saveToLocalStorage(state: any): void {
  try {
    // Only save if we're in the browser
    if (typeof window === "undefined") return

    // Clear any pending save
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    // Debounce the save operation to prevent excessive writes
    saveTimeout = setTimeout(() => {
      try {
        // Create a clean copy of the state for storage
        const stateToSave = {
          ...state,
          // Don't save temporary UI state
          currentFocus: {
            ...state.currentFocus,
            playerView: {
              ...state.currentFocus.playerView,
              isOpen: false, // Don't persist open player view
            },
          },
          // Don't save modal states
          modals: {},
        }

        const serializedState = JSON.stringify(stateToSave)
        localStorage.setItem(STORAGE_KEY, serializedState)
      } catch (error) {
        console.warn("Failed to save state to localStorage:", error)
      }
    }, DEBOUNCE_DELAY)
  } catch (error) {
    console.warn("Failed to schedule localStorage save:", error)
  }
}

// Immediate save for critical operations (like before page unload)
export function saveToLocalStorageImmediate(state: any): void {
  try {
    if (typeof window === "undefined") return

    // Clear any pending debounced save
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }

    const stateToSave = {
      ...state,
      currentFocus: {
        ...state.currentFocus,
        playerView: {
          ...state.currentFocus.playerView,
          isOpen: false,
        },
      },
      modals: {},
    }

    const serializedState = JSON.stringify(stateToSave)
    localStorage.setItem(STORAGE_KEY, serializedState)
  } catch (error) {
    console.warn("Failed to save state to localStorage:", error)
  }
}

export function loadFromLocalStorage(): any | null {
  try {
    // Only load if we're in the browser
    if (typeof window === "undefined") return null

    const serializedState = localStorage.getItem(STORAGE_KEY)
    if (serializedState === null) return null

    const parsedState = JSON.parse(serializedState)

    // Validate that the loaded state has the expected structure
    if (!parsedState || typeof parsedState !== "object") {
      console.warn("Invalid state structure in localStorage")
      return null
    }

    // Ensure required properties exist
    if (!parsedState.projects || !Array.isArray(parsedState.projects)) {
      console.warn("Invalid projects data in localStorage")
      return null
    }

    return parsedState
  } catch (error) {
    console.warn("Failed to load state from localStorage:", error)
    return null
  }
}

export function clearLocalStorage(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn("Failed to clear localStorage:", error)
  }
}

export function getStorageSize(): string {
  try {
    if (typeof window === "undefined") return "0 KB"

    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return "0 KB"

    const sizeInBytes = new Blob([data]).size
    const sizeInKB = (sizeInBytes / 1024).toFixed(2)

    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`
    } else if (sizeInBytes < 1024 * 1024) {
      return `${sizeInKB} KB`
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
    }
  } catch (error) {
    console.warn("Failed to calculate storage size:", error)
    return "Unknown"
  }
}

export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false

    const testKey = "__localStorage_test__"
    localStorage.setItem(testKey, "test")
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}
