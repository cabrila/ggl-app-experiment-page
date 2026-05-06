"use client"

import { useState } from "react"
import { X, Calendar, Clock, Users, Plus, Trash2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface BookAuditionModalProps {
  onClose: () => void
  preselectedCharacters?: string[]
  preselectedActors?: string[]
}

interface AuditionHost {
  id: string
  name: string
  email: string
  role: string
}

interface TimeSlot {
  start: string
  end: string
}

export default function BookAuditionModal({
  onClose,
  preselectedCharacters = [],
  preselectedActors = [],
}: BookAuditionModalProps) {
  // Form state
  const [title, setTitle] = useState("Audition Session")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState("english")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ start: "09:00", end: "17:00" }])
  const [duration, setDuration] = useState(30)
  const [buffer, setBuffer] = useState(0)
  const [minNotice, setMinNotice] = useState("2 hours")
  const [maxAdvance, setMaxAdvance] = useState("1 month")

  // Host management
  const [hosts, setHosts] = useState<AuditionHost[]>([
    { id: "1", name: "Casting Director", email: "casting@production.com", role: "Primary" },
  ])

  const addHost = () => {
    setHosts([
      ...hosts,
      {
        id: Date.now().toString(),
        name: "",
        email: "",
        role: "Secondary",
      },
    ])
  }

  const removeHost = (id: string) => {
    setHosts(hosts.filter((h) => h.id !== id))
  }

  const updateHost = (id: string, field: keyof AuditionHost, value: string) => {
    setHosts(hosts.map((h) => (h.id === id ? { ...h, [field]: value } : h)))
  }

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { start: "09:00", end: "17:00" }])
  }

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index))
  }

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    setTimeSlots(timeSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)))
  }

  const handleSubmit = () => {
    // Here you would typically send the audition booking data to your backend
    console.log("Booking audition:", {
      title,
      location,
      description,
      language,
      selectedDate,
      timeSlots,
      duration,
      buffer,
      minNotice,
      maxAdvance,
      hosts,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        {/* Main Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Book Audition</h2>
                <p className="text-sm text-gray-600">Schedule audition sessions for your casting</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Booking Details */}
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Audition Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Audition Session"
                    />
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="danish">Danish</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="location">Meeting Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Select a location..."
                  />
                </div>

                <div className="mt-4">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="About this audition..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Hosts Section */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Hosts
                </h3>
                <p className="text-sm text-gray-600 mb-4">Manage audition hosts and create multi-host sessions.</p>

                <div className="space-y-3">
                  {hosts.map((host) => (
                    <div key={host.id} className="flex items-center gap-3 p-3 bg-white rounded-md border">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          placeholder="Name"
                          value={host.name}
                          onChange={(e) => updateHost(host.id, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Email"
                          value={host.email}
                          onChange={(e) => updateHost(host.id, "email", e.target.value)}
                        />
                        <Select value={host.role} onValueChange={(value) => updateHost(host.id, "role", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Primary">Primary</SelectItem>
                            <SelectItem value="Secondary">Secondary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {hosts.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeHost(host.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button variant="outline" onClick={addHost} className="mt-3 w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add hosts
                </Button>
              </div>

              {/* Availability Section */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Availability
                </h3>
                <p className="text-sm text-gray-600 mb-4">Define when actors can book audition slots with you.</p>

                <div className="space-y-4">
                  <div>
                    <Label>Set your availability</Label>
                    <div className="space-y-2 mt-2">
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select value="Mon - Fri" onValueChange={() => {}}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mon - Fri">Mon - Fri</SelectItem>
                              <SelectItem value="Mon - Sun">Mon - Sun</SelectItem>
                              <SelectItem value="Weekends">Weekends</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(index, "start", e.target.value)}
                            className="w-24"
                          />
                          <span className="text-gray-500">-</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(index, "end", e.target.value)}
                            className="w-24"
                          />
                          {timeSlots.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeTimeSlot(index)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={addTimeSlot}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add weekday
                      </Button>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add specific date
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Meeting duration</Label>
                    <div className="flex gap-2 mt-2">
                      {[30, 60, 90, 120].map((mins) => (
                        <Button
                          key={mins}
                          variant={duration === mins ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDuration(mins)}
                        >
                          {mins} min
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Min. booking notice</Label>
                      <Select value={minNotice} onValueChange={setMinNotice}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2 hours">2 hours</SelectItem>
                          <SelectItem value="1 day">1 day</SelectItem>
                          <SelectItem value="2 days">2 days</SelectItem>
                          <SelectItem value="1 week">1 week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Max. advance booking</Label>
                      <Select value={maxAdvance} onValueChange={setMaxAdvance}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1 week">1 week</SelectItem>
                          <SelectItem value="1 month">1 month</SelectItem>
                          <SelectItem value="3 months">3 months</SelectItem>
                          <SelectItem value="6 months">6 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Buffer time between auditions</Label>
                    <Select value={buffer.toString()} onValueChange={(value) => setBuffer(Number.parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 min</SelectItem>
                        <SelectItem value="5">5 min</SelectItem>
                        <SelectItem value="10">10 min</SelectItem>
                        <SelectItem value="15">15 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t">
              <div className="text-sm text-gray-600">
                <Info className="h-4 w-4 inline mr-1" />
                Audition booking ready to send
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>Send Invitations</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Preview */}
        <div className="w-96 bg-gray-50 border-l overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} className="w-full" />
            </div>

            {selectedDate && (
              <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Available Times</h4>
                <div className="space-y-1">
                  {Array.from({ length: 8 }, (_, i) => {
                    const hour = 9 + i
                    const time = `${hour.toString().padStart(2, "0")}:00`
                    return (
                      <div key={time} className="text-sm text-gray-600 py-1 px-2 hover:bg-gray-50 rounded">
                        {time}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Duration: {duration} minutes</p>
                <p>Buffer: {buffer} minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
