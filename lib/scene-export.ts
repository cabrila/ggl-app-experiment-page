import { Scene } from "@/types/scene-list"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

function fileSafeName(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-")
}

export function exportScenesAsJSON(scenes: Scene[], projectName: string) {
  const data = JSON.stringify(scenes, null, 2)
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${fileSafeName(projectName)}-scenes.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportScenesAsPDF(scenes: Scene[], projectName: string) {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.setTextColor(56, 189, 248) // sky
  doc.text(projectName, 14, 20)

  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text(`Scene Breakdown - ${scenes.length} scenes`, 14, 28)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 34)

  const tableData = scenes.map((s) => [
    s.sceneNumber.toString(),
    s.sceneHeading,
    s.location,
    s.timeOfDay,
    s.notes || "-",
  ])

  autoTable(doc, {
    startY: 42,
    head: [["#", "Scene Heading", "Location", "Time", "Notes"]],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [56, 189, 248],
      textColor: 0,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [240, 249, 255] },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 60 },
      2: { cellWidth: 45 },
      3: { cellWidth: 22 },
      4: { cellWidth: 40 },
    },
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount} - GoGreenlight Scene Breakdown`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }

  doc.save(`${fileSafeName(projectName)}-scenes.pdf`)
}

export function exportScenesAsExcel(scenes: Scene[], projectName: string) {
  const excelData = scenes.map((s) => ({
    "#": s.sceneNumber,
    "Scene Heading": s.sceneHeading,
    Location: s.location,
    "Time of Day": s.timeOfDay,
    "Raw Text": s.rawText || "",
    Notes: s.notes || "",
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)
  ws["!cols"] = [
    { wch: 6 },
    { wch: 50 },
    { wch: 35 },
    { wch: 15 },
    { wch: 80 },
    { wch: 40 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, "Scenes")
  XLSX.writeFile(wb, `${fileSafeName(projectName)}-scenes.xlsx`)
}
