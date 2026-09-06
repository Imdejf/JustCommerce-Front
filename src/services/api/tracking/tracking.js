import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

const getAllShoppingCart = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/Tracking/ShoppingCart`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const getAllTrackingUsers = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/Tracking/Users`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const getOnline = () =>
  apiFetch(`${APISettings.baseURL}administration/Tracking/online`, {
    method: 'GET',
    credentials: 'include'
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

export const tracking = {
  getAllShoppingCart,
  getAllTrackingUsers,
  getOnline,

  ...CreateBaseApiService('administration/tracking')
}