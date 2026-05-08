import { NextRequest } from "next/server"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskType: string; taskId: string }> }
) {
  const { taskId } = await params

  console.log("[v0] SSE proxy request for taskId:", taskId)

  try {
    // Open SSE stream from AI service
    const streamUrl = `${AI_SERVICE_URL}/tasks/${taskId}/stream`
    console.log("[v0] Fetching upstream SSE:", streamUrl)
    const upstream = await fetch(streamUrl, {
      headers: {
        Accept: "text/event-stream",
        // In production: "Authorization": `Bearer ${await getOidcToken()}`
      },
    })

    console.log("[v0] Upstream response status:", upstream.status, "ok:", upstream.ok, "hasBody:", !!upstream.body)

    if (!upstream.ok || !upstream.body) {
      console.log("[v0] Upstream stream unavailable, returning error event")
      return new Response(
        `event: error\ndata: ${JSON.stringify({ message: "Upstream stream unavailable" })}\n\n`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      )
    }

    // Proxy the stream directly to the browser
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error proxying SSE stream:", error)
    const message = error instanceof Error ? error.message : "Failed to connect to AI service"

    return new Response(
      `event: error\ndata: ${JSON.stringify({ message })}\n\n`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    )
  }
}

// Disable static generation for this route
export const dynamic = "force-dynamic"
