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

const getDetailById = async (offerId) => {
  try {
    const response = await fetch(`${APISettings.baseURL}administration/offer/${offerId}`, {
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

  
const createOffer = (payload) => {
  fetch(`${APISettings.baseURL}administration/offer/CreateOffer`, {
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

const updateOffer = (payload) => {
  fetch(`${APISettings.baseURL}administration/offer/UpdateOffer`, {
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



export const offers = {
    smartTable,
    getDetailById,
    createOffer,
    updateOffer,
    generateOrDownloadOffer,
    ...CreateBaseApiService('administration/offer')
}