import { NextRequest, NextResponse } from "next/server"
import { verifyIdTokenFromRequest } from "@/lib/firebase-admin"

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  "https://gl-ai-service-dev-1021127710054.europe-west4.run.app"

/**
 * Polling endpoint used by `useImportJob` to track long-running extracts.
 *
 * Replaces the previous SSE proxy: the AI service now mirrors live
 * progress to the task document in Firestore on every milestone, so a
 * 2s poll of `GET /tasks/:taskId` is enough — and dramatically more
 * reliable than SSE across Vercel function timeouts, browser tab
 * sleep, and network blips.
 *
 * Mirrors the auth pattern used by /api/usage and the upload route:
 * verify the Firebase ID token from `Authorization: Bearer <token>`
 * and forward to the AI service. The response JSON is returned
 * verbatim — see TaskDocument shape in `useImportJob`.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskType: string; taskId: string }> }
) {
  const { taskId } = await params

  const verified = await verifyIdTokenFromRequest(request)
  if (!verified) {
    return NextResponse.json(
      { error: "Unauthorized — sign in required" },
      { status: 401 }
    )
  }

  try {
    const upstream = await fetch(`${AI_SERVICE_URL}/tasks/${taskId}`, {
      // Always hit the network — Firestore-mirrored progress can change
      // every couple seconds, and Next's default fetch cache would pin
      // the first response forever.
      cache: "no-store",
    })

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "")
      return NextResponse.json(
        {
          error: `Upstream task fetch failed: ${upstream.status}`,
          detail: text.slice(0, 500),
        },
        { status: upstream.status === 404 ? 404 : 502 }
      )
    }

    const body = await upstream.json()
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to reach AI service"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export const dynamic = "force-dynamic"
