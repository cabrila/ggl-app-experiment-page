import { CastingSubmission } from "@/types/public-casting"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

// Get all unique data field keys across all submissions
function getAllDataFieldKeys(submissions: CastingSubmission[]): string[] {
  const fieldKeys = new Set<string>()
  submissions.forEach((submission) => {
    Object.keys(submission.data).forEach((key) => {
      fieldKeys.add(key)
    })
  })
  return Array.from(fieldKeys)
}

// Format grade for display
function formatGrade(grade?: number): string {
  if (!grade || grade === 0) return "Ungraded"
  return `${grade}/10`
}

// Export submissions as JSON file
export function exportSubmissionsAsJSON(submissions: CastingSubmission[], fileName: string = "submissions") {
  const dataStr = JSON.stringify(submissions, null, 2)
  const blob = new Blob([dataStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.href = url
  link.download = `${fileName.replace(/\s+/g, "_")}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export submissions as PDF file
export function exportSubmissionsAsPDF(submissions: CastingSubmission[], fileName: string = "submissions") {
  const doc = new jsPDF({ orientation: "landscape" })
  
  // Add title
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text("Casting Submissions", 14, 20)
  
  // Add subtitle with date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28)
  doc.text(`Total Submissions: ${submissions.length}`, 14, 34)
  
  // Prepare table headers
  const headers = ["#", "Name", "Email", "Phone", "Age", "Playing Age", "Form", "Grade", "Submitted"]
  
  // Prepare table data
  const tableData = submissions.map((submission, index) => [
    (index + 1).toString(),
    submission.name || "-",
    submission.email || "-",
    submission.phone || "-",
    submission.age || "-",
    submission.playingAge || "-",
    submission.castingCallTitle || "-",
    formatGrade(submission.grade),
    new Date(submission.submittedAt).toLocaleDateString(),
  ])
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 42,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [139, 92, 246], // violet-500
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 243, 255], // violet-50
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 30 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { cellWidth: 12 },
      5: { cellWidth: 18 },
      6: { cellWidth: 35 },
      7: { cellWidth: 18 },
      8: { cellWidth: 22 },
    },
  })
  
  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }
  
  doc.save(`${fileName.replace(/\s+/g, "_")}.pdf`)
}

// Export submissions as Excel file
export function exportSubmissionsAsExcel(submissions: CastingSubmission[], fileName: string = "submissions") {
  // Get all unique data field keys
  const dataFieldKeys = getAllDataFieldKeys(submissions)
  
  // Prepare data for Excel
  const excelData = submissions.map((submission, index) => {
    const baseData: Record<string, string | number> = {
      "#": index + 1,
      "Name": submission.name || "",
      "Email": submission.email || "",
      "Phone": submission.phone || "",
      "Age": submission.age || "",
      "Playing Age": submission.playingAge || "",
      "Form": submission.castingCallTitle || "",
      "Grade": submission.grade || "",
      "Submitted": new Date(submission.submittedAt).toLocaleDateString(),
      "Headshot": submission.headshot || "",
      "Notes": submission.notes || "",
    }
    
    // Add all data fields
    dataFieldKeys.forEach((key) => {
      // Avoid duplicating standard fields
      if (!["name", "email", "phone", "age", "playingAge", "headshot", "notes"].includes(key.toLowerCase())) {
        baseData[key] = submission.data[key] || ""
      }
    })
    
    return baseData
  })
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)
  
  // Set column widths
  const colWidths = [
    { wch: 5 },   // #
    { wch: 25 },  // Name
    { wch: 30 },  // Email
    { wch: 15 },  // Phone
    { wch: 8 },   // Age
    { wch: 15 },  // Playing Age
    { wch: 25 },  // Form
    { wch: 8 },   // Grade
    { wch: 15 },  // Submitted
    { wch: 40 },  // Headshot
    { wch: 40 },  // Notes
  ]
  
  // Add widths for additional data fields
  const additionalWidths = dataFieldKeys.map(() => ({ wch: 20 }))
  
  ws["!cols"] = [...colWidths, ...additionalWidths]
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Submissions")
  
  // Generate and download file
  XLSX.writeFile(wb, `${fileName.replace(/\s+/g, "_")}.xlsx`)
}
