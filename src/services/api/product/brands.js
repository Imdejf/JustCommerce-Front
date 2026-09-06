import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

// ===== Warehouses for Brand =====

const getAllWarehouseBrand = (storeId, config) => {
  const params = new URLSearchParams()
  params.append('storeId', storeId)

  return apiFetch(`${APISettings.baseURL}administration/Brand/Warehouse/GetAllWarehouseBrand?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    ...config
  }).then(function (response) {
    if (response.status != 200) {
      throw response.status
    } else {
      return response.json()
    }
  })
}

const getWarehouseBrandById = (warehouseId, config) =>
  apiFetch(`${APISettings.baseURL}administration/Brand/Warehouse/${warehouseId}`, {
    method: 'GET',
    credentials: 'include',
    ...config
  }).then(function (response) {
    if (response.status != 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

const createWarehouseBrand = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/Brand/Warehouse/CreateWarehouseBrand`, {
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

const updateWarehouseBrand = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/Brand/Warehouse/UpdateWarehouseBrand`, {
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

const removeWarehouseBrand = (id) =>
  apiFetch(`${APISettings.baseURL}administration/Brand/Warehouse/RemoveWarehouseBrand/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
    }).then(function (response) {
    if (response.status != 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

export const brands = {
  ...CreateBaseApiService('administration/Brand'),

  // warehouses endpoints
  getAllWarehouseBrand,
  getWarehouseBrandById,
  createWarehouseBrand,
  updateWarehouseBrand,
  removeWarehouseBrand
}
