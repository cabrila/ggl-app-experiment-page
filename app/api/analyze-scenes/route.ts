import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY_FOR_APP_EXPERIMENT
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY_FOR_APP_EXPERIMENT environment variable is not set" },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Content = buffer.toString("base64")
    const mimeType = file.type || "application/pdf"

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    })

    const prompt = `You are a script parsing engine. Your task is to segment the provided screenplay into individual scenes.

Rules:
- Scene delineation: A new scene begins every time there is a standard scene heading (lines starting with INT., EXT., or specific location callouts that clearly denote a change in time or place).
- Raw text capture: For each scene, extract the FULL, verbatim raw text of everything that happens in that scene (action lines, character names, dialogue, parentheticals). Capture stops only when the next scene heading begins.
- Metadata: Extract the primary location and the time of day from the scene heading. If the time of day is not stated, output "unknown".
- Return ONLY a valid JSON array of scene objects. Do not include any markdown formatting, code blocks, or explanatory text. Do not summarise the scene. Do not omit any dialogue or action.

Each scene object has this shape:
{
  "sceneNumber": 1,
  "sceneHeading": "INT. CABIN - NIGHT (1946)",
  "location": "CABIN",
  "timeOfDay": "NIGHT",
  "rawText": "The entire verbatim text of the scene, including all action and dialogue, exactly as it appears in the script..."
}

If no scenes are found, return an empty array: []`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Content,
        },
      },
      { text: prompt },
    ])

    const textContent = result.response.text()
    if (!textContent) {
      return NextResponse.json({ error: "Empty response from AI model" }, { status: 500 })
    }

    let cleanedContent = textContent.trim()
    if (cleanedContent.startsWith("```json")) cleanedContent = cleanedContent.slice(7)
    else if (cleanedContent.startsWith("```")) cleanedContent = cleanedContent.slice(3)
    if (cleanedContent.endsWith("```")) cleanedContent = cleanedContent.slice(0, -3)
    cleanedContent = cleanedContent.trim()

    const parsed = JSON.parse(cleanedContent)
    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "AI did not return a JSON array of scenes" },
        { status: 502 }
      )
    }

    // Normalise (snake_case fallback) + add ids
    const scenes = parsed.map((s: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      sceneNumber:
        (typeof s.sceneNumber === "number" ? s.sceneNumber : undefined) ??
        (typeof s.scene_number === "number" ? s.scene_number : undefined) ??
        0,
      sceneHeading:
        (typeof s.sceneHeading === "string" ? s.sceneHeading : undefined) ??
        (typeof s.scene_heading === "string" ? s.scene_heading : undefined) ??
        "",
      location: (typeof s.location === "string" ? s.location : null) ?? null,
      timeOfDay:
        (typeof s.timeOfDay === "string" ? s.timeOfDay : undefined) ??
        (typeof s.time_of_day === "string" ? s.time_of_day : undefined) ??
        null,
      rawText:
        (typeof s.rawText === "string" ? s.rawText : undefined) ??
        (typeof s.raw_text === "string" ? s.raw_text : undefined) ??
        "",
    }))

    return NextResponse.json({ scenes })
  } catch (error) {
    console.error("Error analyzing scenes:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to analyze script: ${message}` }, { status: 500 })
  }
}
