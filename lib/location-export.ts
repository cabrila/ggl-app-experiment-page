import { Location } from "@/types/location-scouting"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

/**
 * Export locations as JSON file
 */
export function exportLocationsAsJSON(locations: Location[], projectName: string) {
  const data = JSON.stringify(locations, null, 2)
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-locations.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Export locations as PDF file
 */
export function exportLocationsAsPDF(locations: Location[], projectName: string) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.setTextColor(245, 158, 11) // Amber color
  doc.text(projectName, 14, 20)
  
  // Subtitle
  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text(`Location List - ${locations.length} locations`, 14, 28)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 34)
  
  // Table data - including new Location Idea fields
  const tableData = locations.map((loc) => [
    loc.name,
    loc.type,
    loc.timeOfDay,
    loc.description || "-",
    loc.scoutingNotes || "-",
    loc.locationIdeaMapUrl || "-",
    loc.locationIdeaLink || "-",
  ])
  
  // Create table
  autoTable(doc, {
    startY: 42,
    head: [["Location Name", "Type", "Time", "Description", "Scouting Notes", "Map URL", "Reference Link"]],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [245, 158, 11], // Amber
      textColor: 0,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [255, 251, 235], // Light amber
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 12 },
      2: { cellWidth: 12 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
      5: { cellWidth: 35 },
      6: { cellWidth: 35 },
    },
  })
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount} - GoGreenlight Location Scout`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }
  
  doc.save(`${projectName.toLowerCase().replace(/\s+/g, "-")}-locations.pdf`)
}

/**
 * Export locations as Excel file
 */
export function exportLocationsAsExcel(locations: Location[], projectName: string) {
  // Prepare data for Excel - including new Location Idea fields
  const excelData = locations.map((loc) => ({
    "Location Name": loc.name,
    "Type": loc.type,
    "Time of Day": loc.timeOfDay,
    "Description": loc.description || "",
    "Scouting Notes": loc.scoutingNotes || "",
    "Location Idea - Map URL": loc.locationIdeaMapUrl || "",
    "Location Idea - Reference Link": loc.locationIdeaLink || "",
  }))
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)
  
  // Set column widths
  ws["!cols"] = [
    { wch: 30 }, // Location Name
    { wch: 10 }, // Type
    { wch: 15 }, // Time of Day
    { wch: 40 }, // Description
    { wch: 40 }, // Scouting Notes
    { wch: 50 }, // Location Idea - Map URL
    { wch: 50 }, // Location Idea - Reference Link
  ]
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Locations")
  
  // Save file
  XLSX.writeFile(wb, `${projectName.toLowerCase().replace(/\s+/g, "-")}-locations.xlsx`)
}
