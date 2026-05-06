"use client"

import { useMemo, useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, GripVertical, Palette, X, Edit2 } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import type { Scene, ScheduleEntry } from "@/types/schedule"
import type { Actor } from "@/types/casting"

const PRESET_COLORS = [
  { name: "Red (EXT Day)", value: "bg-red-500", textColor: "text-white" },
  { name: "Yellow", value: "bg-yellow-400", textColor: "text-gray-900" },
  { name: "Green (INT Night)", value: "bg-green-500", textColor: "text-white" },
  { name: "Dark Green (EXT Night)", value: "bg-green-700", textColor: "text-white" },
  { name: "White (INT Day)", value: "bg-white border-2 border-gray-400", textColor: "text-gray-900" },
  { name: "Blue", value: "bg-blue-500", textColor: "text-white" },
  { name: "Purple", value: "bg-purple-500", textColor: "text-white" },
  { name: "Orange", value: "bg-orange-500", textColor: "text-white" },
  { name: "Pink", value: "bg-pink-500", textColor: "text-white" },
  { name: "Teal", value: "bg-teal-500", textColor: "text-white" },
  { name: "Indigo", value: "bg-indigo-500", textColor: "text-white" },
  { name: "Gray", value: "bg-gray-500", textColor: "text-white" },
]

interface StripboardViewProps {
  phaseEntries: ScheduleEntry[]
  allActors: Actor[]
  detectConflicts: (entry: ScheduleEntry) => any[]
  onUpdateEntry: (entryId: string, updates: Partial<ScheduleEntry>) => void
  onDeleteShootDay: (entryId: string) => void
  onOpenActorSelector: (entryId: string) => void
  onEditShootDay: (entry: ScheduleEntry) => void
}

function SceneStrip({ scene, shootDay, allActors }: { scene: Scene; shootDay: ScheduleEntry; allActors: Actor[] }) {
  const { dispatch } = useCasting()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })
  const [showColorPicker, setShowColorPicker] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getStripColor = () => {
    if (scene.customColor) return scene.customColor

    if (scene.intExt === "EXT" && scene.dayNight === "Day") return "bg-red-500"
    if (scene.intExt === "EXT" && scene.dayNight === "Night") return "bg-green-700"
    if (scene.intExt === "INT" && scene.dayNight === "Day") return "bg-white border-2 border-gray-400"
    if (scene.intExt === "INT" && scene.dayNight === "Night") return "bg-green-500"
    return "bg-yellow-400" // INT/EXT
  }

  const getTextColor = () => {
    if (scene.customColor) {
      const presetColor = PRESET_COLORS.find((c) => c.value === scene.customColor)
      return presetColor?.textColor || "text-white"
    }

    if (scene.intExt === "INT" && scene.dayNight === "Day") return "text-gray-900"
    return "text-white"
  }

  const handleColorChange = (colorValue: string) => {
    dispatch({
      type: "UPDATE_SCENE",
      payload: {
        id: scene.id,
        updates: { customColor: colorValue },
      },
    })
    setShowColorPicker(false)
  }

  const handleResetColor = () => {
    dispatch({
      type: "UPDATE_SCENE",
      payload: {
        id: scene.id,
        updates: { customColor: undefined },
      },
    })
    setShowColorPicker(false)
  }

  const assignedActors = allActors.filter((a) => shootDay.actorIds.includes(a.id))

  return (
    <div ref={setNodeRef} style={style} className="mb-1 relative">
      <div className={`${getStripColor()} ${getTextColor()} rounded shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex items-stretch h-16">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center px-2 bg-black/10 hover:bg-black/20 transition-colors cursor-move"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Sheet # and Pages */}
          <div className="flex flex-col justify-center px-3 border-r border-black/20 min-w-[80px]">
            <div className="text-xs font-bold">Sheet #: {scene.sceneNumber}</div>
            <div className="text-xs">{scene.pages} pgs</div>
          </div>

          {/* Scenes */}
          <div className="flex flex-col justify-center px-3 border-r border-black/20 min-w-[80px]">
            <div className="text-xs font-bold">Scenes:</div>
            <div className="text-xs">{scene.sceneNumber}</div>
          </div>

          {/* INT/EXT */}
          <div className="flex items-center justify-center px-3 border-r border-black/20 min-w-[60px]">
            <div className="text-sm font-bold">{scene.intExt}</div>
          </div>

          {/* Location */}
          <div className="flex items-center px-4 border-r border-black/20 flex-1 min-w-0">
            <div className="text-sm truncate">{scene.location}</div>
          </div>

          {/* Day/Night */}
          <div className="flex items-center justify-center px-3 border-r border-black/20 min-w-[80px]">
            <div className="text-sm font-bold">{scene.dayNight}</div>
          </div>

          {/* Actors */}
          <div className="flex items-center px-3 min-w-[80px] relative group">
            <div className="text-sm font-bold">{assignedActors.length > 0 ? assignedActors.length : "-"}</div>
            {assignedActors.length > 0 && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                  {assignedActors.map((a) => a.name).join(", ")}
                </div>
              </div>
            )}
          </div>

          {/* Color Picker Button */}
          <div className="flex items-center px-2 border-l border-black/20">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded hover:bg-black/10 transition-colors"
              title="Change strip color"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Picker Popover */}
      {showColorPicker && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[320px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Choose Strip Color</h3>
            <button
              onClick={() => setShowColorPicker(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className={`${color.value} ${color.textColor} px-3 py-2 rounded text-xs font-medium hover:opacity-80 transition-opacity text-left`}
              >
                {color.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetColor}
            className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Reset to Default Color
          </button>
        </div>
      )}
    </div>
  )
}

export default function StripboardView({
  phaseEntries,
  allActors,
  detectConflicts,
  onUpdateEntry,
  onDeleteShootDay,
  onOpenActorSelector,
  onEditShootDay,
}: StripboardViewProps) {
  const { state, dispatch } = useCasting()
  const [showAddSceneForm, setShowAddSceneForm] = useState(false)
  const [selectedShootDayId, setSelectedShootDayId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [newSceneData, setNewSceneData] = useState({
    sceneNumber: "",
    pages: "",
    intExt: "INT" as "INT" | "EXT" | "INT/EXT",
    location: "",
    dayNight: "Day" as "Day" | "Night",
    cast: [] as string[],
    description: "",
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const scenesByShootDay = useMemo(() => {
    const grouped: { [shootDayId: string]: Scene[] } = {}
    phaseEntries.forEach((entry) => {
      grouped[entry.id] = state.scenes
        .filter((scene) => scene.shootDayId === entry.id)
        .sort((a, b) => a.order - b.order)
    })
    return grouped
  }, [state.scenes, phaseEntries])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const activeScene = state.scenes.find((s) => s.id === active.id)
    const overScene = state.scenes.find((s) => s.id === over.id)

    if (!activeScene || !overScene) return

    if (activeScene.shootDayId === overScene.shootDayId) {
      const shootDayScenes = scenesByShootDay[activeScene.shootDayId]
      const oldIndex = shootDayScenes.findIndex((s) => s.id === active.id)
      const newIndex = shootDayScenes.findIndex((s) => s.id === over.id)

      const reorderedScenes = arrayMove(shootDayScenes, oldIndex, newIndex)

      reorderedScenes.forEach((scene, index) => {
        dispatch({
          type: "UPDATE_SCENE",
          payload: { id: scene.id, updates: { order: index } },
        })
      })
    } else {
      const targetShootDayScenes = scenesByShootDay[overScene.shootDayId]
      const newOrder = targetShootDayScenes.findIndex((s) => s.id === over.id)

      dispatch({
        type: "UPDATE_SCENE",
        payload: {
          id: activeScene.id,
          updates: {
            shootDayId: overScene.shootDayId,
            order: newOrder,
          },
        },
      })

      targetShootDayScenes.forEach((scene, index) => {
        if (scene.id !== activeScene.id) {
          const adjustedOrder = index >= newOrder ? index + 1 : index
          dispatch({
            type: "UPDATE_SCENE",
            payload: { id: scene.id, updates: { order: adjustedOrder } },
          })
        }
      })
    }
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Stripboard Header */}
        <div className="mb-4">
          <div className="flex items-stretch h-12 bg-gray-100 rounded-t border-2 border-gray-300 font-semibold text-sm">
            <div className="flex items-center justify-center px-2 border-r border-gray-300 w-[50px]"></div>
            <div className="flex items-center px-3 border-r border-gray-300 min-w-[80px]">Sheet # / Pages</div>
            <div className="flex items-center px-3 border-r border-gray-300 min-w-[80px]">Scenes</div>
            <div className="flex items-center justify-center px-3 border-r border-gray-300 min-w-[60px]">INT/EXT</div>
            <div className="flex items-center px-4 border-r border-gray-300 flex-1">Location</div>
            <div className="flex items-center justify-center px-3 border-r border-gray-300 min-w-[80px]">Day/Night</div>
            <div className="flex items-center px-3 border-r border-gray-300 min-w-[80px]">Actors</div>
            <div className="flex items-center px-2 min-w-[50px]">Color</div>
          </div>
        </div>

        {/* Shooting Days with Scenes */}
        {phaseEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No shoot days in this phase. Create shoot days first to add scenes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {phaseEntries.map((entry, dayIndex) => {
              const dayScenes = scenesByShootDay[entry.id] || []

              return (
                <div key={entry.id}>
                  {/* Shoot Day Divider */}
                  <div className="bg-black text-white px-4 py-2 rounded font-bold text-sm mb-2 flex items-center justify-between group">
                    <span>
                      End of Shooting Day {dayIndex + 1} - {entry.title} ({new Date(entry.date).toLocaleDateString()})
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs opacity-75">
                        {entry.actorIds.length} actor{entry.actorIds.length !== 1 ? "s" : ""} assigned
                      </span>
                      <button
                        onClick={() => onEditShootDay(entry)}
                        className="p-1.5 hover:bg-white/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit shoot day"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scenes for this day */}
                  {dayScenes.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={dayScenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                        {dayScenes.map((scene) => (
                          <SceneStrip key={scene.id} scene={scene} shootDay={entry} allActors={allActors} />
                        ))}
                      </SortableContext>
                      <DragOverlay>
                        {activeId ? (
                          <div className="opacity-80 scale-105">
                            {(() => {
                              const scene = state.scenes.find((s) => s.id === activeId)
                              if (!scene) return null
                              return <SceneStrip scene={scene} shootDay={entry} allActors={allActors} />
                            })()}
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded border-2 border-dashed border-gray-300 mb-2">
                      <p className="text-sm text-gray-500">No scenes for this shoot day</p>
                    </div>
                  )}

                  {/* Add Scene Button */}
                  <button
                    onClick={() => {
                      setSelectedShootDayId(entry.id)
                      setShowAddSceneForm(true)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Scene to Day {dayIndex + 1}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Scene Form Modal */}
        {showAddSceneForm && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Add New Scene</h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scene Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSceneData.sceneNumber}
                      onChange={(e) => setNewSceneData({ ...newSceneData, sceneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., 1, 2A, 15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                    <input
                      type="text"
                      value={newSceneData.pages}
                      onChange={(e) => setNewSceneData({ ...newSceneData, pages: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., 2/8, 1 4/8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">INT/EXT</label>
                    <select
                      value={newSceneData.intExt}
                      onChange={(e) =>
                        setNewSceneData({ ...newSceneData, intExt: e.target.value as "INT" | "EXT" | "INT/EXT" })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="INT">Interior (INT)</option>
                      <option value="EXT">Exterior (EXT)</option>
                      <option value="INT/EXT">INT/EXT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day/Night</label>
                    <select
                      value={newSceneData.dayNight}
                      onChange={(e) =>
                        setNewSceneData({ ...newSceneData, dayNight: e.target.value as "Day" | "Night" })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Day">Day</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSceneData.location}
                      onChange={(e) => setNewSceneData({ ...newSceneData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., kitchen, beverly hills ca"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newSceneData.description}
                      onChange={(e) => setNewSceneData({ ...newSceneData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      placeholder="Scene description..."
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddSceneForm(false)
                    setSelectedShootDayId(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedShootDayId || !newSceneData.sceneNumber.trim() || !newSceneData.location.trim()) {
                      alert("Please fill in scene number and location")
                      return
                    }

                    const shootDayScenes = scenesByShootDay[selectedShootDayId] || []
                    const newScene: Scene = {
                      id: `scene-${Date.now()}`,
                      sceneNumber: newSceneData.sceneNumber.trim(),
                      pages: newSceneData.pages.trim() || "1/8",
                      intExt: newSceneData.intExt,
                      location: newSceneData.location.trim(),
                      dayNight: newSceneData.dayNight,
                      cast: newSceneData.cast,
                      description: newSceneData.description.trim(),
                      shootDayId: selectedShootDayId,
                      order: shootDayScenes.length,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    }

                    dispatch({ type: "ADD_SCENE", payload: newScene })

                    setShowAddSceneForm(false)
                    setSelectedShootDayId(null)
                    setNewSceneData({
                      sceneNumber: "",
                      pages: "",
                      intExt: "INT",
                      location: "",
                      dayNight: "Day",
                      cast: [],
                      description: "",
                    })
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Add Scene
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
