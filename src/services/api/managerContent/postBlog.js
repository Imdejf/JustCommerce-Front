import { CreateBaseApiService } from '../baseApi'

export const postBlogs = {
  ...CreateBaseApiService('administration/blogItem')
}
