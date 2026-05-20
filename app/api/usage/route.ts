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

  // 3. Forward to AI service (with a hard timeout so a hung upstream
  //    surfaces as a 504 instead of pulsing forever in the UI).
  const controller = new AbortController()
  const timeoutMs = 30_000
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  console.log("[usage] forwarding to", upstreamUrl)
  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })

    const text = await upstream.text()
    const ct = upstream.headers.get("content-type") || ""

    if (!upstream.ok) {
      // Bubble upstream error verbatim (per spec — don't swallow it).
      console.error("[usage] upstream", upstream.status, text.slice(0, 300))
      return new NextResponse(text || `AI service error: ${upstream.status}`, {
        status: upstream.status,
        headers: { "Content-Type": ct || "text/plain" },
      })
    }

    // Some misconfigured upstreams return 200 with HTML; reject early so
    // the client sees a clear error rather than a JSON parse later.
    if (!ct.includes("application/json")) {
      console.error("[usage] non-JSON 200 from upstream:", ct, text.slice(0, 300))
      return NextResponse.json(
        {
          error: `Upstream returned ${ct || "no content-type"} instead of JSON. First 300 chars: ${text.slice(0, 300)}`,
        },
        { status: 502 }
      )
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    const aborted = (err as Error)?.name === "AbortError"
    const message = aborted
      ? `Upstream timed out after ${timeoutMs / 1000}s (${upstreamUrl})`
      : err instanceof Error
        ? err.message
        : "Unknown error"
    console.error("[usage] proxy failed:", message)
    return NextResponse.json({ error: message }, { status: aborted ? 504 : 502 })
  } finally {
    clearTimeout(timer)
  }
}
