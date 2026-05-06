"use client"

import { useState } from "react"
import { CalendarIcon } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import type { AvailabilityDate } from "@/types/schedule"

const formatDate = (date: Date, formatStr: string): string => {
  if (formatStr === "yyyy-MM-dd") {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  if (formatStr === "MMM dd, yyyy") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`
  }
  
  return date.toLocaleDateString()
}

interface AvailabilityCalendarPickerProps {
  availabilityDates: AvailabilityDate[]
  onChange: (dates: AvailabilityDate[]) => void
}

export default function AvailabilityCalendarPicker({ availabilityDates, onChange }: AvailabilityCalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<"available" | "unavailable">("available")

  // Convert AvailabilityDate[] to Date[] for calendar
  const availableDates = availabilityDates.filter((d) => d.status === "available").map((d) => new Date(d.date))

  const unavailableDates = availabilityDates.filter((d) => d.status === "unavailable").map((d) => new Date(d.date))

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const dateString = formatDate(date, "yyyy-MM-dd")
    const existingIndex = availabilityDates.findIndex((d) => d.date === dateString)

    let newDates: AvailabilityDate[]

    if (existingIndex >= 0) {
      // Date exists - toggle or remove
      const existing = availabilityDates[existingIndex]
      if (existing.status === selectedMode) {
        // Same mode - remove it
        newDates = availabilityDates.filter((_, i) => i !== existingIndex)
      } else {
        // Different mode - update it
        newDates = availabilityDates.map((d, i) => (i === existingIndex ? { ...d, status: selectedMode } : d))
      }
    } else {
      // New date - add it
      newDates = [...availabilityDates, { date: dateString, status: selectedMode }]
    }

    onChange(newDates)
  }

  const getDateStatus = (date: Date): "available" | "unavailable" | null => {
    const dateString = formatDate(date, "yyyy-MM-dd")
    const found = availabilityDates.find((d) => d.date === dateString)
    return found ? found.status : null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {availabilityDates.length === 0
                ? "Select availability dates"
                : `${availabilityDates.length} date(s) selected`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMode("available")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedMode === "available"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => setSelectedMode("unavailable")}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedMode === "unavailable"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Unavailable
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Click dates to mark as {selectedMode}</p>
            </div>
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              modifiers={{
                available: availableDates,
                unavailable: unavailableDates,
              }}
              modifiersClassNames={{
                available: "bg-green-100 text-green-900 hover:bg-green-200",
                unavailable: "bg-red-100 text-red-900 hover:bg-red-200",
              }}
              className="rounded-md"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Display selected dates */}
      {availabilityDates.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Dates:</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {availabilityDates
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((avail, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                    avail.status === "available" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                  }`}
                >
                  <span>{formatDate(new Date(avail.date), "MMM dd, yyyy")}</span>
                  <span className="text-xs font-medium capitalize">{avail.status}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
