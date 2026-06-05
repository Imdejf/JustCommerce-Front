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

const generateProductSeoFromCompetitor = (payload) =>
  fetch(`${APISettings.baseURL}administration/chatGpt/generateProductSeoFromCompetitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

const generateProductDescriptionVision = (payload) =>
  fetch(`${APISettings.baseURL}administration/chatGpt/generateProductDescriptionVision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

const generateProductDescriptionRewrite = (payload) =>
  fetch(`${APISettings.baseURL}administration/chatGpt/generateProductDescriptionRewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: payload.body
  })

const generateProductAttributesFromDescription = (payload) =>
  fetch(`${APISettings.baseURL}administration/chatGpt/generateProductAttributesFromDescription`, {
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