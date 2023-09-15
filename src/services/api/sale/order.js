import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const smartTable = (payload) =>
  fetch(`${APISettings.baseURL}administration/order/smartTable`, {
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

const changePaidStatus = (payload) => {
  fetch(`${APISettings.baseURL}administration/order/ChangePaidStatus`, {
    method: 'PUT',
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
}

export const orders = {
  smartTable,
  changePaidStatus,
  ...CreateBaseApiService('administration/order')
}
