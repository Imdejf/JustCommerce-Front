import { CreateBaseApiService } from './baseApi'

export const stores = {
  ...CreateBaseApiService('administration/store')
}
