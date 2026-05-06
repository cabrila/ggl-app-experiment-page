"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X, Users, User, Star, Clock, CheckCircle, AlertCircle, Download, Search, Eye, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import type { Character } from "@/types/casting"


interface CastingBreakdownModalProps {
  onClose: () => void
}

export default function CastingBreakdownModal({ onClose }: CastingBreakdownModalProps) {
  const { state, dispatch } = useCasting()
  const [activeView, setActiveView] = useState<"overview" | "detailed" | "progress" | "export">("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "complete" | "in-progress" | "not-started">("all")
  const [isExporting, setIsExporting] = useState<"pdf" | "excel" | null>(null)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  if (!currentProject) {
    return (
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Casting Breakdown</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">No project selected</p>
        </div>
      </div>
    )
  }

  const getCharacterStats = (character: Character) => {
    const longList = character.actors.longList.length
    const shortLists = character.actors.shortLists.reduce((sum, sl) => sum + sl.actors.length, 0)
    const audition = character.actors.audition.length
    const approval = character.actors.approval.length
    const total = longList + shortLists + audition + approval

    const greenlit = [
      ...character.actors.longList,
      ...character.actors.shortLists.flatMap((sl) => sl.actors),
      ...character.actors.audition,
      ...character.actors.approval,
    ].filter((actor) => actor.isGreenlit).length

    const status = greenlit > 0 ? "complete" : total > 0 ? "in-progress" : "not-started"

    return {
      longList,
      shortLists,
      audition,
      approval,
      total,
      greenlit,
      status,
    }
  }

  const getProjectOverview = () => {
    const characters = currentProject.characters
    const totalCharacters = characters.length
    const completedCharacters = characters.filter((char) => getCharacterStats(char).greenlit > 0).length
    const inProgressCharacters = characters.filter((char) => {
      const stats = getCharacterStats(char)
      return stats.total > 0 && stats.greenlit === 0
    }).length
    const notStartedCharacters = characters.filter((char) => getCharacterStats(char).total === 0).length

    const totalActors = characters.reduce((sum, char) => sum + getCharacterStats(char).total, 0)
    const totalGreenlit = characters.reduce((sum, char) => sum + getCharacterStats(char).greenlit, 0)

    return {
      totalCharacters,
      completedCharacters,
      inProgressCharacters,
      notStartedCharacters,
      totalActors,
      totalGreenlit,
      completionRate: totalCharacters > 0 ? Math.round((completedCharacters / totalCharacters) * 100) : 0,
    }
  }

  const filteredCharacters = currentProject.characters.filter((character) => {
    const matchesSearch =
      character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.description.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (filterStatus === "all") return true

    const stats = getCharacterStats(character)
    return stats.status === filterStatus
  })

  const handleCharacterClick = (characterId: string) => {
    dispatch({ type: "SELECT_CHARACTER", payload: characterId })
    onClose()
  }

  const handleExportBreakdown = () => {
    const breakdown = {
      project: {
        name: currentProject.name,
        type: currentProject.details.type,
        exportDate: new Date().toISOString(),
      },
      overview: getProjectOverview(),
      characters: currentProject.characters.map((character) => ({
        name: character.name,
        description: character.description,
        age: character.age,
        gender: character.gender,
        ethnicity: character.ethnicity,
        castingNotes: character.castingNotes,
        stats: getCharacterStats(character),
        actors: {
          longList: character.actors.longList.map((actor) => ({
            name: actor.name,
            age: actor.age,
            location: actor.location,
            agent: actor.agent,
            isGreenlit: actor.isGreenlit,
            votes: Object.keys(actor.userVotes).length,
          })),
          shortLists: character.actors.shortLists.map((sl) => ({
            name: sl.name,
            actors: sl.actors.map((actor) => ({
              name: actor.name,
              age: actor.age,
              location: actor.location,
              agent: actor.agent,
              isGreenlit: actor.isGreenlit,
              votes: Object.keys(actor.userVotes).length,
            })),
          })),
          audition: character.actors.audition.map((actor) => ({
            name: actor.name,
            age: actor.age,
            location: actor.location,
            agent: actor.agent,
            isGreenlit: actor.isGreenlit,
            votes: Object.keys(actor.userVotes).length,
          })),
          approval: character.actors.approval.map((actor) => ({
            name: actor.name,
            age: actor.age,
            location: actor.location,
            agent: actor.agent,
            isGreenlit: actor.isGreenlit,
            votes: Object.keys(actor.userVotes).length,
          })),
        },
      })),
    }

    const dataStr = JSON.stringify(breakdown, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${currentProject.name.replace(/\s+/g, "_")}_casting_breakdown.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async () => {
    try {
      setIsExporting("pdf")

      // Dynamic import to avoid MIME type error
      const { jsPDF } = await import("jspdf")
      await import("jspdf-autotable")

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Add project title and metadata
      doc.setFontSize(22)
      doc.setTextColor(44, 62, 80)
      doc.text(currentProject.name, 15, 20)

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Project Type: ${currentProject.details.type}`, 15, 30)
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 15, 36)

      // Add project overview
      const overview = getProjectOverview()
      doc.setFontSize(16)
      doc.setTextColor(44, 62, 80)
      doc.text("Project Overview", 15, 50)

      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text(`Total Characters: ${overview.totalCharacters}`, 15, 60)
      doc.text(`Completed: ${overview.completedCharacters}`, 15, 66)
      doc.text(`In Progress: ${overview.inProgressCharacters}`, 15, 72)
      doc.text(`Not Started: ${overview.notStartedCharacters}`, 15, 78)
      doc.text(`Total Actors: ${overview.totalActors}`, 15, 84)
      doc.text(`Greenlit Actors: ${overview.totalGreenlit}`, 15, 90)
      doc.text(`Completion Rate: ${overview.completionRate}%`, 15, 96)

      // Add character details
      let yPosition = 110

      for (let i = 0; i < currentProject.characters.length; i++) {
        const character = currentProject.characters[i]
        const stats = getCharacterStats(character)

        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        // Character header
        doc.setFillColor(240, 240, 240)
        doc.rect(15, yPosition, 180, 10, "F")
        doc.setFontSize(12)
        doc.setTextColor(44, 62, 80)
        doc.text(`${character.name}`, 17, yPosition + 7)

        // Character details
        yPosition += 15
        doc.setFontSize(10)
        doc.setTextColor(60, 60, 60)
        doc.text(`Description: ${character.description || "N/A"}`, 17, yPosition)
        yPosition += 6

        if (character.age) {
          doc.text(`Age: ${character.age}`, 17, yPosition)
          yPosition += 6
        }

        if (character.gender) {
          doc.text(`Gender: ${character.gender}`, 17, yPosition)
          yPosition += 6
        }

        if (character.ethnicity) {
          doc.text(`Ethnicity: ${character.ethnicity}`, 17, yPosition)
          yPosition += 6
        }

        // Casting stats
        doc.text(
          `Status: ${stats.status === "complete" ? "Cast" : stats.status === "in-progress" ? "In Progress" : "Not Started"}`,
          17,
          yPosition,
        )
        yPosition += 6
        doc.text(`Total Actors: ${stats.total}`, 17, yPosition)
        yPosition += 6
        doc.text(`Greenlit: ${stats.greenlit}`, 17, yPosition)
        yPosition += 10

        // Actor tables
        if (stats.total > 0) {
          // Define table headers
          const headers = [["Name", "Age", "Location", "Agent", "Status", "Votes"]]

          // Long list actors
          if (character.actors.longList.length > 0) {
            doc.setFontSize(11)
            doc.setTextColor(44, 62, 80)
            doc.text("Long List", 17, yPosition)
            yPosition += 5

            const longListData = character.actors.longList.map((actor) => [
              actor.name,
              actor.age || "N/A",
              actor.location || "N/A",
              actor.agent || "N/A",
              actor.isGreenlit ? "Greenlit" : "Considering",
              Object.keys(actor.userVotes).length.toString(),
            ])

            // Manual table creation as fallback for autoTable
            const createSimpleTable = (headers: string[][], data: string[][], startY: number) => {
              const colWidth = 30
              const rowHeight = 7
              const margin = 17

              // Draw headers
              doc.setFillColor(39, 174, 96)
              doc.setTextColor(255, 255, 255)
              doc.setFontSize(8)

              headers[0].forEach((header, i) => {
                doc.rect(margin + i * colWidth, startY, colWidth, rowHeight, "F")
                doc.text(header, margin + i * colWidth + 2, startY + 5)
              })

              // Draw data rows
              doc.setTextColor(0, 0, 0)
              data.forEach((row, rowIndex) => {
                const y = startY + (rowIndex + 1) * rowHeight

                // Draw cell backgrounds
                if (row[4] === "Greenlit") {
                  doc.setFillColor(46, 204, 113, 0.3)
                  doc.rect(margin + 4 * colWidth, y, colWidth, rowHeight, "F")
                }

                // Draw cell text
                row.forEach((cell, cellIndex) => {
                  doc.text(cell, margin + cellIndex * colWidth + 2, y + 5)
                })
              })

              return startY + (data.length + 1) * rowHeight + 5
            }

            try {
              // Try using autoTable if available
              if (typeof (doc as any).autoTable === "function") {
                // @ts-ignore - jspdf-autotable types
                doc.autoTable({
                  head: headers,
                  body: longListData,
                  startY: yPosition,
                  margin: { left: 17 },
                  theme: "grid",
                  headStyles: { fillColor: [39, 174, 96] },
                  styles: { fontSize: 8 },
                })

                // @ts-ignore - jspdf-autotable types
                yPosition = doc.lastAutoTable.finalY + 10
              } else {
                yPosition = createSimpleTable(headers, longListData, yPosition) + 10
              }
            } catch (e) {
              // Fallback to simple table if autoTable fails
              yPosition = createSimpleTable(headers, longListData, yPosition) + 10
            }
          }

          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }

          // Shortlists - simplified for brevity
          if (character.actors.shortLists.length > 0) {
            for (const shortlist of character.actors.shortLists) {
              if (shortlist.actors.length > 0) {
                doc.setFontSize(11)
                doc.setTextColor(44, 62, 80)
                doc.text(`Shortlist: ${shortlist.name}`, 17, yPosition)
                yPosition += 10

                // Simple text listing instead of tables
                shortlist.actors.forEach((actor) => {
                  doc.setFontSize(8)
                  doc.text(`${actor.name} (${actor.isGreenlit ? "Greenlit" : "Considering"})`, 20, yPosition)
                  yPosition += 5
                })

                yPosition += 5
              }
            }
          }

          // Audition actors - simplified
          if (character.actors.audition.length > 0) {
            doc.setFontSize(11)
            doc.setTextColor(44, 62, 80)
            doc.text("Audition", 17, yPosition)
            yPosition += 10

            // Simple text listing
            character.actors.audition.forEach((actor) => {
              doc.setFontSize(8)
              doc.text(`${actor.name} (${actor.isGreenlit ? "Greenlit" : "Considering"})`, 20, yPosition)
              yPosition += 5
            })

            yPosition += 5
          }

          // Approval actors - simplified
          if (character.actors.approval.length > 0) {
            doc.setFontSize(11)
            doc.setTextColor(44, 62, 80)
            doc.text("Approval", 17, yPosition)
            yPosition += 10

            // Simple text listing
            character.actors.approval.forEach((actor) => {
              doc.setFontSize(8)
              doc.text(`${actor.name} (${actor.isGreenlit ? "Greenlit" : "Considering"})`, 20, yPosition)
              yPosition += 5
            })

            yPosition += 5
          }
        }

        // Add casting notes if available
        if (character.castingNotes) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }

          doc.setFontSize(11)
          doc.setTextColor(44, 62, 80)
          doc.text("Casting Notes:", 17, yPosition)
          yPosition += 6

          doc.setFontSize(9)
          doc.setTextColor(80, 80, 80)

          // Split long notes into multiple lines
          const splitNotes = doc.splitTextToSize(character.castingNotes, 170)
          doc.text(splitNotes, 17, yPosition)

          yPosition += splitNotes.length * 5 + 15
        } else {
          yPosition += 15
        }
      }

      // Add footer with page numbers
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`${currentProject.name} - Casting Breakdown - Page ${i} of ${pageCount}`, 15, 290)
      }

      // Save the PDF
      doc.save(`${currentProject.name.replace(/\s+/g, "_")}_casting_breakdown.pdf`)

      setIsExporting(null)
    } catch (error) {
      console.error("Error exporting PDF:", error)
      setIsExporting(null)
      alert("There was an error exporting the PDF. Please try again.")
    }
  }

  const handleExportExcel = async () => {
    try {
      setIsExporting("excel")

      // Create CSV content that Excel can open
      const overview = getProjectOverview()

      // Project Overview
      let csvContent = "Project Information\n"
      csvContent += `Project Name,${currentProject.name}\n`
      csvContent += `Project Type,${currentProject.details.type}\n`
      csvContent += `Export Date,${new Date().toLocaleDateString()}\n`
      csvContent += "\n"
      csvContent += "Project Statistics\n"
      csvContent += `Total Characters,${overview.totalCharacters}\n`
      csvContent += `Completed Characters,${overview.completedCharacters}\n`
      csvContent += `In Progress Characters,${overview.inProgressCharacters}\n`
      csvContent += `Not Started Characters,${overview.notStartedCharacters}\n`
      csvContent += `Total Actors,${overview.totalActors}\n`
      csvContent += `Greenlit Actors,${overview.totalGreenlit}\n`
      csvContent += `Completion Rate,${overview.completionRate}%\n`
      csvContent += "\n\n"

      // Characters Summary
      csvContent += "Characters Summary\n"
      csvContent += "Character Name,Description,Age,Gender,Ethnicity,Status,Total Actors,Greenlit\n"

      currentProject.characters.forEach((character) => {
        const stats = getCharacterStats(character)
        const status =
          stats.status === "complete" ? "Cast" : stats.status === "in-progress" ? "In Progress" : "Not Started"

        // Escape commas and quotes in CSV
        const escapeCsvField = (field: string) => {
          if (field.includes(",") || field.includes('"') || field.includes("\n")) {
            return `"${field.replace(/"/g, '""')}"`
          }
          return field
        }

        csvContent += `${escapeCsvField(character.name)},`
        csvContent += `${escapeCsvField(character.description || "")},`
        csvContent += `${character.age || ""},`
        csvContent += `${character.gender || ""},`
        csvContent += `${character.ethnicity || ""},`
        csvContent += `${status},`
        csvContent += `${stats.total},`
        csvContent += `${stats.greenlit}\n`
      })

      csvContent += "\n\n"

      // Detailed Actor Information
      csvContent += "Detailed Actor Information\n"
      csvContent += "Character,Actor Name,Age,Location,Agent,Status,Votes,List Type\n"

      currentProject.characters.forEach((character) => {
        const stats = getCharacterStats(character)
        if (stats.total === 0) return

        // Long list actors
        character.actors.longList.forEach((actor) => {
          const escapeCsvField = (field: string) => {
            if (field.includes(",") || field.includes('"') || field.includes("\n")) {
              return `"${field.replace(/"/g, '""')}"`
            }
            return field
          }

          csvContent += `${escapeCsvField(character.name)},`
          csvContent += `${escapeCsvField(actor.name)},`
          csvContent += `${actor.age || ""},`
          csvContent += `${escapeCsvField(actor.location || "")},`
          csvContent += `${escapeCsvField(actor.agent || "")},`
          csvContent += `${actor.isGreenlit ? "Greenlit" : "Considering"},`
          csvContent += `${Object.keys(actor.userVotes).length},`
          csvContent += `Long List\n`
        })

        // Shortlist actors
        character.actors.shortLists.forEach((shortlist) => {
          shortlist.actors.forEach((actor) => {
            const escapeCsvField = (field: string) => {
              if (field.includes(",") || field.includes('"') || field.includes("\n")) {
                return `"${field.replace(/"/g, '""')}"`
              }
              return field
            }

            csvContent += `${escapeCsvField(character.name)},`
            csvContent += `${escapeCsvField(actor.name)},`
            csvContent += `${actor.age || ""},`
            csvContent += `${escapeCsvField(actor.location || "")},`
            csvContent += `${escapeCsvField(actor.agent || "")},`
            csvContent += `${actor.isGreenlit ? "Greenlit" : "Considering"},`
            csvContent += `${Object.keys(actor.userVotes).length},`
            csvContent += `Shortlist: ${escapeCsvField(shortlist.name)}\n`
          })
        })

        // Audition actors
        character.actors.audition.forEach((actor) => {
          const escapeCsvField = (field: string) => {
            if (field.includes(",") || field.includes('"') || field.includes("\n")) {
              return `"${field.replace(/"/g, '""')}"`
            }
            return field
          }

          csvContent += `${escapeCsvField(character.name)},`
          csvContent += `${escapeCsvField(actor.name)},`
          csvContent += `${actor.age || ""},`
          csvContent += `${escapeCsvField(actor.location || "")},`
          csvContent += `${escapeCsvField(actor.agent || "")},`
          csvContent += `${actor.isGreenlit ? "Greenlit" : "Considering"},`
          csvContent += `${Object.keys(actor.userVotes).length},`
          csvContent += `Audition\n`
        })

        // Approval actors
        character.actors.approval.forEach((actor) => {
          const escapeCsvField = (field: string) => {
            if (field.includes(",") || field.includes('"') || field.includes("\n")) {
              return `"${field.replace(/"/g, '""')}"`
            }
            return field
          }

          csvContent += `${escapeCsvField(character.name)},`
          csvContent += `${escapeCsvField(actor.name)},`
          csvContent += `${actor.age || ""},`
          csvContent += `${escapeCsvField(actor.location || "")},`
          csvContent += `${escapeCsvField(actor.agent || "")},`
          csvContent += `${actor.isGreenlit ? "Greenlit" : "Considering"},`
          csvContent += `${Object.keys(actor.userVotes).length},`
          csvContent += `Approval\n`
        })
      })

      csvContent += "\n\n"

      // Team Activity
      csvContent += "Team Activity\n"
      csvContent += "Team Member,Votes Cast\n"

      state.users.forEach((user) => {
        const userVotes = currentProject.characters.reduce((sum, char) => {
          return (
            sum +
            [
              ...char.actors.longList,
              ...char.actors.shortLists.flatMap((sl) => sl.actors),
              ...char.actors.audition,
              ...char.actors.approval,
            ].filter((actor) => actor.userVotes[user.id]).length
          )
        }, 0)

        csvContent += `${user.name},${userVotes}\n`
      })

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `${currentProject.name.replace(/\s+/g, "_")}_casting_breakdown.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setIsExporting(null)
    } catch (error) {
      console.error("Error exporting Excel:", error)
      setIsExporting(null)
      alert("There was an error exporting the Excel file. Please try again.")
    }
  }

  const renderOverviewTab = () => {
    const overview = getProjectOverview()

    return (
      <div className="space-y-6">
        {/* Project Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Characters</p>
                <p className="text-2xl font-bold text-blue-900">{overview.totalCharacters}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">{overview.completedCharacters}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-900">{overview.inProgressCharacters}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Not Started</p>
                <p className="text-2xl font-bold text-red-900">{overview.notStartedCharacters}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Overall Progress</h3>
            <span className="text-2xl font-bold text-emerald-600">{overview.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-emerald-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${overview.completionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>
              {overview.completedCharacters} of {overview.totalCharacters} characters cast
            </span>
            <span>{overview.totalGreenlit} actors greenlit</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Casting Pipeline</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Actors in System:</span>
                <span className="font-semibold">{overview.totalActors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Greenlit Actors:</span>
                <span className="font-semibold text-green-600">{overview.totalGreenlit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Considerations:</span>
                <span className="font-semibold">{overview.totalActors - overview.totalGreenlit}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Team Activity</h3>
            <div className="space-y-3">
              {state.users.map((user) => {
                const userVotes = currentProject.characters.reduce((sum, char) => {
                  return (
                    sum +
                    [
                      ...char.actors.longList,
                      ...char.actors.shortLists.flatMap((sl) => sl.actors),
                      ...char.actors.audition,
                      ...char.actors.approval,
                    ].filter((actor) => actor.userVotes[user.id]).length
                  )
                }, 0)

                return (
                  <div key={user.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ backgroundColor: user.bgColor, color: user.color }}
                      >
                        {user.initials}
                      </div>
                      <span className="text-gray-600">{user.name}:</span>
                    </div>
                    <span className="font-semibold">{userVotes} votes</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDetailedTab = () => (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Characters</option>
          <option value="complete">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="not-started">Not Started</option>
        </select>
      </div>

      {/* Characters List */}
      <div className="space-y-4">
        {filteredCharacters.map((character) => {
          const stats = getCharacterStats(character)
          const statusColor = stats.status === "complete" ? "green" : stats.status === "in-progress" ? "yellow" : "red"

          return (
            <div
              key={character.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3
                      className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-emerald-600"
                      onClick={() => handleCharacterClick(character.id)}
                    >
                      {character.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-700`}
                    >
                      {stats.status === "complete"
                        ? "Cast"
                        : stats.status === "in-progress"
                          ? "In Progress"
                          : "Not Started"}
                    </span>
                    {stats.greenlit > 0 && (
                      <span className="flex items-center text-green-600 text-sm">
                        <Star className="w-4 h-4 mr-1" />
                        {stats.greenlit} Greenlit
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{character.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {character.age && <span>Age: {character.age}</span>}
                    {character.gender && <span>• Gender: {character.gender}</span>}
                    {character.ethnicity && <span>• Ethnicity: {character.ethnicity}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleCharacterClick(character.id)}
                  className="flex items-center px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-md"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
              </div>

              {/* Casting Progress */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-800">{stats.longList}</div>
                  <div className="text-xs text-gray-500">Long List</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-800">{stats.shortLists}</div>
                  <div className="text-xs text-gray-500">Shortlists</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-800">{stats.audition}</div>
                  <div className="text-xs text-gray-500">Audition</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-800">{stats.approval}</div>
                  <div className="text-xs text-gray-500">Approval</div>
                </div>
              </div>

              {/* Casting Notes */}
              {character.castingNotes && (
                <div className="bg-gray-50 rounded-md p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Casting Notes:</h4>
                  <p className="text-sm text-gray-600">{character.castingNotes}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center text-gray-500 py-8">No characters found matching your criteria.</div>
      )}
    </div>
  )

  const renderProgressTab = () => {
    const overview = getProjectOverview()

    return (
      <div className="space-y-6">
        {/* Timeline View */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Casting Timeline</h3>
          <div className="space-y-4">
            {currentProject.characters.map((character, index) => {
              const stats = getCharacterStats(character)
              const progress = stats.total > 0 ? Math.round((stats.greenlit / Math.max(stats.total, 1)) * 100) : 0

              return (
                <div key={character.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-semibold text-emerald-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-gray-800">{character.name}</h4>
                      <span className="text-sm text-gray-500">{progress}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress === 100 ? "bg-green-500" : progress > 0 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.max(progress, 5)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{stats.total} actors total</span>
                      <span>{stats.greenlit} greenlit</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottlenecks and Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Attention Needed</h3>
            <div className="space-y-3">
              {currentProject.characters
                .filter((char) => getCharacterStats(char).status === "not-started")
                .slice(0, 5)
                .map((character) => (
                  <div key={character.id} className="flex justify-between items-center">
                    <span className="text-gray-700">{character.name}</span>
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">No actors</span>
                  </div>
                ))}
              {currentProject.characters.filter((char) => getCharacterStats(char).status === "not-started").length ===
                0 && <p className="text-sm text-gray-500 italic">All characters have actors assigned!</p>}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-600">Ready for Decision</h3>
            <div className="space-y-3">
              {currentProject.characters
                .filter((char) => {
                  const stats = getCharacterStats(char)
                  return stats.approval > 0 && stats.greenlit === 0
                })
                .slice(0, 5)
                .map((character) => {
                  const stats = getCharacterStats(character)
                  return (
                    <div key={character.id} className="flex justify-between items-center">
                      <span className="text-gray-700">{character.name}</span>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        {stats.approval} in approval
                      </span>
                    </div>
                  )
                })}
              {currentProject.characters.filter((char) => {
                const stats = getCharacterStats(char)
                return stats.approval > 0 && stats.greenlit === 0
              }).length === 0 && <p className="text-sm text-gray-500 italic">No characters pending final approval.</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderExportTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Export Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Complete Casting Breakdown</h4>
              <p className="text-sm text-gray-600">Export all character and actor data as JSON</p>
            </div>
            <button
              onClick={handleExportBreakdown}
              className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Export JSON
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">PDF Report</h4>
              <p className="text-sm text-gray-600">Generate a formatted PDF casting report</p>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={isExporting !== null}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting === "pdf" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-1" />
                  Export PDF
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">CSV Spreadsheet</h4>
              <p className="text-sm text-gray-600">Export casting data as CSV file (Excel compatible)</p>
            </div>
            <button
              onClick={handleExportExcel}
              disabled={isExporting !== null}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting === "excel" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Export Preview</h3>
        <div className="bg-white border rounded-lg p-4">
          <pre className="text-xs text-gray-600 overflow-x-auto">
            {`{
  "project": {
    "name": "${currentProject.name}",
    "type": "${currentProject.details.type}",
    "exportDate": "${new Date().toISOString()}"
  },
  "overview": {
    "totalCharacters": ${getProjectOverview().totalCharacters},
    "completedCharacters": ${getProjectOverview().completedCharacters},
    "totalActors": ${getProjectOverview().totalActors},
    "totalGreenlit": ${getProjectOverview().totalGreenlit}
  },
  "characters": [
    // Character details and actor lists...
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold">Casting Breakdown</h2>
          <p className="text-sm text-gray-600">{currentProject.name}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { key: "overview", label: "Overview", icon: Users },
            { key: "detailed", label: "Detailed View", icon: User },
            { key: "progress", label: "Progress", icon: Clock },
            { key: "export", label: "Export", icon: Download },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeView === tab.key
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeView === "overview" && renderOverviewTab()}
        {activeView === "detailed" && renderDetailedTab()}
        {activeView === "progress" && renderProgressTab()}
        {activeView === "export" && renderExportTab()}
      </div>
    </div>
  )
}
