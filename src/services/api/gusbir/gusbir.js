import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'
import { apiFetch } from '../http.js'

const getByNip = async (nip) => {
  const response = await apiFetch(
    `${APISettings.baseURL}administration/gusbir/${nip}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  );

  if (response.status !== 200) {
    throw response.status;
  }

  return response.json();
};



export const gusbir = {
  getByNip,
  ...CreateBaseApiService('administration/GusBir')
}