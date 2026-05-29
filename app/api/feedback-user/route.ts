import { NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email } = body

    if (!email || email.trim().length === 0) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    const emailContent = `
<strong>New Feedback User Sign-up</strong>
<br><br>

<strong>Name:</strong> ${name || "Not provided"}<br>
<strong>Email:</strong> ${email}<br>
<br>
<em>This user has agreed to be contacted for feedback, interviews, and online workshops.</em>
    `.trim()

    const msg = {
      to: "contact@gogreenlight.ai",
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@gogreenlight.ai",
      subject: `FeedbackUser: ${name || email}`,
      html: emailContent,
    }

    await sgMail.send(msg)

    return NextResponse.json(
      { success: true, message: "Sign-up successful" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Feedback user sign-up error:", error)
    return NextResponse.json(
      {
        error: "Failed to sign up. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
