"use client"
import { useState, useMemo, useCallback } from "react"
import { useCasting, type Actor } from "@/components/casting/CastingContext"
import {
  X,
  Search,
  Check,
  User,
  MapPin,
  Calendar,
  ChevronDown,
  Folder,
  Users,
  Star,
  SlidersHorizontal,
} from "lucide-react"

interface AggregatedActor extends Actor {
  projectIds: string[]
  projectNames: string[]
  characterIds: string[]
  characterNames: string[]
}

interface AddFromDatabaseModalProps {
  onClose: () => void
  characterId?: string
}

export default function AddFromDatabaseModal({ onClose, characterId }: AddFromDatabaseModalProps) {
  const { state, dispatch } = useCasting()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedActors, setSelectedActors] = useState<Set<string>>(new Set())
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "recent" | "projects">("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Get current project and character
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find(
    (c) => c.id === (characterId || state.currentFocus.characterId),
  )

  const aggregatedActors = useMemo(() => {
    const actorMap = new Map<string, AggregatedActor>()

    state.projects.forEach((project) => {
      project.characters.forEach((character) => {
        // Collect actors from all lists
        const allActors: Actor[] = []

        if (Array.isArray(character.actors?.longList)) {
          allActors.push(...character.actors.longList)
        }
        if (Array.isArray(character.actors?.audition)) {
          allActors.push(...character.actors.audition)
        }
        if (Array.isArray(character.actors?.approval)) {
          allActors.push(...character.actors.approval)
        }

        // Add actors from shortlists
        if (Array.isArray(character.actors?.shortLists)) {
          character.actors.shortLists.forEach((shortlist: { actors?: Actor[] }) => {
            if (Array.isArray(shortlist.actors)) {
              allActors.push(...shortlist.actors)
            }
          })
        }

        // Add actors from legacy shortlists format
        if (character.shortlists) {
          Object.values(character.shortlists).forEach((list) => {
            if (Array.isArray(list)) {
              allActors.push(...list)
            }
          })
        }

        // Add actors from longList (legacy format)
        if (Array.isArray(character.longList)) {
          allActors.push(...character.longList)
        }

        // Add actors from custom tabs
        character.customTabs?.forEach((tab) => {
          if (Array.isArray(tab.actors)) {
            allActors.push(...tab.actors)
          }
        })

        // Aggregate actors
        allActors.forEach((actor) => {
          if (!actor || !actor.id) return

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

  // Get actors already in current character
  const existingActorIds = useMemo(() => {
    if (!currentCharacter) return new Set<string>()
    const ids = new Set<string>()

    // Check all possible actor locations
    if (Array.isArray(currentCharacter.actors?.longList)) {
      currentCharacter.actors.longList.forEach((actor) => ids.add(actor.id))
    }
    if (Array.isArray(currentCharacter.actors?.audition)) {
      currentCharacter.actors.audition.forEach((actor) => ids.add(actor.id))
    }
    if (Array.isArray(currentCharacter.actors?.approval)) {
      currentCharacter.actors.approval.forEach((actor) => ids.add(actor.id))
    }
    if (Array.isArray(currentCharacter.longList)) {
      currentCharacter.longList.forEach((actor) => ids.add(actor.id))
    }
    if (currentCharacter.shortlists) {
      Object.values(currentCharacter.shortlists).forEach((list) => {
        if (Array.isArray(list)) {
          list.forEach((actor) => ids.add(actor.id))
        }
      })
    }
    currentCharacter.customTabs?.forEach((tab) => {
      tab.actors?.forEach((actor) => ids.add(actor.id))
    })

    return ids
  }, [currentCharacter])

  // Get unique values for filters
  const { genders, locations, projects } = useMemo(() => {
    const genderSet = new Set<string>()
    const locationSet = new Set<string>()
    const projectSet = new Map<string, string>()

    aggregatedActors.forEach((actor) => {
      if (actor.gender?.trim()) genderSet.add(actor.gender.trim())
      if (actor.location?.trim()) locationSet.add(actor.location.trim())
      actor.projectIds.forEach((id, idx) => {
        projectSet.set(id, actor.projectNames[idx])
      })
    })

    return {
      genders: Array.from(genderSet).sort(),
      locations: Array.from(locationSet).sort(),
      projects: Array.from(projectSet.entries()).sort((a, b) => a[1].localeCompare(b[1])),
    }
  }, [aggregatedActors])

  // Filter and sort actors
  const filteredActors = useMemo(() => {
    const result = aggregatedActors.filter((actor) => {
      // Exclude actors already in the current character
      if (existingActorIds.has(actor.id)) return false

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesName = actor.name?.toLowerCase().includes(search)
        const matchesLocation = actor.location?.toLowerCase().includes(search)
        const matchesGender = actor.gender?.toLowerCase().includes(search)
        const matchesProject = actor.projectNames.some((p) => p.toLowerCase().includes(search))
        const matchesCharacter = actor.characterNames.some((c) => c.toLowerCase().includes(search))
        if (!matchesName && !matchesLocation && !matchesGender && !matchesProject && !matchesCharacter) return false
      }

      // Gender filter
      if (genderFilter !== "all" && actor.gender !== genderFilter) return false

      // Location filter
      if (locationFilter !== "all" && actor.location !== locationFilter) return false

      // Project filter
      if (projectFilter !== "all" && !actor.projectIds.includes(projectFilter)) return false

      return true
    })

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        break
      case "projects":
        result.sort((a, b) => b.projectIds.length - a.projectIds.length)
        break
      case "recent":
        // Keep original order (most recently added)
        break
    }

    return result
  }, [aggregatedActors, existingActorIds, searchTerm, genderFilter, locationFilter, projectFilter, sortBy])

  const handleToggleActor = useCallback((actorId: string) => {
    setSelectedActors((prev) => {
      const next = new Set(prev)
      if (next.has(actorId)) {
        next.delete(actorId)
      } else {
        next.add(actorId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedActors.size === filteredActors.length) {
      setSelectedActors(new Set())
    } else {
      setSelectedActors(new Set(filteredActors.map((a) => a.id)))
    }
  }, [filteredActors, selectedActors.size])

  const handleAddSelected = useCallback(async () => {
    if (selectedActors.size === 0 || !currentCharacter) return

    setIsAdding(true)

    // Get the selected actor objects
    const actorsToAdd = aggregatedActors.filter((a) => selectedActors.has(a.id))

    // Add each actor to the current character's long list
    for (const actor of actorsToAdd) {
      // Create a fresh copy of the actor for the new character
      const newActor: Actor = {
        ...actor,
        id: `${actor.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        votes: { yes: 0, no: 0, maybe: 0 },
        userVotes: {},
        isGreenlit: false,
        status: [],
        notes: "",
      }

      dispatch({
        type: "ADD_ACTOR",
        payload: {
          actor: newActor,
          characterId: currentCharacter.id,
        },
      })
    }

    // Show success notification
    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `add-from-db-${Date.now()}`,
        type: "success",
        title: "Actors Added",
        message: `${actorsToAdd.length} actor${actorsToAdd.length > 1 ? "s" : ""} added to ${currentCharacter.name} Long List`,
        timestamp: Date.now(),
        read: false,
      },
    })

    setIsAdding(false)
    onClose()
  }, [selectedActors, aggregatedActors, currentCharacter, dispatch, onClose])

  const actorLabel = state.terminology?.actor?.singular || "Actor"
  const actorsLabel = state.terminology?.actor?.plural || "Actors"

  const activeFiltersCount = [genderFilter !== "all", locationFilter !== "all", projectFilter !== "all"].filter(
    Boolean,
  ).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal - Full Screen */}
      <div className="relative w-full h-full bg-background flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Add from {actorLabel} Database</h2>
                <p className="text-sm text-muted-foreground">
                  Browse and select {actorsLabel.toLowerCase()} from your existing projects
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentCharacter && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                <Star className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Adding to: <span className="font-medium text-foreground">{currentCharacter.name}</span>
                </span>
              </div>
            )}
            {selectedActors.size > 0 && (
              <button
                onClick={handleAddSelected}
                disabled={isAdding}
                className="flex items-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isAdding ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>
                  Add {selectedActors.size} {selectedActors.size === 1 ? actorLabel : actorsLabel}
                </span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex-shrink-0 p-4 border-b border-border bg-card/50">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={`Search by name, location, project, or character...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-success-500/50 focus:border-success-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none pl-3 pr-8 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-success-500/50 cursor-pointer"
                >
                  <option value="name">Sort: A-Z</option>
                  <option value="projects">Sort: Most Used</option>
                  <option value="recent">Sort: Recent</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? "bg-success-50 border-success-200 text-success-700"
                    : "bg-background border-border text-foreground hover:bg-muted"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-success-600 text-white rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* View Toggle */}
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-muted" : "hover:bg-muted/50"}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                    <rect x="1" y="1" width="6" height="6" rx="1" />
                    <rect x="9" y="1" width="6" height="6" rx="1" />
                    <rect x="1" y="9" width="6" height="6" rx="1" />
                    <rect x="9" y="9" width="6" height="6" rx="1" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-muted" : "hover:bg-muted/50"}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                    <rect x="1" y="2" width="14" height="3" rx="1" />
                    <rect x="1" y="7" width="14" height="3" rx="1" />
                    <rect x="1" y="12" width="14" height="3" rx="1" />
                  </svg>
                </button>
              </div>

              {/* Select All */}
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground hover:bg-muted transition-colors text-sm"
              >
                {selectedActors.size === filteredActors.length && filteredActors.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
              {/* Gender Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Gender:</span>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-success-500/50"
                >
                  <option value="all">All Genders</option>
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Location:</span>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-success-500/50"
                >
                  <option value="all">All Locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Project:</span>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-success-500/50"
                >
                  <option value="all">All Projects</option>
                  {projects.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setGenderFilter("all")
                    setLocationFilter("all")
                    setProjectFilter("all")
                  }}
                  className="text-sm text-error-600 hover:text-error-700 transition-colors font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex-shrink-0 px-4 py-2 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredActors.length}</span>{" "}
              {filteredActors.length === 1 ? actorLabel.toLowerCase() : actorsLabel.toLowerCase()} available
              {existingActorIds.size > 0 && (
                <span className="ml-2 text-muted-foreground/70">
                  ({existingActorIds.size} already in {currentCharacter?.name || "character"})
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Total in database: <span className="font-medium text-foreground">{aggregatedActors.length}</span>
            </p>
          </div>
        </div>

        {/* Actor Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredActors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-medium text-foreground mb-1">No {actorsLabel.toLowerCase()} found</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                {searchTerm || activeFiltersCount > 0
                  ? `Try adjusting your search or filters to find ${actorsLabel.toLowerCase()}.`
                  : `Add ${actorsLabel.toLowerCase()} to other projects first, then they'll appear here.`}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
              {filteredActors.map((actor) => {
                const isSelected = selectedActors.has(actor.id)

                return (
                  <div
                    key={actor.id}
                    onClick={() => handleToggleActor(actor.id)}
                    className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 bg-card ${
                      isSelected
                        ? "border-success-500 ring-2 ring-success-500/30 scale-[1.02]"
                        : "border-transparent hover:border-border hover:shadow-lg"
                    }`}
                  >
                    {/* Selection Indicator */}
                    <div
                      className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-success-500 text-white scale-100"
                          : "bg-black/50 text-white scale-0 group-hover:scale-100"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>

                    {/* Actor Image */}
                    <div className="aspect-[3/4] bg-muted">
                      {actor.headshots && actor.headshots.length > 0 && actor.headshots[0] ? (
                        <img
                          src={actor.headshots[0]}
                          alt={actor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                          <User className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Actor Info */}
                    <div className="p-3">
                      <h3 className="font-medium text-foreground truncate">{actor.name}</h3>
                      <div className="flex flex-col gap-1 mt-1.5">
                        {actor.gender && <p className="text-xs text-muted-foreground truncate">{actor.gender}</p>}
                        {actor.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{actor.location}</span>
                          </div>
                        )}
                        {actor.age && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>Age {actor.age}</span>
                          </div>
                        )}
                        {/* Project count badge */}
                        <div className="flex items-center gap-1 text-xs text-info-600 mt-1">
                          <Folder className="w-3 h-3 flex-shrink-0" />
                          <span>
                            {actor.projectIds.length} project{actor.projectIds.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredActors.map((actor) => {
                const isSelected = selectedActors.has(actor.id)

                return (
                  <div
                    key={actor.id}
                    onClick={() => handleToggleActor(actor.id)}
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer border-2 transition-all duration-200 bg-card ${
                      isSelected
                        ? "border-success-500 ring-2 ring-success-500/30"
                        : "border-transparent hover:border-border hover:shadow-md"
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div
                      className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all border-2 ${
                        isSelected ? "bg-success-500 border-success-500 text-white" : "border-border"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>

                    {/* Actor Image */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {actor.headshots && actor.headshots.length > 0 && actor.headshots[0] ? (
                        <img
                          src={actor.headshots[0]}
                          alt={actor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Actor Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">{actor.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
                        {actor.gender && <span>{actor.gender}</span>}
                        {actor.age && <span>Age {actor.age}</span>}
                        {actor.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {actor.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="hidden md:flex flex-col items-end text-sm">
                      <span className="text-muted-foreground text-xs mb-1">In projects:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                        {actor.projectNames.slice(0, 3).map((name, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-info-100 text-info-700 rounded text-xs truncate max-w-[120px]"
                          >
                            {name}
                          </span>
                        ))}
                        {actor.projectNames.length > 3 && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                            +{actor.projectNames.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
