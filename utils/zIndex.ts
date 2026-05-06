// Z-index management constants for consistent modal layering
export const Z_INDEX = {
  // Base application layers
  BASE: 0,
  SIDEBAR: 10,
  HEADER: 20,
  DROPDOWN: 30,
  TOOLTIP: 40,

  // Modal layers
  MODAL_BACKDROP: 50,
  MODAL_CONTENT: 60,

  // Player view layers
  PLAYER_VIEW_BACKDROP: 70,
  PLAYER_VIEW_CONTENT: 80,

  // Critical modals that must appear above everything
  CRITICAL_MODAL_BACKDROP: 90,
  CRITICAL_MODAL_CONTENT: 100,

  // Photo viewer - must be above all Player View elements including the Player View Modal
  PHOTO_VIEWER: 9997,

  // CoPilot - persistent, always visible above all content including modals
  COPILOT: 9998,

  // Absolute top layer for system alerts
  SYSTEM_ALERT: 9999,
} as const

export type ZIndexLevel = (typeof Z_INDEX)[keyof typeof Z_INDEX]

// Helper function to get z-index for modal types
export function getModalZIndex(modalType: string): ZIndexLevel {
  switch (modalType) {
    case "photoViewer":
      // Photo viewer must always be on top of Player View and all other modals
      return Z_INDEX.PHOTO_VIEWER
    case "moveActor":
    case "moveActorToCharacter":
    case "confirmDelete":
      return Z_INDEX.CRITICAL_MODAL_CONTENT
    case "playerView":
      return Z_INDEX.PLAYER_VIEW_CONTENT
    case "playerViewActions":
      return Z_INDEX.CRITICAL_MODAL_CONTENT
    default:
      return Z_INDEX.MODAL_CONTENT
  }
}

export function getBackdropZIndex(modalType: string): ZIndexLevel {
  switch (modalType) {
    case "moveActor":
    case "moveActorToCharacter":
    case "confirmDelete":
    case "playerViewActions":
      return Z_INDEX.CRITICAL_MODAL_BACKDROP
    case "playerView":
      return Z_INDEX.PLAYER_VIEW_BACKDROP
    default:
      return Z_INDEX.MODAL_BACKDROP
  }
}
