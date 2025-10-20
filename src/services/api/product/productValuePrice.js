// src/services/product/productValuePrice.js
import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const okJson = (response) => {
  if (response.status != 200) {
    throw response.status
  } else {
    return response.json()
  }
}

/** GET: lista progów dla danego produktu */
const getByProductId = (productId, includeInactive = true, config = {}) =>
  fetch(
    `${APISettings.baseURL}administration/ProductVolumePrice/GetProductVolumePriceByProductId/${productId}?includeInactive=${includeInactive}`,
    {
      method: 'GET',
      credentials: 'include',
      ...config
    }
  ).then(okJson)

/** POST: Add/ReplaceAll – body przekazujesz w payload.body (JSON.stringify(command)) */
const addOrReplace = (payload) =>
  fetch(`${APISettings.baseURL}administration/ProductVolumePrice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(okJson)

/** PUT: Edit pojedynczego progu – body w payload.body (JSON.stringify(command)) */
const editVolumePrice = (payload) =>
  fetch(`${APISettings.baseURL}administration/ProductVolumePrice`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(okJson)

/** DELETE: Soft-delete po Id w BODY (nie /{id}) – body w payload.body (JSON.stringify(command)) */
const removeVolumePrice = (payload) =>
  fetch(`${APISettings.baseURL}administration/ProductVolumePrice`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(okJson)

export const productValuePrice = {
  getByProductId,
  addOrReplace,
  editVolumePrice,
  removeVolumePrice,
  ...CreateBaseApiService('administration/ProductVolumePrice')
}
