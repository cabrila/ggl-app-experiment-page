import type { AvailabilityDate, ScheduleEntry, ProductionPhase, Scene } from "./schedule"

export interface Actor {
  id: string
  name: string
  age?: string
  playingAge?: string
  location?: string
  agent?: string
  gender?: string
  ethnicity?: string
  contactPhone?: string
  contactEmail?: string
  skills?: string[]
  availability?: string[] | AvailabilityDate[]
  availabilityDates?: AvailabilityDate[]
  headshots: string[]
  currentCardHeadshotIndex: number
  userVotes: Record<string, "yes" | "no" | "maybe">
  isSoftRejected: boolean
  isGreenlit: boolean
  isCast?: boolean
  currentListKey: string
  currentShortlistId?: string
  statuses: ActorStatus[]
  notes?: Note[]
  dateAdded?: number
  sortOrder?: number
  consensusAction?: {
    type: "yes" | "no" | "stay"
    targetKey?: string
    targetName?: string
    isGreenlit?: boolean
  }
  submissionId?: string
  submissionSource?: "form" | "manual" | "import"
  submissionVideos?: Array<{
    url: string
    embedUrl: string
    platform: string
    videoPassword?: string
  }>
}

export interface ActorStatus {
  id: string
  label: string
  bgColor: string
  textColor: string
  isCustom: boolean
}

export interface Note {
  id?: string
  userId: string
  userName: string
  timestamp: number
  text: string
}

export interface User {
  id: string
  name: string
  initials: string
  email: string
  role: string
  bgColor: string
  color: string
}

export interface Notification {
  id: string
  type: "system" | "user" | "casting" | "approval"
  title: string
  message: string
  timestamp: number
  read: boolean
  priority: "low" | "medium" | "high"
  relatedTabKey?: string
  relatedActorId?: string
  relatedProjectId?: string
  relatedCharacterId?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

export interface TabDefinition {
  key: string
  name: string
  isCustom: boolean
}

export interface Status {
  id: string
  label: string
  bgColor: string
  textColor: string
  category?: string
}

export interface PermissionLevel {
  id: string
  label: string
  description: string
}

export interface CurrentFocus {
  currentProjectId: string | null
  characterId: string | null
  activeTabKey: string
  cardDisplayMode: "detailed" | "compact" | "player"
  currentSortOption: string
  searchTerm: string
  searchTags: SearchTag[]
  savedSearches: SavedSearch[]
  filters: {
    showFilters: boolean
    status: string[]
    ageRange: { min: number; max: number }
    location: string[]
  }
  playerView: {
    isOpen: boolean
    currentIndex: number
    currentHeadshotIndex: number
  }
}

export interface SearchTag {
  id: string
  type: string
  value: string
  label: string
}

export interface SavedSearch {
  id: string
  name: string
  tags: SearchTag[]
  isGlobal?: boolean
}

export interface CardViewSettings {
  age: boolean
  playingAge: boolean
  location: boolean
  agent: boolean
  imdbUrl: boolean
  status: boolean
  skills: boolean
  notes: boolean
  showVotes: boolean
  showActionButtons: boolean
  mediaAndNotes: boolean
  showProgress: boolean
  showTags: boolean
}

export interface SortOption {
  key: string
  label: string
}

export interface Terminology {
  actor: {
    singular: string
    plural: string
  }
  character: {
    singular: string
    plural: string
  }
}

export interface Character {
  id: string
  name: string
  description?: string
  age?: string
  gender?: string
  ethnicity?: string
  castingNotes?: string
  actors: {
    longList: Actor[]
    audition?: Actor[]
    approval?: Actor[]
    shortLists: ShortList[]
    [key: string]: Actor[] | ShortList[] | undefined
  }
}

export interface ShortList {
  id: string
  name: string
  actors: Actor[]
}

export interface Project {
  id: string
  name: string
  details?: {
    type?: string
    productionCompany?: string
    director?: string
    producer?: string
    scriptLink?: string
    description?: string
  }
  createdDate: number
  modifiedDate: number
  projectUsers?: Array<{
    userId: string
    permissionLevel: string
  }>
  characters: Character[]
  terminology?: Terminology
}

export interface CastingState {
  users: User[]
  currentUser: User | null
  projects: Project[]
  notifications: Notification[]
  tabDefinitions: TabDefinition[]
  predefinedStatuses: Status[]
  permissionLevels: PermissionLevel[]
  currentFocus: CurrentFocus
  modals: { [key: string]: { isOpen: boolean; props: unknown } }
  cardViewSettings: CardViewSettings
  sortOptionDefinitions: SortOption[]
  terminology: Terminology
  tabDisplayNames: { [tabKey: string]: string }
  scheduleEntries: ScheduleEntry[]
  productionPhases: ProductionPhase[]
  scenes: Scene[]
  filters?: {
    status: string[]
    ageRange: { min: number; max: number }
    location: string[]
    showFilters: boolean
  }
}

export type CastingAction =
  | { type: "LOAD_FROM_STORAGE"; payload: CastingState }
  | { type: "CLEAR_CACHE" }
  | { type: "LOAD_DEMO_DATA"; payload: CastingState }
  | { type: "SET_CURRENT_USER"; payload: User }
  | { type: "UPDATE_USER"; payload: { userId: string; updates: Partial<User> } }
  | { type: "SELECT_PROJECT"; payload: string }
  | { type: "SELECT_CHARACTER"; payload: string }
  | { type: "SELECT_TAB"; payload: string }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: "detailed" | "compact" | "player" }
  | { type: "SET_SORT_OPTION"; payload: string }
  | { type: "OPEN_PLAYER_VIEW"; payload?: { actorIndex: number } }
  | { type: "CLOSE_PLAYER_VIEW" }
  | { type: "NAVIGATE_PLAYER_VIEW"; payload: number }
  | { type: "SET_PLAYER_HEADSHOT"; payload: number }
  | { type: "ADD_ACTOR"; payload: { actor: Actor; characterId: string } }
  | { type: "ADD_CHARACTER"; payload: { character: Character; projectId: string } }
  | { type: "UPDATE_CHARACTER"; payload: { character: Character; projectId: string } }
  | { type: "DELETE_CHARACTER"; payload: string }
  | { type: "UPDATE_ACTOR"; payload: { actorId: string; characterId: string; updates: Partial<Actor> } }
  | { type: "CREATE_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: Project }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "UPDATE_TAB_DEFINITIONS"; payload: TabDefinition[] }
