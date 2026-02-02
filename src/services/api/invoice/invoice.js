import { CreateBaseApiService } from '../baseApi'
import { APISettings } from '../config.js'

const sendInvoice = async (invoiceId) => {
  try {
    const response = await fetch(`${APISettings.baseURL}administration/invoice/SendInvoice/` + invoiceId, {
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

const getInvoicesThisMonth = async () => {
  const response = await fetch(`${APISettings.baseURL}administration/invoice/InvoiceThisMonth`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  const data = await response.json()
  return data
}

const createInvoice = (invoiceId) => {
  fetch(`${APISettings.baseURL}administration/invoice/CreateInvoice/` + invoiceId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  }).then(function (response) {
    if (response.status != 200) {
      throw response.status
    } else {
      return response.json()
    }
  })
};

const generateProforma = (orderId) => {
  return fetch(`${APISettings.baseURL}administration/invoice/GenerateProformaInvoice/` + orderId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return response.json()
  })
}

export const invoices = {
  createInvoice,
  sendInvoice,
  generateProforma,
  getInvoicesThisMonth,
  ...CreateBaseApiService('administration/invoice')
}
