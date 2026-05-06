"use client"

import type React from "react"

import { useState, useMemo } from "react"
import {
  X,
  Search,
  Grid3X3,
  List,
  LayoutGrid,
  SortAsc,
  Filter,
  Database,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Link2,
  Check,
  FolderOpen,
  Home,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal, navigateToModal } from "@/components/modals/ModalManager"
import type { Actor } from "@/types/casting"
import ActorCard from "@/components/actors/ActorCard"

interface DatabaseModalProps {
  onClose: () => void
}

interface AggregatedActor extends Actor {
  projectIds: string[]
  projectNames: string[]
  characterIds: string[]
  characterNames: string[]
  projectAssignments?: { projectId: string; projectName: string; characterId: string; characterName: string }[]
}

export default function DatabaseModal({ onClose }: DatabaseModalProps) {
  const { state, dispatch } = useCasting()

  // View and filter state
  const [viewMode, setViewMode] = useState<"row" | "list" | "gallery">("row")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState("alphabetical")
  const [showFilters, setShowFilters] = useState(false)

  const [selectedActors, setSelectedActors] = useState<Set<string>>(new Set())

  // Filter state
  const [genderFilter, setGenderFilter] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [ageRangeFilter, setAgeRangeFilter] = useState({ min: 0, max: 100 })
  const [projectFilter, setProjectFilter] = useState<string[]>([])

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    actorId: string
  } | null>(null)

  // Aggregate all actors from all projects
  const aggregatedActors = useMemo(() => {
    const actorMap = new Map<string, AggregatedActor>()

    state.projects.forEach((project) => {
      project.characters.forEach((character) => {
        // Collect actors from all lists
        const allActors: Actor[] = []

        if (Array.isArray(character.actors.longList)) {
          allActors.push(...character.actors.longList)
        }
        if (Array.isArray(character.actors.audition)) {
          allActors.push(...character.actors.audition)
        }
        if (Array.isArray(character.actors.approval)) {
          allActors.push(...character.actors.approval)
        }

        // Add actors from shortlists
        if (Array.isArray(character.actors.shortLists)) {
          character.actors.shortLists.forEach((shortlist) => {
            if (Array.isArray(shortlist.actors)) {
              allActors.push(...shortlist.actors)
            }
          })
        }

        // Add actors from custom tabs
        Object.keys(character.actors).forEach((key) => {
          if (!["longList", "audition", "approval", "shortLists"].includes(key)) {
            const customList = character.actors[key]
            if (Array.isArray(customList)) {
              allActors.push(...customList)
            }
          }
        })

        // Aggregate actors
        allActors.forEach((actor) => {
          if (actorMap.has(actor.id)) {
            const existing = actorMap.get(actor.id)!
            if (!existing.projectIds.includes(project.id)) {
              existing.projectIds.push(project.id)
              existing.projectNames.push(project.name)
            }
            if (!existing.characterIds.includes(character.id)) {
              existing.characterIds.push(character.id)
              existing.characterNames.push(character.name)
            }
          } else {
            actorMap.set(actor.id, {
              ...actor,
              projectIds: [project.id],
              projectNames: [project.name],
              characterIds: [character.id],
              characterNames: [character.name],
            })
          }
        })
      })
    })

    return Array.from(actorMap.values())
  }, [state.projects])

  // Get unique values for filters
  const uniqueGenders = useMemo(() => {
    const genders = new Set<string>()
    aggregatedActors.forEach((actor) => {
      if (actor.gender && actor.gender.trim()) {
        genders.add(actor.gender.trim())
      }
    })
    return Array.from(genders).sort()
  }, [aggregatedActors])

  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    aggregatedActors.forEach((actor) => {
      if (actor.location && actor.location.trim()) {
        locations.add(actor.location.trim())
      }
    })
    return Array.from(locations).sort()
  }, [aggregatedActors])

  // Filter and sort actors
  const filteredAndSortedActors = useMemo(() => {
    let filtered = [...aggregatedActors]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (actor) =>
          actor.name.toLowerCase().includes(term) ||
          actor.gender?.toLowerCase().includes(term) ||
          actor.ethnicity?.toLowerCase().includes(term) ||
          actor.location?.toLowerCase().includes(term) ||
          actor.agent?.toLowerCase().includes(term) ||
          actor.projectNames.some((name) => name.toLowerCase().includes(term)) ||
          actor.characterNames.some((name) => name.toLowerCase().includes(term)),
      )
    }

    // Gender filter
    if (genderFilter.length > 0) {
      filtered = filtered.filter((actor) => actor.gender && genderFilter.includes(actor.gender))
    }

    // Location filter
    if (locationFilter.length > 0) {
      filtered = filtered.filter((actor) => actor.location && locationFilter.includes(actor.location))
    }

    // Age range filter
    filtered = filtered.filter((actor) => {
      if (!actor.age) return true
      const age = Number.parseInt(actor.age)
      if (isNaN(age)) return true
      return age >= ageRangeFilter.min && age <= ageRangeFilter.max
    })

    // Project filter
    if (projectFilter.length > 0) {
      filtered = filtered.filter((actor) => actor.projectIds.some((id) => projectFilter.includes(id)))
    }

    // Sort
    switch (sortOption) {
      case "alphabetical":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "dateAdded":
        filtered.sort((a, b) => b.dateAdded - a.dateAdded)
        break
      case "age":
        filtered.sort((a, b) => {
          const ageA = Number.parseInt(a.age || "0")
          const ageB = Number.parseInt(b.age || "0")
          return ageA - ageB
        })
        break
      case "projectCount":
        filtered.sort((a, b) => b.projectIds.length - a.projectIds.length)
        break
    }

    return filtered
  }, [aggregatedActors, searchTerm, genderFilter, locationFilter, ageRangeFilter, projectFilter, sortOption])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (genderFilter.length > 0) count++
    if (locationFilter.length > 0) count++
    if (ageRangeFilter.min > 0 || ageRangeFilter.max < 100) count++
    if (projectFilter.length > 0) count++
    return count
  }, [genderFilter, locationFilter, ageRangeFilter, projectFilter])

  const handleClearAllFilters = () => {
    setGenderFilter([])
    setLocationFilter([])
    setAgeRangeFilter({ min: 0, max: 100 })
    setProjectFilter([])
  }

  const handleGenderFilterChange = (gender: string) => {
    setGenderFilter((prev) => (prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]))
  }

  const handleLocationFilterChange = (location: string) => {
    setLocationFilter((prev) => (prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]))
  }

  const handleProjectFilterChange = (projectId: string) => {
    setProjectFilter((prev) => (prev.includes(projectId) ? prev.filter((p) => p !== projectId) : [...prev, projectId]))
  }

  const handleAddActor = () => {
    openModal("createActorForm", {
      characterId: state.currentFocus.currentCharacterId,
      projectId: state.currentFocus.currentProjectId,
    })
  }

  // Handler for right-click context menu
  const handleContextMenu = (e: React.MouseEvent, actorId: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      actorId,
    })
  }

  // Handler for assigning actor to project-character
  const handleAssignToProjectCharacter = (
    actorId: string,
    projectId: string,
    projectName: string,
    characterId: string,
    characterName: string,
  ) => {
    dispatch({
      type: "ASSIGN_ACTOR_TO_PROJECT_CHARACTER",
      payload: {
        actorId,
        projectId,
        projectName,
        characterId,
        characterName,
      },
    })
    setContextMenu(null)
  }

  // Handler for removing assignment
  const handleRemoveAssignment = (actorId: string, projectId: string, characterId: string) => {
    dispatch({
      type: "REMOVE_ACTOR_ASSIGNMENT",
      payload: {
        actorId,
        projectId,
        characterId,
      },
    })
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  const handleAssignToProject = (actor: Actor) => {
    openModal("assignToProject", { actor })
  }

  const handleToggleActorSelection = (actorId: string) => {
    const newSelection = new Set(selectedActors)
    if (newSelection.has(actorId)) {
      newSelection.delete(actorId)
    } else {
      newSelection.add(actorId)
    }
    setSelectedActors(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedActors.size === filteredAndSortedActors.length) {
      setSelectedActors(new Set())
    } else {
      setSelectedActors(new Set(filteredAndSortedActors.map((a) => a.id)))
    }
  }

  const handleBatchAssignToProject = () => {
    const actorsToAssign = filteredAndSortedActors.filter((a) => selectedActors.has(a.id))
    openModal("assignToProject", { actors: actorsToAssign })
  }

  // Handler for clearing selection
  const handleClearSelection = () => {
    setSelectedActors(new Set())
  }

  // Render project indicator
  const ProjectIndicator = ({ actor }: { actor: AggregatedActor }) => {
    const assignments = actor.projectAssignments || []

    if (assignments.length === 0 && actor.projectIds.length === 0) {
      return <span className="text-xs text-slate-400 italic">No Projects</span>
    }

    if (assignments.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {assignments.slice(0, 2).map((assignment) => (
            <span
              key={`${assignment.projectId}-${assignment.characterId}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
              title={`${assignment.projectName} - ${assignment.characterName}`}
            >
              <Link2 className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{assignment.projectName}</span>
            </span>
          ))}
          {assignments.length > 2 && (
            <span className="text-xs text-emerald-600 font-medium">+{assignments.length - 2}</span>
          )}
        </div>
      )
    }

    if (actor.projectIds.length === 1) {
      return <span className="text-xs text-emerald-600 font-medium truncate">{actor.projectNames[0]}</span>
    }

    return (
      <span className="text-xs text-emerald-600 font-medium">
        {actor.projectNames.slice(0, 2).join(", ")}
        {actor.projectIds.length > 2 && ` +${actor.projectIds.length - 2}`}
      </span>
    )
  }

  const MiniatureActorCard = ({ actor }: { actor: AggregatedActor }) => {
    const statusColor =
      actor.consensusAction === "yes"
        ? "text-green-600"
        : actor.consensusAction === "no"
          ? "text-red-600"
          : actor.consensusAction === "maybe"
            ? "text-blue-600"
            : "text-slate-400"
    const statusText =
      actor.consensusAction === "yes"
        ? "Yes"
        : actor.consensusAction === "no"
          ? "No"
          : actor.consensusAction === "maybe"
            ? "Maybe"
            : "Unvoted"

    const [imageError, setImageError] = useState(false)
    const actorImage = actor.headshots && actor.headshots.length > 0 ? actor.headshots[0] : null
    const isSelected = selectedActors.has(actor.id)

    return (
      <div
        className={`bg-white rounded-lg border-2 transition-all duration-200 overflow-hidden group relative cursor-pointer ${
          isSelected
            ? "border-emerald-500 shadow-lg ring-2 ring-emerald-500 ring-opacity-50"
            : "border-slate-200 hover:border-emerald-300 hover:shadow-md"
        }`}
        onContextMenu={(e) => handleContextMenu(e, actor.id)}
        onClick={() => handleToggleActorSelection(actor.id)}
      >
        <div
          className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "bg-emerald-500 border-emerald-500 scale-110"
                : "bg-white border-slate-300 group-hover:border-emerald-400"
            }`}
          >
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>

        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            {actorImage && !imageError ? (
              <img
                src={actorImage}
                alt={actor.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold bg-gradient-to-br from-slate-100 to-slate-200">
                {actor.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-sm">{actor.name}</h3>

            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              {actor.age && <span>{actor.age} yrs</span>}
              {actor.age && actor.gender && <span>•</span>}
              {actor.gender && <span>{actor.gender}</span>}
            </div>

            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
              <span className="text-slate-300">•</span>
              <ProjectIndicator actor={actor} />
            </div>

            {/* Contact Info */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              {actor.email && (
                <div className="flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{actor.email}</span>
                </div>
              )}
              {actor.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{actor.phone}</span>
                </div>
              )}
            </div>

            {actor.location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{actor.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col" onClick={handleCloseContextMenu}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Actor Database</h1>
                <p className="text-sm text-slate-500">
                  {filteredAndSortedActors.length} of {aggregatedActors.length} actors
                  {selectedActors.size > 0 && (
                    <span className="ml-2 text-emerald-600 font-semibold">• {selectedActors.size} selected</span>
                  )}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex items-center gap-2">
              <button
onClick={() => navigateToModal("splashScreen")}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Main Menu"
              >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Main Menu</span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedActors.size > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-b border-emerald-700 shadow-lg">
          <div className="max-w-[1920px] mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-white">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">{selectedActors.size} actor(s) selected</span>
                </div>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {selectedActors.size === filteredAndSortedActors.length ? "Deselect All" : "Select All"}
                </button>
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Clear Selection
                </button>
              </div>
              <button
                onClick={handleBatchAssignToProject}
                className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-slate-50 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Assign to Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            {/* Left Section - Add Actor, View Mode, Sort, Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddActor}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span className="font-medium">Add Actor</span>
              </button>

              <div className="w-px h-6 bg-slate-300"></div>

              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("row")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "row"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                  title="Row View (3 Columns)"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("gallery")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "gallery"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                  title="Gallery View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-slate-300"></div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Sort:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="alphabetical">Alphabetical</option>
                  <option value="dateAdded">Date Added</option>
                  <option value="age">Age</option>
                  <option value="projectCount">Project Count</option>
                </select>
                <SortAsc className="w-4 h-4 text-slate-400 -ml-7 pointer-events-none" />
              </div>

              <div className="w-px h-6 bg-slate-300"></div>

              {/* Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors text-sm relative ${
                  showFilters
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-white border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right Section - Search */}
            <div className="relative flex-shrink-0 w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search actors, projects, characters..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-800">Filter Options</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearAllFilters}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Clear All ({activeFiltersCount})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Gender Filter */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Gender
                    {genderFilter.length > 0 && (
                      <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                        {genderFilter.length}
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueGenders.map((gender) => (
                      <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={genderFilter.includes(gender)}
                          onChange={() => handleGenderFilterChange(gender)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-600">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Location
                    {locationFilter.length > 0 && (
                      <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                        {locationFilter.length}
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueLocations.map((location) => (
                      <label key={location} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={locationFilter.includes(location)}
                          onChange={() => handleLocationFilterChange(location)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-600 truncate">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Age Range Filter */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Age Range
                    {(ageRangeFilter.min > 0 || ageRangeFilter.max < 100) && (
                      <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">
                        Min: <span className="font-semibold">{ageRangeFilter.min}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={ageRangeFilter.min}
                        onChange={(e) => setAgeRangeFilter((prev) => ({ ...prev, min: Number(e.target.value) }))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">
                        Max: <span className="font-semibold">{ageRangeFilter.max}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={ageRangeFilter.max}
                        onChange={(e) => setAgeRangeFilter((prev) => ({ ...prev, max: Number(e.target.value) }))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Project Filter */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Projects
                    {projectFilter.length > 0 && (
                      <span className="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                        {projectFilter.length}
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {state.projects.map((project) => (
                      <label key={project.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={projectFilter.includes(project.id)}
                          onChange={() => handleProjectFilterChange(project.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-600 truncate">{project.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          {filteredAndSortedActors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Database className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No actors found</h3>
              <p className="text-slate-500">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                viewMode === "row"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : viewMode === "list"
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              }`}
            >
              {filteredAndSortedActors.map((actor) => {
                if (viewMode === "row") {
                  return <MiniatureActorCard key={actor.id} actor={actor} />
                }

                // Find a character to pass to ActorCard (required prop) for other views
                const firstProject = state.projects.find((p) => p.id === actor.projectIds[0])
                const firstCharacter = firstProject?.characters.find((c) => c.id === actor.characterIds[0])

                if (!firstCharacter) return null

                return (
                  <div key={actor.id} className="relative" onContextMenu={(e) => handleContextMenu(e, actor.id)}>
                    {/* Project Indicator Overlay */}
                    <div className="absolute top-2 left-2 z-10 bg-white bg-opacity-95 rounded-lg px-2 py-1 shadow-sm">
                      <ProjectIndicator actor={actor} />
                    </div>

                    <ActorCard
                      actor={actor}
                      character={firstCharacter}
                      viewMode={viewMode === "list" ? "list-view" : "simple"}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-[100] min-w-[280px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        ></div>
      )}
    </div>
  )
}
