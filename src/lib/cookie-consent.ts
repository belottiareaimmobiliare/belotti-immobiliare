export type CookieConsentStatus = 'accepted' | 'rejected' | 'custom'

export type CookiePreferences = {
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
  status: CookieConsentStatus
}

export const COOKIE_CONSENT_STORAGE_KEY = 'areaimmobiliare-cookie-preferences'
export const COOKIE_CONSENT_VERSION = 'v1'
export const COOKIE_CONSENT_MAX_AGE_DAYS = 180

export function getDefaultCookiePreferences(): CookiePreferences {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
    status: 'rejected',
  }
}

export function saveCookiePreferences(preferences: CookiePreferences) {
  if (typeof window === 'undefined') return

  const payload = {
    version: COOKIE_CONSENT_VERSION,
    preferences,
  }

  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify(payload)
  )
}

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as {
      version?: string
      preferences?: CookiePreferences
    }

    if (parsed.version !== COOKIE_CONSENT_VERSION || !parsed.preferences) {
      return null
    }

    return parsed.preferences
  } catch {
    return null
  }
}

export function clearCookiePreferences() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY)
}