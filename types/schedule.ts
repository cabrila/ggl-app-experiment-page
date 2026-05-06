export interface ScheduleEntry {
  id: string
  title: string
  date: string // ISO date string
  phaseId?: string // ID of the production phase this shoot day belongs to
  startTime?: string
  endTime?: string
  location?: string
  sceneType?: "INT" | "EXT" | "INT/EXT" // Added scene type field
  sceneNotes?: string // Added scene notes field
  props?: string[] // Added props array
  actorIds: string[] // IDs of actors assigned to this schedule
  crewMembers: string[]
  redFlags: RedFlag[]
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface RedFlag {
  id: string
  type: "conflict" | "warning" | "important" | "custom"
  message: string
  color: string
  actorId?: string // Added actorId to associate red flags with specific actors
}

export interface AvailabilityDate {
  date: string // ISO date string (YYYY-MM-DD)
  status: "available" | "unavailable"
}

export interface ProductionPhase {
  id: string
  name: string
  startDate: string
  color: string // text color class (e.g., "text-blue-700")
  bgColor: string // background color class (e.g., "bg-blue-500")
}

export interface Scene {
  id: string
  sceneNumber: string // e.g., "1", "2A", "15"
  pages: string // e.g., "2/8", "1 4/8", "3"
  intExt: "INT" | "EXT" | "INT/EXT"
  location: string // e.g., "kitchen", "beverly hills, ca"
  dayNight: "Day" | "Night"
  cast: string[] // Actor IDs or character names
  description?: string
  shootDayId: string // ID of the ScheduleEntry this scene belongs to
  order: number // Order within the shoot day
  customColor?: string // Optional custom color (hex or Tailwind class)
  createdAt: number
  updatedAt: number
}
