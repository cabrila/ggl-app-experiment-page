export interface TestActorData {
  name: string
  age: string
  playingAge: string
  contactNumber: string
  contactMail: string
  headshot: string
  expectedResult: "valid" | "invalid"
  expectedErrors?: string[]
}

export const testActorData: TestActorData[] = [
  // Valid entries with different headshot types
  {
    name: "John Doe",
    age: "28",
    playingAge: "25-30",
    contactNumber: "+1-555-0123",
    contactMail: "john.doe@email.com",
    headshot: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    expectedResult: "valid",
  },
  {
    name: "Jane Smith",
    age: "32",
    playingAge: "30-35",
    contactNumber: "+1-555-0124",
    contactMail: "jane.smith@email.com",
    headshot:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    expectedResult: "valid",
  },
  {
    name: "Mike Johnson",
    age: "24",
    playingAge: "20-25",
    contactNumber: "+1-555-0125",
    contactMail: "mike.johnson@email.com",
    headshot: "/path/to/local/headshot.jpg",
    expectedResult: "valid",
  },
  {
    name: "Sarah Wilson",
    age: "29",
    playingAge: "25-32",
    contactNumber: "+1-555-0126",
    contactMail: "sarah.wilson@email.com",
    headshot: "", // No headshot - should be valid
    expectedResult: "valid",
  },

  // Invalid entries
  {
    name: "", // Missing name
    age: "25",
    playingAge: "20-30",
    contactNumber: "+1-555-0127",
    contactMail: "invalid.email",
    headshot: "not-an-image-url",
    expectedResult: "invalid",
    expectedErrors: ["Name is required", "Invalid email format", "Invalid headshot URL or file path"],
  },
  {
    name: "Tom Brown",
    age: "not-a-number",
    playingAge: "25-30",
    contactNumber: "invalid-phone",
    contactMail: "tom.brown@email.com",
    headshot: "https://not-an-image.txt",
    expectedResult: "invalid",
    expectedErrors: ["Age must be a number", "Invalid phone number format", "Invalid headshot URL or file path"],
  },
]

export function generateTestCSV(): string {
  const headers = ["Name", "Age", "Playing Age", "Contact Number", "Contact Mail", "Headshot"]
  const rows = testActorData.map((actor) => [
    actor.name,
    actor.age,
    actor.playingAge,
    actor.contactNumber,
    actor.contactMail,
    actor.headshot,
  ])

  return [headers, ...rows].map((row) => row.join(",")).join("\n")
}

export function generateTestExcelData(): any[][] {
  const headers = ["Name", "Age", "Playing Age", "Contact Number", "Contact Mail", "Headshot"]
  const rows = testActorData.map((actor) => [
    actor.name,
    actor.age,
    actor.playingAge,
    actor.contactNumber,
    actor.contactMail,
    actor.headshot,
  ])

  return [headers, ...rows]
}

export async function downloadTestFiles() {
  // Download test CSV
  const csvContent = generateTestCSV()
  const csvBlob = new Blob([csvContent], { type: "text/csv" })
  const csvUrl = window.URL.createObjectURL(csvBlob)
  const csvLink = document.createElement("a")
  csvLink.href = csvUrl
  csvLink.download = "test_actors_with_headshots.csv"
  document.body.appendChild(csvLink)
  csvLink.click()
  document.body.removeChild(csvLink)
  window.URL.revokeObjectURL(csvUrl)

  // Download test Excel (if XLSX is available)
  try {
    const XLSX = await import("xlsx")
    const excelData = generateTestExcelData()
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Test Actors")

    // Use browser-compatible method to generate and download Excel file
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "test_actors_with_headshots.xlsx"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.warn("Could not generate Excel test file:", error)
  }
}
