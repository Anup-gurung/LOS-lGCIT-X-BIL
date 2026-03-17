// services/api.ts
import { API_CONFIG, getAuthHeaders, fetchWithRetry, getCachedData, setCachedData } from './config'

/**
 * Fetch all loan types
 * GET /api/lms/loantype-data
 * Response: { success: "success", data: { status: "...", message: "...", data: { loanType: [...] } } }
 */
export async function fetchLoanTypes() {
  const cacheKey = 'loanTypes'

  try {
    const cached = getCachedData(cacheKey)
    if (cached) return cached

    const response = await fetchWithRetry(
      `${API_CONFIG.LMS_BASE_URL}/loantype-data`,
      { headers: getAuthHeaders() }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch loan types: ${response.status}`)
    }

    const result = await response.json()
    console.log('fetchLoanTypes raw result:', result)

    // Correct path: result.data.data.loanType
    const loanTypeArray = result?.data?.data?.loanType
    if (Array.isArray(loanTypeArray) && loanTypeArray.length > 0) {
      setCachedData(cacheKey, loanTypeArray)
      return loanTypeArray
    }

    console.warn('Unexpected loan types response structure:', result)
    return []
  } catch (error) {
    console.error('Error fetching loan types:', error)
    const cached = getCachedData(cacheKey)
    return cached || []
  }
}

/**
 * Fetch loan sectors for a given loan type code (e.g., "005")
 * GET /api/lms/loansector-data/{loanTypeCode}
 * Response: { success: "success", data: { status: "...", message: "...", data: { loanSector: [...] } } }
 */
export async function fetchLoanSectors(loanTypeCode: string) {
  const cacheKey = `loanSectors_${loanTypeCode}`

  try {
    const cached = getCachedData(cacheKey)
    if (cached) return cached

    const response = await fetchWithRetry(
      `${API_CONFIG.LMS_BASE_URL}/loansector-data/${loanTypeCode}`,
      { headers: getAuthHeaders() }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch loan sectors: ${response.status}`)
    }

    const result = await response.json()
    console.log(`fetchLoanSectors(${loanTypeCode}) raw result:`, result)

    // Correct path: result.data.data.loanSector
    const sectorsArray = result?.data?.data?.loanSector
    if (Array.isArray(sectorsArray) && sectorsArray.length > 0) {
      setCachedData(cacheKey, sectorsArray)
      return sectorsArray
    }

    console.warn('Unexpected sectors response structure:', result)
    return []
  } catch (error) {
    console.error(`Error fetching loan sectors for code ${loanTypeCode}:`, error)
    const cached = getCachedData(cacheKey)
    return cached || []
  }
}

/**
 * Fetch loan sub‑sectors for a given sector ID (pk_id of sector)
 * GET /api/lms/loansubsector-data/{sectorId}
 * Response: { success: "success", data: { status: "...", message: "...", data: { loanSubSector: [...] } } }
 */
export async function fetchLoanSubSectors(sectorId: string | number) {
  const cacheKey = `loanSubSectors_${sectorId}`

  try {
    const cached = getCachedData(cacheKey)
    if (cached) return cached

    const response = await fetchWithRetry(
      `${API_CONFIG.LMS_BASE_URL}/loansubsector-data/${sectorId}`,
      { headers: getAuthHeaders() }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch loan sub‑sectors: ${response.status}`)
    }

    const result = await response.json()
    console.log(`fetchLoanSubSectors(${sectorId}) raw result:`, result)

    // Correct path: result.data.data.loanSubSector
    const subsArray = result?.data?.data?.loanSubSector
    if (Array.isArray(subsArray) && subsArray.length > 0) {
      setCachedData(cacheKey, subsArray)
      return subsArray
    }

    console.warn('Unexpected sub‑sectors response structure:', result)
    return []
  } catch (error) {
    console.error(`Error fetching sub‑sectors for sector ${sectorId}:`, error)
    const cached = getCachedData(cacheKey)
    return cached || []
  }
}

/**
 * Fetch loan sub‑sector categories for a given sub‑sector ID
 * GET /api/lms/loancatsector-data/{subSectorId}
 * Response: { success: "success", data: { status: "...", message: "...", data: { loanCatSector: [...] } } }
 */
export async function fetchLoanSubSectorCategories(subSectorId: string | number) {
  const cacheKey = `loanCategories_${subSectorId}`

  try {
    const cached = getCachedData(cacheKey)
    if (cached) return cached

    const response = await fetchWithRetry(
      `${API_CONFIG.LMS_BASE_URL}/loancatsector-data/${subSectorId}`,
      { headers: getAuthHeaders() }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch loan categories: ${response.status}`)
    }

    const result = await response.json()
    console.log(`fetchLoanCategories(${subSectorId}) raw result:`, result)

    // Correct path: result.data.data.loanCatSector
    const catsArray = result?.data?.data?.loanCatSector
    if (Array.isArray(catsArray) && catsArray.length > 0) {
      setCachedData(cacheKey, catsArray)
      return catsArray
    }

    console.warn('Unexpected categories response structure:', result)
    return []
  } catch (error) {
    console.error(`Error fetching categories for sub‑sector ${subSectorId}:`, error)
    const cached = getCachedData(cacheKey)
    return cached || []
  }
}

