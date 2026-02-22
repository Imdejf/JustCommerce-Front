import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const getAllShoppingCart = (payload) =>
  fetch(`${APISettings.baseURL}administration/Tracking/ShoppingCart`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const getAllTrackingUsers = (payload) =>
  fetch(`${APISettings.baseURL}administration/Tracking/Users`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...payload
  }).then((response) => {
    if (response.status != 200) throw response.status
    return response.json()
  })

const getOnline = () =>
  fetch(`${APISettings.baseURL}administration/Tracking/online`, {
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