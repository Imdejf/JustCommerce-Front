import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'


const addRuleToProduct = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/ProductRule`, {
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

const removeProductFromRule = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/ProductRule`, {
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

export const productRules = {
  addRuleToProduct,
  removeProductFromRule,
    ...CreateBaseApiService('administration/product/ProductRule')
}
