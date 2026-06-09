import { APISettings } from '../config.js'

const getLogs = (params = {}) => {
  const qs = new URLSearchParams()

  if (params.search) qs.set('search', params.search)
  if (params.orderId) qs.set('orderId', params.orderId)
  if (params.customerEmail) qs.set('customerEmail', params.customerEmail)
  if (params.deliveryStatus) qs.set('deliveryStatus', params.deliveryStatus)
  if (params.notificationType) qs.set('notificationType', params.notificationType)
  if (params.fromUtc) qs.set('fromUtc', params.fromUtc)
  if (params.toUtc) qs.set('toUtc', params.toUtc)
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('pageSize', String(params.pageSize))

  const url = `${APISettings.baseURL}administration/customer-notification?${qs.toString()}`

  return fetch(url, {
    method: 'GET',
    credentials: 'include'
  }).then((response) => {
    if (response.status !== 200) {
      throw response.status
    }
    return response.json()
  })
}

export const customerNotifications = {
  getLogs
}
