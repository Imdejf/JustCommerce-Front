<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import CreateOrder from '/@/components/Page/Sale/Order/CreateOrder.vue'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'
import { Api } from '/@/services/api'

const cookies = new Cookies()
const token = cookies.get('Authorization')
const decoded: any = token ? jwt_decode(token) : {}

const taxRate = 0.23
const toNumber = (v: any, def = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}
const route = useRoute()

// Twój model zamówienia – zostaw jak masz, poniżej tylko inicjalizacja:
const currentOrder = ref<any>({
  storeId: cookies.get('dsStore'),
  languageId: '40beaea2-f6e4-4414-8a10-2570718f13aa',
  createdById: decoded?.UserId,
  customerId: decoded?.UserId,
  orderSourceType: 5,
  orderStatus: 100,
  deliveryMethod: 0,
  paymentProvider: 1,
  paymentTerm: 99,

  shippingFeeAmountNetto: 0,
  shippingFeeAmountGross: 0,
  realShippingFeeAmountNetto: 0,
  realShippingFeeAmountGross: 0,
  subTotal: 0,
  subTotalGross: 0,
  totalNetto: 0,
  totalGross: 0,

  useShippingAddressAsBillingAddress: false,
  isPaid: false,
  paymentOn: null,
  userId: null,

  billingAddress: {
    isCompany: false,
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    nip: '',
    phone: '',
    addressLine1: '',
    stateOrProvinceId: '',
    city: '',
    zipCode: '',
    stateProvinceId: '',
    countryId: '0b64292c-e249-4906-ab48-429441745899',
  },
  shippingAddress: {
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    nip: '',
    phone: '',
    addressLine1: '',
    stateOrProvinceId: '',
    city: '',
    zipCode: '',
    stateProvinceId: '',
    countryId: '0b64292c-e249-4906-ab48-429441745899',
  },

  products: [],
  orderNoteForClient: '',
  orderNoteForCustomer: '',
  orderNoteOnInvoice: '',
})

// Prefill z oferty -> zamówienie
const prefillFromOffer = (o: any) => {
  // Nagłówki / płatność / dostawa
  currentOrder.value.storeId        = o.storeId ?? currentOrder.value.storeId
  currentOrder.value.languageId     = o.languageId ?? currentOrder.value.languageId
  currentOrder.value.deliveryMethod = o.deliveryMethod ?? 0
  currentOrder.value.paymentProvider= o.payment ?? 1
  currentOrder.value.paymentTerm    = o.paymentTerm ?? 99

  // Summy (netto/brutto)
  currentOrder.value.shippingFeeAmountNetto      = toNumber(o.shippingPrice, 0)
  currentOrder.value.shippingFeeAmountGross      = toNumber(o.shippingPriceGross, 0)
  currentOrder.value.realShippingFeeAmountNetto  = currentOrder.value.shippingFeeAmountNetto
  currentOrder.value.realShippingFeeAmountGross  = currentOrder.value.shippingFeeAmountGross
  currentOrder.value.subTotal                    = toNumber(o.totalItemPrice, 0)
  currentOrder.value.subTotalGross               = toNumber(o.totalItemPriceGross, 0)
  currentOrder.value.totalGross                  = toNumber(o.totalPriceGross, 0)
  currentOrder.value.totalNetto                  = toNumber(o.totalPrice, 0)

  // Notatki
  currentOrder.value.orderNoteForClient   = o.offerNote ?? ''
  currentOrder.value.orderNoteForCustomer = o.comment ?? ''
  currentOrder.value.orderNoteOnInvoice   = '' // jeśli coś masz w ofercie, przypisz

  // Adresy
  const bill = o.billingAddress ?? {}
  const ship = o.shippingAddress ?? null

  currentOrder.value.billingAddress = {
    ...currentOrder.value.billingAddress,
    isCompany: bill.isCompany ?? false,
    firstName: bill.firstName ?? '',
    lastName: bill.lastName ?? '',
    email: bill.email ?? '',
    companyName: bill.companyName ?? '',
    nip: bill.nip ?? '',
    phone: bill.phone ?? '',
    addressLine1: bill.addressLine1 ?? '',
    city: bill.city ?? '',
    zipCode: bill.zipCode ?? ''
  }

  currentOrder.value.shippingAddress = ship ? {
    ...currentOrder.value.shippingAddress,
    firstName: ship.firstName ?? '',
    lastName: ship.lastName ?? '',
    email: ship.email ?? '',
    companyName: ship.companyName ?? '',
    nip: ship.nip ?? '',
    phone: ship.phone ?? '',
    addressLine1: ship.addressLine1 ?? '',
    city: ship.city ?? '',
    zipCode: ship.zipCode ?? ''
  } : { ...currentOrder.value.billingAddress }

  currentOrder.value.useShippingAddressAsBillingAddress = !ship

  // Pozycje – obsługa produktowych i custom (productId=null, customName/customSku/brandId)
  currentOrder.value.products = (o.offerItems ?? []).map((it: any) => {
  const isCustom = !it.productId
  const priceNetto      = toNumber(it.priceNetto)
  const totalPriceNetto = toNumber(it.totalPriceNetto) || toNumber(it.quantity, 1) * priceNetto
  const priceGross      = toNumber(it.priceGross) || +(priceNetto * (1 + taxRate)).toFixed(2)
  const totalPriceGross = toNumber(it.totalPriceGross) || +(totalPriceNetto * (1 + taxRate)).toFixed(2)

  return {
    // klucze oczekiwane przez ProductTable:
    productId: isCustom ? null : it.productId,
    name: isCustom ? (it.productName || '') : (it.productName || ''), // ProductTable czyta "name"
    sku: isCustom ? (it.sku || '') : (it.sku || ''),                  // ProductTable czyta "sku"
    brandId: isCustom ? (it.brandId ?? null) : (it.brandId ?? null),

    quantity: toNumber(it.quantity, 1),
    priceNetto,
    priceGross,
    tax: toNumber(it.taxPercent ?? it.tax, 23) || 23,                 // ProductTable używa "tax"
    producerPriceNetto: toNumber(it.producerPriceNetto),
    totalPriceNetto,
    totalPriceGross,

    // te dwa pola są używane w ProductTable
    shippingPriceGross: 0,    // dla customów możesz wpisać realny koszt jeśli masz
    shippingRule: null,

    noteForProducer: ''
  }
})

}

onMounted(async () => {
  // wspieramy oba warianty nazw parametru: :id lub :offerId
  const offerId = (route.params.id as string) || (route.params.offerId as string)
  if (!offerId) return

  // pobierz ofertę
  const res =   await Api.offers.getDetailById(offerId)
  const offer = res?.data ?? res
  if (offer) prefillFromOffer(offer)
})
</script>

<template>
  <CreateOrder :order="currentOrder" :updated="false" />
</template>

