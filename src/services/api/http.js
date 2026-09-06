import Cookies from 'universal-cookie'

const cookies = new Cookies()

export function getAuthToken() {
  return cookies.get('Authorization') || ''
}

export function buildAuthHeaders(extra = {}) {
  const headers =
    extra instanceof Headers
      ? Object.fromEntries(extra.entries())
      : { ...(extra || {}) }

  const token = getAuthToken()
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export function clearAuthAndRedirectToLogin() {
  cookies.remove('Authorization', { path: '/' })
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

/**
 * Authenticated fetch for admin API calls.
 * Attaches Bearer JWT from cookie and redirects to /login on 401.
 */
export async function apiFetch(url, config = {}) {
  const { headers: configHeaders, ...rest } = config

  const response = await fetch(url, {
    credentials: 'include',
    ...rest,
    headers: buildAuthHeaders(configHeaders)
  })

  if (response.status === 401) {
    clearAuthAndRedirectToLogin()
  }

  return response
}
