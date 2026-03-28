import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

// custom GET (bo masz route z paramem)
const getByProductId = (productId) =>
  fetch(`${APISettings.baseURL}administration/product-faq/${productId}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  }).then(function (response) {
    if (response.status != 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

// custom DELETE (bo masz id w URL, nie w body)
const removeProductFaq = (productFaqId) =>
  fetch(`${APISettings.baseURL}administration/product-faq/${productFaqId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  }).then(function (response) {
    if (response.status != 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

export const productFaq = {
  ...CreateBaseApiService('administration/product-faq'),
  getByProductId,
  removeProductFaq
}