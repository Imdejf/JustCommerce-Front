import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

const addBlogItemToCategory = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/Category/AddBlogItemToCategory`, {
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

const removeBlogItemToCategory = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/Category/removeBlogItemToCategory`, {
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

  const getCategoryFaq = (
  categoryId =  '',
  pageSize = 50,
  pageNumber = 1,
  searchQuery = ''
) =>
  apiFetch(
    `${APISettings.baseURL}administration/categoryFaq?categoryId=${encodeURIComponent(categoryId)}&pageSize=${pageSize}&pageNumber=${pageNumber}&searchQuery=${encodeURIComponent(searchQuery)}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    }
  ).then(function (response) {
    if (response.status !== 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

const getCategoryFaqById = (categoryFaqId) =>
  apiFetch(`${APISettings.baseURL}administration/categoryFaq/${categoryFaqId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  }).then(function (response) {
    if (response.status !== 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

const getCategoryFaqByCategoryId = (categoryId) =>
  apiFetch(`${APISettings.baseURL}administration/categoryFaq/GetCategoryFaqByCategoryId/${categoryId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  }).then(function (response) {
    if (response.status !== 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

const createCategoryFaq = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/categoryFaq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (response.status !== 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

const updateCategoryFaq = (payload) =>
  apiFetch(`${APISettings.baseURL}administration/categoryFaq`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (response.status !== 200) {
      throw response.status
    } else {
      return response.json()
    }
  })

const deleteCategoryFaq = (id) =>
  apiFetch(`${APISettings.baseURL}administration/categoryFaq/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  }).then(function (response) {
    if (response.status !== 200) {
      throw response.status
    } else {
      return response.json()
    }
  })


export const categories = {
  addBlogItemToCategory,
  removeBlogItemToCategory,
  getCategoryFaq,
  getCategoryFaqById,
  getCategoryFaqByCategoryId,
  createCategoryFaq,
  updateCategoryFaq,
  deleteCategoryFaq,
  ...CreateBaseApiService('administration/category')
}
