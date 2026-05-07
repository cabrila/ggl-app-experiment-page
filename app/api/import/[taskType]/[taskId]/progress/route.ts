import { NextRequest } from "next/server"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskType: string; taskId: string }> }
) {
  const { taskId } = await params

  try {
    // Open SSE stream from AI service
    const upstream = await fetch(`${AI_SERVICE_URL}/tasks/${taskId}/stream`, {
      headers: {
        Accept: "text/event-stream",
        // In production: "Authorization": `Bearer ${await getOidcToken()}`
      },
    })

    if (!upstream.ok || !upstream.body) {
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
