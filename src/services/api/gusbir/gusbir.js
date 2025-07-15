import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const getByNip = async (nip) => {
  const response = await fetch(
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