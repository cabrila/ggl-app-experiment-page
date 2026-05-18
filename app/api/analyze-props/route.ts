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

    const prompt = `You are a film production expert specialising in script breakdown. Your task is to extract all props from the provided screenplay and map exactly where they are used and by whom.

Rules:
- A prop is an object a character handles, uses, or interacts with directly. Set dressing and costumes are out of scope.
- Instance vs. type: If a specific, unique object travels between scenes (e.g., a stolen briefcase, a hero's signature weapon), group all its appearances into a single entry. However, if characters interact with different physical objects of the same type in different locations, list them as separate prop entries.
- Evidence-based extraction: Categorise the prop based on what is explicitly stated OR strongly implied by context. If no text implies who is handling it, output "unknown".
- Dynamic categorisation: Use baseline categories (weapon, document, food_or_drink, personal_item, tool) when they fit, or use descriptive lowercase category names when they don't. If you truly cannot determine a category, use "unknown".
- Description: Write a concise physical description of the prop and its purpose. Do not invent details.
- The anchors: For every prop, log the exact Scene Heading it appears under, AND the exact name of the Character handling it in that scene.
- Traceability: Every scene appearance must include a verbatim quote from the text proving the prop was used or handled.
- Return ONLY a valid JSON array of prop objects. No markdown, no code blocks, no explanatory text.

Each prop object has this shape:
{
  "name": "Prop Name",
  "category": "weapon | document | food_or_drink | personal_item | tool | etc. | unknown",
  "description": "Concise physical description and context of the prop.",
  "sceneAppearances": [
    {
      "sceneHeading": "EXACT SCENE HEADING",
      "handledBy": "CHARACTER NAME or unknown",
      "citation": "Verbatim line proving this prop was used."
    }
  ]
}

If no props are found, return an empty array: []`

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
        { error: "AI did not return a JSON array of props" },
        { status: 502 }
      )
    }

    type RawAppearance = {
      sceneHeading?: unknown
      scene_heading?: unknown
      handledBy?: unknown
      handled_by?: unknown
      citation?: unknown
    }

    const props = parsed.map((p: Record<string, unknown>) => {
      const appearancesRaw = Array.isArray(p.sceneAppearances)
        ? (p.sceneAppearances as RawAppearance[])
        : Array.isArray(p.scene_appearances)
          ? (p.scene_appearances as RawAppearance[])
          : []

      const sceneAppearances = appearancesRaw.map((a) => ({
        sceneHeading:
          (typeof a.sceneHeading === "string" ? a.sceneHeading : undefined) ??
          (typeof a.scene_heading === "string" ? a.scene_heading : undefined) ??
          "",
        handledBy:
          (typeof a.handledBy === "string" ? a.handledBy : undefined) ??
          (typeof a.handled_by === "string" ? a.handled_by : undefined) ??
          "unknown",
        citation: typeof a.citation === "string" ? a.citation : "",
      }))

      return {
        id: crypto.randomUUID(),
        name: typeof p.name === "string" ? p.name : "",
        category: typeof p.category === "string" ? p.category : "unknown",
        description: typeof p.description === "string" ? p.description : "",
        sceneAppearances,
      }
    })

    return NextResponse.json({ props })
  } catch (error) {
    console.error("Error analyzing props:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to analyze script: ${message}` }, { status: 500 })
  }
}
