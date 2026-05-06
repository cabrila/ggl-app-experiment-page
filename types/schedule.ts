export interface ScheduleEntry {
  id: string
  title: string
  date: string
  phaseId?: string
  startTime?: string
  endTime?: string
  location?: string
  sceneType?: "INT" | "EXT" | "INT/EXT"
  sceneNotes?: string
  props?: string[]
  actorIds: string[]
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
  actorId?: string
}

export interface AvailabilityDate {
  date: string
  status: "available" | "unavailable"
}

export interface ProductionPhase {
  id: string
  name: string
  startDate: string
  color: string
  bgColor: string
}

export interface Scene {
  id: string
  sceneNumber: string
  pages: string
  intExt: "INT" | "EXT" | "INT/EXT"
  location: string
  dayNight: "Day" | "Night"
  cast: string[]
  description?: string
  shootDayId: string
  order: number
  customColor?: string
  createdAt: number
  updatedAt: number
}
