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
  isCast: boolean
  currentListKey: string
  currentShortlistId?: string
  statuses: ActorStatus[]
  notes?: Note[]
  dateAdded: number
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
  readyForApproval?: boolean
  approvalMoveDate?: number
  lastContactDate?: number
  lastContactType?: string
  projectAssignments?: Array<{
    projectId: string
    projectName: string
    characterId: string
    characterName: string
    assignedDate: number
  }>
  vimeoVideos?: Array<{
    id: string
    url: string
    videoId: string
    platform: "vimeo" | "youtube"
    title?: string
    taggedActorNames?: string[]
    isTagged?: boolean
    markIn?: number
    markOut?: number
    duration?: number
    videoPassword?: string
  }>
  youtubeVideos?: Array<{
    id: string
    url: string
    videoId: string
    platform: "youtube"
    title?: string
    taggedActorNames?: string[]
    isTagged?: boolean
    markIn?: number
    markOut?: number
    duration?: number
    videoPassword?: string
  }>
  /** Communication history for this actor */
  messageHistory?: MessageHistoryItem[]
}

export interface MessageHistoryItem {
  id: string
  /** "outgoing" = sent by production team, "incoming" = reply from actor/agent */
  direction: "outgoing" | "incoming"
  senderName: string
  senderRole?: string
  subject: string
  body: string
  timestamp: number
  templateUsed?: string
  /** Which character role this message relates to */
  characterName?: string
  read?: boolean
}

export interface TabNotification {
  tabKey: string
  characterId: string
  unreadCount: number
  lastUpdate: number
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
  modals: { [key: string]: { isOpen: boolean; props: any } }
  cardViewSettings: CardViewSettings
  sortOptionDefinitions: SortOption[]
  terminology: Terminology
  tabDisplayNames: { [tabKey: string]: string }
  scheduleEntries: ScheduleEntry[]
  productionPhases: ProductionPhase[]
  scenes: Scene[]
  tabNotifications: Record<string, TabNotification[]>
}

export type CastingAction =
  | { type: "UPDATE_TAB_DISPLAY_NAME"; payload: { tabKey: string; displayName: string } }
  | { type: "RESET_TAB_DISPLAY_NAME"; payload: { tabKey: string } }
  | {
      type: "REORDER_TABS"
      payload: { draggedTabKey: string; targetTabKey: string; insertPosition: "before" | "after" }
    }
  | { type: "UPDATE_PROJECT_TERMINOLOGY"; payload: { type: string; form: string; value: string } }
  | { type: "UPDATE_TERMINOLOGY"; payload: { type: string; form: string; value: string } }
  | { type: "LOAD_FROM_STORAGE"; payload: any }
  | { type: "CLEAR_CACHE" }
  | { type: "LOAD_DEMO_DATA"; payload: any }
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
  | { type: "CAST_VOTE"; payload: { actorId: string; characterId: string; vote: string; userId: string } }
  | {
    type: "ADD_CONTACT_STATUS"
    payload: { actorIds: string[]; characterId: string; contactType: string; templateName: string; timestamp: number; emailSubject?: string; emailBody?: string }
    }
  | { type: "ADD_ACTOR"; payload: { actor: Actor; characterId: string } }
  | { type: "ADD_CHARACTER"; payload: { character: Character; projectId: string } }
  | { type: "UPDATE_CHARACTER"; payload: { character: Character; projectId: string } }
  | { type: "DELETE_CHARACTER"; payload: string }
  | { type: "UPDATE_ACTOR"; payload: { actorId: string; characterId: string; updates: Partial<Actor> } }
  | {
      type: "MOVE_ACTOR"
      payload: {
        actorId: string
        sourceLocation: any
        destinationType: string
        destinationKey: string
        destinationShortlistId?: string
        characterId: string
        moveReason?: string
      }
    }
  | {
      type: "MOVE_MULTIPLE_ACTORS"
      payload: {
        actorIds: string[]
        sourceLocation: any
        destinationType: string
        destinationKey: string
        destinationShortlistId?: string
        characterId: string
        moveReason?: string
      }
    }
  | {
      type: "REORDER_MULTIPLE_ACTORS"
      payload: {
        characterId: string
        listType: string
        listKey: string
        shortlistId?: string
        actorIds: string[]
        targetActorId: string
        insertPosition: "before" | "after"
      }
    }
  | { type: "UPDATE_CARD_SETTINGS"; payload: { field: string; value: any } }
  | { type: "CREATE_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: Project }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "OPEN_MODAL"; payload: { type: string; props?: any } }
  | { type: "CLOSE_MODAL"; payload: string }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "DELETE_NOTIFICATION"; payload: string }
  | { type: "DELETE_SELECTED_NOTIFICATIONS"; payload: string[] }
  | {
      type: "MOVE_ACTOR_TO_CHARACTER"
      payload: { actorId: string; sourceCharacterId: string; destinationCharacterId: string }
    }
  | { type: "DELETE_ACTOR"; payload: { actorId: string; characterId: string } }
  | { type: "ADD_NOTE"; payload: { actorId: string; characterId: string; note: Note } }
  | { type: "UPDATE_NOTE"; payload: { actorId: string; characterId: string; noteId: string; text: string } }
  | { type: "DELETE_NOTE"; payload: { actorId: string; characterId: string; noteId: string } }
  | {
      type: "REORDER_ACTORS"
      payload: {
        characterId: string
        listType: string
        listKey: string
        shortlistId?: string
        draggedActorId: string
        targetActorId: string
        insertPosition: "before" | "after"
      }
    }
  | { type: "ADD_SHORTLIST"; payload: { characterId: string; group: any } }
  | { type: "DELETE_SHORTLIST"; payload: { characterId: string; groupId: string } }
  | { type: "RENAME_SHORTLIST"; payload: { characterId: string; groupId: string; updates: any } }
  | { type: "ADD_TAB"; payload: { tabKey: string; tabName: string } }
  | { type: "RENAME_TAB"; payload: { oldKey: string; newKey: string; newName: string } }
  | { type: "DELETE_TAB"; payload: string }
  | { type: "CREATE_GROUP"; payload: { characterId: string; group: any } }
  | { type: "UPDATE_GROUP"; payload: { characterId: string; groupId: string; updates: any } }
  | { type: "DELETE_GROUP"; payload: { characterId: string; groupId: string } }
  | { type: "UPDATE_TAB_DEFINITIONS"; payload: TabDefinition[] }
  | { type: "SET_SEARCH_TAGS"; payload: SearchTag[] }
  | { type: "ADD_SEARCH_TAG"; payload: SearchTag }
  | { type: "REMOVE_SEARCH_TAG"; payload: string }
  | { type: "CLEAR_SEARCH_TAGS" }
  | { type: "SAVE_CURRENT_SEARCH"; payload: { name: string; isGlobal?: boolean } }
  | { type: "LOAD_SAVED_SEARCH"; payload: string }
  | { type: "DELETE_SAVED_SEARCH"; payload: string }
  | { type: "UPDATE_SAVED_SEARCH"; payload: { id: string; updates: Partial<SavedSearch> } }
  | { type: "ADD_SCHEDULE_ENTRY"; payload: ScheduleEntry }
  | { type: "UPDATE_SCHEDULE_ENTRY"; payload: { id: string; updates: Partial<ScheduleEntry> } }
  | { type: "DELETE_SCHEDULE_ENTRY"; payload: string }
  | { type: "ADD_PRODUCTION_PHASE"; payload: ProductionPhase }
  | { type: "UPDATE_PRODUCTION_PHASE"; payload: { id: string; updates: Partial<ProductionPhase> } }
  | { type: "DELETE_PRODUCTION_PHASE"; payload: string }
  | { type: "SET_STATUS_FILTER"; payload: string[] }
  | { type: "SET_AGE_RANGE_FILTER"; payload: { min: number; max: number } }
  | { type: "SET_LOCATION_FILTER"; payload: string[] }
  | { type: "CLEAR_ALL_FILTERS" }
  | { type: "TOGGLE_FILTERS" }
  | { type: "ADD_SCENE"; payload: Scene }
  | { type: "UPDATE_SCENE"; payload: { id: string; updates: Partial<Scene> } }
  | { type: "DELETE_SCENE"; payload: string }
  | { type: "REORDER_SCENES"; payload: { sceneId: string; newShootDayId: string; newOrder: number } }
  | {
      type: "ASSIGN_ACTOR_TO_PROJECT_CHARACTER"
      payload: { actorId: string; projectId: string; projectName: string; characterId: string; characterName: string }
    }
  | { type: "REMOVE_ACTOR_ASSIGNMENT"; payload: { actorId: string; projectId: string; characterId: string } }
  | { type: "ADD_CANVAS_ACTOR"; payload: { projectId: string; canvasActor: CanvasActor } }
  | { type: "INCREMENT_TAB_NOTIFICATION"; payload: { tabKey: string; characterId: string; count?: number } }
  | { type: "CLEAR_TAB_NOTIFICATION"; payload: { tabKey: string; characterId: string } }
  | { type: "CLEAR_ALL_TAB_NOTIFICATIONS"; payload: { characterId: string } }
  | { type: "UPDATE_CHARACTER_CONCEPT_ART"; payload: { characterId: string; conceptArt: string } }
  | { type: "SET_PROJECT_PROPS"; payload: { projectId: string; props: ProjectProp[] } }
  | { type: "SET_PROJECT_LOCATIONS"; payload: { projectId: string; locations: ProjectLocation[] } }
  | { type: "SET_PROP_PURCHASE_REQUESTS"; payload: { projectId: string; requests: PropPurchaseRequest[] } }
  | { type: "SET_PROJECT_COSTUMES"; payload: { projectId: string; costumes: ProjectCostumes } }
  | { type: "SET_PROJECT_PROP_INVENTORY"; payload: { projectId: string; inventory: PropInventoryItem[] } }
  | { type: "SET_PROJECT_LOCATION_INVENTORY"; payload: { projectId: string; inventory: ProjectLocation[] } }
  | { type: "SET_PROJECT_SCRIPT"; payload: { projectId: string; script: ScriptData } }
  | { type: "SET_SCHEDULE_ENTRIES"; payload: ScheduleEntry[] }
  | { type: "SET_SCENES"; payload: Scene[] }
  | { type: "SET_PRODUCTION_PHASES"; payload: ProductionPhase[] }

export interface User {
  id: string
  name: string
  initials: string
  email: string
  role: string
  bgColor: string
  color: string
}

export interface PropVote {
  userId: string
  vote: "yes" | "no" | "maybe"
}

export interface PropComment {
  id: string
  userId: string
  userName: string
  userInitials: string
  text: string
  timestamp: number
}

export interface PropAvailability {
  id: string
  day: string
  startTime: string
  endTime: string
}

export interface ProjectProp {
  id: string
  name: string
  model: string
  category: string
  brand: string
  serialNumber: string
  skuBarcode: string
  notes: string
  imageUrl: string
  purchaseType: string
  unitPrice: string
  quantity: number
  bookedTo: string | null
  votes: PropVote[]
  comments: PropComment[]
  availability: PropAvailability[]
  status: "available" | "in-use" | "maintenance" | "retired"
  /** IDs of scenes this prop is used in */
  sceneIds?: string[]
  /** ID of the character this prop is assigned to */
  characterId?: string | null
  /** Whether this prop requires certified armory supervision */
  requiresArmorySupervision?: boolean
}

/* ------------------------------------------------------------------ */
/*  Locations                                                          */
/* ------------------------------------------------------------------ */

export type LocationStatus = "scouted" | "pending-approval" | "secured" | "burned"
export type LocationType = "on-location" | "studio"

export interface LocationMediaItem {
  id: string
  url: string
  type: "photo" | "360" | "video"
  caption?: string
}

export interface LocationContact {
  id: string
  role: string          // Owner, Site Rep, Neighbor
  name: string
  phone: string
  email: string
}

export interface LocationScheduleBlock {
  id: string
  type: "prep" | "shoot" | "strike"
  startDate: string     // ISO date
  endDate: string
  notes?: string
}

export interface LocationBlackoutDate {
  id: string
  date: string          // ISO date
  reason?: string
}

export interface LocationSceneTag {
  sceneNumber: string
  sceneTitle?: string
}

export interface ProjectLocation {
  id: string
  code: string                           // e.g. "LOC-001"
  name: string
  locationType: LocationType
  status: LocationStatus
  lat: number
  lng: number
  address: string
  vibeTags: string[]
  media: LocationMediaItem[]
  notes: string

  /* Costing */
  dailyRate: string
  overtimeRate: string
  securityDeposit: string

  /* On-Location specific */
  basecampParking?: string
  crewParkingCapacity?: number
  cateringArea?: string
  sunPathNotes?: string
  noiseProfile?: string
  loadInDifficulty?: string              // "Ground floor" | "Stairs only" | "Freight elevator"
  bathroomCount?: number
  greenRoomCapability?: string
  makeupAreaSuitability?: string
  contacts?: LocationContact[]

  /* Studio specific */
  dimensionsL?: number
  dimensionsW?: number
  dimensionsH?: number
  gridHeight?: number
  floorType?: string
  amperage?: string
  camlockAvailable?: boolean
  soundRating?: string                   // "Soundproof" | "Warehouse shell"
  workshopAccess?: boolean
  millSpace?: boolean
  paintShopProximity?: string

  /* Scene & schedule integration */
  sceneTags: LocationSceneTag[]
  scheduleBlocks: LocationScheduleBlock[]
  blackoutDates: LocationBlackoutDate[]

  /* Booking */
  bookedTo: string | null

  /* Voting / feedback (when added to project) */
  votes?: PropVote[]
  comments?: PropComment[]
}

/* ------------------------------------------------------------------ */
/*  Costumes & Makeup                                                  */
/* ------------------------------------------------------------------ */

export type CostumeItemType = "costume-piece" | "hmu-consumable" | "durable"
export type CostumeItemStatus = "in-stock" | "rented" | "purchased" | "on-set" | "at-cleaners" | "damaged"

/** Layer A: Human / Actor measurements & HMU specs */
export interface ActorMeasurements {
  chest?: string
  waist?: string
  inseam?: string
  hat?: string
  ring?: string
  glove?: string
  shoe?: string
}

export interface ActorHMUSpecs {
  skinToneCode?: string
  hairType?: string
  hairColor?: string
  allergies?: string[]          // "Latex", "Wool", "Spirit gum", etc.
  tattoos?: Array<{ location: string; coverUpNeeded: boolean }>
}

/** Layer B: Inventory item (physical asset) */
export interface CostumeInventoryItem {
  id: string
  name: string
  type: CostumeItemType
  status: CostumeItemStatus
  brand?: string
  size?: string
  purchasePrice?: string
  vendor?: string
  imageUrl: string
  vibeTags: string[]            // "Bloody", "Formal", "Distressed", etc.
  rentReturnDate?: string       // ISO date – only if status === "rented"
  notes?: string

  /* Voting / feedback */
  votes?: PropVote[]
  comments?: PropComment[]
}

/** Layer C: The "Look" – composite unit joining Character + Inventory */
export interface CostumeLook {
  id: string
  name: string                  // "Day 1 – Hero Outfit"
  characterId: string
  changeNumber: string          // "Change 1", "Change 2A"
  scriptDays: string[]          // ["Day 1", "Day 3"]
  sceneNumbers: string[]        // ["Sc 4", "Sc 12"]
  itemIds: string[]             // refs into CostumeInventoryItem[]
  continuityNotes: string       // "Top button undone, mud on left boot"
  referencePhotos: string[]     // URLs (fitting photos)
  matchPhotos: string[]         // URLs (on-set photos)
}

/** Shopping list request item */
export interface CostumeShoppingItem {
  id: string
  description: string
  vendor: string
  estimatedPrice: string
  status: "requested" | "approved" | "ordered" | "received"
  requestedBy: string
  characterId?: string
  lookId?: string
}

/** Root data stored per project */
export interface ProjectCostumes {
  actorSpecs: Record<string, { measurements: ActorMeasurements; hmuSpecs: ActorHMUSpecs }>  // keyed by actorId
  inventory: CostumeInventoryItem[]
  looks: CostumeLook[]
  shoppingList: CostumeShoppingItem[]
}

  /** Purchase / design request for a prop */
  export interface PropPurchaseRequest {
  id: string
  description: string
  quantity: number
  vendor: string
  estimatedPrice: string
  designNotes: string
  status: "requested" | "approved" | "ordered" | "received" | "in-design" | "design-complete"
  requestType: "purchase" | "design" | "fabrication"
  requestedBy: string
  characterId?: string
  sceneIds?: string[]
  priority: "low" | "medium" | "high" | "urgent"
  /** Whether this prop requires certified armory supervision */
  requiresArmorySupervision?: boolean
  }

  /** An item in the global prop inventory (the "All" tab). */
  export interface PropInventoryItem {
  id: string
  name: string
  model: string
  category: string
  brand: string
  serialNumber: string
  skuBarcode: string
  notes: string
  imageUrl: string
  purchaseType: string
  unitPrice: string
  quantity: number
  bookedTo: string | null
  availability: { id: string; day: string; startTime: string; endTime: string }[]
  status: "available" | "in-use" | "maintenance" | "retired"
  /** IDs of scenes this prop is used in */
  sceneIds?: string[]
  /** ID of the character this prop is assigned to */
  characterId?: string | null
  /** Whether this prop requires certified armory supervision */
  requiresArmorySupervision?: boolean
}

/* ------------------------------------------------------------------ */
/*  Script / Fountain types                                            */
/* ------------------------------------------------------------------ */
export type ScriptBlockType =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"

export type RevisionColor = "white" | "blue" | "pink" | "yellow" | "green" | "goldenrod" | "salmon" | "cherry"

export interface BreakdownTag {
  id: string
  /** Character range within the block text */
  startOffset: number
  endOffset: number
  text: string
  category: string  // "prop" | "vehicle" | "wardrobe" | "sfx" | "vfx" | "animal" | "extra" | "stunt"
}

export interface ScriptBlock {
  id: string
  type: ScriptBlockType
  text: string
  /** Scene number (set on scene-heading blocks) */
  sceneNumber?: string
  /** One-liner synopsis for scene-heading blocks */
  synopsis?: string
  /** Linked character id when type === "character" */
  linkedCharacterId?: string
  /** Linked location id when type === "scene-heading" */
  linkedLocationId?: string
  /** Whether this line was changed since the last lock */
  changed?: boolean
  /** Breakdown tags on this block */
  breakdownTags?: BreakdownTag[]
  /** Revision color when locked */
  revisionColor?: RevisionColor
}

export type BeatColor = "amber" | "blue" | "green" | "pink" | "purple" | "rose" | "sky" | "stone"

export interface BeatItem {
  id: string
  title: string
  description: string
  color: BeatColor
  /** Act label (e.g. "Act 1", "Act 2", "Act 3") */
  act: string
  /** Linked scene-heading block id, if any */
  linkedSceneId?: string
  /** Order index for sorting */
  order: number
}

export interface ScriptData {
  blocks: ScriptBlock[]
  /** Whether the script is locked (scene numbers frozen) */
  locked: boolean
  /** The next available suffix counter for locked-mode new scenes, e.g. { "3": 1 } means next is 3A */
  lockedSceneSuffixes?: Record<string, number>
  /** Current revision color for edits */
  currentRevision: RevisionColor
  /** Timestamp of last modification */
  lastModified: number
  /** Beat board items */
  beats?: BeatItem[]
}

export interface Project {
  id: string
  name: string
  description?: string
  characters: Character[]
  createdDate: number
  modifiedDate: number
  terminology?: Terminology
  canvasActors?: CanvasActor[]
  props?: ProjectProp[]
  locations?: ProjectLocation[]
  costumes?: ProjectCostumes
  /** Global prop inventory ("All" tab in Props modal) */
  propInventory?: PropInventoryItem[]
  /** Prop purchase / design requests */
  propPurchaseRequests?: PropPurchaseRequest[]
  /** Global location inventory ("All Locations" tab in Locations modal) */
  locationInventory?: ProjectLocation[]
  /** Script data */
  script?: ScriptData
}

export interface Character {
  id: string
  name: string
  description?: string
  conceptArt?: string
  actors: {
    longList: Actor[]
    audition: Actor[]
    approval: Actor[]
    shortLists: ShortList[]
    [key: string]: Actor[] | ShortList[]
  }
}

export interface ShortList {
  id: string
  name: string
  description?: string
  actors: Actor[]
  color?: string
  createdAt: number
}

export interface SubmissionVideo {
  id: string
  title: string
  url: string
  thumbnail?: string
  duration?: number
  type: "youtube" | "vimeo" | "direct"
}

export interface Note {
  id: string
  userId: string
  userName: string
  timestamp: number
  text: string
}

export interface Status {
  id: string
  name?: string
  label: string
  color?: string
  bgColor: string
  textColor: string
  category: string
  isCustom?: boolean
  timestamp?: number
  templateUsed?: string
}

export interface Notification {
  id: string
  type: "system" | "user" | "vote" | "sent"
  title: string
  message: string
  timestamp: number
  read: boolean
  priority: "low" | "medium" | "high"
  actorId?: string
  characterId?: string
  userId?: string
  metadata?: any
  /** For sent notifications -- names of recipients */
  recipients?: string[]
}

export interface TabDefinition {
  key: string
  name: string
  isCustom: boolean
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
  cardDisplayMode: "detailed" | "compact" | "player" | "simple" | "list-view" | "row"
  currentSortOption: string
  searchTerm: string
  searchTags: SearchTag[]
  savedSearches: SavedSearch[]
  playerView: {
    isOpen: boolean
    currentIndex: number
    currentHeadshotIndex: number
  }
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

export interface ActorStatus {
  id: string
  name?: string
  label: string
  color?: string
  bgColor: string
  textColor: string
  category?: string
  isCustom?: boolean
  timestamp?: number
  templateUsed?: string
}

export interface ActorNote {
  id: string
  content: string
  timestamp: number
  userId: string
}

export interface SearchTag {
  id: string
  text: string
  color?: string
}

export interface SavedSearch {
  id: string
  name: string
  tags: SearchTag[]
  searchTerm: string
  createdAt: number
  lastUsed: number
  isGlobal: boolean
}

export interface CanvasActor {
  id: string
  actorId: string
  x: number
  y: number
  characterName: string
  actor: Actor
}

/* ============================================================
   Production Design Types
   ============================================================ */

export type SetStatusPhase =
  | "concept"
  | "design"
  | "drafting"
  | "approved"
  | "construction"
  | "dressing"
  | "camera-ready"
  | "wrapped"

export type ConstructionPhase =
  | "carpentry"
  | "paint"
  | "rigging"
  | "set-dec"
  | "on-camera"
  | "strike"

export interface BuildElement {
  id: string
  name: string
  material: string
  dimensions: string
  quantity: number
  notes?: string
}

export interface SetDecoration {
  id: string
  name: string
  source: "inventory" | "rental" | "purchase" | "fabricated"
  propId?: string
  quantity: number
  notes?: string
}

export interface LightingFixture {
  id: string
  name: string
  type: "practical" | "motivated" | "ambient" | "effect"
  wattage?: string
  dimmable: boolean
  notes?: string
  fixtureImage?: string
  lightExampleImage?: string
}

export interface MoodBoardImage {
  id: string
  url: string
  caption?: string
  tags: string[]
  addedAt: number
}

export interface ConstructionTask {
  id: string
  title: string
  phase: ConstructionPhase
  assignedTo?: string
  priority: "low" | "medium" | "high" | "urgent"
  dueDate?: number
  completed: boolean
  notes?: string
  setId: string
}

export interface ProductionDesignSet {
  id: string
  name: string
  description: string
  status: SetStatusPhase
  locationId?: string
  sceneIds: string[]
  buildElements: BuildElement[]
  decorations: SetDecoration[]
  lighting: LightingFixture[]
  moodBoard: MoodBoardImage[]
  estimatedBudget: string
  actualBudget?: string
  floorPlanUrl?: string
  notes: string
  createdAt: number
  updatedAt: number
}
