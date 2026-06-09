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

const createInvoice = async (orderId) => {
  const response = await fetch(`${APISettings.baseURL}administration/invoice/CreateInvoice/` + orderId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  if (!response.ok) {
    let message = `Nie udało się wygenerować faktury (HTTP ${response.status})`
    try {
      const payload = await response.json()
      message = payload?.message || payload?.data?.message || message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  return response.json()
};

const getBulkInvoicePreview = async (storeId) => {
  const response = await fetch(`${APISettings.baseURL}administration/invoice/BulkInvoicePreview/${storeId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Nie udało się pobrać podglądu faktur (HTTP ${response.status})`)
  }

  const json = await response.json()
  return json.data ?? json
}

const createBulkInvoices = async (storeId, orderIds) => {
  const response = await fetch(`${APISettings.baseURL}administration/invoice/CreateBulkInvoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ storeId, orderIds }),
  })

  if (!response.ok) {
    let message = `Nie udało się wygenerować faktur (HTTP ${response.status})`
    try {
      const payload = await response.json()
      message = payload?.message || payload?.data?.message || message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  const json = await response.json()
  return json.data ?? json
}

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
  getBulkInvoicePreview,
  createBulkInvoices,
  getInvoicesThisMonth,
  ...CreateBaseApiService('administration/invoice')
}
