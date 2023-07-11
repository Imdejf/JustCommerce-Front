import { CreateBaseApiService } from '../baseApi'

export const products = {
  ...CreateBaseApiService('administration/product')
}
