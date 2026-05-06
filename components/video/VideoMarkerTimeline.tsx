"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Play, Pause, RotateCcw, Clock } from "lucide-react"
import { formatTimecode, parseTimecode, validateTimeMarkers } from "@/utils/videoUtils"

interface VideoMarkerTimelineProps {
  videoId: string
  duration?: number
  markIn?: number
  markOut?: number
  onMarkersChange: (markIn?: number, markOut?: number) => void
  className?: string
}

export default function VideoMarkerTimeline({
  videoId,
  duration = 300, // Default 5 minutes if duration unknown
  markIn,
  markOut,
  onMarkersChange,
  className = "",
}: VideoMarkerTimelineProps) {
  const [isDragging, setIsDragging] = useState<"markIn" | "markOut" | null>(null)
  const [localMarkIn, setLocalMarkIn] = useState(markIn || 0)
  const [localMarkOut, setLocalMarkOut] = useState(markOut || duration)
  const [markInInput, setMarkInInput] = useState(formatTimecode(markIn || 0))
  const [markOutInput, setMarkOutInput] = useState(formatTimecode(markOut || duration))
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLocalMarkIn(markIn || 0)
    setLocalMarkOut(markOut || duration)
    setMarkInInput(formatTimecode(markIn || 0))
    setMarkOutInput(formatTimecode(markOut || duration))
  }, [markIn, markOut, duration])

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return

    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const clickTime = percentage * duration

    setCurrentTime(Math.max(0, Math.min(duration, clickTime)))
  }

  const handleMarkerDrag = (e: React.MouseEvent, markerType: "markIn" | "markOut") => {
    e.preventDefault()
    setIsDragging(markerType)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const moveX = moveEvent.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, moveX / rect.width))
      const newTime = Math.floor(percentage * duration) // Ensure integer values

      if (markerType === "markIn") {
        const newMarkIn = Math.max(0, Math.min(localMarkOut - 1, newTime))
        setLocalMarkIn(newMarkIn)
        setMarkInInput(formatTimecode(newMarkIn))
      } else {
        const newMarkOut = Math.max(localMarkIn + 1, Math.min(duration, newTime))
        setLocalMarkOut(newMarkOut)
        setMarkOutInput(formatTimecode(newMarkOut))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(null)
      onMarkersChange(Math.floor(localMarkIn), Math.floor(localMarkOut)) // Ensure integer values
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleTimecodeInput = (value: string, type: "markIn" | "markOut") => {
    if (type === "markIn") {
      setMarkInInput(value)
    } else {
      setMarkOutInput(value)
    }
  }

  const handleTimecodeBlur = (type: "markIn" | "markOut") => {
    const input = type === "markIn" ? markInInput : markOutInput
    const parsedTime = Math.floor(parseTimecode(input)) // Ensure integer values

    if (type === "markIn") {
      const newMarkIn = Math.max(0, Math.min(localMarkOut - 1, parsedTime))
      setLocalMarkIn(newMarkIn)
      setMarkInInput(formatTimecode(newMarkIn))
    } else {
      const newMarkOut = Math.max(localMarkIn + 1, Math.min(duration, parsedTime))
      setLocalMarkOut(newMarkOut)
      setMarkOutInput(formatTimecode(newMarkOut))
    }

    onMarkersChange(Math.floor(localMarkIn), Math.floor(localMarkOut)) // Ensure integer values
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      setIsPlaying(true)
      setCurrentTime(localMarkIn)

      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1
          if (newTime >= localMarkOut) {
            setIsPlaying(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return localMarkOut
          }
          return newTime
        })
      }, 100)
    }
  }

  const handleReset = () => {
    setLocalMarkIn(0)
    setLocalMarkOut(duration)
    setMarkInInput(formatTimecode(0))
    setMarkOutInput(formatTimecode(duration))
    setCurrentTime(0)
    setIsPlaying(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    onMarkersChange(0, duration)
  }

  const markInPercentage = (localMarkIn / duration) * 100
  const markOutPercentage = (localMarkOut / duration) * 100
  const currentTimePercentage = (currentTime / duration) * 100
  const segmentWidth = markOutPercentage - markInPercentage

  const validation = validateTimeMarkers(localMarkIn, localMarkOut, duration)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Video Markers</span>
        </h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title="Reset markers"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <div
          ref={timelineRef}
          className="relative h-12 bg-gray-200 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Full timeline background */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400"></div>

          {/* Selected segment */}
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-70"
            style={{
              left: `${markInPercentage}%`,
              width: `${segmentWidth}%`,
            }}
          ></div>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-red-500 z-20"
            style={{ left: `${currentTimePercentage}%` }}
          ></div>

          {/* Mark In handle */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-8 bg-green-500 rounded cursor-ew-resize z-10 border-2 border-white shadow-md hover:bg-green-600 transition-colors"
            style={{ left: `${markInPercentage}%`, marginLeft: "-8px" }}
            onMouseDown={(e) => handleMarkerDrag(e, "markIn")}
            title="Mark In - Drag to adjust start time"
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full text-xs text-green-600 font-semibold whitespace-nowrap">
              IN
            </div>
          </div>

          {/* Mark Out handle */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-8 bg-red-500 rounded cursor-ew-resize z-10 border-2 border-white shadow-md hover:bg-red-600 transition-colors"
            style={{ left: `${markOutPercentage}%`, marginLeft: "-8px" }}
            onMouseDown={(e) => handleMarkerDrag(e, "markOut")}
            title="Mark Out - Drag to adjust end time"
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full text-xs text-red-600 font-semibold whitespace-nowrap">
              OUT
            </div>
          </div>
        </div>

        {/* Timeline labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0:00</span>
          <span>{formatTimecode(duration)}</span>
        </div>
      </div>

      {/* Timecode inputs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mark In</label>
          <input
            type="text"
            value={markInInput}
            onChange={(e) => handleTimecodeInput(e.target.value, "markIn")}
            onBlur={() => handleTimecodeBlur("markIn")}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="00:00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mark Out</label>
          <input
            type="text"
            value={markOutInput}
            onChange={(e) => handleTimecodeInput(e.target.value, "markOut")}
            onBlur={() => handleTimecodeBlur("markOut")}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="05:00"
          />
        </div>
      </div>

      {/* Segment info */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Segment: {formatTimecode(localMarkOut - localMarkIn)}</span>
        <span>Current: {formatTimecode(currentTime)}</span>
      </div>

      {/* Validation error */}
      {!validation.isValid && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{validation.error}</div>
      )}
    </div>
  )
}
