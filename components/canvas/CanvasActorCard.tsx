"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Heart, XIcon, Star, Check } from "lucide-react"

interface CanvasActor {
  id: string
  actorId: string
  x: number
  y: number
  characterName: string
  actor: any
  groupId?: string
}

interface CanvasActorCardProps {
  canvasActor: CanvasActor
  showActorName: boolean
  isSelected: boolean
  isInGroup: boolean
  groupColor?: string
  viewMode?: "standard" | "compact" | "minimal" | "voting"
  onDrag: (id: string, deltaX: number, deltaY: number) => void
  onCharacterNameChange: (id: string, newName: string) => void
  onContextMenu: (e: React.MouseEvent, id: string) => void
  onSelect: (id: string, isMultiSelect: boolean) => void
  characterId?: string
  dispatch?: any
  currentUser?: any
  allUsers?: any[]
}

export default function CanvasActorCard({
  canvasActor,
  showActorName,
  isSelected,
  isInGroup,
  groupColor,
  viewMode = "standard",
  onDrag,
  onCharacterNameChange,
  onContextMenu,
  onSelect,
  characterId,
  dispatch,
  currentUser,
  allUsers = [],
}: CanvasActorCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(canvasActor.characterName)
  const cardRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [recentVote, setRecentVote] = useState<string | null>(null)

  const [touchStartTime, setTouchStartTime] = useState(0)
  const touchStartRef = useRef({ x: 0, y: 0 })
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isLongPress, setIsLongPress] = useState(false)

  useEffect(() => {
    setEditValue(canvasActor.characterName)
  }, [canvasActor.characterName])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setCurrentImageIndex(0)
  }, [canvasActor.actor.id])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".character-edit-area")) {
      return
    }

    if (
      (e.target as HTMLElement).closest(".voting-buttons") ||
      (e.target as HTMLElement).closest(".image-navigation") ||
      (e.target as HTMLElement).closest(".selection-checkbox")
    ) {
      return
    }

    if (e.ctrlKey || e.metaKey) {
      onSelect(canvasActor.id, true)
    } else {
      onSelect(canvasActor.id, false)
    }

    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
    e.stopPropagation()
  }

  const handleCharacterNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleCharacterNameChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value)
  }

  const handleCharacterNameBlur = () => {
    setIsEditing(false)
    onCharacterNameChange(canvasActor.id, editValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
      onCharacterNameChange(canvasActor.id, editValue)
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(canvasActor.characterName)
    }
  }

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : (canvasActor.actor.headshots?.length || 1) - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev < (canvasActor.actor.headshots?.length || 1) - 1 ? prev + 1 : 0))
  }

  const handleVote = (e: React.MouseEvent, vote: "yes" | "no" | "maybe") => {
    e.stopPropagation()
    e.preventDefault()

    if (!currentUser || !characterId || !dispatch) return

    dispatch({
      type: "CAST_VOTE",
      payload: {
        actorId: canvasActor.actorId,
        characterId,
        vote,
        userId: currentUser.id,
      },
    })

    setRecentVote(vote)
    setTimeout(() => setRecentVote(null), 1000)
  }

  const currentUserVote = currentUser ? canvasActor.actor.userVotes?.[currentUser.id] : null

  const getVoteStats = () => {
    const votes = canvasActor.actor.userVotes || {}
    const yesVotes = Object.values(votes).filter((v) => v === "yes").length
    const noVotes = Object.values(votes).filter((v) => v === "no").length
    const maybeVotes = Object.values(votes).filter((v) => v === "maybe").length
    return { yesVotes, noVotes, maybeVotes, totalVotes: yesVotes + noVotes + maybeVotes }
  }

  const voteStats = getVoteStats()

  const getCardDimensions = () => {
    switch (viewMode) {
      case "compact":
        return { width: "200px", imageWidth: "w-1/3" }
      case "minimal":
        return { width: "120px", imageWidth: "w-full" }
      case "voting":
        return { width: "240px", imageWidth: "w-2/5" }
      default:
        return { width: "280px", imageWidth: "w-1/2" }
    }
  }

  const { width: cardWidth, imageWidth } = getCardDimensions()

  const getVoteHighlightColor = () => {
    if (!currentUserVote) return ""
    switch (currentUserVote) {
      case "yes":
        return "ring-2 ring-green-400 shadow-lg shadow-green-200"
      case "no":
        return "ring-2 ring-red-400 shadow-lg shadow-red-200"
      case "maybe":
        return "ring-2 ring-blue-400 shadow-lg shadow-blue-200"
      default:
        return ""
    }
  }

  const getRecentVoteAnimation = () => {
    if (!recentVote) return ""
    switch (recentVote) {
      case "yes":
        return "animate-pulse ring-4 ring-green-500"
      case "no":
        return "animate-pulse ring-4 ring-red-500"
      case "maybe":
        return "animate-pulse ring-4 ring-blue-500"
      default:
        return ""
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".character-edit-area")) {
      return
    }

    if (
      (e.target as HTMLElement).closest(".voting-buttons") ||
      (e.target as HTMLElement).closest(".image-navigation") ||
      (e.target as HTMLElement).closest(".selection-checkbox")
    ) {
      return
    }

    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    setTouchStartTime(Date.now())

    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true)
      onSelect(canvasActor.id, true)
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 500ms long press

    e.preventDefault()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      if (!isDragging) {
        setIsDragging(true)
      }
      onDrag(canvasActor.id, deltaX, deltaY)
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const touchDuration = Date.now() - touchStartTime

    if (!isDragging && touchDuration < 500 && !isLongPress) {
      onSelect(canvasActor.id, false)
    }

    setIsDragging(false)
    setIsLongPress(false)
  }

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.x
        const deltaY = e.clientY - dragStartRef.current.y

        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          onDrag(canvasActor.id, deltaX, deltaY)
          dragStartRef.current = { x: e.clientX, y: e.clientY }
        }
      }
    }

    const handleDocumentMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleDocumentMouseMove)
      document.addEventListener("mouseup", handleDocumentMouseUp)
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove)
      document.removeEventListener("mouseup", handleDocumentMouseUp)
      document.body.style.userSelect = ""
    }
  }, [isDragging, canvasActor.id, onDrag])

  const SelectionCheckbox = () => (
    <div
      className="selection-checkbox absolute top-2 left-2 z-20"
      onClick={(e) => {
        e.stopPropagation()
        onSelect(canvasActor.id, true)
      }}
      onTouchEnd={(e) => {
        e.stopPropagation()
        onSelect(canvasActor.id, true)
      }}
    >
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          isSelected
            ? "bg-blue-500 border-blue-500 shadow-lg"
            : "bg-white bg-opacity-80 border-gray-300 hover:border-blue-400"
        }`}
      >
        {isSelected && <Check className="w-4 h-4 text-white" />}
      </div>
    </div>
  )

  if (viewMode === "voting") {
    return (
      <motion.div
        ref={cardRef}
        className={`absolute flex flex-col bg-white rounded-lg shadow-md overflow-hidden select-none group ${
          isSelected ? "ring-2 ring-blue-500" : ""
        } ${isInGroup ? `border-2 border-dashed ${groupColor ? groupColor : "border-gray-400"}` : ""} ${getVoteHighlightColor()} ${getRecentVoteAnimation()}`}
        style={{
          left: canvasActor.x,
          top: canvasActor.y,
          width: cardWidth,
          cursor: isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.8 : 1,
          zIndex: isSelected || isDragging ? 10 : 1,
          touchAction: "none", // Prevent default touch actions
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => onContextMenu(e, canvasActor.id)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        data-actor-card="true"
      >
        <SelectionCheckbox />

        <div className="flex">
          <div className={`${imageWidth} relative`}>
            {canvasActor.actor.headshots?.[currentImageIndex] ? (
              <img
                src={canvasActor.actor.headshots[currentImageIndex]}
                alt={canvasActor.actor.name}
                className="w-full h-full object-cover"
                style={{ aspectRatio: "1/1.2" }}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-xl font-bold" style={{ aspectRatio: "1/1.2" }}>
                {canvasActor.actor.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}

            {canvasActor.actor.headshots && canvasActor.actor.headshots.length > 1 && (
              <div className="image-navigation">
                <button
                  onClick={handlePreviousImage}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="absolute left-0.5 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-0.5 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Previous image"
                >
                  <ChevronLeft className="w-2 h-2" />
                </button>
                <button
                  onClick={handleNextImage}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="absolute right-0.5 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-0.5 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Next image"
                >
                  <ChevronRight className="w-2 h-2" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-2 flex flex-col justify-between">
            {showActorName && (
              <div className="text-xs font-semibold text-gray-800 truncate">{canvasActor.actor.name}</div>
            )}
            <div className="text-xs text-gray-600 truncate">{canvasActor.characterName || "No character"}</div>

            <div className="flex flex-wrap gap-0.5 mt-1">
              {allUsers.map((user) => {
                const userVote = canvasActor.actor.userVotes?.[user.id]
                let bgGradient = "bg-gray-200"
                let textColor = "text-gray-500"

                if (userVote === "yes") {
                  bgGradient = "bg-gradient-to-br from-green-500 to-green-600"
                  textColor = "text-white"
                } else if (userVote === "no") {
                  bgGradient = "bg-gradient-to-br from-red-500 to-red-600"
                  textColor = "text-white"
                } else if (userVote === "maybe") {
                  bgGradient = "bg-gradient-to-br from-blue-500 to-blue-600"
                  textColor = "text-white"
                }

                return (
                  <div
                    key={user.id}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${bgGradient} ${textColor} shadow-sm`}
                    title={`${user.name}: ${userVote || "not voted"}`}
                  >
                    {user.initials}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="voting-buttons grid grid-cols-3 gap-1 p-1.5 bg-gray-50 border-t border-gray-200">
          <button
            onClick={(e) => handleVote(e, "yes")}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            className={`px-1 py-1 text-xs font-semibold rounded border transition-all duration-200 flex items-center justify-center space-x-0.5 ${
              currentUserVote === "yes"
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700 shadow-sm"
                : "bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300 hover:from-green-200 hover:to-green-300"
            }`}
            title="Vote Yes"
          >
            <Heart className="w-3 h-3" />
            <span>{voteStats.yesVotes > 0 ? voteStats.yesVotes : ""}</span>
          </button>
          <button
            onClick={(e) => handleVote(e, "no")}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            className={`px-1 py-1 text-xs font-semibold rounded border transition-all duration-200 flex items-center justify-center space-x-0.5 ${
              currentUserVote === "no"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-700 shadow-sm"
                : "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300 hover:from-red-200 hover:to-red-300"
            }`}
            title="Vote No"
          >
            <XIcon className="w-3 h-3" />
            <span>{voteStats.noVotes > 0 ? voteStats.noVotes : ""}</span>
          </button>
          <button
            onClick={(e) => handleVote(e, "maybe")}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            className={`px-1 py-1 text-xs font-semibold rounded border transition-all duration-200 flex items-center justify-center space-x-0.5 ${
              currentUserVote === "maybe"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-700 shadow-sm"
                : "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300 hover:from-blue-200 hover:to-blue-300"
            }`}
            title="Vote Maybe"
          >
            <Star className="w-3 h-3" />
            <span>{voteStats.maybeVotes > 0 ? voteStats.maybeVotes : ""}</span>
          </button>
        </div>
      </motion.div>
    )
  }

  if (viewMode === "minimal") {
    return (
      <motion.div
        ref={cardRef}
        className={`absolute flex flex-col bg-white rounded-lg shadow-md overflow-hidden select-none group ${
          isSelected ? "ring-2 ring-blue-500" : ""
        } ${isInGroup ? `border-2 border-dashed ${groupColor ? groupColor : "border-gray-400"}` : ""}`}
        style={{
          left: canvasActor.x,
          top: canvasActor.y,
          width: cardWidth,
          cursor: isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.8 : 1,
          zIndex: isSelected || isDragging ? 10 : 1,
          touchAction: "none", // Prevent default touch actions
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => onContextMenu(e, canvasActor.id)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        data-actor-card="true"
      >
        <SelectionCheckbox />

        <div className="w-full relative">
          {canvasActor.actor.headshots?.[currentImageIndex] ? (
            <img
              src={canvasActor.actor.headshots[currentImageIndex]}
              alt={canvasActor.actor.name}
              className="w-full h-full object-cover"
              style={{ aspectRatio: "1/1" }}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-xl font-bold" style={{ aspectRatio: "1/1" }}>
              {canvasActor.actor.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}

          {canvasActor.actor.headshots && canvasActor.actor.headshots.length > 1 && (
            <div className="image-navigation">
              <button
                onClick={handlePreviousImage}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                className="absolute left-0.5 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-0.5 transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Previous image"
              >
                <ChevronLeft className="w-2 h-2" />
              </button>
              <button
                onClick={handleNextImage}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                className="absolute right-0.5 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-0.5 transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Next image"
              >
                <ChevronRight className="w-2 h-2" />
              </button>
            </div>
          )}
        </div>

        {showActorName && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center truncate">
            {canvasActor.actor.name}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={cardRef}
      className={`absolute flex bg-white rounded-lg shadow-md overflow-hidden select-none group ${
        isSelected ? "ring-2 ring-blue-500" : ""
      } ${isInGroup ? `border-2 border-dashed ${groupColor ? groupColor : "border-gray-400"}` : ""}`}
      style={{
        left: canvasActor.x,
        top: canvasActor.y,
        width: cardWidth,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.8 : 1,
        zIndex: isSelected || isDragging ? 10 : 1,
        touchAction: "none", // Prevent default touch actions
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => onContextMenu(e, canvasActor.id)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      data-actor-card="true"
    >
      <SelectionCheckbox />

      <div className={`${imageWidth} h-full relative`}>
        {canvasActor.actor.headshots?.[currentImageIndex] ? (
          <img
            src={canvasActor.actor.headshots[currentImageIndex]}
            alt={canvasActor.actor.name}
            className="w-full h-full object-cover"
            style={{ aspectRatio: "1/1.2" }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-xl font-bold" style={{ aspectRatio: "1/1.2" }}>
            {canvasActor.actor.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}

        {canvasActor.actor.headshots && canvasActor.actor.headshots.length > 1 && (
          <div className="image-navigation">
            <button
              onClick={handlePreviousImage}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Previous image"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleNextImage}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Next image"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {canvasActor.actor.headshots.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(index)
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentImageIndex ? "bg-white" : "bg-white bg-opacity-50 hover:bg-opacity-75"
                  }`}
                  title={`Image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className={`${viewMode === "compact" ? "w-2/3" : "w-1/2"} ${viewMode === "compact" ? "p-2" : "p-3"} flex flex-col`}
      >
        {showActorName && (
          <div className={`${viewMode === "compact" ? "text-xs" : "text-sm"} font-medium text-gray-600 mb-2 truncate`}>
            {canvasActor.actor.name}
          </div>
        )}

        <div
          className={`character-edit-area flex-grow ${showActorName ? "" : "pt-1"}`}
          onClick={handleCharacterNameClick}
        >
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={editValue}
              onChange={handleCharacterNameChange}
              onBlur={handleCharacterNameBlur}
              onKeyDown={handleKeyDown}
              className={`w-full h-full ${viewMode === "compact" ? "min-h-[40px] text-xs" : "min-h-[60px] text-sm"} p-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter character details..."
            />
          ) : (
            <div
              className={`${viewMode === "compact" ? "text-sm min-h-[40px]" : "text-base min-h-[60px]"} font-bold text-gray-600 p-1 hover:bg-gray-50 rounded cursor-text`}
            >
              {canvasActor.characterName || "Click to add character details..."}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
