import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const getAllOrderShippingNotProcessed = (payload) =>
    fetch(`${APISettings.baseURL}administration/orderShipping`, {
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

const changeOrderedCourier = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/changeOrderedCourier`, {
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

const changeManufacturerOrderedDate = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/changeManufacturerOrderedDate`, {
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

const generateOrderToManufacturer = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/generateOrderToManufacturer`, {
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

const getByIdOrderShipping = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/GetByIdOrderShipping`, {
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

const changeShippingOrderState = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/changeShippingOrderState`, {
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

const changeOwnLabel = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/changeOwnLabel`, {
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

export const shipping = {
    getAllOrderShippingNotProcessed,
    changeOrderedCourier,
    changeOwnLabel,
    changeManufacturerOrderedDate,
    changeShippingOrderState,
    getByIdOrderShipping,
    generateOrderToManufacturer,
    ...CreateBaseApiService('administration/orderShipping')
}