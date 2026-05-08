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

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send immediate keep-alive to establish connection
      controller.enqueue(encoder.encode(": connected\n\n"))
      console.log("[v0] Sent initial keep-alive")

      // Start keep-alive interval while waiting for upstream
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"))
          console.log("[v0] Sent keep-alive ping")
        } catch {
          // Stream may be closed
          clearInterval(keepAliveInterval)
        }
      }, 5000)

      try {
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
          upstream.ok
        )

        clearInterval(keepAliveInterval)

        if (!upstream.ok || !upstream.body) {
          const errorEvent = `event: error\ndata: ${JSON.stringify({ message: "Upstream stream unavailable" })}\n\n`
          controller.enqueue(encoder.encode(errorEvent))
          controller.close()
          return
        }

        const reader = upstream.body.getReader()
        const decoder = new TextDecoder()

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
        clearInterval(keepAliveInterval)
        console.error("[v0] Stream error:", error)
        const message =
          error instanceof Error
            ? error.message
            : "Failed to connect to AI service"
        const errorEvent = `event: error\ndata: ${JSON.stringify({ message })}\n\n`
        controller.enqueue(encoder.encode(errorEvent))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

// Disable static generation for this route
export const dynamic = "force-dynamic"
