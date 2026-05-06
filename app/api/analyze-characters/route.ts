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

    const prompt = `Analyze this screenplay/script document and extract all characters. For each character, provide:
- name: The character's full name as it appears in the script
- age: Estimated age or age range (e.g., "30s", "mid-40s", "25") - use "Unknown" if not specified
- gender: The character's gender based on context - use "Unknown" if unclear
- ethnicity: The character's ethnicity if mentioned or implied - use "Not specified" if not mentioned
- scenes: Estimated number of scenes the character appears in
- castingNotes: Brief notes about the character's role, personality, or important traits for casting purposes

Return ONLY a valid JSON array of character objects. Do not include any markdown formatting, code blocks, or explanatory text. Example format:
[{"name":"John Smith","age":"30s","gender":"Male","ethnicity":"Not specified","scenes":15,"castingNotes":"Lead protagonist, determined and resourceful"}]

If no characters are found, return an empty array: []`

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

    const characters = JSON.parse(cleanedContent)

    // Add unique IDs to each character
    const charactersWithIds = characters.map((char: Record<string, unknown>) => ({
      ...char,
      id: crypto.randomUUID(),
    }))

    return NextResponse.json({ characters: charactersWithIds })
  } catch (error) {
    console.error("Error analyzing characters:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to analyze script: ${errorMessage}` }, { status: 500 })
  }
}
