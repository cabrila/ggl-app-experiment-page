"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Pencil,
  Check,
  XCircle,
  ImagePlus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface UploadCSVModalProps {
  onClose: () => void
  characterId: string
}

interface CSVRow {
  name: string
  age: string
  playingAge: string
  contactNumber: string
  contactMail: string
  headshot: string
}

interface ParsedActor extends CSVRow {
  rowNumber: number
  errors: string[]
}

interface EditingActor extends ParsedActor {
  isEditing: boolean
  editedData: CSVRow
}

// Excel parsing utility functions
const parseExcelFile = async (file: File): Promise<any[][]> => {
  // Dynamic import with better error handling
  let XLSX: any

  try {
    XLSX = await import("xlsx")
  } catch (importError) {
    throw new Error("Excel processing library not available. Please use CSV format instead.")
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: false,
          cellNF: false,
          cellText: true,
        })

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          reject(new Error("No worksheets found in Excel file"))
          return
        }

        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to array of arrays with better options
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          raw: false,
          dateNF: "yyyy-mm-dd",
        }) as any[][]

        // Filter out completely empty rows
        const filteredData = jsonData.filter(
          (row) => row && row.some((cell) => cell !== null && cell !== undefined && cell.toString().trim() !== ""),
        )

        if (filteredData.length === 0) {
          reject(new Error("Excel file appears to be empty"))
          return
        }

        resolve(filteredData)
      } catch (error) {
        console.error("Excel parsing error:", error)
        reject(
          new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown parsing error"}`),
        )
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read Excel file"))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Image processing utilities
const validateImageUrl = (url: string): boolean => {
  if (!url.trim()) return true // Headshot is optional

  // Check if it's a valid URL format
  try {
    new URL(url)
    return true
  } catch {
    // Check if it's a valid file path format
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    const extension = url.toLowerCase().split(".").pop()
    return validExtensions.includes(`.${extension}`)
  }
}

const processImageUrl = async (imageUrl: string): Promise<string | null> => {
  if (!imageUrl.trim()) return null

  try {
    // If it's already a valid URL, return it
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      // Validate that the URL actually points to an image
      const response = await fetch(imageUrl, { method: "HEAD" })
      if (response.ok && response.headers.get("content-type")?.startsWith("image/")) {
        return imageUrl
      }
      throw new Error("URL does not point to a valid image")
    }

    // For local file paths, return null since we can't access local files
    // In a real implementation, this would handle file uploads differently
    return null
  } catch (error) {
    console.warn("Failed to process image URL:", imageUrl, error)
    return null
  }
}

export default function UploadCSVModal({ onClose, characterId }: UploadCSVModalProps) {
  const { state, dispatch } = useCasting()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedActors, setParsedActors] = useState<ParsedActor[]>([])
  const [validActors, setValidActors] = useState<ParsedActor[]>([])
  const [invalidActors, setInvalidActors] = useState<ParsedActor[]>([])
  const [uploadComplete, setUploadComplete] = useState(false)
  const [processingStats, setProcessingStats] = useState({ total: 0, successful: 0, failed: 0 })
  const [fileType, setFileType] = useState<"csv" | "excel">("csv")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageProcessingProgress, setImageProcessingProgress] = useState<{
    [key: string]: "processing" | "success" | "failed"
  }>({})
  const [processedImages, setProcessedImages] = useState<{ [key: string]: string | null }>({})

  const [editingActors, setEditingActors] = useState<{ [key: number]: EditingActor }>({})
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const imageUploadRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)

  if (!currentCharacter) {
    onClose()
    return null
  }

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true // Phone is optional
    // Allow various phone formats
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$|^[$$$$\-.\s\d]+$/
    return phoneRegex.test(phone.replace(/[\s\-$$$$.]/g, ""))
  }

  const isExcelFile = (filename: string): boolean => {
    const extension = filename.toLowerCase().split(".").pop()
    return extension === "xlsx" || extension === "xls"
  }

  const parseCSV = (csvText: string): ParsedActor[] => {
    const lines = csvText.split("\n").filter((line) => line.trim())
    if (lines.length === 0) return []

    // Parse header
    const header = lines[0].split(",").map((col) => col.trim().toLowerCase().replace(/['"]/g, ""))

    // Find column indices
    const nameIndex = header.findIndex((col) => col.includes("name"))
    const ageIndex = header.findIndex((col) => col === "age")
    const playingAgeIndex = header.findIndex((col) => col.includes("playing") && col.includes("age"))
    const contactNumberIndex = header.findIndex(
      (col) => col.includes("contact") && (col.includes("number") || col.includes("phone")),
    )
    const contactMailIndex = header.findIndex(
      (col) =>
        (col.includes("contact") && (col.includes("mail") || col.includes("email"))) ||
        col === "email" ||
        col === "mail",
    )

    // Find column indices (add after existing indices)
    const headshotIndex = header.findIndex(
      (col) => col.includes("headshot") || col.includes("photo") || col.includes("image"),
    )

    const actors: ParsedActor[] = []

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((cell) => cell.trim().replace(/['"]/g, ""))
      const errors: string[] = []

      // Extract data
      const name = nameIndex >= 0 ? row[nameIndex] || "" : ""
      const age = ageIndex >= 0 ? row[ageIndex] || "" : ""
      const playingAge = playingAgeIndex >= 0 ? row[playingAgeIndex] || "" : ""
      const contactNumber = contactNumberIndex >= 0 ? row[contactNumberIndex] || "" : ""
      const contactMail = contactMailIndex >= 0 ? row[contactMailIndex] || "" : ""
      const headshot = headshotIndex >= 0 ? row[headshotIndex] || "" : ""

      // Validate required fields
      if (!name.trim()) {
        errors.push("Name is required")
      }

      // Validate optional fields
      if (contactMail && !validateEmail(contactMail)) {
        errors.push("Invalid email format")
      }

      if (contactNumber && !validatePhone(contactNumber)) {
        errors.push("Invalid phone number format")
      }

      // Check for age format if provided
      if (age && isNaN(Number(age)) && !/^\d+$/.test(age)) {
        errors.push("Age must be a number")
      }

      // Add headshot validation in the validation section:
      if (headshot && !validateImageUrl(headshot)) {
        errors.push("Invalid headshot URL or file path")
      }

      // Update the actor object creation:
      actors.push({
        name,
        age,
        playingAge,
        contactNumber,
        contactMail,
        headshot,
        rowNumber: i + 1,
        errors,
      })
    }

    return actors
  }

  const parseExcel = (data: any[][]): ParsedActor[] => {
    if (data.length === 0) return []

    // Parse header (first row)
    const header = data[0].map((col) => (col || "").toString().trim().toLowerCase().replace(/['"]/g, ""))

    // Find column indices
    const nameIndex = header.findIndex((col) => col.includes("name"))
    const ageIndex = header.findIndex((col) => col === "age")
    const playingAgeIndex = header.findIndex((col) => col.includes("playing") && col.includes("age"))
    const contactNumberIndex = header.findIndex(
      (col) => col.includes("contact") && (col.includes("number") || col.includes("phone")),
    )
    const contactMailIndex = header.findIndex(
      (col) =>
        (col.includes("contact") && (col.includes("mail") || col.includes("email"))) ||
        col === "email" ||
        col === "mail",
    )

    // Find headshot column index
    const headshotIndex = header.findIndex(
      (col) => col.includes("headshot") || col.includes("photo") || col.includes("image"),
    )

    const actors: ParsedActor[] = []

    // Process data rows (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const errors: string[] = []

      // Extract data with safe access
      const name = nameIndex >= 0 && row[nameIndex] ? row[nameIndex].toString().trim() : ""
      const age = ageIndex >= 0 && row[ageIndex] ? row[ageIndex].toString().trim() : ""
      const playingAge = playingAgeIndex >= 0 && row[playingAgeIndex] ? row[playingAgeIndex].toString().trim() : ""
      const contactNumber =
        contactNumberIndex >= 0 && row[contactNumberIndex] ? row[contactNumberIndex].toString().trim() : ""
      const contactMail = contactMailIndex >= 0 && row[contactMailIndex] ? row[contactMailIndex].toString().trim() : ""
      const headshot = headshotIndex >= 0 && row[headshotIndex] ? row[headshotIndex].toString().trim() : ""

      // Validate required fields
      if (!name.trim()) {
        errors.push("Name is required")
      }

      // Validate optional fields
      if (contactMail && !validateEmail(contactMail)) {
        errors.push("Invalid email format")
      }

      if (contactNumber && !validatePhone(contactNumber)) {
        errors.push("Invalid phone number format")
      }

      // Check for age format if provided
      if (age && isNaN(Number(age)) && !/^\d+$/.test(age)) {
        errors.push("Age must be a number")
      }

      // Add validation
      if (headshot && !validateImageUrl(headshot)) {
        errors.push("Invalid headshot URL or file path")
      }

      // Include in actor object
      actors.push({
        name,
        age,
        playingAge,
        contactNumber,
        contactMail,
        headshot,
        rowNumber: i + 1,
        errors,
      })
    }

    return actors
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const isCSV = selectedFile.name.toLowerCase().endsWith(".csv")
    const isExcel = isExcelFile(selectedFile.name)

    if (!isCSV && !isExcel) {
      alert("Please select a CSV or Excel file (.csv, .xlsx, .xls)")
      return
    }

    // Validate file size (max 10MB for Excel, 5MB for CSV)
    const maxSize = isExcel ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      alert(`File size must be less than ${isExcel ? "10MB" : "5MB"}`)
      return
    }

    setFile(selectedFile)
    setFileType(isExcel ? "excel" : "csv")
    setParsedActors([])
    setValidActors([])
    setInvalidActors([])
    setUploadComplete(false)
  }

  const handleParseFile = async () => {
    if (!file) return

    setIsProcessing(true)

    try {
      let parsed: ParsedActor[] = []

      if (fileType === "csv") {
        const text = await file.text()
        parsed = parseCSV(text)
      } else {
        // Parse Excel file
        try {
          const excelData = await parseExcelFile(file)
          parsed = parseExcel(excelData)
        } catch (error) {
          throw new Error(`Excel parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }

      const valid = parsed.filter((actor) => actor.errors.length === 0)
      const invalid = parsed.filter((actor) => actor.errors.length > 0)

      setParsedActors(parsed)
      setValidActors(valid)
      setInvalidActors(invalid)

      setProcessingStats({
        total: parsed.length,
        successful: 0,
        failed: 0,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Error parsing file: ${errorMessage}. Please check the file format and try again.`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateActors = async () => {
    if (validActors.length === 0) return

    setIsProcessing(true)
    let successful = 0
    let failed = 0

    // First, process all images
    const imageResults: { [key: string]: string | null } = {}
    const imageProgress: { [key: string]: "processing" | "success" | "failed" } = {}

    for (const actor of validActors) {
      if (actor.headshot) {
        const actorKey = `${actor.name}-${actor.rowNumber}`
        imageProgress[actorKey] = "processing"
        setImageProcessingProgress({ ...imageProgress })

        try {
          const processedUrl = await processImageUrl(actor.headshot)
          imageResults[actorKey] = processedUrl
          imageProgress[actorKey] = processedUrl ? "success" : "failed"
        } catch (error) {
          imageResults[actorKey] = null
          imageProgress[actorKey] = "failed"
        }

        setImageProcessingProgress({ ...imageProgress })
        setProcessedImages({ ...imageResults })
      }
    }

    // Process actors in batches to avoid blocking the UI
    const batchSize = 10
    for (let i = 0; i < validActors.length; i += batchSize) {
      const batch = validActors.slice(i, i + batchSize)

      for (const actorData of batch) {
        try {
          const actorKey = `${actorData.name}-${actorData.rowNumber}`
          const processedImageUrl = imageResults[actorKey]

          const newActor = {
            id: `actor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: actorData.name,
            age: actorData.age,
            playingAge: actorData.playingAge,
            location: "",
            agent: "",
            imdbUrl: "",
            gender: "",
            ethnicity: "",
            contactPhone: actorData.contactNumber,
            contactEmail: actorData.contactMail,
            skills: [],
            availability: [],
            notes: [],
            headshots: processedImageUrl ? [processedImageUrl] : [],
            currentCardHeadshotIndex: 0,
            userVotes: {},
            isSoftRejected: false,
            isGreenlit: false,
            isCast: false,
            currentListKey: state.currentFocus.activeTabKey || "longList",
            currentShortlistId: state.currentFocus.activeShortlistId || undefined,
            statuses: [],
            mediaMaterials: [],
            showreels: [],
            auditionTapes: [],
            vimeoVideos: [],
            dateAdded: Date.now(),
            sortOrder: 0,
          }

          dispatch({
            type: "ADD_ACTOR",
            payload: {
              actor: newActor,
              characterId: currentCharacter.id,
            },
          })

          successful++
        } catch (error) {
          failed++
        }
      }

      // Update progress
      setProcessingStats({
        total: validActors.length,
        successful,
        failed,
      })

      // Small delay to prevent UI blocking
      if (i + batchSize < validActors.length) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }

    // Create summary notification with image processing info
    const fileTypeText = fileType === "excel" ? "Excel" : "CSV"
    const imageCount = Object.values(imageResults).filter((url) => url !== null).length
    const failedImages = Object.values(imageProgress).filter((status) => status === "failed").length

    const summaryNotification = {
      id: `file-upload-${Date.now()}-${Math.random()}`,
      type: "system" as const,
      title: `${fileTypeText} Upload Complete`,
      message: `Successfully created ${successful} actor cards from ${fileTypeText} file. ${imageCount > 0 ? `${imageCount} headshots imported successfully.` : ""} ${failed > 0 ? `${failed} entries failed.` : ""} ${failedImages > 0 ? `${failedImages} images failed to process.` : ""}`,
      timestamp: Date.now(),
      read: false,
      priority: "medium" as const,
      characterId: currentCharacter.id,
    }

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: summaryNotification,
    })

    setUploadComplete(true)
    setIsProcessing(false)
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ["Name", "Age", "Playing Age", "Contact Number", "Contact Mail", "Headshot"],
      ["John Doe", "28", "25-30", "+1-555-0123", "john.doe@email.com", "https://example.com/headshots/john-doe.jpg"],
      [
        "Jane Smith",
        "32",
        "30-35",
        "+1-555-0124",
        "jane.smith@email.com",
        "https://example.com/headshots/jane-smith.jpg",
      ],
      ["Mike Johnson", "24", "20-25", "+1-555-0125", "mike.johnson@email.com", ""],
    ]

    const csvContent = sampleData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample_actors_with_headshots.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const downloadSampleExcel = async () => {
    try {
      // Try to use the XLSX library with proper error handling
      let XLSX: any

      try {
        XLSX = await import("xlsx")
      } catch (importError) {
        console.error("Failed to import XLSX library:", importError)
        // Fallback to creating a simple Excel-like CSV with .xlsx extension
        const sampleData = [
          ["Name", "Age", "Playing Age", "Contact Number", "Contact Mail", "Headshot"],
          [
            "John Doe",
            "28",
            "25-30",
            "+1-555-0123",
            "john.doe@email.com",
            "https://example.com/headshots/john-doe.jpg",
          ],
          [
            "Jane Smith",
            "32",
            "30-35",
            "+1-555-0124",
            "jane.smith@email.com",
            "https://example.com/headshots/jane-smith.jpg",
          ],
          ["Mike Johnson", "24", "20-25", "+1-555-0125", "mike.johnson@email.com", ""],
        ]

        // Create a tab-separated CSV that Excel can open
        const csvContent = sampleData.map((row) => row.join("\t")).join("\n")
        const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "sample_actors.xls"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        return
      }

      const sampleData = [
        ["Name", "Age", "Playing Age", "Contact Number", "Contact Mail", "Headshot"],
        ["John Doe", "28", "25-30", "+1-555-0123", "john.doe@email.com", "https://example.com/headshots/john-doe.jpg"],
        [
          "Jane Smith",
          "32",
          "30-35",
          "+1-555-0124",
          "jane.smith@email.com",
          "https://example.com/headshots/jane-smith.jpg",
        ],
        ["Mike Johnson", "24", "20-25", "+1-555-0125", "mike.johnson@email.com", ""],
      ]

      // Create worksheet from array of arrays
      const worksheet = XLSX.utils.aoa_to_sheet(sampleData)

      // Set column widths for better formatting
      const colWidths = [
        { wch: 15 }, // Name
        { wch: 8 }, // Age
        { wch: 12 }, // Playing Age
        { wch: 15 }, // Contact Number
        { wch: 20 }, // Contact Mail
        { wch: 30 }, // Headshot
      ]
      worksheet["!cols"] = colWidths

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Actors")

      // Generate Excel file as a blob and download it using browser APIs
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "sample_actors_with_headshots.xlsx"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Excel generation error:", error)

      // Fallback: Create a tab-delimited file that Excel can open
      const sampleData = [
        ["Name", "Age", "Playing Age", "Contact Number", "Contact Mail", "Headshot"],
        ["John Doe", "28", "25-30", "+1-555-0123", "john.doe@email.com", "https://example.com/headshots/john-doe.jpg"],
        [
          "Jane Smith",
          "32",
          "30-35",
          "+1-555-0124",
          "jane.smith@email.com",
          "https://example.com/headshots/jane-smith.jpg",
        ],
      ]

      try {
        // Create a tab-separated file that Excel can open
        const tsvContent = sampleData.map((row) => row.join("\t")).join("\n")
        const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "sample_actors.xls"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (fallbackError) {
        alert("Unable to generate Excel sample file. Please use the CSV sample instead.")
      }
    }
  }

  const startEditing = (actor: ParsedActor, isValid: boolean) => {
    setEditingActors((prev) => ({
      ...prev,
      [actor.rowNumber]: {
        ...actor,
        isEditing: true,
        editedData: {
          name: actor.name,
          age: actor.age,
          playingAge: actor.playingAge,
          contactNumber: actor.contactNumber,
          contactMail: actor.contactMail,
          headshot: actor.headshot,
        },
      },
    }))
    setExpandedRows((prev) => new Set(prev).add(actor.rowNumber))
  }

  const cancelEditing = (rowNumber: number) => {
    setEditingActors((prev) => {
      const newState = { ...prev }
      delete newState[rowNumber]
      return newState
    })
  }

  const updateEditingField = (rowNumber: number, field: keyof CSVRow, value: string) => {
    setEditingActors((prev) => ({
      ...prev,
      [rowNumber]: {
        ...prev[rowNumber],
        editedData: {
          ...prev[rowNumber].editedData,
          [field]: value,
        },
      },
    }))
  }

  const saveEditing = (rowNumber: number, isValid: boolean) => {
    const editingActor = editingActors[rowNumber]
    if (!editingActor) return

    const updatedData = editingActor.editedData
    const errors: string[] = []

    // Validate
    if (!updatedData.name.trim()) {
      errors.push("Name is required")
    }
    if (updatedData.contactMail && !validateEmail(updatedData.contactMail)) {
      errors.push("Invalid email format")
    }
    if (updatedData.contactNumber && !validatePhone(updatedData.contactNumber)) {
      errors.push("Invalid phone number format")
    }
    if (updatedData.age && isNaN(Number(updatedData.age))) {
      errors.push("Age must be a number")
    }

    const updatedActor: ParsedActor = {
      ...updatedData,
      rowNumber,
      errors,
    }

    // Update the appropriate list
    if (isValid) {
      if (errors.length === 0) {
        // Still valid, update in validActors
        setValidActors((prev) => prev.map((a) => (a.rowNumber === rowNumber ? updatedActor : a)))
      } else {
        // Now invalid, move to invalidActors
        setValidActors((prev) => prev.filter((a) => a.rowNumber !== rowNumber))
        setInvalidActors((prev) => [...prev, updatedActor].sort((a, b) => a.rowNumber - b.rowNumber))
      }
    } else {
      if (errors.length === 0) {
        // Now valid, move to validActors
        setInvalidActors((prev) => prev.filter((a) => a.rowNumber !== rowNumber))
        setValidActors((prev) => [...prev, updatedActor].sort((a, b) => a.rowNumber - b.rowNumber))
      } else {
        // Still invalid, update in invalidActors
        setInvalidActors((prev) => prev.map((a) => (a.rowNumber === rowNumber ? updatedActor : a)))
      }
    }

    // Update parsedActors
    setParsedActors((prev) => prev.map((a) => (a.rowNumber === rowNumber ? updatedActor : a)))

    // Clear editing state
    cancelEditing(rowNumber)
  }

  const handleInlineImageUpload = (rowNumber: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB")
      return
    }

    // Create data URL for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string

      // If currently editing, update the editedData
      if (editingActors[rowNumber]) {
        updateEditingField(rowNumber, "headshot", dataUrl)
      } else {
        // Directly update the actor
        const updateList = (list: ParsedActor[]) =>
          list.map((a) => (a.rowNumber === rowNumber ? { ...a, headshot: dataUrl } : a))

        setValidActors(updateList)
        setInvalidActors(updateList)
        setParsedActors(updateList)
      }
    }
    reader.readAsDataURL(file)
  }

  const deleteActor = (rowNumber: number, isValid: boolean) => {
    if (isValid) {
      setValidActors((prev) => prev.filter((a) => a.rowNumber !== rowNumber))
    } else {
      setInvalidActors((prev) => prev.filter((a) => a.rowNumber !== rowNumber))
    }
    setParsedActors((prev) => prev.filter((a) => a.rowNumber !== rowNumber))
    cancelEditing(rowNumber)
  }

  const toggleRowExpand = (rowNumber: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(rowNumber)) {
        newSet.delete(rowNumber)
      } else {
        newSet.add(rowNumber)
      }
      return newSet
    })
  }

  const renderFileUpload = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {file ? file.name : "Choose CSV or Excel file"}
                </span>
                <span className="mt-1 block text-sm text-gray-500">CSV files up to 5MB, Excel files up to 10MB</span>
              </label>
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="sr-only"
                onChange={handleFileSelect}
              />
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <Download className="w-4 h-4 mr-1" />
                  CSV Sample
                </button>
                <button
                  type="button"
                  onClick={downloadSampleExcel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">File Format Requirements:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Supported formats:</strong> CSV (.csv), Excel (.xlsx, .xls)
          </li>
          <li>
            • <strong>Name</strong> (required): Actor's full name
          </li>
          <li>
            • <strong>Age</strong> (optional): Actor's age
          </li>
          <li>
            • <strong>Playing Age</strong> (optional): Age range they can play
          </li>
          <li>
            • <strong>Contact Number</strong> (optional): Phone number
          </li>
          <li>
            • <strong>Contact Mail</strong> (optional): Email address
          </li>
          <li>
            • <strong>Headshot</strong> (optional): Image URL or file path to actor's headshot
          </li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Column names are case-insensitive. For Excel files, only the first worksheet will be processed. Other fields
          will be left blank for manual entry.
        </p>
      </div>

      {file && (
        <div className="flex justify-end">
          <button
            onClick={handleParseFile}
            disabled={isProcessing}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Parsing..." : `Parse ${fileType.toUpperCase()} File`}
          </button>
        </div>
      )}
    </div>
  )

  const renderPreview = () => {
    const renderActorRow = (actor: ParsedActor, isValid: boolean) => {
      const isEditing = editingActors[actor.rowNumber]?.isEditing
      const editData = editingActors[actor.rowNumber]?.editedData
      const isExpanded = expandedRows.has(actor.rowNumber)

      return (
        <div
          key={actor.rowNumber}
          className={`border-b ${isValid ? "border-green-300" : "border-red-300"} last:border-b-0`}
        >
          {/* Main row */}
          <div
            className={`flex items-center gap-2 p-3 ${isValid ? "hover:bg-green-50" : "hover:bg-red-50"} transition-colors`}
          >
            {/* Expand/Collapse button */}
            <button onClick={() => toggleRowExpand(actor.rowNumber)} className="p-1 hover:bg-gray-200 rounded">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {(isEditing ? editData?.headshot : actor.headshot) ? (
                <img
                  src={isEditing ? editData?.headshot : actor.headshot}
                  alt={actor.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImagePlus className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Row number */}
            <span className="text-xs text-gray-500 w-8">#{actor.rowNumber}</span>

            {/* Name - editable or display */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.name || ""}
                  onChange={(e) => updateEditingField(actor.rowNumber, "name", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Name"
                />
              ) : (
                <span className="font-medium text-gray-900 truncate block">{actor.name || "(empty)"}</span>
              )}
            </div>

            {/* Age */}
            <div className="w-16 flex-shrink-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.age || ""}
                  onChange={(e) => updateEditingField(actor.rowNumber, "age", e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  placeholder="Age"
                />
              ) : (
                <span className="text-sm text-gray-600">{actor.age || "-"}</span>
              )}
            </div>

            {/* Status indicator */}
            {!isValid && !isEditing && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 flex-shrink-0">
                {actor.errors.length} error{actor.errors.length > 1 ? "s" : ""}
              </span>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => saveEditing(actor.rowNumber, isValid)}
                    className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    title="Save changes"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => cancelEditing(actor.rowNumber)}
                    className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    title="Cancel"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEditing(actor, isValid)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit actor"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteActor(actor.rowNumber, isValid)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove actor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Expanded details */}
          {isExpanded && (
            <div
              className={`px-4 py-3 ${isValid ? "bg-green-50/50" : "bg-red-50/50"} border-t ${isValid ? "border-green-300" : "border-red-300"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Headshot upload */}
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Headshot</label>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {(isEditing ? editData?.headshot : actor.headshot) ? (
                        <img
                          src={isEditing ? editData?.headshot : actor.headshot}
                          alt={actor.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImagePlus className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        ref={(el) => {
                          imageUploadRefs.current[actor.rowNumber] = el
                        }}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleInlineImageUpload(actor.rowNumber, e)}
                      />
                      <button
                        onClick={() => imageUploadRefs.current[actor.rowNumber]?.click()}
                        className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      {(isEditing ? editData?.headshot : actor.headshot) && (
                        <button
                          onClick={() => {
                            if (isEditing) {
                              updateEditingField(actor.rowNumber, "headshot", "")
                            } else {
                              const updateList = (list: ParsedActor[]) =>
                                list.map((a) => (a.rowNumber === actor.rowNumber ? { ...a, headshot: "" } : a))
                              setValidActors(updateList)
                              setInvalidActors(updateList)
                              setParsedActors(updateList)
                            }
                          }}
                          className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Playing Age */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Playing Age</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData?.playingAge || ""}
                      onChange={(e) => updateEditingField(actor.rowNumber, "playingAge", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 25-30"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">{actor.playingAge || "-"}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData?.contactNumber || ""}
                      onChange={(e) => updateEditingField(actor.rowNumber, "contactNumber", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Phone number"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">{actor.contactNumber || "-"}</p>
                  )}
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData?.contactMail || ""}
                      onChange={(e) => updateEditingField(actor.rowNumber, "contactMail", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Email address"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">{actor.contactMail || "-"}</p>
                  )}
                </div>

                {/* Headshot URL (if editing) */}
                {isEditing && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Headshot URL</label>
                    <input
                      type="text"
                      value={editData?.headshot || ""}
                      onChange={(e) => updateEditingField(actor.rowNumber, "headshot", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="https://example.com/headshot.jpg"
                    />
                  </div>
                )}
              </div>

              {/* Error display */}
              {!isValid && actor.errors.length > 0 && (
                <div className="mt-3 p-2 bg-red-100 rounded-lg">
                  <p className="text-xs font-medium text-red-800 mb-1">Validation Errors:</p>
                  <ul className="text-xs text-red-700 list-disc list-inside">
                    {actor.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preview & Edit
            <span className="text-sm font-normal text-gray-600 ml-2">({fileType.toUpperCase()} file)</span>
          </h3>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{parsedActors.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{validActors.length}</div>
              <div className="text-sm text-green-600">Valid Entries</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{invalidActors.length}</div>
              <div className="text-sm text-red-600">Invalid Entries</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Click the arrow to expand a row for full editing. Use the{" "}
              <Pencil className="w-3 h-3 inline" /> button for quick edits, or upload images directly for each actor.
            </p>
          </div>

          {/* Valid Actors List */}
          {validActors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-green-700 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Valid Entries ({validActors.length})
              </h4>
              <div className="max-h-[300px] overflow-y-auto border border-green-200 rounded-lg bg-white">
                {validActors.map((actor) => renderActorRow(actor, true))}
              </div>
            </div>
          )}

          {/* Invalid Actors List */}
          {invalidActors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-red-700 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Invalid Entries ({invalidActors.length}) - Edit to fix errors
              </h4>
              <div className="max-h-[300px] overflow-y-auto border border-red-200 rounded-lg bg-white">
                {invalidActors.map((actor) => renderActorRow(actor, false))}
              </div>
            </div>
          )}

          {/* Image Processing Progress */}
          {Object.keys(imageProcessingProgress).length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-blue-700 mb-3">Image Processing Progress</h4>
              <div className="space-y-2">
                {Object.entries(imageProcessingProgress).map(([actorKey, status]) => (
                  <div key={actorKey} className="flex items-center justify-between text-sm">
                    <span>{actorKey.split("-")[0]}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : status === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {status === "processing" ? "Processing..." : status === "success" ? "Success" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validActors.length > 0 && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setFile(null)
                  setParsedActors([])
                  setValidActors([])
                  setInvalidActors([])
                  setEditingActors({})
                  setExpandedRows(new Set())
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleCreateActors}
                disabled={isProcessing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing
                  ? `Creating... (${processingStats.successful}/${processingStats.total})`
                  : `Create ${validActors.length} Actor Cards`}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Complete!</h3>
        <p className="text-gray-600">
          Successfully created {processingStats.successful} actor cards from your {fileType.toUpperCase()} file.
          {processingStats.failed > 0 && (
            <span className="text-red-600 block mt-1">{processingStats.failed} entries failed to process.</span>
          )}
        </p>
      </div>
      <div className="flex justify-center">
        <button onClick={onClose} className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
          Done
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-2xl font-bold">Upload Actors from File</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6">
        {uploadComplete ? renderComplete() : parsedActors.length > 0 ? renderPreview() : renderFileUpload()}
      </div>
    </div>
  )
}
