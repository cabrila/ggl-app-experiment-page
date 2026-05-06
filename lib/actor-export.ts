import { Actor } from "@/types/actor-list"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

// Get all unique custom field names across all actors
function getAllCustomFieldNames(actors: Actor[]): string[] {
  const fieldNames = new Set<string>()
  actors.forEach((actor) => {
    actor.customFields?.forEach((field) => {
      fieldNames.add(field.name)
    })
  })
  return Array.from(fieldNames)
}

// Get custom field value for an actor
function getCustomFieldValue(actor: Actor, fieldName: string): string {
  const field = actor.customFields?.find((f) => f.name === fieldName)
  return field?.value || ""
}

// Export actors as JSON file
export function exportActorsAsJSON(actors: Actor[], projectName: string) {
  const dataStr = JSON.stringify(actors, null, 2)
  const blob = new Blob([dataStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.href = url
  link.download = `${projectName.replace(/\s+/g, "_")}_actors.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export actors as PDF file
export function exportActorsAsPDF(actors: Actor[], projectName: string) {
  const doc = new jsPDF({ orientation: "landscape" })
  
  // Add title
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text(projectName, 14, 20)
  
  // Add subtitle with date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28)
  doc.text(`Total Actors: ${actors.length}`, 14, 34)
  
  // Get custom field names
  const customFieldNames = getAllCustomFieldNames(actors)
  
  // Prepare table headers
  const baseHeaders = ["#", "Name", "Age", "Playing Age", "Phone", "Email", "Media Material"]
  const headers = [...baseHeaders, ...customFieldNames, "Notes"]
  
  // Prepare table data
  const tableData = actors.map((actor, index) => {
    const baseData = [
      (index + 1).toString(),
      actor.name,
      actor.age?.toString() || "-",
      actor.playingAge || "-",
      actor.phone || "-",
      actor.email || "-",
      actor.mediaMaterial || "-",
    ]
    
    // Add custom field values
    const customFieldValues = customFieldNames.map((name) => getCustomFieldValue(actor, name) || "-")
    
    return [...baseData, ...customFieldValues, actor.notes || "-"]
  })
  
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
      fillColor: [56, 189, 248], // sky-400
      textColor: 0,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 249, 255], // sky-50
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 25 },
      2: { cellWidth: 12 },
      3: { cellWidth: 18 },
      4: { cellWidth: 22 },
      5: { cellWidth: 35 },
      6: { cellWidth: 35 },
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
  
  doc.save(`${projectName.replace(/\s+/g, "_")}_actors.pdf`)
}

// Export actors as Excel file
export function exportActorsAsExcel(actors: Actor[], projectName: string) {
  // Get custom field names
  const customFieldNames = getAllCustomFieldNames(actors)
  
  // Prepare data for Excel
  const excelData = actors.map((actor, index) => {
    const baseData: Record<string, string | number> = {
      "#": index + 1,
      "Name": actor.name,
      "Age": actor.age || "",
      "Playing Age": actor.playingAge || "",
      "Phone": actor.phone || "",
      "Email": actor.email || "",
      "Headshot URL": actor.headshotUrl || "",
      "Media Material": actor.mediaMaterial || "",
      "Notes": actor.notes || "",
    }
    
    // Add custom fields
    customFieldNames.forEach((fieldName) => {
      baseData[fieldName] = getCustomFieldValue(actor, fieldName)
    })
    
    return baseData
  })
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)
  
  // Set column widths
  const baseColWidths = [
    { wch: 5 },   // #
    { wch: 25 },  // Name
    { wch: 8 },   // Age
    { wch: 15 },  // Playing Age
    { wch: 15 },  // Phone
    { wch: 30 },  // Email
    { wch: 40 },  // Headshot URL
    { wch: 40 },  // Media Material
    { wch: 40 },  // Notes
  ]
  
  // Add widths for custom fields
  const customFieldWidths = customFieldNames.map(() => ({ wch: 20 }))
  
  ws["!cols"] = [...baseColWidths, ...customFieldWidths]
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Actors")
  
  // Generate and download file
  XLSX.writeFile(wb, `${projectName.replace(/\s+/g, "_")}_actors.xlsx`)
}
