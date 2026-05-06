"use client"

import { useState, useRef } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X, Upload, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import type { Character } from "@/types/casting"

interface UploadCharactersModalProps {
  onClose: () => void
}

interface CharacterData {
  name: string
  age: string
  gender: string
  ethnicity: string
  description: string
  castingNotes: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

export default function UploadCharactersModal({ onClose }: UploadCharactersModalProps) {
  const { state, dispatch } = useCasting()
  const [currentStep, setCurrentStep] = useState<"upload" | "preview" | "processing" | "complete">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<CharacterData[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [processingProgress, setProcessingProgress] = useState(0)
  const [createdCount, setCreatedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return

    // Validate file type
    const validTypes = [".csv", ".xlsx", ".xls"]
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf("."))

    if (!validTypes.includes(fileExtension)) {
      alert("Please select a CSV or Excel file (.csv, .xlsx, .xls)")
      return
    }

    // Validate file size (10MB for Excel, 5MB for CSV)
    const maxSize = fileExtension === ".csv" ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      alert(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB for ${fileExtension} files.`)
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const parseFile = async (file: File) => {
    try {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
      let data: CharacterData[] = []

      if (fileExtension === ".csv") {
        data = await parseCSV(file)
      } else {
        data = await parseExcel(file)
      }

      const { validData, errors } = validateData(data)
      setParsedData(validData)
      setValidationErrors(errors)
      setCurrentStep("preview")
    } catch (error) {
      console.error("Error parsing file:", error)
      alert("Error parsing file. Please check the file format and try again.")
    }
  }

  const parseCSV = (file: File): Promise<CharacterData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split("\n").filter((line) => line.trim())

          if (lines.length < 2) {
            reject(new Error("File must contain at least a header row and one data row"))
            return
          }

          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""))
          const data: CharacterData[] = []

          // Map column variations to standard fields
          const columnMap: Record<string, string> = {
            "character name": "name",
            name: "name",
            character: "name",
            age: "age",
            gender: "gender",
            sex: "gender",
            ethnicity: "ethnicity",
            race: "ethnicity",
            description: "description",
            "character description": "description",
            "casting notes": "castingNotes",
            notes: "castingNotes",
            "casting note": "castingNotes",
          }

          const fieldIndices: Record<string, number> = {}
          headers.forEach((header, index) => {
            const mappedField = columnMap[header]
            if (mappedField) {
              fieldIndices[mappedField] = index
            }
          })

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))

            // Skip empty rows
            if (values.every((v) => !v)) continue

            const character: CharacterData = {
              name: values[fieldIndices.name] || "",
              age: values[fieldIndices.age] || "",
              gender: values[fieldIndices.gender] || "",
              ethnicity: values[fieldIndices.ethnicity] || "",
              description: values[fieldIndices.description] || "",
              castingNotes: values[fieldIndices.castingNotes] || "",
            }

            data.push(character)
          }

          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error("Error reading file"))
      reader.readAsText(file)
    })
  }

  const parseExcel = async (file: File): Promise<CharacterData[]> => {
    try {
      const XLSX = await import("xlsx")

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, {
              type: "array",
              cellDates: false,
              cellNF: false,
              cellText: false,
            })

            const firstSheetName = workbook.SheetNames[0]
            if (!firstSheetName) {
              reject(new Error("Excel file contains no worksheets"))
              return
            }

            const worksheet = workbook.Sheets[firstSheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            if (jsonData.length < 2) {
              reject(new Error("Excel file must contain at least a header row and one data row"))
              return
            }

            const headers = (jsonData[0] as string[]).map((h) =>
              String(h || "")
                .trim()
                .toLowerCase(),
            )

            const columnMap: Record<string, string> = {
              "character name": "name",
              name: "name",
              character: "name",
              age: "age",
              gender: "gender",
              sex: "gender",
              ethnicity: "ethnicity",
              race: "ethnicity",
              description: "description",
              "character description": "description",
              "casting notes": "castingNotes",
              notes: "castingNotes",
              "casting note": "castingNotes",
            }

            const fieldIndices: Record<string, number> = {}
            headers.forEach((header, index) => {
              const mappedField = columnMap[header]
              if (mappedField) {
                fieldIndices[mappedField] = index
              }
            })

            const characters: CharacterData[] = []

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] as any[]

              // Skip empty rows
              if (!row || row.every((cell) => !cell)) continue

              const character: CharacterData = {
                name: String(row[fieldIndices.name] || "").trim(),
                age: String(row[fieldIndices.age] || "").trim(),
                gender: String(row[fieldIndices.gender] || "").trim(),
                ethnicity: String(row[fieldIndices.ethnicity] || "").trim(),
                description: String(row[fieldIndices.description] || "").trim(),
                castingNotes: String(row[fieldIndices.castingNotes] || "").trim(),
              }

              characters.push(character)
            }

            resolve(characters)
          } catch (error) {
            reject(new Error(`Excel parsing error: ${error}`))
          }
        }
        reader.onerror = () => reject(new Error("Error reading Excel file"))
        reader.readAsArrayBuffer(file)
      })
    } catch (error) {
      throw new Error("Failed to load Excel parsing library. Please try CSV format instead.")
    }
  }

  const validateData = (data: CharacterData[]) => {
    const errors: ValidationError[] = []
    const validData: CharacterData[] = []

    data.forEach((character, index) => {
      const rowNumber = index + 2 // +2 because index starts at 0 and we skip header

      // Validate required fields
      if (!character.name.trim()) {
        errors.push({
          row: rowNumber,
          field: "Character Name",
          message: "Character name is required",
        })
      } else {
        validData.push(character)
      }
    })

    return { validData, errors }
  }

  const downloadSampleCSV = () => {
    const csvContent = [
      "Character Name,Age,Gender,Ethnicity,Description,Casting Notes",
      "John Smith,30s,Male,Caucasian,A charming protagonist with a mysterious past,Looking for someone with strong dramatic range",
      "Sarah Johnson,25-35,Female,Any,The brilliant scientist who discovers the truth,Need someone who can convey intelligence and determination",
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "character_sample.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadSampleExcel = async () => {
    try {
      const XLSX = await import("xlsx")

      const data = [
        ["Character Name", "Age", "Gender", "Ethnicity", "Description", "Casting Notes"],
        [
          "John Smith",
          "30s",
          "Male",
          "Caucasian",
          "A charming protagonist with a mysterious past",
          "Looking for someone with strong dramatic range",
        ],
        [
          "Sarah Johnson",
          "25-35",
          "Female",
          "Any",
          "The brilliant scientist who discovers the truth",
          "Need someone who can convey intelligence and determination",
        ],
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(data)

      // Set column widths
      worksheet["!cols"] = [
        { width: 20 }, // Character Name
        { width: 10 }, // Age
        { width: 12 }, // Gender
        { width: 15 }, // Ethnicity
        { width: 40 }, // Description
        { width: 40 }, // Casting Notes
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Characters")

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "character_sample.xlsx"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      // Fallback to tab-delimited file
      const tsvContent = [
        "Character Name\tAge\tGender\tEthnicity\tDescription\tCasting Notes",
        "John Smith\t30s\tMale\tCaucasian\tA charming protagonist with a mysterious past\tLooking for someone with strong dramatic range",
        "Sarah Johnson\t25-35\tFemale\tAny\tThe brilliant scientist who discovers the truth\tNeed someone who can convey intelligence and determination",
      ].join("\n")

      const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "character_sample.xls"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const createCharacters = async () => {
    const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
    if (!currentProject) {
      alert("No project selected.")
      return
    }

    setCurrentStep("processing")
    setProcessingProgress(0)
    setCreatedCount(0)
    setFailedCount(0)

    const batchSize = 10
    let created = 0
    let failed = 0

    for (let i = 0; i < parsedData.length; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize)

      for (const characterData of batch) {
        try {
          const newCharacter: Character = {
            id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: characterData.name,
            age: characterData.age,
            gender: characterData.gender,
            ethnicity: characterData.ethnicity,
            description: characterData.description,
            castingNotes: characterData.castingNotes,
            actors: {
              longList: [],
              shortLists: [],
              audition: [],
              approval: [],
            },
          }

          dispatch({
            type: "ADD_CHARACTER",
            payload: {
              projectId: currentProject.id,
              character: newCharacter,
            },
          })

          // Add notification for character creation
          dispatch({
            type: "ADD_NOTIFICATION",
            payload: {
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: "Character Added",
              message: `Character "${characterData.name}" was added to the project`,
              timestamp: Date.now(),
              isRead: false,
              priority: "low",
              metadata: {
                characterId: newCharacter.id,
                projectId: currentProject.id,
                source: "file_upload",
              },
            },
          })

          created++
          setCreatedCount(created)
        } catch (error) {
          console.error(`Failed to create character ${characterData.name}:`, error)
          failed++
          setFailedCount(failed)
        }
      }

      // Update progress
      const progress = Math.min(((i + batchSize) / parsedData.length) * 100, 100)
      setProcessingProgress(progress)

      // Small delay to prevent UI blocking
      if (i + batchSize < parsedData.length) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }

    // Add summary notification
    dispatch({
      type: "ADD_NOTIFICATION",
      payload: {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: "Characters Import Complete",
        message: `Successfully imported ${created} characters${failed > 0 ? `, ${failed} failed` : ""}`,
        timestamp: Date.now(),
        isRead: false,
        priority: "medium",
        metadata: {
          projectId: currentProject.id,
          created,
          failed,
          source: "file_upload",
        },
      },
    })

    setCurrentStep("complete")
  }

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-emerald-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add("border-emerald-400")
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove("border-emerald-400")
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove("border-emerald-400")
            const files = Array.from(e.dataTransfer.files)
            if (files.length > 0) {
              handleFileSelect(files[0])
            }
          }}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Drop your file here or click to browse</p>
          <p className="text-sm text-gray-500">Supports CSV and Excel files (.csv, .xlsx, .xls)</p>
          <p className="text-xs text-gray-400 mt-2">Maximum file size: 10MB for Excel, 5MB for CSV</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
          className="hidden"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Required Columns:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Character Name</strong> (required)
          </li>
          <li>• Age (optional)</li>
          <li>• Gender (optional)</li>
          <li>• Ethnicity (optional)</li>
          <li>• Description (optional)</li>
          <li>• Casting Notes (optional)</li>
        </ul>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={downloadSampleCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV Sample</span>
        </button>
        <button
          onClick={downloadSampleExcel}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Excel Sample</span>
        </button>
      </div>
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Preview Characters</h3>
          <p className="text-sm text-gray-600">
            File: {file?.name} • {parsedData.length} valid characters
            {validationErrors.length > 0 && `, ${validationErrors.length} errors`}
          </p>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-900">Validation Errors</h4>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {validationErrors.map((error, index) => (
              <p key={index} className="text-sm text-red-800">
                Row {error.row}: {error.field} - {error.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-medium text-gray-900">Valid Characters ({parsedData.length})</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {parsedData.slice(0, 10).map((character, index) => (
            <div key={index} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
              <div className="font-medium text-gray-900">{character.name}</div>
              <div className="text-sm text-gray-600 grid grid-cols-2 gap-4 mt-1">
                <span>Age: {character.age || "Not specified"}</span>
                <span>Gender: {character.gender || "Not specified"}</span>
                <span>Ethnicity: {character.ethnicity || "Not specified"}</span>
              </div>
              {character.description && (
                <p className="text-sm text-gray-600 mt-1 truncate">Description: {character.description}</p>
              )}
            </div>
          ))}
          {parsedData.length > 10 && (
            <div className="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
              ... and {parsedData.length - 10} more characters
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <Loader2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Characters...</h3>
        <p className="text-sm text-gray-600">Please wait while we add your characters to the project</p>
      </div>

      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${processingProgress}%` }}
        />
      </div>

      <div className="text-sm text-gray-600">
        <p>Progress: {Math.round(processingProgress)}%</p>
        <p>
          Created: {createdCount} • Failed: {failedCount}
        </p>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
        <p className="text-sm text-gray-600">
          Successfully created {createdCount} characters
          {failedCount > 0 && ` (${failedCount} failed)`}
        </p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <p className="text-sm text-emerald-800">
          Your characters have been added to the current project and are ready for casting.
        </p>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-bold">Add Characters from File</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "preview" && renderPreviewStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "complete" && renderCompleteStep()}
      </div>

      <div className="flex justify-between items-center p-6 border-t bg-gray-50">
        <div className="flex space-x-2">
          {currentStep !== "upload" && currentStep !== "processing" && currentStep !== "complete" && (
            <button
              onClick={() => {
                setCurrentStep("upload")
                setFile(null)
                setParsedData([])
                setValidationErrors([])
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Start Over
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            {currentStep === "complete" ? "Close" : "Cancel"}
          </button>
          {currentStep === "preview" && parsedData.length > 0 && (
            <button
              onClick={createCharacters}
              className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
            >
              Create {parsedData.length} Characters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
