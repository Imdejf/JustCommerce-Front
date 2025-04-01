<script lang="ts" setup>
import { ref } from 'vue'
import OfferForm from '/@/components/Page/Sale/Offer/OfferForm.vue'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'

const cookies = new Cookies()
const token = cookies.get('Authorization')
const decoded = jwt_decode(token)

const getExpirationDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
};

const currentOffer = ref<Offer>({
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
  useShippingAddressAsBillingAddress: false,
  deliveryMethod: 0,
  payment: 1,
  transportIndividualPricing: false,
  paymentTerm: 99, // None
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
    countryId: '0b64292c-e249-4906-ab48-429441745899',
  },
  billingAddress: {
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
    countryId: '0b64292c-e249-4906-ab48-429441745899',
  },
  offerItems: [
    {
      productId: '',
      name: '',
      quantity: 0,
      priceNetto: 0,
      priceGross: 0,
      tax: 0,
      producerPriceNetto: 0,
      totalPriceNetto: 0,
      totalPriceGross: 0,
    },
  ]
});
</script>
<template>
<OfferForm :offer="currentOffer"/>
</template>