import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const getAllOrderShippingNotProcessed = (payload) =>
    fetch(`${APISettings.baseURL}administration/orderShipping`, {
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

export const shipping = {
    getAllOrderShippingNotProcessed,
    ...CreateBaseApiService('administration/orderShipping')
}