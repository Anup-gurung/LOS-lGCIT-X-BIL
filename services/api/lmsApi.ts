// LMS API Service
import { CloudCog } from 'lucide-react'
import { API_CONFIG, getAuthHeaders, fetchWithRetry, getCachedData, setCachedData } from './config'

/**
 * Fetch loan data (sectors, sub-sectors, and loan types)
 * Implements caching and retry logic for rate limit handling
 */
export async function fetchLoanData() {
  const cacheKey = 'loantype-data'
  
  try {
    // Check cache first
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      return cachedData
    }
    
    // Fetch with retry logic
    const response = await fetchWithRetry(
      `${API_CONFIG.LMS_BASE_URL}/loantype-data`,
      { headers: getAuthHeaders() }
    )
    
    if (!response.ok) {
      // Log response details for debugging
      console.error('LMS API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      })
      
      // Provide specific error messages for different status codes
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.')
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please check your access token.')
      } else if (response.status >= 500) {
        throw new Error(`Server error (${response.status}): ${response.statusText}. The LMS server may be down or experiencing issues.`)
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    // The API returns: { status: 'success', data: { loanType: [], loanSector: [] } }
    if (result && result.data) {
      // Cache successful response
      setCachedData(cacheKey, result.data)
      return result.data
    }
    
    console.warn('Unexpected API response structure:', result)
    return { loanType: [], loanSector: [] }
  } catch (error) {
    console.error('Error fetching loan data:', error)
    console.error('API URL:', `${API_CONFIG.LMS_BASE_URL}/loan-data`)
    
    // Try to return cached data even if expired
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.warn('Returning cached data due to API error')
      return cachedData
    }
    
    console.warn('No cached data available, returning empty data')
    return { loanType: [], loanSector: [] }
    
  }
}

export async function fetchLoanTypeDetails(loanTypeCode: string) {
  const cacheKey = `loan-type-details-${loanTypeCode}`

  try {
    const cachedData = getCachedData(cacheKey)
    if (cachedData) return cachedData

    const response = await fetchWithRetry(
      `${API_CONFIG.LMS_BASE_URL}/loantype-details-data/${loanTypeCode}`,
      { headers: getAuthHeaders() }
    )

    if (!response.ok) {
      console.error("Loan Type Details API Error:", {
        status: response.status,
        statusText: response.statusText,
      })

      throw new Error(`Failed to fetch loan type details (${response.status})`)
    }

    const result = await response.json()

    if (result?.data) {
      setCachedData(cacheKey, result.data)
      return result.data
    }

    return null
  } catch (error) {
    console.error("Error fetching loan type details:", error)

    const cachedData = getCachedData(cacheKey)
    if (cachedData) return cachedData

    return null
  }
}