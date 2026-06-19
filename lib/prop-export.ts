import { Prop } from "@/types/prop-list"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

function fileSafeName(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-")
}

export function exportPropsAsJSON(props: Prop[], projectName: string) {
  const data = JSON.stringify(props, null, 2)
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${fileSafeName(projectName)}-props.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPropsAsPDF(props: Prop[], projectName: string) {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.setTextColor(244, 114, 182) // rose
  doc.text(projectName, 14, 20)

  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text(`Prop List - ${props.length} props`, 14, 28)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 34)

  const tableData = props.map((p) => [
    p.name,
    p.category,
    p.description || "-",
    p.sceneAppearances.length.toString(),
    p.notes || "-",
  ])

  autoTable(doc, {
    startY: 42,
    head: [["Prop Name", "Category", "Description", "Appearances", "Notes"]],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [244, 114, 182],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [253, 242, 248] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 60 },
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
      `Page ${i} of ${pageCount} - GoGreenlight Prop List`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }

  doc.save(`${fileSafeName(projectName)}-props.pdf`)
}

export function exportPropsAsExcel(props: Prop[], projectName: string) {
  const excelData = props.map((p) => ({
    "Prop Name": p.name,
    Category: p.category,
    Description: p.description || "",
    Appearances: p.sceneAppearances.length,
    "Scene Appearances": p.sceneAppearances
      .map((s) => `${s.sceneHeading} (${s.handledBy})`)
      .join(" | "),
    Notes: p.notes || "",
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)
  ws["!cols"] = [
    { wch: 30 },
    { wch: 18 },
    { wch: 50 },
    { wch: 12 },
    { wch: 60 },
    { wch: 40 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, "Props")
  XLSX.writeFile(wb, `${fileSafeName(projectName)}-props.xlsx`)
}
