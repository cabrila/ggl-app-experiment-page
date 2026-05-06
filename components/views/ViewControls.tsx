"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import {
  Search,
  Grid3X3,
  List,
  LayoutGrid,
  SortAsc,
  Filter,
  Plus,
  Upload,
  Bookmark,
  Play,
  RectangleVertical,
  Save,
  Database,
  ChevronDown,
} from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"
import TerminologyContextMenu from "@/components/ui/TerminologyContextMenu"
import SearchTags from "@/components/ui/SearchTags"
import SavedSearchesManager from "@/components/ui/SavedSearchesManager"
import type { SearchTag } from "@/components/ui/SearchTags"
import { useActorGrid } from "@/components/actors/ActorGridContext"

export default function ViewControls() {
  const { state, dispatch } = useCasting()
  const { selectedActorIds } = useActorGrid()
  const { searchTerm, searchTags, savedSearches, cardDisplayMode, currentSortOption, filters } = state.currentFocus

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

  // Get current terminology
  const getCurrentTerminology = () => {
    const defaultTerminology = {
      actor: {
        singular: "Actor",
        plural: "Actors",
      },
      character: {
        singular: "Character",
        plural: "Characters",
      },
    }

    let projectTerminology = {}
    if (currentProject?.terminology) {
      projectTerminology = currentProject.terminology
    } else if (state.terminology) {
      projectTerminology = state.terminology
    }

    const mergedTerminology = {
      ...defaultTerminology,
      ...projectTerminology,
    }

    if (!mergedTerminology.actor || typeof mergedTerminology.actor !== "object") {
      mergedTerminology.actor = defaultTerminology.actor
    }
    if (!mergedTerminology.character || typeof mergedTerminology.character !== "object") {
      mergedTerminology.character = defaultTerminology.character
    }

    mergedTerminology.actor = {
      singular: mergedTerminology.actor?.singular || defaultTerminology.actor.singular,
      plural: mergedTerminology.actor?.plural || defaultTerminology.actor.plural,
    }
    mergedTerminology.character = {
      singular: mergedTerminology.character?.singular || defaultTerminology.character.singular,
      plural: mergedTerminology.character?.plural || defaultTerminology.character.plural,
    }

    return mergedTerminology
  }

  const terminology = getCurrentTerminology()
  const { activeTabKey } = state.currentFocus
  const isLongListTab = activeTabKey === "longList"

  const [showSavedSearches, setShowSavedSearches] = useState(false)

  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  const getUniqueLocations = (): string[] => {
    if (!currentCharacter) return []

    const locations = new Set<string>()
    const allActors: any[] = []

    // Collect all actors from all lists
    if (Array.isArray(currentCharacter.actors.longList)) {
      allActors.push(...currentCharacter.actors.longList)
    }
    if (Array.isArray(currentCharacter.actors.audition)) {
      allActors.push(...currentCharacter.actors.audition)
    }
    if (Array.isArray(currentCharacter.actors.approval)) {
      allActors.push(...currentCharacter.actors.approval)
    }

    // Extract locations
    allActors.forEach((actor) => {
      if (actor.location && actor.location.trim()) {
        locations.add(actor.location.trim())
      }
    })

    return Array.from(locations).sort()
  }

  const uniqueLocations = getUniqueLocations()

  useEffect(() => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.ageRange.min > 0 || filters.ageRange.max < 100) count++
    if (filters.location.length > 0) count++
    setActiveFiltersCount(count)
  }, [filters])

  const handleStatusFilterChange = (statusId: string) => {
    const newStatusFilter = filters.status.includes(statusId)
      ? filters.status.filter((id) => id !== statusId)
      : [...filters.status, statusId]

    dispatch({
      type: "SET_STATUS_FILTER",
      payload: newStatusFilter,
    })
  }

  const handleLocationFilterChange = (location: string) => {
    const newLocationFilter = filters.location.includes(location)
      ? filters.location.filter((loc) => loc !== location)
      : [...filters.location, location]

    dispatch({
      type: "SET_LOCATION_FILTER",
      payload: newLocationFilter,
    })
  }

  const handleAgeRangeChange = (type: "min" | "max", value: number) => {
    dispatch({
      type: "SET_AGE_RANGE_FILTER",
      payload: {
        ...filters.ageRange,
        [type]: value,
      },
    })
  }

  const handleClearAllFilters = () => {
    dispatch({
      type: "CLEAR_ALL_FILTERS",
    })
  }

  const handleSearchTagsChange = (tags: SearchTag[]) => {
    dispatch({
      type: "SET_SEARCH_TAGS",
      payload: tags,
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "SET_SEARCH_TERM",
      payload: e.target.value,
    })
  }

  const handleViewModeChange = (mode: "detailed" | "simple" | "list-view" | "row") => {
    dispatch({
      type: "SET_VIEW_MODE",
      payload: mode,
    })
  }

  const handleSortChange = (sortOption: string) => {
    dispatch({
      type: "SET_SORT_OPTION",
      payload: sortOption,
    })
  }

  const handleAddActor = () => {
    if (currentCharacter) {
      openModal("addActor", { characterId: currentCharacter.id })
    }
  }

  const handleUploadActors = () => {
    if (currentCharacter) {
      openModal("uploadActorsMenu", { characterId: currentCharacter.id })
    }
  }

  const handleAddFromDatabase = () => {
    if (currentCharacter) {
      openModal("addFromDatabase", { characterId: currentCharacter.id })
    }
  }

  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const addDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOpenPlayerView = () => {
    dispatch({ type: "OPEN_PLAYER_VIEW" })
  }

  const sortOptions = state.sortOptionDefinitions || [
    { key: "alphabetical", label: "Alphabetical" },
    { key: "dateAdded", label: "Date Added" },
    { key: "consensus", label: "Consensus" },
    { key: "status", label: "Status" },
    { key: "age", label: "Age" },
    { key: "custom", label: "Custom Order" },
  ]

  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    type: "actor" | "character"
    form: "singular" | "plural"
    currentValue: string
  } | null>(null)

  const handleContextMenu = (e: React.MouseEvent, type: "actor" | "character", form: "singular" | "plural") => {
    e.preventDefault()
    e.stopPropagation()

    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      form,
      currentValue: terminology[type][form],
    })

    return false
  }

  const handleLoadSavedSearch = (searchId: string) => {
    dispatch({
      type: "LOAD_SAVED_SEARCH",
      payload: searchId,
    })
  }

  const handleQuickSaveSearch = () => {
    // Check if there's content to save
    const hasContent = searchTags.length > 0 || searchTerm.trim().length > 0
    if (!hasContent) return

    // Generate a name based on content
    let searchName = ""
    if (searchTerm.trim()) {
      searchName = `"${searchTerm.trim()}"`
    }
    if (searchTags.length > 0) {
      const tagNames = searchTags.map((tag) => tag.text).join(", ")
      searchName = searchName ? `${searchName} + ${tagNames}` : tagNames
    }

    // Add timestamp for uniqueness
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
    searchName = `${searchName} (${timestamp})`

    dispatch({
      type: "SAVE_CURRENT_SEARCH",
      payload: {
        name: searchName,
        isGlobal: false,
      },
    })

    // Show brief success indication (optional - UI feedback)
    console.log("[v0] Quick saved search:", searchName)
  }

  const hasSearchContent = searchTags.length > 0 || searchTerm.trim().length > 0

  return (
    <div className="space-y-3">
      {/* Main Controls Container - Responsive Layout */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Left Section - Action Buttons and Controls */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Action Buttons - Only show on Long List tab */}
            {isLongListTab && currentCharacter && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div ref={addDropdownRef} className="relative">
                  <button
                    onClick={() => setShowAddDropdown(!showAddDropdown)}
                    onContextMenu={(e) => handleContextMenu(e, "actor", "singular")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${showAddDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showAddDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => {
                          handleAddActor()
                          setShowAddDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-foreground hover:bg-muted transition-colors"
                      >
                        <Plus className="w-4 h-4 text-success-600" />
                        <div>
                          <div className="font-medium text-sm">
                            Manual add {state.terminology?.actor?.singular?.toLowerCase() || "actor"}
                          </div>
                          <div className="text-xs text-muted-foreground">Create a new entry manually</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          handleUploadActors()
                          setShowAddDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-foreground hover:bg-muted transition-colors"
                      >
                        <Upload className="w-4 h-4 text-info-600" />
                        <div>
                          <div className="font-medium text-sm">Upload from file or form</div>
                          <div className="text-xs text-muted-foreground">Import from CSV, Excel, or form</div>
                        </div>
                      </button>

                      <div className="my-1 border-t border-border" />

                      <button
                        onClick={() => {
                          handleAddFromDatabase()
                          setShowAddDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-foreground hover:bg-muted transition-colors"
                      >
                        <Database className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="font-medium text-sm">From Database</div>
                          <div className="text-xs text-muted-foreground">
                            Add existing {state.terminology?.actor?.plural?.toLowerCase() || "actors"} from other
                            projects
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-px h-5 bg-slate-300 mx-1"></div>
              </div>
            )}

            {/* Player View Button */}
            <button
              onClick={handleOpenPlayerView}
              className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap shadow-md hover:shadow-lg"
            >
              <Play className="w-4 h-4" />
              <span>Player View</span>
            </button>
            <div className="w-px h-5 bg-slate-300 mx-1"></div>

            {/* View Mode Toggle */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => handleViewModeChange("detailed")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    cardDisplayMode === "detailed"
                      ? "bg-white text-emerald-600 shadow-sm scale-105"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  title="Detailed View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange("simple")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    cardDisplayMode === "simple"
                      ? "bg-white text-emerald-600 shadow-sm scale-105"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  title="Simple View"
                >
                  <RectangleVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange("row")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    cardDisplayMode === "row"
                      ? "bg-white text-emerald-600 shadow-sm scale-105"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  title="Row View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange("list-view")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    cardDisplayMode === "list-view"
                      ? "bg-white text-emerald-600 shadow-sm scale-105"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="w-px h-5 bg-slate-300 mx-2"></div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-sm font-medium text-slate-700 whitespace-nowrap hidden sm:inline">Sort:</span>
              <div className="relative">
                <select
                  value={currentSortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors min-w-[110px]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <SortAsc className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
              <div className="w-px h-5 bg-slate-300 mx-1"></div>
            </div>

            {/* Filters Button */}
            <button
              onClick={() => dispatch({ type: "TOGGLE_FILTERS" })}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg border transition-all duration-200 text-sm relative flex-shrink-0 ${
                filters.showFilters
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                  : "bg-white border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-md">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Section - Search Field with Saved Searches */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto lg:min-w-[300px] lg:max-w-[400px]">
            <button
              onClick={handleQuickSaveSearch}
              disabled={!hasSearchContent}
              className={`p-2 rounded-lg border transition-all duration-200 flex-shrink-0 ${
                hasSearchContent
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400"
                  : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
              }`}
              title={hasSearchContent ? "Save current search" : "Enter search terms or tags to save"}
            >
              <Save className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className={`p-2 rounded-lg border transition-all duration-200 flex-shrink-0 relative ${
                showSavedSearches || savedSearches.length > 0
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400"
              }`}
              title="Saved Searches"
            >
              <Bookmark className="w-4 h-4" />
              {savedSearches.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {savedSearches.length}
                </span>
              )}
            </button>

            <div className="relative flex-1">
              <SearchTags
                tags={searchTags}
                onTagsChange={handleSearchTagsChange}
                placeholder="Search actors..."
                className="w-full"
                maxTags={8}
                allowDuplicates={false}
                savedSearches={savedSearches}
                onLoadSavedSearch={handleLoadSavedSearch}
              />
            </div>

            {showSavedSearches && (
              <div className="absolute top-full right-0 mt-2 w-96 z-20">
                <SavedSearchesManager onClose={() => setShowSavedSearches(false)} />
              </div>
            )}
          </div>
        </div>

        {/* Search Help Text - More compact */}
        {(searchTags.length > 0 || searchTerm) && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              <span className="font-medium">Searching:</span> Name, Gender, Ethnicity, Skills, Location
              {searchTags.length > 0 && (
                <>
                  {" • "}
                  <span className="font-medium">Tags:</span> {searchTags.map((tag) => tag.text).join(", ")}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Filters Panel */}
      {filters.showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-slate-800">Filter Options</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Clear All Filters ({activeFiltersCount})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card View Settings */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <LayoutGrid className="w-4 h-4 mr-2 text-slate-500" />
                Display Options
              </h4>
              <div className="space-y-2">
                {Object.entries(state.cardViewSettings).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_CARD_SETTINGS",
                          payload: { field: key, value: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-sm text-slate-600 capitalize group-hover:text-slate-800 transition-colors">
                      {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2 text-slate-500" />
                Status Filters
                {filters.status.length > 0 && (
                  <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {filters.status.length}
                  </span>
                )}
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {state.predefinedStatuses.length > 0 ? (
                  state.predefinedStatuses.map((status) => (
                    <label key={status.id} className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status.id)}
                        onChange={() => handleStatusFilterChange(status.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span
                        className="text-xs px-2 py-1 rounded-md font-medium transition-all"
                        style={{
                          backgroundColor: status.bgColor,
                          color: status.textColor,
                        }}
                      >
                        {status.label}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 italic">No statuses available</div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <SortAsc className="w-4 h-4 mr-2 text-slate-500" />
                Age Range
                {(filters.ageRange.min > 0 || filters.ageRange.max < 100) && (
                  <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    Active
                  </span>
                )}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">
                    Minimum Age: <span className="font-semibold text-slate-800">{filters.ageRange.min}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.ageRange.min}
                    onChange={(e) => handleAgeRangeChange("min", Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">
                    Maximum Age: <span className="font-semibold text-slate-800">{filters.ageRange.max}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.ageRange.max}
                    onChange={(e) => handleAgeRangeChange("max", Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <div className="text-xs text-slate-500 bg-white rounded-md p-2 border border-slate-200">
                  Showing actors aged <span className="font-semibold text-emerald-600">{filters.ageRange.min}</span> to{" "}
                  <span className="font-semibold text-emerald-600">{filters.ageRange.max}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Search className="w-4 h-4 mr-2 text-slate-500" />
                Location
                {filters.location.length > 0 && (
                  <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {filters.location.length}
                  </span>
                )}
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {uniqueLocations.length > 0 ? (
                  uniqueLocations.map((location) => (
                    <label key={location} className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.location.includes(location)}
                        onChange={() => handleLocationFilterChange(location)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors truncate">
                        {location}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 italic">No locations available</div>
                )}
              </div>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Active Filters:</span>
                {filters.status.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-medium">
                    {filters.status.length} Status{filters.status.length > 1 ? "es" : ""}
                  </span>
                )}
                {(filters.ageRange.min > 0 || filters.ageRange.max < 100) && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                    Age: {filters.ageRange.min}-{filters.ageRange.max}
                  </span>
                )}
                {filters.location.length > 0 && (
                  <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">
                    {filters.location.length} Location{filters.location.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Terminology Context Menu */}
      {contextMenu && (
        <TerminologyContextMenu
          show={contextMenu.show}
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          form={contextMenu.form}
          currentValue={contextMenu.currentValue}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
