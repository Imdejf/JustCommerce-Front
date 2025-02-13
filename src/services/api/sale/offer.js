import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const smartTable = (payload) =>
    fetch(`${APISettings.baseURL}administration/offer/smartTable`, {
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
  
const createOffer = (payload) => {
  fetch(`${APISettings.baseURL}administration/offer/CreateOffer`, {
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
}

export const offers = {
    smartTable,
    createOffer,
    ...CreateBaseApiService('administration/orderShipping')
}