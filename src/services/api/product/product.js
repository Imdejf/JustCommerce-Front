import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

const smartTable = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/product/smartTable`, {
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
  apiFetch(`${APISettings.baseURL}administration/product/GetProductByNameOrCode`, {
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
  apiFetch(`${APISettings.baseURL}administration/product/ProductVariation`, {
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
  apiFetch(`${APISettings.baseURL}administration/product/ProductVariation`, {
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
  apiFetch(`${APISettings.baseURL}administration/product/ProductOptionCombination`, {
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
  apiFetch(`${APISettings.baseURL}administration/product/ProductOption`, {
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
  apiFetch(`${APISettings.baseURL}administration/product/ProductOption`, {
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
  apiFetch(`${APISettings.baseURL}administration/product/ProductOptionCombination`, {
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

const isSuccessResponse = (status) => status >= 200 && status < 300

const addAttributeValue = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/product/AttributeValue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(function (response) {
    if (!isSuccessResponse(response.status)) {
      throw response.status
    } else {
      return response.json()
    }
  })

const removeAttributeValue = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/product/RemoveProductAttributeValue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(function (response) {
    if (!isSuccessResponse(response.status)) {
      throw response.status
    } else {
      return response.json()
    }
  })

const updateAttributeValue = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/product/AttributeValue`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...payload
  }).then(function (response) {
    if (!isSuccessResponse(response.status)) {
      throw response.status
    } else {
      return response.json()
    }
  })

  const removeProduct = (productId) =>
    apiFetch(`${APISettings.baseURL}administration/product/` + productId, {
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
  apiFetch(`${APISettings.baseURL}administration/product/ProductCategory`, {
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

const exportProductToExcel = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/product/exportProductToExcel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  });

  const importProductFromExcel = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/product/ImportProductFromExcel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(function (response) {
    if (!response.ok) {
      throw response.status
    } else {
      return response.json()
    }
  })

const updateQuickEdit = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/product/QuickEdit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(function (response) {
    if (!response.ok) {
      throw response.status
    }
    return response.json()
  })


  const addProductBlogItem = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/product/ProductBlogItem`, {
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

const removeProductBlogItem = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/product/ProductBlogItem`, {
    method: 'DELETE',
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

  const getProductBlogItem = (productId) =>
  apiFetch(`${APISettings.baseURL}administration/product/ProductBlogItem/${productId}`, {
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
  exportProductToExcel,
  importProductFromExcel,
  updateQuickEdit,
  removeAttributeValue,
  addProductBlogItem,
  removeProductBlogItem,
  getProductBlogItem,
  ...CreateBaseApiService('administration/product')
}
