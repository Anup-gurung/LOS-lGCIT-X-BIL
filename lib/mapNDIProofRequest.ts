// utils/ndiDataMapper.ts

export interface NdiProofAttributes {
  "Full Name"?: string
  "Gender"?: string
  "Date of Birth"?: string
  "ID Type"?: string
  "ID Number"?: string
  "Citizenship"?: string
}

export interface verfiedCustomerData {
    fullName?: string
    applicantName?: string
    gender?: string
    dateOfBirth?: string
    identificationType?: string
    identificationNo?: string
    nationality?: string

    isVerified?: boolean
    verifiedFields?: string[]
}

/**
 * Format date to YYYY-MM-DD (safe for input[type=date])
 */
export function formatNdiDobToISO(dob?: string): string {
  if (!dob) return ""

  // Expected format from NDI: DD/MM/YYYY
  const [day, month, year] = dob.split("/")

  if (!day || !month || !year) return ""

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}
/**
 * Map NDI proof attributes → loan application form fields
 */
export function mapNdiDataToForm(
  ndiAttributes: NdiProofAttributes
): verfiedCustomerData {
  const mapped: verfiedCustomerData = {
    fullName: ndiAttributes["Full Name"] || '',
    applicantName: ndiAttributes["Full Name"] || "",
    gender: ndiAttributes["Gender"]?.toLowerCase()|| "",
    dateOfBirth: formatNdiDobToISO(ndiAttributes["Date of Birth"]),
    identificationType: ndiAttributes["ID Type"]?.toLowerCase() || "",
    identificationNo: ndiAttributes["ID Number"] || "",
    nationality: ndiAttributes["Citizenship"]?.toLowerCase() || "",

    isVerified: true,
  }

  // Mark fields as verified ONLY if NDI provided them
  mapped.verifiedFields = Object.entries(mapped)
    .filter(([_, value]) => value && value !== "")
    .map(([key]) => key)
console.log("Mapped NDI Data:", mapped);
  return mapped
}
