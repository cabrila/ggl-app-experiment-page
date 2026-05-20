import { NextRequest, NextResponse } from "next/server"
import { verifyIdTokenFromRequest, isInternalEmail } from "@/lib/firebase-admin"

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"

export async function GET(request: NextRequest) {
  // 1. Authenticate — must be a valid Firebase ID token...
  const user = await verifyIdTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ...belonging to a @gogreenlight.ai user.
  if (!isInternalEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 2. Pass through ?from / ?to if present.
  const url = new URL(request.url)
  const params = new URLSearchParams()
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  const qs = params.toString()
  const upstreamUrl = `${AI_SERVICE_URL}/usage${qs ? `?${qs}` : ""}`

  // 3. Forward to AI service.
  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const text = await upstream.text()

    if (!upstream.ok) {
      // Bubble upstream error verbatim (per spec — don't swallow it).
      return new NextResponse(text || `AI service error: ${upstream.status}`, {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("content-type") || "text/plain" },
      })
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[usage] proxy failed:", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
