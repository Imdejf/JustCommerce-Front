<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import OfferForm from '/@/components/Page/Sale/Offer/OfferForm.vue'
import { Api } from '/@/services/api'

const route = useRoute()
const loading = ref(true)
const currentOffer = ref<any>(null)

onMounted(async () => {
  try {
    const slug = route.params.slug as string
    const result = await Api.offers.getDetailById(slug)
    const data = result.data

    currentOffer.value = {
      offerId: data.id,
      id: data.id,
      languageId: data.languageId,
      storeId: data.storeId,
      createdById: data.createdById,
      updatedById: data.createdById,
      createdOn: data.createdOn,
      latestUpdatedOn: data.latestUpdatedOn,
      expirationTime: data.expirationTime,
      sendToClientDate: data.sendToClientDate,
      offerNumber: data.offerNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingPrice: data.shippingPrice,
      shippingPriceGross: data.shippingPriceGross,
      totalItemPrice: data.totalItemPrice,
      totalItemPriceGross: data.totalItemPriceGross,
      totalPrice: data.totalPrice,
      totalPriceGross: data.totalPriceGross,
      realizationTerm: data.realizationTerm,
      offerNote: data.offerNote,
      comment: data.comment,
      sendToClient: data.sendToClient,
      useShippingAddressAsBillingAddress: data.billingAddressId === data.shippingAddressId,
      deliveryMethod: data.deliveryMethod,
      payment: data.payment,
      transportIndividualPricing: data.transportIndividualPricing ?? false,
      paymentTerm: data.paymentTerm,
      billingAddress: {
        isCompany: data.billingAddress?.isCompany ?? false,
        firstName: data.billingAddress?.firstName ?? '',
        lastName: data.billingAddress?.lastName ?? '',
        email: data.billingAddress?.email ?? '',
        companyName: data.billingAddress?.companyName ?? '',
        nip: data.billingAddress?.nip ?? '',
        phone: data.billingAddress?.phone ?? '',
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
        email: data.shippingAddress?.email ?? '',
        companyName: data.shippingAddress?.companyName ?? '',
        nip: data.shippingAddress?.nip ?? '',
        phone: data.shippingAddress?.phone ?? '',
        addressLine1: data.shippingAddress?.addressLine1 ?? '',
        city: data.shippingAddress?.city ?? '',
        zipCode: data.shippingAddress?.zipCode ?? '',
        stateOrProvinceId: '',
        countryId: '0b64292c-e249-4906-ab48-429441745899'
      },
      products: data.offerItems.map((item: any) => ({
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
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading" class="offer-edit-loading">
    <el-skeleton animated>
      <template #template>
        <el-skeleton-item variant="h1" style="width: 40%; height: 40px; margin-bottom: 16px" />
        <el-skeleton-item variant="rect" style="width: 100%; height: 200px; border-radius: 18px" />
      </template>
    </el-skeleton>
  </div>
  <OfferForm v-else-if="currentOffer" :offer="currentOffer" :updated="true" />
</template>

<style scoped>
.offer-edit-loading {
  padding: 24px 20px;
  max-width: 900px;
}
</style>
