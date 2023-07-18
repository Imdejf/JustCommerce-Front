import { CreateBaseApiService } from '../baseApi'

const addVariation = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/ProductVariation`, {
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

const updateVariation = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/ProductVariation`, {
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

export const products = {
  addVariation,
  updateVariation,
  ...CreateBaseApiService('administration/product')
}
