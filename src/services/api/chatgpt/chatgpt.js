import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const generateProductData = (payload) =>
  fetch(`${APISettings.baseURL}administration/chatGpt/generateProductData`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  })

const generateProductSection = (payload) =>
  fetch(`${APISettings.baseURL}administration/chatGpt/generateProductSection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

const generateProductPhoto = (payload) =>
  fetch(`${APISettings.baseURL}administration/chatGpt/generateProductPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

export const chatGpt = {
  generateProductData,
  generateProductSection,
  generateProductPhoto,
  ...CreateBaseApiService('administration/chatGpt')
}