import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

    // Convert file to base64 for Gemini
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Content = buffer.toString("base64")

    // Determine mime type
    const mimeType = file.type || "application/pdf"

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `Analyze this screenplay/script document and extract all locations/settings. For each location, provide:
- name: The location name as it appears in scene headings (e.g., "COFFEE SHOP", "JOHN'S APARTMENT")
- type: Either "INT" (interior) or "EXT" (exterior) based on the scene heading
- timeOfDay: One of "DAY", "NIGHT", "DAWN", or "DUSK" based on the scene heading - use "DAY" as default if not specified
- description: A brief description of the location based on action lines and context in the script
- scoutingNotes: Suggestions for location scouting, including key visual elements, mood, or practical requirements

Return ONLY a valid JSON array of location objects. Do not include any markdown formatting, code blocks, or explanatory text. Example format:
[{"name":"COFFEE SHOP","type":"INT","timeOfDay":"DAY","description":"A cozy neighborhood cafe with exposed brick walls","scoutingNotes":"Need a location with natural lighting, space for 4-5 tables"}]

If no locations are found, return an empty array: []`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Content,
        },
      },
      { text: prompt },
    ])

    const response = result.response
    const textContent = response.text()

    if (!textContent) {
      return NextResponse.json({ error: "Empty response from AI model" }, { status: 500 })
    }

    // Parse the JSON response - clean up any markdown formatting
    let cleanedContent = textContent.trim()

    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7)
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3)
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3)
    }
    cleanedContent = cleanedContent.trim()

    const locations = JSON.parse(cleanedContent)

    // Add unique IDs to each location
    const locationsWithIds = locations.map((loc: Record<string, unknown>) => ({
      ...loc,
      id: crypto.randomUUID(),
    }))

    return NextResponse.json({ locations: locationsWithIds })
  } catch (error) {
    console.error("Error analyzing locations:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to analyze script: ${errorMessage}` }, { status: 500 })
  }
}
