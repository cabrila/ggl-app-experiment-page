"use client"

import type React from "react"
import { useState } from "react"

import { Copy, Trash2, MoreHorizontal, ArrowRightLeft, Users, Plus, ChevronRight } from "lucide-react"

interface CanvasContextMenuProps {
  x: number
  y: number
  availableGroups: Array<{ id: string; name: string; color: string }>
  onRemove: () => void
  onDuplicate: () => void
  onMoveActor: () => void
  onAddToGroup: (groupId: string) => void
  onCreateNewGroup: () => void
  onClose: () => void
}

export default function CanvasContextMenu({
  x,
  y,
  availableGroups,
  onRemove,
  onDuplicate,
  onMoveActor,
  onAddToGroup,
  onCreateNewGroup,
  onClose,
}: CanvasContextMenuProps) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const [showGroupSubmenu, setShowGroupSubmenu] = useState(false)

  return (
    <div
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={handleMenuClick}
    >
      {/* Header */}
      <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-100 flex items-center">
        <MoreHorizontal className="w-3 h-3 mr-1" />
        Options
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <button
          onClick={onDuplicate}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
        >
          <Copy className="w-4 h-4 mr-2 text-gray-500" />
          Duplicate Actor
        </button>

        <button
          onClick={onMoveActor}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
        >
          <ArrowRightLeft className="w-4 h-4 mr-2 text-gray-500" />
          Move Actor
        </button>

        {/* Add to Group Section */}
        <div className="border-t border-gray-100 my-1"></div>

        <div
          className="relative"
          onMouseEnter={() => setShowGroupSubmenu(true)}
          onMouseLeave={() => setShowGroupSubmenu(false)}
        >
          <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              Add to Group
            </div>
            <ChevronRight className="w-3 h-3 text-gray-400" />
          </button>

          {/* Group Submenu */}
          {showGroupSubmenu && (
            <div
              className="absolute left-full top-0 ml-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-60 min-w-[180px]"
              onClick={handleMenuClick}
            >
              {/* Create New Group Option */}
              <button
                onClick={onCreateNewGroup}
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Group
              </button>

              {availableGroups.length > 0 && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-3 py-1 text-xs font-medium text-gray-500">Existing Groups</div>
                  {availableGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => onAddToGroup(group.id)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <div
                        className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                        style={{ backgroundColor: group.color }}
                      ></div>
                      <span className="truncate">{group.name}</span>
                    </button>
                  ))}
                </>
              )}

              {availableGroups.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-500 italic">No groups available</div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 my-1"></div>

        <button
          onClick={onRemove}
          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
        >
          <Trash2 className="w-4 h-4 mr-2 text-red-500" />
          Remove from Canvas
        </button>
      </div>
    </div>
  )
}
