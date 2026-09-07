<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import OfferForm from '/@/components/Page/Sale/Offer/OfferForm.vue'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'
import { Api } from '/@/services/api'
import { ElMessage } from 'element-plus'

const cookies = new Cookies()
const token = cookies.get('Authorization')
const decoded: any = jwt_decode(token)
const route = useRoute()
const loading = ref(false)

const getExpirationDate = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}

const createEmptyOffer = () => ({
  id: '',
  languageId: '40beaea2-f6e4-4414-8a10-2570718f13aa',
  storeId: cookies.get('dsStore'),
  createdById: decoded.UserId,
  createdOn: null,
  latestUpdatedOn: null,
  expirationTime: getExpirationDate(),
  sendToClientDate: null,
  offerNumber: 0,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  shippingPrice: 0,
  shippingPriceGross: 0,
  totalItemPrice: 0,
  totalItemPriceGross: 0,
  totalPrice: 0,
  totalPriceGross: 0,
  realizationTerm: '',
  offerNote: '',
  comment: '',
  sendToClient: false,
  useShippingAddressAsBillingAddress: true,
  deliveryMethod: 0,
  payment: 1,
  transportIndividualPricing: false,
  paymentTerm: 99,
  shippingAddress: {
    isCompany: false,
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    nip: '',
    phone: '',
    addressLine1: '',
    city: '',
    zipCode: '',
    stateOrProvinceId: '',
    countryId: '0b64292c-e249-4906-ab48-429441745899'
  },
  billingAddress: {
    isCompany: true,
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    nip: '',
    phone: '',
    addressLine1: '',
    city: '',
    zipCode: '',
    stateOrProvinceId: '',
    countryId: '0b64292c-e249-4906-ab48-429441745899'
  },
  products: [] as any[]
})

const currentOffer = ref(createEmptyOffer())
const ready = ref(false)

const mapOfferToForm = (data: any) => ({
  id: '',
  offerId: undefined,
  languageId: data.languageId,
  storeId: data.storeId ?? cookies.get('dsStore'),
  createdById: decoded.UserId,
  createdOn: null,
  latestUpdatedOn: null,
  expirationTime: getExpirationDate(),
  sendToClientDate: null,
  offerNumber: 0,
  customerName: data.customerName ?? '',
  customerEmail: data.customerEmail ?? '',
  customerPhone: data.customerPhone ?? '',
  shippingPrice: Number(data.shippingPrice ?? 0),
  shippingPriceGross: Number(data.shippingPriceGross ?? 0),
  totalItemPrice: Number(data.totalItemPrice ?? 0),
  totalItemPriceGross: Number(data.totalItemPriceGross ?? 0),
  totalPrice: Number(data.totalPrice ?? 0),
  totalPriceGross: Number(data.totalPriceGross ?? 0),
  realizationTerm: data.realizationTerm ?? '',
  offerNote: data.offerNote ?? '',
  comment: data.comment ?? '',
  sendToClient: false,
  useShippingAddressAsBillingAddress: data.billingAddressId === data.shippingAddressId,
  deliveryMethod: data.deliveryMethod ?? 0,
  payment: data.payment ?? 1,
  transportIndividualPricing: data.transportIndividualPricing ?? false,
  paymentTerm: data.paymentTerm ?? 99,
  billingAddress: {
    isCompany: data.billingAddress?.isCompany ?? false,
    firstName: data.billingAddress?.firstName ?? '',
    lastName: data.billingAddress?.lastName ?? '',
    email: data.billingAddress?.email ?? data.customerEmail ?? '',
    companyName: data.billingAddress?.companyName ?? '',
    nip: data.billingAddress?.nip ?? '',
    phone: data.billingAddress?.phone ?? data.customerPhone ?? '',
    addressLine1: data.billingAddress?.addressLine1 ?? '',
    city: data.billingAddress?.city ?? '',
    zipCode: data.billingAddress?.zipCode ?? '',
    stateOrProvinceId: '',
    countryId: '0b64292c-e249-4906-ab48-429441745899'
  },
  shippingAddress: {
    isCompany: data.shippingAddress?.isCompany ?? false,
    firstName: data.shippingAddress?.firstName ?? '',
    lastName: data.shippingAddress?.lastName ?? '',
    email: data.shippingAddress?.email ?? data.customerEmail ?? '',
    companyName: data.shippingAddress?.companyName ?? '',
    nip: data.shippingAddress?.nip ?? '',
    phone: data.shippingAddress?.phone ?? data.customerPhone ?? '',
    addressLine1: data.shippingAddress?.addressLine1 ?? '',
    city: data.shippingAddress?.city ?? '',
    zipCode: data.shippingAddress?.zipCode ?? '',
    stateOrProvinceId: '',
    countryId: '0b64292c-e249-4906-ab48-429441745899'
  },
  products: (data.offerItems ?? []).map((item: any) => ({
    productId: item.productId ?? null,
    brandId: item.brandId ?? null,
    sku: item.sku ?? '',
    slug: item.slug ?? '',
    name: item.productName ?? '',
    productImage: item.productImage ?? '',
    quantity: item.quantity ?? 1,
    identificationCode: item.identificationCode ?? '',
    taxAmount: item.taxAmount ?? 0,
    taxPercent: item.taxPercent ?? 23,
    startingPriceNetto: item.startingPriceNetto ?? item.producerPriceNetto ?? 0,
    priceNetto: item.priceNetto ?? 0,
    priceGross: item.priceGross ?? 0,
    tax: item.tax ?? item.taxPercent ?? 23,
    producerPriceNetto: item.producerPriceNetto ?? 0,
    totalPriceNetto: item.totalPriceNetto ?? 0,
    totalPriceGross: item.totalPriceGross ?? 0,
    shippingPriceGross: 0,
    shippingRule: null,
    offerItemAttributes: item.offerItemAttributes ?? []
  }))
})

onMounted(async () => {
  const copyFrom = route.query.copyFrom as string | undefined
  if (!copyFrom) {
    ready.value = true
    return
  }

  loading.value = true
  try {
    const result = await Api.offers.getDetailById(copyFrom)
    const data = result?.data ?? result
    if (!data) {
      ElMessage.error('Nie udało się pobrać oferty do skopiowania')
      ready.value = true
      return
    }
    currentOffer.value = mapOfferToForm(data)
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się skopiować oferty')
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
  <OfferForm v-else-if="ready" :offer="currentOffer" :updated="false" />
</template>
