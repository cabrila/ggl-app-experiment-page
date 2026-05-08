import { NextRequest } from "next/server"

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"

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
      },
    })

    console.log(
      "[v0] Upstream response status:",
      upstream.status,
      "ok:",
      upstream.ok,
      "hasBody:",
      !!upstream.body
    )

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

    // Transform stream to log what we receive
    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial comment to establish connection
        controller.enqueue(encoder.encode(": keep-alive\n\n"))
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              console.log("[v0] Upstream stream ended")
              controller.close()
              break
            }
            const chunk = decoder.decode(value, { stream: true })
            console.log("[v0] SSE chunk received:", chunk.substring(0, 500))
            controller.enqueue(value)
          }
        } catch (error) {
          console.error("[v0] Stream error:", error)
          controller.error(error)
        }
      },
      cancel() {
        reader.cancel()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error proxying SSE stream:", error)
    const message =
      error instanceof Error ? error.message : "Failed to connect to AI service"

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
