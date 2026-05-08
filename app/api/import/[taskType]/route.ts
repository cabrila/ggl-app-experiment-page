import { NextRequest, NextResponse } from "next/server"

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"

// Supported skills
const SUPPORTED_SKILLS = ["character-extract", "actor-extract", "location-overview"]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskType: string }> }
) {
  try {
    const { taskType } = await params

    // Validate task type
    if (!SUPPORTED_SKILLS.includes(taskType)) {
      return NextResponse.json(
        { error: `Unsupported task type: ${taskType}. Supported types: ${SUPPORTED_SKILLS.join(", ")}` },
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx (for actor-extract)
      "text/csv",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, XLSX, CSV, TXT` },
        { status: 400 }
      )
    }

    // Forward the file directly to the AI service's /tasks/upload endpoint
    // The AI service expects: file (multipart), skill (string), and optionally source_title
    const aiFormData = new FormData()
    aiFormData.append("file", file, file.name)
    aiFormData.append("skill", taskType)
    if (sourceTitle) {
      aiFormData.append("source_title", sourceTitle)
    }

    console.log("[v0] Sending to AI service:", {
      skill: taskType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      sourceTitle,
    })

    const aiResponse = await fetch(`${AI_SERVICE_URL}/tasks/upload`, {
      method: "POST",
      body: aiFormData,
      // In production: headers: { "Authorization": `Bearer ${await getOidcToken()}` }
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error("AI service error:", aiResponse.status, errorText)
      
      // Handle specific error codes gracefully
      if (aiResponse.status === 400) {
        // Parse the error message if possible
        let errorMessage = "This skill is not available yet. Please try again later."
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
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        )
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
