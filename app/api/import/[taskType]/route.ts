import { NextRequest, NextResponse } from "next/server"
import { verifyIdTokenFromRequest } from "@/lib/firebase-admin"

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"

// Supported skills
const SUPPORTED_SKILLS = [
  "character-extract",
  "actor-extract",
  "location-overview",
  "prop-extract",
  "scene-extract",
]

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

    // Verify Firebase ID token. Per spec, do NOT fall back to sending the
    // request without attribution — return 401 instead. The /api/usage
    // route uses the same pattern.
    const verified = await verifyIdTokenFromRequest(request)
    if (!verified) {
      return NextResponse.json(
        { error: "Unauthorized — sign in required" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const sourceTitle = formData.get("sourceTitle") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type — accept either by MIME or by extension, since
    // some browsers (esp. Windows/Linux) report "" or "application/octet-stream"
    // for .docx uploads. This must behave identically for every skill.
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "text/csv",
      "text/plain",
    ]
    const allowedExtensions = /\.(pdf|docx|xlsx|csv|txt)$/i
    const mimeOk = allowedTypes.includes(file.type)
    const extOk = allowedExtensions.test(file.name)

    if (!mimeOk && !extOk) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type || "unknown"}. Supported types: PDF, DOCX, XLSX, CSV, TXT`,
        },
        { status: 400 }
      )
    }

    // Forward file directly to AI service as multipart/form-data, plus
    // server-derived attribution fields (NEVER trust client-supplied user
    // info — these come from the verified Firebase token).
    const upstream = new FormData()
    upstream.append("file", file, file.name) // third arg = filename
    upstream.append("skill", taskType)
    if (sourceTitle) {
      upstream.append("input", JSON.stringify({ source_title: sourceTitle }))
    }
    upstream.append("userId", verified.uid)
    if (verified.email) {
      upstream.append("userEmail", verified.email)
    }

    const aiResponse = await fetch(`${AI_SERVICE_URL}/tasks/upload`, {
      method: "POST",
      body: upstream,
      // NO headers — let fetch set Content-Type automatically with boundary
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

    return NextResponse.json({ taskId: result.taskId }, { status: 202 })
  } catch (error) {
    console.error("Error in import API:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
