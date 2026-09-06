import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

const removeRelated = (payload) =>
  apiFetch(`${APISettings.baseURL}${'administration/related'}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...payload
  }).then(function (response) {
    if (response.status != 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

export const productRelateds = {
  removeRelated,
  ...CreateBaseApiService('administration/related')
}
