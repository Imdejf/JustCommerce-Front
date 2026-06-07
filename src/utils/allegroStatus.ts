export const ALLEGRO_ORDER_STATUS_OPTIONS = [
  { value: 'READY_FOR_PROCESSING', label: 'Gotowe do realizacji' },
  { value: 'BOUGHT', label: 'Zakupione' },
  { value: 'FILLED_IN', label: 'W trakcie wypełniania' },
  { value: 'CANCELLED', label: 'Anulowane' }
] as const

export const ALLEGRO_FULFILLMENT_STATUS_OPTIONS = [
  { value: 'NEW', label: 'Nowe' },
  { value: 'PROCESSING', label: 'W realizacji' },
  { value: 'READY_FOR_SHIPMENT', label: 'Gotowe do wysłania' },
  { value: 'READY_FOR_PICKUP', label: 'Gotowe do odbioru' },
  { value: 'SENT', label: 'Wysłane' },
  { value: 'PICKED_UP', label: 'Odebrane' },
  { value: 'SUSPENDED', label: 'Wstrzymane' },
  { value: 'RETURNED', label: 'Zwrócone' },
  { value: 'CANCELLED', label: 'Anulowane' }
] as const

const ORDER_STATUS_LABELS: Record<string, string> = {
  READY_FOR_PROCESSING: 'Gotowe do realizacji',
  BOUGHT: 'Zakupione',
  FILLED_IN: 'W trakcie wypełniania',
  CANCELLED: 'Anulowane'
}

const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  NEW: 'Nowe',
  PROCESSING: 'W realizacji',
  READY_FOR_SHIPMENT: 'Gotowe do wysłania',
  READY_FOR_PICKUP: 'Gotowe do odbioru',
  SENT: 'Wysłane',
  PICKED_UP: 'Odebrane',
  SUSPENDED: 'Wstrzymane',
  RETURNED: 'Zwrócone',
  CANCELLED: 'Anulowane'
}

export const translateAllegroOrderStatus = (status?: string | null) => {
  if (!status) return '—'
  return ORDER_STATUS_LABELS[status] ?? status
}

export const translateAllegroFulfillmentStatus = (status?: string | null) => {
  if (!status) return '—'
  return FULFILLMENT_STATUS_LABELS[status] ?? status
}

export const allegroOrderStatusTone = (status?: string | null) => {
  switch (status) {
    case 'READY_FOR_PROCESSING': return 'ready'
    case 'BOUGHT':
    case 'FILLED_IN': return 'pending'
    case 'CANCELLED': return 'cancelled'
    default: return 'neutral'
  }
}

export const allegroFulfillmentStatusTone = (status?: string | null) => {
  switch (status) {
    case 'NEW': return 'new'
    case 'PROCESSING':
    case 'READY_FOR_SHIPMENT':
    case 'READY_FOR_PICKUP': return 'progress'
    case 'SENT':
    case 'PICKED_UP': return 'done'
    case 'SUSPENDED':
    case 'RETURNED': return 'warning'
    case 'CANCELLED': return 'cancelled'
    default: return 'neutral'
  }
}

export const paymentStatusTone = (status?: string | null) => {
  if (!status) return 'neutral'
  const lower = status.toLowerCase()
  if (lower.includes('pobrani')) return 'cod'
  if (lower.includes('opłac') || lower.includes('oplac')) return 'paid'
  if (lower.includes('anul')) return 'cancelled'
  if (lower.includes('oczek')) return 'pending'
  return 'neutral'
}
