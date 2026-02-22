import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const getAllOrderShippingNotProcessed = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const changeOrderedCourier = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/changeOrderedCourier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const generateOrderSelectedProductsToManufacturer = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/generateOrderSelectedProductsToManufacturer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const changeManufacturerOrderedDate = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/changeManufacturerOrderedDate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const generateOrderToManufacturer = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/generateOrderToManufacturer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

/**
 * ✅ NOWE: generuj pełne zamówienia tylko dla zaznaczonych orderów
 * Body: { storeId, brandId, orderIds: [] }
 */
const generateOrdersToManufacturerSelected = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/generateOrdersToManufacturerSelected`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const getByIdOrderShipping = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/GetByIdOrderShipping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const changeShippingOrderState = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/changeShippingOrderState`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const addLabelNumer = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/Shipment/AddLabelNumer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const changeOwnLabel = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/changeOwnLabel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const getLabelsZip = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/Shipment/GetLabel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then(async (response) => {
    if (response.status !== 200) throw response.status

    const blob = await response.blob()

    const disposition = response.headers.get('content-disposition')
    let fileName = 'labels.zip'

    if (disposition && disposition.includes('filename=')) {
      fileName = disposition.split('filename=')[1].replace(/"/g, '')
    }

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  })

const addShipment = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/Shipment/AddShipment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const printLabel = (shipmentId, userId) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/Shipment/${shipmentId}?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    credentials: 'include'
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const smartTableShipment = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/Shipment/SmartTable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const deleteShipment = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/Shipment/DeleteShipment`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const releaseShipments = (payload) =>
  fetch(`${APISettings.baseURL}administration/orderShipping/Shipment/ReleaseShipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })
  

export const shipping = {
  getAllOrderShippingNotProcessed,
  changeOrderedCourier,
  changeOwnLabel,
  changeManufacturerOrderedDate,
  changeShippingOrderState,
  getByIdOrderShipping,
  generateOrderToManufacturer,
  generateOrdersToManufacturerSelected,
  generateOrderSelectedProductsToManufacturer,
  addShipment,
  printLabel,
  addLabelNumer,
  getLabelsZip,
  smartTableShipment,
  deleteShipment,
  releaseShipments,
  ...CreateBaseApiService('administration/orderShipping')
}
