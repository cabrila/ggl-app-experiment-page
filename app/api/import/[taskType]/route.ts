import { NextRequest, NextResponse } from "next/server"
import { Storage } from "@google-cloud/storage"
import { v4 as uuidv4 } from "uuid"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"
const GCS_BUCKET = process.env.GCS_BUCKET || "gl-task-attachments-dev"

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
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, XLSX` },
        { status: 400 }
      )
    }

    // Generate a unique ID for this upload
    const uploadId = uuidv4()
    const gcsPath = `uploads/${uploadId}/${file.name}`

    // Upload to GCS
    const storage = new Storage() // Uses Application Default Credentials
    const bucket = storage.bucket(GCS_BUCKET)
    const gcsFile = bucket.file(gcsPath)

    const buffer = Buffer.from(await file.arrayBuffer())
    await gcsFile.save(buffer, {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    })

    const uri = `gs://${GCS_BUCKET}/${gcsPath}`

    // POST to AI service
    const aiResponse = await fetch(`${AI_SERVICE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // In production: "Authorization": `Bearer ${await getOidcToken()}`
      },
      body: JSON.stringify({
        skill: taskType,
        input: sourceTitle ? { source_title: sourceTitle } : {},
        attachments: [
          {
            uri,
            mimeType: file.type,
            role: "source_document",
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error("AI service error:", errorText)
      return NextResponse.json(
        { error: `AI service error: ${aiResponse.status}` },
        { status: 502 }
      )
    }

    const { taskId } = await aiResponse.json()

    return NextResponse.json({ taskId }, { status: 202 })
  } catch (error) {
    console.error("Error in import API:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
