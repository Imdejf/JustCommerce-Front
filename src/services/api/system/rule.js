import { CreateBaseApiService } from '../baseApi'

const addRule = (payload) =>
  fetch(`${APISettings.baseURL}administration/ProductOption`, {
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

const updateRule = (payload) =>
  fetch(`${APISettings.baseURL}administration/ProductOption`, {
    method: 'PUT',
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

const removeRule = (payload) =>
  fetch(`${APISettings.baseURL}administration/ProductOption`, {
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

export const rules = {
  addRule,
  updateRule,
  removeRule,
  ...CreateBaseApiService('administration/rule')
}
