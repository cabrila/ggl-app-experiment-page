import type { ScheduleEntry, Scene, ProductionPhase } from "@/types/schedule"

export const MOCK_SCHEDULE_ENTRIES: ScheduleEntry[] = [
  {
    id: "shoot-day-1",
    title: "Day 1 - Hatchery Scenes",
    date: "2026-07-15",
    phaseId: "principal",
    startTime: "06:00",
    endTime: "18:00",
    location: "Studio A - Hatchery Set",
    actorIds: ["grant", "stone"],
    crewMembers: ["Director", "DP", "Sound"],
    redFlags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "shoot-day-2",
    title: "Day 2 - Control Room",
    date: "2026-07-16",
    phaseId: "principal",
    startTime: "07:00",
    endTime: "19:00",
    location: "Studio B - Control Room Set",
    actorIds: ["park", "malkova"],
    crewMembers: ["Director", "DP", "Sound", "VFX Supervisor"],
    redFlags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

export const MOCK_SCENES: Scene[] = [
  {
    id: "scene-1",
    sceneNumber: "1",
    pages: "2 4/8",
    intExt: "INT",
    location: "Hatchery - Incubation Wing",
    dayNight: "Night",
    cast: ["Dr. Grant", "Dr. Stone"],
    description: "A raptor hatches instead of an herbivore",
    shootDayId: "shoot-day-1",
    order: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "scene-2",
    sceneNumber: "2",
    pages: "1 6/8",
    intExt: "INT",
    location: "Control Room",
    dayNight: "Night",
    cast: ["Park", "Malkova"],
    description: "The fences go down across the island",
    shootDayId: "shoot-day-2",
    order: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

export const MOCK_PRODUCTION_PHASES: ProductionPhase[] = [
  {
    id: "principal",
    name: "Principal Photography",
    startDate: "2026-07-15",
    color: "text-emerald-700",
    bgColor: "bg-emerald-500",
  },
  {
    id: "pickups",
    name: "Pickups",
    startDate: "2026-08-20",
    color: "text-amber-700",
    bgColor: "bg-amber-500",
  },
]
