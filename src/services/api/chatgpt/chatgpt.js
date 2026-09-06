import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

const generateProductData = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/chatGpt/generateProductData`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  })

const generateProductSection = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/chatGpt/generateProductSection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

const generateProductPhoto = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/chatGpt/generateProductPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

const generateProductSeoFromCompetitor = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/chatGpt/generateProductSeoFromCompetitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

const generateProductDescriptionVision = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/chatGpt/generateProductDescriptionVision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

const generateProductDescriptionRewrite = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/chatGpt/generateProductDescriptionRewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

const generateProductAttributesFromDescription = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/chatGpt/generateProductAttributesFromDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

export const chatGpt = {
  generateProductData,
  generateProductSection,
  generateProductPhoto,
  generateProductSeoFromCompetitor,
  generateProductAttributesFromDescription,
  generateProductDescriptionVision,
  generateProductDescriptionRewrite,
  ...CreateBaseApiService('administration/chatGpt')
}