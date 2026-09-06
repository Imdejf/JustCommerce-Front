import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

const exportToExcel = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/rule/ExportToExcel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(function (response) {
    if (!response.ok) {
      throw response.status
    }
    return response
  })

const importFromExcel = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/rule/ImportFromExcel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(function (response) {
    if (!response.ok) {
      throw response.status
    }
    return response.json()
  })

export const rules = {
  exportToExcel,
  importFromExcel,
  ...CreateBaseApiService('administration/rule')
}
