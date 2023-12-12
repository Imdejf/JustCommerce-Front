import { CreateBaseApiService } from '../baseApi'

export const invoices = {
  ...CreateBaseApiService('administration/invoice')
}
