import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Api } from '/@/services/api'

type InvoiceListItem = {
  id: number
  number: string
  viewUrl: string
  buyerName: string
  buyerTaxNumber: string
}

type OrderInvoiceContext = {
  orderId: string
  companyName: string | null
  nip: string | null
  clientName: string
  orderTotal: number
}

export const useInvoiceStore = defineStore('invoice', () => {
  const isOpen = ref(false)
  const loading = ref(false)
  const orderContext = ref<OrderInvoiceContext | null>(null)

  const orderId = ref<string | null>(null)

  const invoices = ref<InvoiceListItem[]>([])
  const search = ref('')

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return invoices.value
    return invoices.value.filter((x) => {
      const n = (x.number ?? '').toLowerCase()
      const bn = (x.buyerName ?? '').toLowerCase()
      const nip = (x.buyerTaxNumber ?? '').toLowerCase()
      return n.includes(q) || bn.includes(q) || nip.includes(q)
    })
  })

const open = async (order: {
  id: string
  billingAddress: {
    companyName?: string
    nip?: string
    firstName: string
    lastName: string
  }
  orderTotal: number
}) => {
  orderContext.value = {
    orderId: order.id,
    companyName: order.billingAddress.companyName ?? null,
    nip: order.billingAddress.nip ?? null,
    clientName: `${order.billingAddress.firstName} ${order.billingAddress.lastName}`,
    orderTotal: order.orderTotal
  }

  isOpen.value = true

  if (invoices.value.length === 0) {
    await reload()
  }
}


const close = () => {
  isOpen.value = false
  search.value = ''
  orderContext.value = null
}

const reload = async () => {
  try {
    loading.value = true
    const res = await Api.invoices.getInvoicesThisMonth()
    const list = (res?.data ?? res ?? []) as any[]

    invoices.value = list.map(x => ({
      ...x,
      buyerTaxNumber: x.buyerTaxNumber
        ? x.buyerTaxNumber.replace(/\D/g, '')
        : ''
    }))
  } finally {
    loading.value = false
  }
}

  const select = (invoice: InvoiceListItem) => {
    return { orderId: orderId.value, invoice }
  }

return {
  isOpen,
  loading,
  orderContext,
  invoices,
  filtered,
  search,
  open,
  close,
  reload,
  select
}
})
