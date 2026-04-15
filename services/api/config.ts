// API Configuration
export const API_CONFIG = {
  CDMS_BASE_URL: ' https://eservices-uat.bil.bt/api/cdms',
  LMS_BASE_URL: ' https://eservices-uat.bil.bt/api/lms',
  ACCESS_TOKEN: 'rEwOrW10rgTC75dqY5zfQO0SGgJUcPQU8Ue6x7XuXftaE0V5DgVE8NVe4BFq',
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
}

// Helper function to get headers with auth token
export function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${API_CONFIG.ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()

export function getCachedData(key: string) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < API_CONFIG.CACHE_DURATION) {
    return cached.data
  }
  return null
}

export function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() })
}

// Delay utility for retry logic
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Retry fetch with exponential backoff
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = API_CONFIG.MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options)

    // If rate limited (429), retry with exponential backoff
    if (response.status === 429 && retries > 0) {
      const retryAfter = response.headers.get('Retry-After')
      const delayMs = retryAfter
        ? parseInt(retryAfter) * 1000
        : API_CONFIG.RETRY_DELAY * (API_CONFIG.MAX_RETRIES - retries + 1)

      console.warn(`Rate limited. Retrying after ${delayMs}ms... (${retries} retries left)`)
      await delay(delayMs)
      return fetchWithRetry(url, options, retries - 1)
    }

    return response
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch error. Retrying... (${retries} retries left)`)
      await delay(API_CONFIG.RETRY_DELAY)
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}
