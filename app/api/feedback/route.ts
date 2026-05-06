import { NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { heading, message, screenshotUrl } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    const emailContent = `
<strong>New Feedback Submission</strong>
<br><br>

${heading ? `<strong>Subject:</strong> ${heading}<br><br>` : ""}

<strong>Message:</strong><br>
${message.replace(/\n/g, "<br>")}
${screenshotUrl ? `<br><br><strong>Screenshot:</strong><br><img src="${screenshotUrl}" style="max-width: 500px; border: 1px solid #e5e7eb; border-radius: 8px;">` : ""}
    `.trim()

    const msg = {
      to: "support@gogreenlight.ai",
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@gogreenlight.ai",
      subject: `GoGreenlight Feedback${heading ? `: ${heading}` : ""}`,
      html: emailContent,
    }

    await sgMail.send(msg)

    return NextResponse.json(
      { success: true, message: "Feedback sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] SendGrid error:", error)
    return NextResponse.json(
      {
        error: "Failed to send feedback. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
