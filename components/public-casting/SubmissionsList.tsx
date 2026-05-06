"use client"

import { useState, useMemo, useEffect } from "react"
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown, FileJson, FileSpreadsheet, Download } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"
import SubmissionCard from "./SubmissionCard"
import { CastingSubmission } from "@/types/public-casting"
import { exportSubmissionsAsJSON, exportSubmissionsAsPDF, exportSubmissionsAsExcel } from "@/lib/submission-export"

interface SubmissionsListProps {
  onBack: () => void
}

type SortOption = "newest" | "oldest" | "alphabetical" | "form" | "grade-high" | "grade-low"
type GradeFilter = "all" | "graded" | "ungraded" | "high" | "medium" | "low"

export default function SubmissionsList({ onBack }: SubmissionsListProps) {
  const { state, markSubmissionsAsRead, updateSubmission, deleteSubmission } = usePublicCasting()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [filterByForm, setFilterByForm] = useState<string>("all")
  const [filterByGrade, setFilterByGrade] = useState<GradeFilter>("all")
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Get all submissions across all projects
  const allSubmissions = useMemo(() => {
    return state.projects.flatMap((p) => p.submissions)
  }, [state.projects])

  // Get unique form names for filter
  const formNames = useMemo(() => {
    const names = new Set(allSubmissions.map((s) => s.castingCallTitle))
    return Array.from(names)
  }, [allSubmissions])

  // Mark submissions as read when viewing
  useEffect(() => {
    state.projects.forEach((p) => {
      if (p.submissions.some((s) => s.isNew)) {
        markSubmissionsAsRead(p.id)
      }
    })
  }, [state.projects, markSubmissionsAsRead])

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...allSubmissions]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.castingCallTitle.toLowerCase().includes(query)
      )
    }

    // Filter by form
    if (filterByForm !== "all") {
      result = result.filter((s) => s.castingCallTitle === filterByForm)
    }

    // Filter by grade
    if (filterByGrade !== "all") {
      switch (filterByGrade) {
        case "graded":
          result = result.filter((s) => s.grade !== undefined && s.grade > 0)
          break
        case "ungraded":
          result = result.filter((s) => !s.grade || s.grade === 0)
          break
        case "high":
          result = result.filter((s) => s.grade !== undefined && s.grade >= 8)
          break
        case "medium":
          result = result.filter((s) => s.grade !== undefined && s.grade >= 5 && s.grade < 8)
          break
        case "low":
          result = result.filter((s) => s.grade !== undefined && s.grade > 0 && s.grade < 5)
          break
      }
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        break
      case "oldest":
        result.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
        break
      case "alphabetical":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "form":
        result.sort((a, b) => a.castingCallTitle.localeCompare(b.castingCallTitle))
        break
      case "grade-high":
        result.sort((a, b) => (b.grade || 0) - (a.grade || 0))
        break
      case "grade-low":
        result.sort((a, b) => (a.grade || 0) - (b.grade || 0))
        break
    }

    return result
  }, [allSubmissions, searchQuery, filterByForm, filterByGrade, sortBy])

  const handleUpdateSubmission = (submissionId: string, updates: Partial<CastingSubmission>) => {
    updateSubmission(submissionId, updates)
  }

  const handleDeleteSubmission = (submissionId: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      deleteSubmission(submissionId)
    }
  }

  const handleExportJSON = () => {
    exportSubmissionsAsJSON(filteredSubmissions, "casting_submissions")
  }

  const handleExportPDF = () => {
    exportSubmissionsAsPDF(filteredSubmissions, "casting_submissions")
  }

  const handleExportExcel = () => {
    exportSubmissionsAsExcel(filteredSubmissions, "casting_submissions")
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "alphabetical", label: "A-Z by Name" },
    { value: "form", label: "By Form" },
    { value: "grade-high", label: "Highest Grade" },
    { value: "grade-low", label: "Lowest Grade" },
  ]

  const gradeOptions: { value: GradeFilter; label: string }[] = [
    { value: "all", label: "All Grades" },
    { value: "graded", label: "Graded Only" },
    { value: "ungraded", label: "Ungraded" },
    { value: "high", label: "High (8-10)" },
    { value: "medium", label: "Medium (5-7)" },
    { value: "low", label: "Low (1-4)" },
  ]

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a4a2a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 py-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Casting Calls</span>
          </button>

          {/* Title & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white font-sans">Submissions</h1>
              <p className="text-white/50 text-sm font-sans">
                {filteredSubmissions.length} total submissions
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                disabled={filteredSubmissions.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as JSON"
              >
                <FileJson className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">JSON</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={filteredSubmissions.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={filteredSubmissions.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-violet-500 hover:bg-violet-400 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as PDF"
              >
                <Download className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or form..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans text-sm"
              />
            </div>

            {/* Form Filter */}
            <select
              value={filterByForm}
              onChange={(e) => setFilterByForm(e.target.value)}
              className="px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none font-sans min-w-[140px]"
            >
              <option value="all">All Forms</option>
              {formNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Grade Filter */}
            <select
              value={filterByGrade}
              onChange={(e) => setFilterByGrade(e.target.value as GradeFilter)}
              className="px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none font-sans min-w-[130px]"
            >
              {gradeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm hover:border-white/20 transition-colors font-sans min-w-[150px]"
              >
                <SlidersHorizontal className="w-4 h-4 text-white/60" />
                <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                <ChevronDown className="w-4 h-4 text-white/40 ml-auto" />
              </button>

              {showSortDropdown && (
                <div className="absolute top-full mt-1 right-0 w-full bg-[#1a2e23] border border-white/10 rounded-lg overflow-hidden shadow-xl z-20">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-sans transition-colors ${
                        sortBy === option.value
                          ? "bg-violet-500/20 text-violet-300"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="p-6">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 font-sans">
              {searchQuery || filterByForm !== "all" || filterByGrade !== "all"
                ? "No submissions match your filters"
                : "No submissions yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onUpdate={(updates) => handleUpdateSubmission(submission.id, updates)}
                onDelete={() => handleDeleteSubmission(submission.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
