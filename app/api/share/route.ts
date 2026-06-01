import { NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "")

type ToolType = "character-bible" | "location-overview" | "actor-list" | "prop-list" | "scene-list"

interface ShareRequest {
  from: string
  to: string
  subject: string
  message: string
  formats: {
    pdf: boolean
    json: boolean
    excel: boolean
  }
  toolType: ToolType
  projectName: string
  data: unknown
}

const toolLabels: Record<ToolType, string> = {
  "character-bible": "Character Bible",
  "location-overview": "Location Overview",
  "actor-list": "Actor List",
  "prop-list": "Prop List",
  "scene-list": "Scene List",
}

function fileSafeName(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-")
}

// Generate PDF buffer based on tool type
function generatePDF(toolType: ToolType, data: unknown, projectName: string): Buffer {
  const doc = new jsPDF()
  const items = data as Record<string, unknown>[]
  const toolLabel = toolLabels[toolType]

  // Title
  doc.setFontSize(20)
  doc.setTextColor(16, 185, 129)
  doc.text(projectName, 14, 20)

  // Subtitle
  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text(`${toolLabel} - ${items.length} items`, 14, 28)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 34)

  // Table data based on tool type
  let headers: string[] = []
  let tableData: string[][] = []

  switch (toolType) {
    case "character-bible":
      headers = ["Name", "Age", "Gender", "Aliases", "Scenes", "Description"]
      tableData = items.map((char) => [
        String(char.name || ""),
        String(char.ageRange || "-"),
        String(char.gender || "-"),
        Array.isArray(char.aliases) ? char.aliases.join(", ") : "-",
        String(Array.isArray(char.sceneAppearances) ? char.sceneAppearances.length : 0),
        String(char.description || "-"),
      ])
      break
    case "location-overview":
      headers = ["Location", "Type", "Time", "Description", "Notes"]
      tableData = items.map((loc) => [
        String(loc.name || ""),
        String(loc.type || "-"),
        String(loc.timeOfDay || "-"),
        String(loc.description || "-"),
        String(loc.scoutingNotes || "-"),
      ])
      break
    case "actor-list":
      headers = ["Name", "Age", "Playing Age", "Phone", "Email", "Notes"]
      tableData = items.map((actor) => [
        String(actor.name || ""),
        String(actor.age || "-"),
        String(actor.playingAge || "-"),
        String(actor.phone || "-"),
        String(actor.email || "-"),
        String(actor.notes || "-"),
      ])
      break
    case "prop-list":
      headers = ["Prop Name", "Category", "Description", "Appearances", "Notes"]
      tableData = items.map((prop) => [
        String(prop.name || ""),
        String(prop.category || "-"),
        String(prop.description || "-"),
        String(Array.isArray(prop.sceneAppearances) ? prop.sceneAppearances.length : 0),
        String(prop.notes || "-"),
      ])
      break
    case "scene-list":
      headers = ["#", "Scene Heading", "Location", "Time", "Notes"]
      tableData = items.map((scene) => [
        String(scene.sceneNumber || ""),
        String(scene.sceneHeading || ""),
        String(scene.location || "-"),
        String(scene.timeOfDay || "-"),
        String(scene.notes || "-"),
      ])
      break
  }

  autoTable(doc, {
    startY: 42,
    head: [headers],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [240, 253, 244] },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount} - GoGreenlight ${toolLabel}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }

  return Buffer.from(doc.output("arraybuffer"))
}

// Generate Excel buffer
function generateExcel(toolType: ToolType, data: unknown, projectName: string): Buffer {
  const items = data as Record<string, unknown>[]
  let excelData: Record<string, unknown>[] = []

  switch (toolType) {
    case "character-bible":
      excelData = items.map((char) => ({
        Name: char.name,
        Aliases: Array.isArray(char.aliases) ? char.aliases.join(", ") : "",
        "Age Range": char.ageRange || "",
        Gender: char.gender || "",
        Description: char.description || "",
        "Scene Count": Array.isArray(char.sceneAppearances) ? char.sceneAppearances.length : 0,
      }))
      break
    case "location-overview":
      excelData = items.map((loc) => ({
        "Location Name": loc.name,
        Type: loc.type,
        "Time of Day": loc.timeOfDay,
        Description: loc.description || "",
        "Scouting Notes": loc.scoutingNotes || "",
      }))
      break
    case "actor-list":
      excelData = items.map((actor) => ({
        Name: actor.name,
        Age: actor.age || "",
        "Playing Age": actor.playingAge || "",
        Phone: actor.phone || "",
        Email: actor.email || "",
        Notes: actor.notes || "",
      }))
      break
    case "prop-list":
      excelData = items.map((prop) => ({
        "Prop Name": prop.name,
        Category: prop.category,
        Description: prop.description || "",
        Appearances: Array.isArray(prop.sceneAppearances) ? prop.sceneAppearances.length : 0,
        Notes: prop.notes || "",
      }))
      break
    case "scene-list":
      excelData = items.map((scene) => ({
        "#": scene.sceneNumber,
        "Scene Heading": scene.sceneHeading,
        Location: scene.location,
        "Time of Day": scene.timeOfDay,
        Notes: scene.notes || "",
      }))
      break
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)
  XLSX.utils.book_append_sheet(wb, ws, toolLabels[toolType])

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }))
}

export async function POST(request: NextRequest) {
  try {
    const body: ShareRequest = await request.json()
    const { from, to, subject, message, formats, toolType, projectName, data } = body

    // Validation
    if (!from || !to || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!formats.pdf && !formats.json && !formats.excel) {
      return NextResponse.json({ error: "At least one format must be selected" }, { status: 400 })
    }

    const items = data as unknown[]
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // Build attachments
    const attachments: { content: string; filename: string; type: string }[] = []
    const safeName = fileSafeName(projectName)
    const toolSuffix = toolType.replace(/-/g, "-")

    if (formats.pdf) {
      const pdfBuffer = generatePDF(toolType, data, projectName)
      attachments.push({
        content: pdfBuffer.toString("base64"),
        filename: `${safeName}-${toolSuffix}.pdf`,
        type: "application/pdf",
      })
    }

    if (formats.json) {
      const jsonStr = JSON.stringify(data, null, 2)
      attachments.push({
        content: Buffer.from(jsonStr).toString("base64"),
        filename: `${safeName}-${toolSuffix}.json`,
        type: "application/json",
      })
    }

    if (formats.excel) {
      const excelBuffer = generateExcel(toolType, data, projectName)
      attachments.push({
        content: excelBuffer.toString("base64"),
        filename: `${safeName}-${toolSuffix}.xlsx`,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    }

    // Format email HTML
    const htmlMessage = `
      <div style="font-family: system-ui, -apple-system, sans-serif; color: #1f2937; max-width: 600px;">
        ${message.replace(/\n/g, "<br>")}
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af;">
          Shared via <a href="https://tools.gogreenlight.ai" style="color: #10b981;">GoGreenlight Tools</a>
        </p>
      </div>
    `.trim()

    // Send email with reply-to set to sender's email and BCC to GoGreenlight
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || "noreply@gogreenlight.ai",
        name: from, // Show sender's email as display name
      },
      replyTo: from, // When recipient clicks reply, it goes to the actual sender
      bcc: "contact@gogreenlight.ai",
      subject: `[Shared] ${subject}`,
      html: htmlMessage,
      attachments,
    }

    await sgMail.send(msg)

    return NextResponse.json({ success: true, message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Share email error:", error)
    return NextResponse.json(
      {
        error: "Failed to send email. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
