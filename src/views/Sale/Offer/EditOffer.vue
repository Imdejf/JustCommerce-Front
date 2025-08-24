<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import OfferForm from '/@/components/Page/Sale/Offer/OfferForm.vue'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'
import { Api } from '/@/services/api'

const cookies = new Cookies()
const token = cookies.get('Authorization')
const decoded = jwt_decode(token)

const route = useRoute()
const offer = ref(null)

const getExpirationDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
};

const currentOffer = ref(null);

const getById = (slug: string) => {
  return Api.offers.getDetailById(slug)
}

onMounted(async () => {
  const slug = route.params.slug
  const result = await getById(slug)
  offer.value = result.data
  currentOffer.value = {
  offerId: result.data.id,
  languageId: result.data.languageId,
  storeId: result.data.storeId,
  createdById: result.data.createdById,
  updatedById: result.data.createdById,
  createdOn: result.data.createdOn,
  latestUpdatedOn: result.data.latestUpdatedOn,
  expirationTime: result.data.expirationTime,
  sendToClientDate: result.data.sendToClientDate,
  offerNumber: result.data.offerNumber,
  customerName: result.data.customerName,
  customerEmail: result.data.customerEmail,
  customerPhone: result.data.customerPhone,
  shippingPrice: result.data.shippingPrice,
  shippingPriceGross: result.data.shippingPriceGross,
  totalItemPrice: result.data.totalItemPrice,
  totalItemPriceGross: result.data.totalItemPriceGross,
  totalPrice: result.data.totalPrice,
  totalPriceGross: result.data.totalPriceGross,
  realizationTerm: result.data.realizationTerm,
  offerNote: result.data.offerNote,
  comment: result.data.comment,
  sendToClient: result.data.sendToClient,
  useShippingAddressAsBillingAddress: result.data.billingAddressId === result.data.shippingAddressId,
  deliveryMethod: result.data.deliveryMethod,
  payment: result.data.payment,
  transportIndividualPricing: result.data.transportIndividualPricing ?? false,
  paymentTerm: result.data.paymentTerm,
  billingAddress: {
    isCompany: result.data.billingAddress?.isCompany ?? false,
    firstName: result.data.billingAddress?.firstName ?? '',
    lastName: result.data.billingAddress?.lastName ?? '',
    email: result.data.billingAddress?.email ?? '',
    companyName: result.data.billingAddress?.companyName ?? '',
    nip: result.data.billingAddress?.nip ?? '',
    phone: result.data.billingAddress?.phone ?? '',
    addressLine1: result.data.billingAddress?.addressLine1 ?? '',
    city: result.data.billingAddress?.city ?? '',
    zipCode: result.data.billingAddress?.zipCode ?? '',
    stateOrProvinceId: '', // Dodaj jeśli masz w osobnym DTO
    countryId: '0b64292c-e249-4906-ab48-429441745899'
  },
  shippingAddress: {
    isCompany: result.data.shippingAddress?.isCompany ?? false,
    firstName: result.data.shippingAddress?.firstName ?? '',
    lastName: result.data.shippingAddress?.lastName ?? '',
    email: result.data.shippingAddress?.email ?? '',
    companyName: result.data.shippingAddress?.companyName ?? '',
    nip: result.data.shippingAddress?.nip ?? '',
    phone: result.data.shippingAddress?.phone ?? '',
    addressLine1: result.data.shippingAddress?.addressLine1 ?? '',
    city: result.data.shippingAddress?.city ?? '',
    zipCode: result.data.shippingAddress?.zipCode ?? '',
    stateOrProvinceId: '', // Dodaj jeśli masz w osobnym DTO
    countryId: '0b64292c-e249-4906-ab48-429441745899'
  },
  products: result.data.offerItems.map(item => ({
    id: item.id,
    productId: item.productId,
    brandId: item.brandId,
    sku: item.sku,
    slug: item.slug,
    name: item.productName,
    productImage: item.productImage,
    quantity: item.quantity,
    identificationCode: item.identificationCode,
    taxAmount: item.taxAmount,
    taxPercent: item.taxPercent,
    startingPriceNetto: item.startingPriceNetto,
    priceNetto: item.priceNetto,
    priceGross: item.priceGross,
    tax: item.tax,
    producerPriceNetto: item.producerPriceNetto,
    totalPriceNetto: item.totalPriceNetto,
    totalPriceGross: item.totalPriceGross,
    offerItemAttributes: item.offerItemAttributes
  }))
}
})
</script>
<template>
    <div v-if="currentOffer != null">
        <OfferForm :offer="currentOffer" :updated="true"/>
  </div>
</template>