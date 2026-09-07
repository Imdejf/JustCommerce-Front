import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

const base = `${APISettings.baseURL}administration`

async function parseJson(response) {
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `HTTP ${response.status}`)
  }
  const json = await response.json()
  return json.data ?? json
}

export const iamUsers = {
  list: async (search = '') => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    const qs = params.toString()
    return parseJson(await apiFetch(`${base}/users${qs ? `?${qs}` : ''}`, { method: 'GET' }))
  },
  get: async (id) =>
    parseJson(await apiFetch(`${base}/users/${id}`, { method: 'GET' })),
  create: async (payload) =>
    parseJson(
      await apiFetch(`${base}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    ),
  update: async (id, payload) =>
    parseJson(
      await apiFetch(`${base}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    ),
  remove: async (id) =>
    parseJson(await apiFetch(`${base}/users/${id}`, { method: 'DELETE' })),
  setPassword: async (id, newPassword) =>
    parseJson(
      await apiFetch(`${base}/users/${id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })
    ),
  sendPasswordReset: async (id) =>
    parseJson(
      await apiFetch(`${base}/users/${id}/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
    )
}

export const iamRoles = {
  list: async () => parseJson(await apiFetch(`${base}/roles`, { method: 'GET' })),
  getPermissions: async (role) =>
    parseJson(await apiFetch(`${base}/roles/${role}/permissions`, { method: 'GET' })),
  updatePermissions: async (role, permissionCodes) =>
    parseJson(
      await apiFetch(`${base}/roles/${role}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionCodes })
      })
    )
}

export const iamPermissions = {
  list: async () => parseJson(await apiFetch(`${base}/permissions`, { method: 'GET' })),
  create: async (payload) =>
    parseJson(
      await apiFetch(`${base}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    ),
  update: async (code, payload) =>
    parseJson(
      await apiFetch(`${base}/permissions/${encodeURIComponent(code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionCode: code,
          permissionName: payload.permissionName,
          description: payload.description,
          role: payload.role
        })
      })
    ),
  remove: async (code) =>
    parseJson(
      await apiFetch(`${base}/permissions/${encodeURIComponent(code)}`, {
        method: 'DELETE'
      })
    )
}
