import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const smartTable = (payload) =>
  fetch(`${APISettings.baseURL}administration/user/smartTable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(function (response) {
    if (response.status != 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

export const users = {
  smartTable,
  ...CreateBaseApiService('administration/user')
}
