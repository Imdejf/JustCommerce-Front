import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const getFaqByBlogItemId = (blogItemId) =>
  fetch(`${APISettings.baseURL}administration/blogItem/${blogItemId}/faq`, {
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
  fetch(`${APISettings.baseURL}administration/blogItem/faq`, {
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
  fetch(`${APISettings.baseURL}administration/blogItem/faq`, {
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
  fetch(`${APISettings.baseURL}administration/blogItem/faq`, {
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