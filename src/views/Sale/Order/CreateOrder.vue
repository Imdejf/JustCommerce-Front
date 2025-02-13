<script lang="ts" setup>
import { ref } from 'vue'
import CreateOrder from '/@/components/Page/Sale/Order/CreateOrder.vue'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'

const cookies = new Cookies()
const token = cookies.get('Authorization')
const decoded = jwt_decode(token)

const currentOrder = ref({
  storeId: cookies.get('dsStore'),
  languageId: '40beaea2-f6e4-4414-8a10-2570718f13aa',
  createdById: decoded.sub,
  customerId: decoded.sub,
  orderSourceType: 5,
  orderStatus: 100,
  deliveryMethod: null,
  paymentProvider: null,
  paymentTerm: 99,
  shippingFeeAmountNetto: 0,
  shippingFeeAmountGross: 0, // Nowe pole
  realShippingFeeAmountNetto: 0, // Nowe pole
  realShippingFeeAmountGross: 0, // Nowe pole
  subTotalGross: 0, // Nowe pole
  subTotal: 0, // Nowe pole
  totalGross: 0,
  useShippingAddressAsBillingAddress: false, // Nowe pole
  totalGross: 0,
  totalNetto: 0,
  isPaid: false,
  paymentOn: null, // Nowe pole
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
  products: [
    // {
    //   id: '', // UUID
    //   priceNetto: 0, // Nowe pole
    //   tax: 0, // Nowe pole
    //   producerPrice: 0, // Nowe pole
    //   quantity: 0, // Nowe pole
    //   shippingPrice: 0, // Nowe pole
    //   noteForProducer: '', // Nowe pole
    // },
  ],
  applyRules: false,
  orderNoteForClient: '',
  orderNoteForCustomer: '',
  orderNoteOnInvoice: '',
});
</script>

<template>
  <CreateOrder :order="currentOrder" :updated="false"/>
</template>
