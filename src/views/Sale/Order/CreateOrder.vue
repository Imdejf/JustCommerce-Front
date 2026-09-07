<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import CreateOrder from '/@/components/Page/Sale/Order/CreateOrder.vue'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'
import { Api } from '/@/services/api'
import { ElMessage } from 'element-plus'

const cookies = new Cookies()
const token = cookies.get('Authorization')
const decoded: any = token ? jwt_decode(token) : {}

const taxRate = 0.23
const toNumber = (v: any, def = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}
const route = useRoute()
const ready = ref(false)
const loading = ref(false)

const createEmptyOrder = () => ({
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
  shippingPrice: 0,
  shippingPriceGross: 0,
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

  products: [] as any[],
  transportIndividualPricing: false,
  orderNoteForClient: '',
  orderNoteForCustomer: '',
  orderNoteOnInvoice: '',
})

const currentOrder = ref(createEmptyOrder())

const prefillFromOffer = (o: any) => {
  currentOrder.value.storeId = o.storeId ?? currentOrder.value.storeId
  currentOrder.value.languageId = o.languageId ?? currentOrder.value.languageId
  currentOrder.value.deliveryMethod = o.deliveryMethod ?? 0
  currentOrder.value.paymentProvider = o.payment ?? 1
  currentOrder.value.paymentTerm =
    currentOrder.value.paymentProvider === 5 ? (o.paymentTerm ?? 99) : 99
  currentOrder.value.orderSourceType = 2

  const shippingNetto = toNumber(o.shippingPrice, 0)
  const shippingBrutto = toNumber(o.shippingPriceGross, 0)

  currentOrder.value.shippingFeeAmountNetto = shippingNetto
  currentOrder.value.shippingFeeAmountGross = shippingBrutto
  currentOrder.value.shippingPrice = shippingNetto
  currentOrder.value.shippingPriceGross = shippingBrutto
  currentOrder.value.realShippingFeeAmountNetto = shippingNetto
  currentOrder.value.realShippingFeeAmountGross = shippingBrutto
  currentOrder.value.transportIndividualPricing = !!o.transportIndividualPricing
  currentOrder.value.subTotal = toNumber(o.totalItemPrice, 0)
  currentOrder.value.subTotalGross = toNumber(o.totalItemPriceGross, 0)
  currentOrder.value.totalGross = toNumber(o.totalPriceGross, 0)
  currentOrder.value.totalNetto = toNumber(o.totalPrice, 0)

  currentOrder.value.orderNoteForClient = o.offerNote ?? ''
  currentOrder.value.orderNoteForCustomer = o.comment ?? ''
  currentOrder.value.orderNoteOnInvoice = ''

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

  currentOrder.value.shippingAddress = ship
    ? {
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
      }
    : { ...currentOrder.value.billingAddress }

  currentOrder.value.useShippingAddressAsBillingAddress = !ship

  currentOrder.value.products = (o.offerItems ?? []).map((it: any) => {
    const isCustom = !it.productId
    const priceNetto = toNumber(it.priceNetto)
    const totalPriceNetto =
      toNumber(it.totalPriceNetto) || toNumber(it.quantity, 1) * priceNetto
    const priceGross = toNumber(it.priceGross) || +(priceNetto * (1 + taxRate)).toFixed(2)
    const totalPriceGross =
      toNumber(it.totalPriceGross) || +(totalPriceNetto * (1 + taxRate)).toFixed(2)

    return {
      productId: isCustom ? null : it.productId,
      name: it.productName || '',
      sku: it.sku || '',
      brandId: it.brandId ?? null,
      quantity: toNumber(it.quantity, 1),
      priceNetto,
      priceGross,
      tax: toNumber(it.taxPercent ?? it.tax, 23) || 23,
      producerPriceNetto: toNumber(it.producerPriceNetto),
      totalPriceNetto,
      totalPriceGross,
      shippingPriceGross: 0,
      shippingRule: null,
      noteForProducer: ''
    }
  })
}

onMounted(async () => {
  const offerId = (route.params.id as string) || (route.params.offerId as string)
  if (!offerId) {
    ready.value = true
    return
  }

  loading.value = true
  try {
    const res = await Api.offers.getDetailById(offerId)
    const offer = res?.data ?? res
    if (offer) {
      prefillFromOffer(offer)
    } else {
      ElMessage.error('Nie udało się pobrać oferty')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać oferty')
  } finally {
    loading.value = false
    ready.value = true
  }
})
</script>

<template>
  <div v-if="loading" class="p-6">
    <el-skeleton animated>
      <template #template>
        <el-skeleton-item variant="h1" style="width: 40%; height: 40px; margin-bottom: 16px" />
        <el-skeleton-item variant="rect" style="width: 100%; height: 200px; border-radius: 18px" />
      </template>
    </el-skeleton>
  </div>
  <CreateOrder v-else-if="ready" :order="currentOrder" :updated="false" />
</template>
