import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const blogCateogryWithPost = (storeId) =>
  fetch(`${APISettings.baseURL}administration/BlogCategory/BlogCateogryWithPost/` + storeId, {
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


export const categoryBlogs = {
  blogCateogryWithPost,
  ...CreateBaseApiService('administration/blogCategory')
}
