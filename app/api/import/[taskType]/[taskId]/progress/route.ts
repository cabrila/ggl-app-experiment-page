import { NextRequest } from "next/server"

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskType: string; taskId: string }> }
) {
  const { taskId } = await params
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send immediate keep-alive to establish connection
      controller.enqueue(encoder.encode(": connected\n\n"))

      // Start keep-alive interval while waiting for upstream
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"))
        } catch {
          // Stream may be closed
          clearInterval(keepAliveInterval)
        }
      }, 5000)

      try {
        const streamUrl = `${AI_SERVICE_URL}/tasks/${taskId}/stream`

        const upstream = await fetch(streamUrl, {
          headers: {
            Accept: "text/event-stream",
          },
        })

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
            console.log("[v0] SSE upstream closed for task:", taskId)
            controller.close()
            break
          }
          // Log raw upstream chunks so we can see exactly what the AI
          // service emits (event names, field names, etc.). Truncated to
          // keep server logs readable.
          try {
            const text = decoder.decode(value, { stream: true })
            console.log(
              "[v0] SSE upstream chunk:",
              text.length > 500 ? text.slice(0, 500) + "...[truncated]" : text,
            )
          } catch {
            // Ignore decode errors — still forward the bytes.
          }
          controller.enqueue(value)
        }
      } catch (error) {
        clearInterval(keepAliveInterval)
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
