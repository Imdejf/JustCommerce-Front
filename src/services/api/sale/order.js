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

const getAvilableAddresses = (storeId) => {
  return new Promise((resolve, reject) => {
    const url = `${APISettings.baseURL}product/shoppingcart/GetAvilableAddresses?storeId=${storeId}`
    fetch(url, {
      method: 'GET',
      credentials: 'include'
    })
      .then(async function (response) {
        if (response.status != 200) {
          reject(response.status)
        } else {
          const json = await response.json()
          resolve(json.data)
        }
      })
      .catch((error) => {
        reject(error)
      })
  })
}

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

const changeOrderStatus = (payload) => {
  fetch(`${APISettings.baseURL}administration/order/ChangeOrderStatus`, {
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

const createOrder = (payload) => {
  fetch(`${APISettings.baseURL}administration/order/CreateOrder`, {
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

export const orders = {
  smartTable,
  getAvilableAddresses,
  changePaidStatus,
  changeOrderStatus,
  createOrder,
  ...CreateBaseApiService('administration/order')
}
