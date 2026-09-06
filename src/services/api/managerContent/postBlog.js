import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

const getFaqByBlogItemId = (blogItemId) =>
  apiFetch(`${APISettings.baseURL}administration/blogItem/${blogItemId}/faq`, {
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

const addFaq = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/blogItem/faq`, {
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

const updateFaq = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/blogItem/faq`, {
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

const removeFaq = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/blogItem/faq`, {
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

export const postBlogs = {
  ...CreateBaseApiService('administration/blogItem'),
  getFaqByBlogItemId,
  addFaq,
  updateFaq,
  removeFaq
}