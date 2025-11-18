// CDMS API Service
import { API_CONFIG, getAuthHeaders } from './config'

/**
 * Fetch marital status options
 */
export async function fetchMaritalStatus() {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/marital-status`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    
    console.log('Raw API Response:', result)
    console.log('Response type:', typeof result)
    console.log('Is Array:', Array.isArray(result))
    
    // Handle different response structures
    if (result && result.data && Array.isArray(result.data)) {
      console.log('Using result.data:', result.data)
      return result.data
    } else if (result && Array.isArray(result)) {
      console.log('Using result directly:', result)
      return result
    } else if (result && result.results && Array.isArray(result.results)) {
      console.log('Using result.results:', result.results)
      return result.results
    }
    
    console.warn('Unexpected API response structure:', result)
    return []
  } catch (error) {
    console.error('Error fetching marital status:', error)
    throw error
  }
}


/**
 * Fetch banks list
 */
export async function fetchBanks() {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/banks`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    
    console.log('Banks API Response:', result)
    
    // Handle different response structures
    if (result && result.data && Array.isArray(result.data)) {
      return result.data
    } else if (result && Array.isArray(result)) {
      return result
    } else if (result && result.results && Array.isArray(result.results)) {
      return result.results
    }
    
    // console.warn('Unexpected API response structure:', result)
    return []
  } catch (error) {
    // console.error('Error fetching banks:', error)
    throw error
  }
}

/**
 * Fetch nationality list
 */
export async function fetchNationality() {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/nationality`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    
    console.log('Nationality API Response:', result)
    
    // Handle different response structures
    if (result && result.data && Array.isArray(result.data)) {
      return result.data
    } else if (result && Array.isArray(result)) {
      return result
    } else if (result && result.results && Array.isArray(result.results)) {
      return result.results
    }
    
    console.warn('Unexpected API response structure:', result)
    return []
  } catch (error) {
    console.error('Error fetching nationality:', error)
    throw error
  }
}

/**
 * Fetch identification type list
 */
export async function fetchIdentificationType() {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/identification-type`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    
    console.log('Identification Type API Response:', result)
    
    // Handle different response structures
    if (result && result.data && Array.isArray(result.data)) {
      console.log('Using result.data:', result.data)
      return result.data
    } else if (result && Array.isArray(result)) {
      console.log('Using result directly:', result)
      return result
    } else if (result && result.results && Array.isArray(result.results)) {
      console.log('Using result.results:', result.results)
      return result.results
    }
    
    console.warn('Unexpected API response structure:', result)
    return []
  } catch (error) {
    console.error('Error fetching identification type:', error)
    throw error
  }
}

/**
 * Fetch country list
 */
export async function fetchCountry() {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/country`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    
    console.log('Country API Response:', result)
    
    // Handle different response structures
    if (result && result.data && Array.isArray(result.data)) {
      return result.data
    } else if (result && Array.isArray(result)) {
      return result
    } else if (result && result.results && Array.isArray(result.results)) {
      return result.results
    }
    
    console.warn('Unexpected API response structure:', result)
    return []
  } catch (error) {
    console.error('Error fetching country:', error)
    throw error
  }
}

/**
 * Fetch dzongkhag list
 */
export async function fetchDzongkhag() {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/dzongkhag`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    
    console.log('Dzongkhag API Response:', result)
    
    // Handle different response structures
    if (result && result.data && Array.isArray(result.data)) {
      return result.data
    } else if (result && Array.isArray(result)) {
      return result
    } else if (result && result.results && Array.isArray(result.results)) {
      return result.results
    }
    
    console.warn('Unexpected API response structure:', result)
    return []
  } catch (error) {
    console.error('Error fetching dzongkhag:', error)
    throw error
  }
}

/**
 * Fetch gewogs by dzongkhag code
 */
export async function fetchGewogsByDzongkhag(dzongkhagCode: string) {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/gewogs/by/dzongkhag/${dzongkhagCode}`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    
    console.log('Gewog API Response:', result)
    
    // Handle different response structures
    if (result && result.data && Array.isArray(result.data)) {
      return result.data
    } else if (result && Array.isArray(result)) {
      return result
    } else if (result && result.results && Array.isArray(result.results)) {
      return result.results
    }
    
    console.warn('Unexpected API response structure:', result)
    return []
  } catch (error) {
    console.error('Error fetching gewogs:', error)
    throw error
  }
}

/**
 * Fetch occupations list
 */
export async function fetchOccupations() {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/occupations`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    
    console.log('Occupations API Response:', result)
    
    // Handle different response structures
    if (result && result.data && Array.isArray(result.data)) {
      return result.data
    } else if (result && Array.isArray(result)) {
      return result
    } else if (result && result.results && Array.isArray(result.results)) {
      return result.results
    }
    
    console.warn('Unexpected API response structure:', result)
    return []
  } catch (error) {
    console.error('Error fetching occupations:', error)
    throw error
  }
}

/**
 * Fetch legal constitution (organizations) list
 */
export async function fetchLegalConstitution() {
  try {
    const response = await fetch(`${API_CONFIG.CDMS_BASE_URL}/legal-constitution`, {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    
    console.log('Legal Constitution API Response:', result)
    
    // Handle different response structures
    if (result && result.data && Array.isArray(result.data)) {
      return result.data
    } else if (result && Array.isArray(result)) {
      return result
    } else if (result && result.results && Array.isArray(result.results)) {
      return result.results
    }
    
    console.warn('Unexpected API response structure:', result)
    return []
  } catch (error) {
    console.error('Error fetching legal constitution:', error)
    throw error
  }
}

