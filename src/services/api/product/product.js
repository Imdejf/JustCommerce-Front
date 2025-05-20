import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const smartTable = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/smartTable`, {
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

const getByNameOrCode = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/GetProductByNameOrCode`, {
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

const addOptionCombination = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/ProductOptionCombination`, {
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

const addOption = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/ProductOption`, {
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

const updateOption = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/ProductOption`, {
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

const removeOptionCombination = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/ProductOptionCombination`, {
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

const addAttributeValue = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/AttributeValue`, {
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

const updateAttributeValue = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/AttributeValue`, {
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

  const removeProduct = (productId) =>
    fetch(`${APISettings.baseURL}administration/product/` + productId, {
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
const updateCategory = (payload) =>
  fetch(`${APISettings.baseURL}administration/product/ProductCategory`, {
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
  smartTable,
  getByNameOrCode,
  addVariation,
  updateVariation,
  addOptionCombination,
  removeOptionCombination,
  addOption,
  removeProduct,
  updateOption,
  addAttributeValue,
  updateAttributeValue,
  updateCategory,
  ...CreateBaseApiService('administration/product')
}
