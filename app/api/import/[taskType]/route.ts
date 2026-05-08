import { NextRequest, NextResponse } from "next/server"
import mammoth from "mammoth"
import pdf from "pdf-parse"

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"

// Supported skills
const SUPPORTED_SKILLS = ["character-extract", "actor-extract", "location-overview"]

// Extract text from various file types
async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type === "application/pdf") {
    const data = await pdf(buffer)
    return data.text
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (file.type === "text/plain" || file.type === "text/csv") {
    return buffer.toString("utf-8")
  }

  // For xlsx, we'd need a different library - for now return empty
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    // TODO: Add xlsx support with a library like xlsx
    throw new Error("Excel file support coming soon. Please convert to CSV or PDF.")
  }

  throw new Error(`Unsupported file type: ${file.type}`)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskType: string }> }
) {
  try {
    const { taskType } = await params

    // Validate task type
    if (!SUPPORTED_SKILLS.includes(taskType)) {
      return NextResponse.json(
        {
          error: `Unsupported task type: ${taskType}. Supported types: ${SUPPORTED_SKILLS.join(", ")}`,
        },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const sourceTitle = formData.get("sourceTitle") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "text/csv",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, XLSX, CSV, TXT`,
        },
        { status: 400 }
      )
    }

    // Extract text from the file
    console.log("[v0] Extracting text from file:", file.name, file.type)
    const extractedText = await extractTextFromFile(file)

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract any text from the file. Please check the file content." },
        { status: 400 }
      )
    }

    console.log("[v0] Extracted text length:", extractedText.length)

    // Send to AI service with extracted text
    const aiResponse = await fetch(`${AI_SERVICE_URL}/tasks/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: extractedText,
        skill: taskType,
        source_title: sourceTitle || file.name,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error("AI service error:", aiResponse.status, errorText)

      if (aiResponse.status === 400) {
        let errorMessage =
          "This skill is not available yet. Please try again later."
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = Array.isArray(errorJson.message)
              ? errorJson.message.join(", ")
              : errorJson.message
          }
        } catch {
          // Use default error message
        }
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }

      return NextResponse.json(
        { error: `AI service error: ${aiResponse.status}` },
        { status: 502 }
      )
    }

    const result = await aiResponse.json()
    console.log("[v0] AI service response:", result)

    return NextResponse.json({ taskId: result.taskId }, { status: 202 })
  } catch (error) {
    console.error("Error in import API:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
