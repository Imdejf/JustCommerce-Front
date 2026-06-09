import { APISettings } from '../config.js'

const baseUrl = `${APISettings.baseURL}administration/allegro`

const request = async (url: string, config: RequestInit = {}) => {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(config.headers || {})
    },
    ...config
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Allegro API error (${res.status})`)
  }

  if (res.status === 204) return null

  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? await res.json() : await res.text()
}

// AUTH / ACCOUNT

const getAuthorizationUrl = (sandbox = false) =>
  request(`${baseUrl}/auth/url?sandbox=${sandbox}`, {
    method: 'GET'
  })

const refreshToken = () =>
  request(`${baseUrl}/auth/refresh`, {
    method: 'POST'
  })

const getAccount = () =>
  request(`${baseUrl}/account`, {
    method: 'GET'
  })

const getAccountStatus = () =>
  request(`${baseUrl}/account/status`, {
    method: 'GET'
  })

const disconnectAccount = () =>
  request(`${baseUrl}/account`, {
    method: 'DELETE'
  })

// CATEGORIES

const getCategories = (parentId?: string | null) => {
  const params = new URLSearchParams()

  if (parentId) {
    params.append('parentId', parentId)
  }

  const query = params.toString()

  return request(`${baseUrl}/categories${query ? `?${query}` : ''}`, {
    method: 'GET'
  })
}

const getCategoryParameters = (categoryId: string) =>
  request(`${baseUrl}/categories/${categoryId}/parameters`, {
    method: 'GET'
  })

// PRODUCT MAPPING

const getProductMapping = (productId: string) =>
  request(`${baseUrl}/products/${productId}/mapping`, {
    method: 'GET'
  })

const saveProductMapping = (productId: string, body: any) =>
  request(`${baseUrl}/products/${productId}/mapping`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })

const validateProductForAllegro = (productId: string) =>
  request(`${baseUrl}/products/${productId}/validate`, {
    method: 'POST'
  })

const getOfferPreview = (productId: string) =>
  request(`${baseUrl}/products/${productId}/offer-preview`, {
    method: 'GET'
  })

const publishProduct = (productId: string, body: any) =>
  request(`${baseUrl}/products/${productId}/publish`, {
    method: 'POST',
    body: JSON.stringify(body)
  })

// OFFERS

const getOffers = (
  status?: string | null,
  search?: string | null,
  page = 1,
  pageSize = 50
) => {
  const params = new URLSearchParams()

  if (status) params.append('status', status)
  if (search) params.append('search', search)

  params.append('page', page.toString())
  params.append('pageSize', pageSize.toString())

  return request(`${baseUrl}/offers?${params.toString()}`, {
    method: 'GET'
  })
}

const getOffer = (offerId: string) =>
  request(`${baseUrl}/offers/${offerId}`, {
    method: 'GET'
  })

const getOfferForEdit = (offerId: string) =>
  request(`${baseUrl}/offers/${offerId}/edit`, {
    method: 'GET'
  })

const updateOffer = (offerId: string, body: any) =>
  request(`${baseUrl}/offers/${offerId}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })

const updateOfferPrice = (offerId: string, price: number) =>
  request(`${baseUrl}/offers/${offerId}/price`, {
    method: 'PUT',
    body: JSON.stringify({ price })
  })

const updateOfferStock = (offerId: string, stock: number) =>
  request(`${baseUrl}/offers/${offerId}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ stock })
  })

const getLiveOffer = (offerId: string) =>
  request(`${baseUrl}/offers/${offerId}/live`, {
    method: 'GET'
  })

const getOfferOperationStatus = (offerId: string, operationId: string) =>
  request(`${baseUrl}/offers/${offerId}/operations/${operationId}`, {
    method: 'GET'
  })

const patchOffer = (offerId: string, body: any) =>
  request(`${baseUrl}/offers/${offerId}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })

const activateOffer = (offerId: string) =>
  request(`${baseUrl}/offers/${offerId}/activate`, {
    method: 'POST'
  })

const endOffer = (offerId: string) =>
  request(`${baseUrl}/offers/${offerId}/end`, {
    method: 'POST'
  })

const republishOffer = (offerId: string) =>
  request(`${baseUrl}/offers/${offerId}/republish`, {
    method: 'POST'
  })

const getPublicationCommandStatus = (commandId: string) =>
  request(`${baseUrl}/offers/publication-commands/${commandId}`, {
    method: 'GET'
  })

const getPublicationCommandTasks = (commandId: string) =>
  request(`${baseUrl}/offers/publication-commands/${commandId}/tasks`, {
    method: 'GET'
  })

const syncOffersFromAllegro = (publicationStatus?: string | null) => {
  const params = new URLSearchParams()

  if (publicationStatus) {
    params.append('publicationStatus', publicationStatus)
  }

  const query = params.toString()

  return request(`${baseUrl}/offers/sync-from-allegro${query ? `?${query}` : ''}`, {
    method: 'POST'
  })
}

// IMAGES

const syncProductImages = (productId: string) =>
  request(`${baseUrl}/products/${productId}/images/sync`, {
    method: 'POST'
  })

const getProductImages = (productId: string) =>
  request(`${baseUrl}/products/${productId}/images`, {
    method: 'GET'
  })

// ORDERS

const getOrderByLocalOrderId = (localOrderId: string) =>
  request(`${baseUrl}/orders/by-local-order/${localOrderId}`, {
    method: 'GET'
  })

const getOrderShipments = (checkoutFormId: string) =>
  request(`${baseUrl}/orders/${checkoutFormId}/shipments`, {
    method: 'GET'
  })

const addOrderShipment = (
  checkoutFormId: string,
  carrierId: string,
  waybill: string
) =>
  request(`${baseUrl}/orders/${checkoutFormId}/shipments`, {
    method: 'POST',
    body: JSON.stringify({
      carrierId,
      waybill
    })
  })

const updateOrderFulfillment = (
  checkoutFormId: string,
  status: string
) =>
  request(`${baseUrl}/orders/${checkoutFormId}/fulfillment`, {
    method: 'PUT',
    body: JSON.stringify({
      status
    })
  })

const getCarriers = () =>
  request(`${baseUrl}/orders/carriers`, {
    method: 'GET'
  })

const getOrderInvoices = (checkoutFormId: string) =>
  request(`${baseUrl}/orders/${checkoutFormId}/invoices`, {
    method: 'GET'
  })

const uploadOrderInvoiceFromLocalOrder = (checkoutFormId: string) =>
  request(`${baseUrl}/orders/${checkoutFormId}/invoices/upload-from-local-order`, {
    method: 'POST'
  })

const getLiveOrders = (
  status?: string | null,
  fulfillmentStatus?: string | null,
  from?: string | null,
  to?: string | null,
  limit = 50,
  offset = 0
) => {
  const params = new URLSearchParams()

  if (status) params.append('status', status)
  if (fulfillmentStatus) params.append('fulfillmentStatus', fulfillmentStatus)
  if (from) params.append('from', from)
  if (to) params.append('to', to)

  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  return request(`${baseUrl}/orders/live?${params.toString()}`, {
    method: 'GET'
  })
}

const importOrders = (body: any) =>
  request(`${baseUrl}/orders/import`, {
    method: 'POST',
    body: JSON.stringify(body)
  })

type ImportedOrdersFilters = {
  sandbox?: boolean | null
  status?: string | null
  fulfillmentStatus?: string | null
  search?: string | null
  page?: number
  pageSize?: number
  fromUtc?: string | null
  toUtc?: string | null
  hasLocalOrder?: boolean | null
  deliveryMethod?: string | null
  minTotal?: number | null
  maxTotal?: number | null
  minProfit?: number | null
  maxProfit?: number | null
  billingSynced?: boolean | null
}

const getImportedOrders = (filters: ImportedOrdersFilters = {}) => {
  const params = new URLSearchParams()
  const {
    sandbox = null,
    status = null,
    fulfillmentStatus = null,
    search = null,
    page = 1,
    pageSize = 50,
    fromUtc = null,
    toUtc = null,
    hasLocalOrder = null,
    deliveryMethod = null,
    minTotal = null,
    maxTotal = null,
    minProfit = null,
    maxProfit = null,
    billingSynced = null
  } = filters

  if (sandbox !== null && sandbox !== undefined) {
    params.append('sandbox', sandbox.toString())
  }

  if (status) params.append('status', status)
  if (fulfillmentStatus) params.append('fulfillmentStatus', fulfillmentStatus)
  if (search) params.append('search', search)
  if (fromUtc) params.append('fromUtc', fromUtc)
  if (toUtc) params.append('toUtc', toUtc)
  if (hasLocalOrder !== null && hasLocalOrder !== undefined) {
    params.append('hasLocalOrder', hasLocalOrder.toString())
  }
  if (deliveryMethod) params.append('deliveryMethod', deliveryMethod)
  if (minTotal !== null && minTotal !== undefined) params.append('minTotal', minTotal.toString())
  if (maxTotal !== null && maxTotal !== undefined) params.append('maxTotal', maxTotal.toString())
  if (minProfit !== null && minProfit !== undefined) params.append('minProfit', minProfit.toString())
  if (maxProfit !== null && maxProfit !== undefined) params.append('maxProfit', maxProfit.toString())
  if (billingSynced !== null && billingSynced !== undefined) {
    params.append('billingSynced', billingSynced.toString())
  }

  params.append('page', page.toString())
  params.append('pageSize', pageSize.toString())

  return request(`${baseUrl}/orders/imported?${params.toString()}`, {
    method: 'GET'
  })
}

const syncOrderBilling = (checkoutFormId: string, sandbox?: boolean | null) => {
  const params = new URLSearchParams()

  if (sandbox !== null && sandbox !== undefined) {
    params.append('sandbox', sandbox.toString())
  }

  const query = params.toString()

  return request(`${baseUrl}/orders/${checkoutFormId}/sync-billing${query ? `?${query}` : ''}`, {
    method: 'POST'
  })
}

const syncOrdersBilling = (body: any = {}) =>
  request(`${baseUrl}/orders/sync-billing`, {
    method: 'POST',
    body: JSON.stringify({
      sandbox: body.sandbox ?? null,
      fromUtc: body.fromUtc ?? null,
      toUtc: body.toUtc ?? null,
      page: body.page ?? 1,
      pageSize: body.pageSize ?? 50,
      onlyMissingBilling: body.onlyMissingBilling ?? true
    })
  })

const getImportedOrder = (checkoutFormId: string, sandbox?: boolean | null) => {
  const params = new URLSearchParams()

  if (sandbox !== null && sandbox !== undefined) {
    params.append('sandbox', sandbox.toString())
  }

  const query = params.toString()

  return request(`${baseUrl}/orders/imported/${checkoutFormId}${query ? `?${query}` : ''}`, {
    method: 'GET'
  })
}

const emptyGuid = '00000000-0000-0000-0000-000000000000'

const allegroDefaultStoreId = import.meta.env.VITE_ALLEGRO_DEFAULT_STORE_ID || emptyGuid
const allegroDefaultLanguageId = import.meta.env.VITE_ALLEGRO_DEFAULT_LANGUAGE_ID || emptyGuid
const allegroDefaultUserId = import.meta.env.VITE_ALLEGRO_DEFAULT_USER_ID || emptyGuid
const allegroDefaultCountryId = import.meta.env.VITE_ALLEGRO_DEFAULT_COUNTRY_ID || emptyGuid
const allegroDefaultStateProvinceId = import.meta.env.VITE_ALLEGRO_DEFAULT_STATE_PROVINCE_ID || emptyGuid

const getAllegroLocalOrderEnvDefaults = () => ({
  storeId: allegroDefaultStoreId,
  languageId: allegroDefaultLanguageId,
  userId: allegroDefaultUserId,
  countryId: allegroDefaultCountryId,
  stateProvinceId: allegroDefaultStateProvinceId,
})

const buildCreateLocalOrderBody = (settings?: any) => ({
  storeId: allegroDefaultStoreId,
  createdById: allegroDefaultUserId,
  defaultCustomerId: allegroDefaultUserId,
  defaultLanguageId: allegroDefaultLanguageId,
  defaultCountryId: allegroDefaultCountryId,
  defaultStateProvinceId: allegroDefaultStateProvinceId,
  deliveryMethod: settings?.defaultDeliveryMethod ?? 0,
  orderStatus: settings?.defaultOrderStatus > 0 ? settings.defaultOrderStatus : 1,
  paidPaymentStatus: settings?.defaultPaidPaymentStatus > 0 ? settings.defaultPaidPaymentStatus : 20,
  unpaidPaymentStatus: settings?.defaultUnpaidPaymentStatus > 0 ? settings.defaultUnpaidPaymentStatus : 10,
})

const createLocalOrder = (checkoutFormId: string, body: any) =>
  request(`${baseUrl}/orders/${checkoutFormId}/create-local-order`, {
    method: 'POST',
    body: JSON.stringify(body)
  })

// SETTINGS / SALE DATA

const searchCatalogProducts = (
  phrase: string,
  categoryId?: string | null,
  limit = 20,
  offset = 0
) => {
  const params = new URLSearchParams()

  params.append('phrase', phrase)

  if (categoryId) {
    params.append('categoryId', categoryId)
  }

  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  return request(`${baseUrl}/catalog/products?${params.toString()}`, {
    method: 'GET'
  })
}

const getSettings = () =>
  request(`${baseUrl}/settings`, {
    method: 'GET'
  })

const saveSettings = (body: any) =>
  request(`${baseUrl}/settings`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })

const runAutomation = () =>
  request(`${baseUrl}/automation/run`, {
    method: 'POST'
  })

const getReturnPolicies = () =>
  request(`${baseUrl}/sale/return-policies`, {
    method: 'GET'
  })

const getImpliedWarranties = () =>
  request(`${baseUrl}/sale/implied-warranties`, {
    method: 'GET'
  })

const getWarranties = () =>
  request(`${baseUrl}/sale/warranties`, {
    method: 'GET'
  })

const getDeliveryPriceLists = () =>
  request(`${baseUrl}/delivery/price-lists`, {
    method: 'GET'
  })


  const getResponsibleProducers = (limit = 1000, offset = 0) =>
  request(`${baseUrl}/sale/responsible-producers?limit=${limit}&offset=${offset}`, {
    method: 'GET'
  })

const getResponsiblePersons = (limit = 1000, offset = 0) =>
  request(`${baseUrl}/sale/responsible-persons?limit=${limit}&offset=${offset}`, {
    method: 'GET'
  })

const getAdditionalServicesGroups = () =>
  request(`${baseUrl}/sale/additional-services/groups`, {
    method: 'GET'
  })

const getTaxSettings = (
  categoryId: string,
  countryCode?: string | null
) => {
  const params = new URLSearchParams()

  params.append('category.id', categoryId)

  if (countryCode) {
    params.append('countryCode', countryCode)
  }

  return request(`${baseUrl}/sale/tax-settings?${params.toString()}`, {
    method: 'GET'
  })
}

const uploadImage = (base64File: string) =>
  request(`${baseUrl}/images/upload`, {
    method: 'POST',
    body: JSON.stringify({ base64File })
  })

const previewOfferFees = (body: any) =>
  request(`${baseUrl}/offers/preview/fees`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
  

export const allegro = {
  getAuthorizationUrl,
  refreshToken,
  getAccount,
  getAccountStatus,
  disconnectAccount,

  getCategories,
  getCategoryParameters,

  getProductMapping,
  saveProductMapping,
  validateProductForAllegro,
  getOfferPreview,
  publishProduct,

  getOffers,
  getOffer,
  getOfferForEdit,
  updateOffer,
  updateOfferPrice,
  updateOfferStock,

  syncProductImages,
  getProductImages,

  getLiveOrders,
  importOrders,
  getImportedOrders,
  getImportedOrder,
  syncOrderBilling,
  syncOrdersBilling,
  createLocalOrder,
  buildCreateLocalOrderBody,
  getAllegroLocalOrderEnvDefaults,

  getReturnPolicies,
  getImpliedWarranties,
  getWarranties,
  getDeliveryPriceLists,

  getLiveOffer,
  getOfferOperationStatus,
  patchOffer,
  activateOffer,
  endOffer,
  republishOffer,
  getPublicationCommandStatus,
  getPublicationCommandTasks,
  syncOffersFromAllegro,

  getOrderByLocalOrderId,
  getOrderShipments,
  addOrderShipment,
  updateOrderFulfillment,
  getCarriers,
  getOrderInvoices,
  uploadOrderInvoiceFromLocalOrder,

  searchCatalogProducts,
  getSettings,
  saveSettings,
  runAutomation,

  getResponsibleProducers,
  getResponsiblePersons,
  getAdditionalServicesGroups,
  getTaxSettings,
  previewOfferFees,
  uploadImage
}