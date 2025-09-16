import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const smartTable = (payload) =>
    fetch(`${APISettings.baseURL}administration/offer/smartTable`, {
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

export const getDetailById = async (offerId) => {
  const res = await fetch(`${APISettings.baseURL}administration/offer/${offerId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `GetOfferById failed (${res.status})`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? await res.json() : await res.text();
};

  
const createOffer = async (payload) => {
  const res = await fetch(`${APISettings.baseURL}administration/offer/CreateOffer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `CreateOffer failed (${res.status})`);
  }

  // jeśli backend zwraca 204 No Content
  if (res.status === 204) return null;

  // zwróć JSON lub tekst – w zależności od odpowiedzi
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? await res.json() : await res.text();
};

const updateOffer = async (payload) => {
  const res = await fetch(`${APISettings.baseURL}administration/offer/UpdateOffer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `UpdateOffer failed (${res.status})`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? await res.json() : await res.text();
};

const generateOrDownloadOffer = async (offerId) => {
  try {
    const response = await fetch(`${APISettings.baseURL}administration/offer/GenerateOffer/${offerId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Błąd podczas generowania oferty:", error);
    throw error;
  }
};


const changeOfferStatus = (payload) => {
  fetch(`${APISettings.baseURL}administration/offer/ChangeStatusOffer`, {
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
}

export const offers = {
    smartTable,
    getDetailById,
    createOffer,
    updateOffer,
    generateOrDownloadOffer,
    changeOfferStatus,
    ...CreateBaseApiService('administration/offer')
}