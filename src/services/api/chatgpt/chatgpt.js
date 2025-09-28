import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'


const generateProductData = (payload) =>
  fetch(`${APISettings.baseURL}administration/chatGpt/generateProductData`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  });

export const chatGpt = {
    generateProductData,
  ...CreateBaseApiService('administration/chatGpt')
}