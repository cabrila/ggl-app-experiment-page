import { Character } from "@/types/character-bible"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

/**
 * Export characters as JSON file
 */
export function exportCharactersAsJSON(characters: Character[], projectName: string) {
  const data = JSON.stringify(characters, null, 2)
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-characters.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Export characters as PDF file
 */
export function exportCharactersAsPDF(characters: Character[], projectName: string) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.setTextColor(16, 185, 129) // Emerald color
  doc.text(projectName, 14, 20)
  
  // Subtitle
  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text(`Character Bible - ${characters.length} characters`, 14, 28)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 34)
  
  // Table data - map new shape to export format
  const tableData = characters.map((char) => [
    char.name,
    char.profile?.castingProfile?.ageRange?.playingAge || "N/A",
    char.profile?.gender?.gender || "N/A",
    char.profile?.ethnicity || "N/A",
    char.alternateNames?.join(", ") || "-",
    char.profile?.castingNotes || char.profile?.background || "-",
  ])
  
  // Create table
  autoTable(doc, {
    startY: 42,
    head: [["Name", "Age", "Gender", "Ethnicity", "Aliases", "Notes"]],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [16, 185, 129], // Emerald
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244], // Light emerald
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 15 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: "auto" },
    },
  })
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount} - GoGreenlight Character Bible`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }
  
  doc.save(`${projectName.toLowerCase().replace(/\s+/g, "-")}-characters.pdf`)
}

/**
 * Export characters as Excel file
 */
export function exportCharactersAsExcel(characters: Character[], projectName: string) {
  // Prepare data for Excel - map new shape to export format
  const excelData = characters.map((char) => ({
    "Name": char.name,
    "Aliases": char.alternateNames?.join(", ") || "",
    "Age": char.profile?.castingProfile?.ageRange?.playingAge || "",
    "Gender": char.profile?.gender?.gender || "",
    "Pronouns": char.profile?.gender?.genderPronoun || "",
    "Ethnicity": char.profile?.ethnicity || "",
    "Background": char.profile?.background || "",
    "Casting Notes": char.profile?.castingNotes || "",
    "Species": char.profile?.physicalCharacteristics?.species || "",
    "Hair Color": char.profile?.physicalCharacteristics?.hairColor || "",
    "Eye Color": char.profile?.physicalCharacteristics?.eyeColor || "",
    "Height": char.profile?.physicalCharacteristics?.height || "",
    "Identifier": char.identifier?.identifierValue || "",
  }))
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)
  
  // Set column widths
  ws["!cols"] = [
    { wch: 25 }, // Name
    { wch: 20 }, // Aliases
    { wch: 10 }, // Age
    { wch: 12 }, // Gender
    { wch: 12 }, // Pronouns
    { wch: 15 }, // Ethnicity
    { wch: 40 }, // Background
    { wch: 40 }, // Casting Notes
    { wch: 12 }, // Species
    { wch: 12 }, // Hair Color
    { wch: 12 }, // Eye Color
    { wch: 10 }, // Height
    { wch: 20 }, // Identifier
  ]
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Characters")
  
  // Save file
  XLSX.writeFile(wb, `${projectName.toLowerCase().replace(/\s+/g, "-")}-characters.xlsx`)
}
