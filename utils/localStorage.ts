const STORAGE_KEY = "gogreenlight-casting-state"

let saveTimeout: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_DELAY = 500

export function saveToLocalStorage(state: unknown): void {
  try {
    if (typeof window === "undefined") return

    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(() => {
      try {
        const stateToSave = {
          ...(state as Record<string, unknown>),
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

export function saveToLocalStorageImmediate(state: unknown): void {
  try {
    if (typeof window === "undefined") return

    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }

    const stateToSave = {
      ...(state as Record<string, unknown>),
      modals: {},
    }
    const serializedState = JSON.stringify(stateToSave)
    localStorage.setItem(STORAGE_KEY, serializedState)
  } catch (error) {
    console.warn("Failed to save state to localStorage:", error)
  }
}

export function loadFromLocalStorage(): unknown | null {
  try {
    if (typeof window === "undefined") return null

    const serializedState = localStorage.getItem(STORAGE_KEY)
    if (serializedState === null) return null

    const parsedState = JSON.parse(serializedState)

    if (!parsedState || typeof parsedState !== "object") {
      console.warn("Invalid state structure in localStorage")
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
