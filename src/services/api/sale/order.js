import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const smartTable = (payload) =>
  fetch(`${APISettings.baseURL}administration/order/smartTable`, {
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

const getAvilableAddresses = (storeId) => {
  return new Promise((resolve, reject) => {
    const url = `${APISettings.baseURL}product/shoppingcart/GetAvilableAddresses?storeId=${storeId}`
    fetch(url, {
      method: 'GET',
      credentials: 'include'
    })
      .then(async function (response) {
        if (response.status != 200) {
          reject(response.status)
        } else {
          const json = await response.json()
          resolve(json.data)
        }
      })
      .catch((error) => {
        reject(error)
      })
  })
}

const changePaidStatus = (payload) => {
  fetch(`${APISettings.baseURL}administration/order/ChangePaidStatus`, {
    method: 'PUT',
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

const changeInvoiceStatus = (payload) => {
  fetch(`${APISettings.baseURL}administration/order/ChangeInvoiceStatus`, {
    method: 'PUT',
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

const changeOrderStatus = (payload) => {
  fetch(`${APISettings.baseURL}administration/order/ChangeOrderStatus`, {
    method: 'PUT',
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

const createOrder = async (payload) => {
  const res = await fetch(`${APISettings.baseURL}administration/order/CreateOrder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload, // np. { body: JSON.stringify(data) }
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `CreateOrder failed (${res.status})`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? await res.json() : await res.text();
};


const updateOrder = async (payload) => {
  const res = await fetch(`${APISettings.baseURL}administration/order/UpdateOrder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...payload, // np. { body: JSON.stringify(data) }
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `UpdateOrder failed (${res.status})`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? await res.json() : await res.text();
};


const getOrderById = async (orderId) => {
  const response = await fetch(`${APISettings.baseURL}administration/order/${orderId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status !== 200) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json(); // Zwraca obiekt JSON jako Promise
};

const uploadPurchaseInvoice = (payload) => {
  return fetch(`${APISettings.baseURL}administration/order/UploadPurchaseInvoice`, {
    method: 'PUT',
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

const uploadInvoice = (payload) => {
  return fetch(`${APISettings.baseURL}administration/order/UploadInvoice`, {
    method: 'PUT',
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

const removePurchaseInvoice = (payload) => {
  return fetch(`${APISettings.baseURL}administration/order/removePurchaseInvoice` , {
    method: 'DELETE',
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


export const orders = {
  smartTable,
  getAvilableAddresses,
  changePaidStatus,
  changeInvoiceStatus,
  changeOrderStatus,
  createOrder,
  updateOrder,
  getOrderById,
  uploadPurchaseInvoice,
  uploadInvoice,
  removePurchaseInvoice,
  ...CreateBaseApiService('administration/order')
}
