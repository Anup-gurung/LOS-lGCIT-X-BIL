// CDMS API Service
import { API_CONFIG, getAuthHeaders, fetchWithRetry, getCachedData, setCachedData } from './config'

/**
 * Generic function to fetch CDMS data with caching and retry logic
 */
async function fetchCDMSData(endpoint: string, cacheKey: string) {
  try {
    // Check cache first
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log(`Returning cached ${cacheKey}`)
      return cachedData
    }
    
    // Fetch with retry logic
    const response = await fetchWithRetry(
      `${API_CONFIG.CDMS_BASE_URL}${endpoint}`,
      { headers: getAuthHeaders() }
    )
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again.')
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    // Handle different response structures
    let data = []
    if (result && result.data && Array.isArray(result.data)) {
      data = result.data
    } else if (result && Array.isArray(result)) {
      data = result
    } else if (result && result.results && Array.isArray(result.results)) {
      data = result.results
    }
    
    // Cache successful response
    if (data.length > 0) {
      setCachedData(cacheKey, data)
    }
    
    return data
  } catch (error) {
    console.error(`Error fetching ${cacheKey}:`, error)
    
    // Try to return cached data even if expired
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log(`API failed, returning cached ${cacheKey}`)
      return cachedData
    }
    
    return []
  }
}

/**
 * Fetch marital status options
 */
export async function fetchMaritalStatus() {
  return fetchCDMSData('/marital-status', 'marital-status')
}


/**
 * Fetch banks list
 */
export async function fetchBanks() {
  return fetchCDMSData('/banks', 'banks')
}

/**
 * Fetch nationality list
 */
export async function fetchNationality() {
  return fetchCDMSData('/nationality', 'nationality')
}

/**
 * Fetch identification type list
 */
export async function fetchIdentificationType() {
  return fetchCDMSData('/identification-type', 'identification-type')
}

/**
 * Fetch country list
 */
export async function fetchCountry() {
  return fetchCDMSData('/country', 'country')
}

/**
 * Fetch dzongkhag list
 */
export async function fetchDzongkhag() {
  return fetchCDMSData('/dzongkhag', 'dzongkhag')
}

/**
 * Fetch gewogs by dzongkhag code
 * Note: Not cached due to dynamic parameter
 */
export async function fetchGewogsByDzongkhag(dzongkhagCode: string) {
  const cacheKey = `gewogs-${dzongkhagCode}`
  return fetchCDMSData(`/gewogs/by/dzongkhag/${dzongkhagCode}`, cacheKey)
}

/**
 * Fetch occupations list
 */
export async function fetchOccupations() {
  return fetchCDMSData('/occupations', 'occupations')
}

/**
 * Fetch legal constitution (organizations) list
 */
export async function fetchLegalConstitution() {
  return fetchCDMSData('/legal-constitution', 'legal-constitution')
}

/**
 * Fetch PEP categories list
 */
export async function fetchPepCategory() {
  return fetchCDMSData('/pep-category', 'pep-category')
}

/**
 * Fetch PEP sub-categories by PEP category code
 * Note: Not cached due to dynamic parameter
 */
export async function fetchPepSubCategoryByCategory(pepCategoryCode: string) {
  const cacheKey = `pep-sub-category-${pepCategoryCode}`
  return fetchCDMSData(`/pep-sub-category/by/pep-category/${pepCategoryCode}`, cacheKey)
}

