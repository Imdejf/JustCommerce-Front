import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const addBlogItemToCategory = (payload) =>
  fetch(`${APISettings.baseURL}administration/Category/AddBlogItemToCategory`, {
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
  fetch(`${APISettings.baseURL}administration/Category/removeBlogItemToCategory`, {
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



export const categories = {
  addBlogItemToCategory,
  removeBlogItemToCategory,
  ...CreateBaseApiService('administration/category')
}
