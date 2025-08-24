<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CreateOrder from '/@/components/Page/Sale/Order/CreateOrder.vue'
import { Api } from '/@/services/api'


const route = useRoute()
const order = ref(null)
const currentOrder = ref(null);

const getById = (slug: string) => {
  return Api.orders.getOrderById(slug)
}

onMounted(async () => {
  const slug = route.params.slug
  const result = await getById(slug)
  order.value = result.data

  currentOrder.value = {
    orderId: result.data.id,
    storeId: result.data.storeId,
    customerId: result.data.customerId,
    languageId: result.data.languageId,
    createdById: result.data.createdById,
    deliveryMethod: result.data.deliveryMethod,
    orderStatus: result.data.orderStatus,
    orderSourceType: result.data.orderSourceType,
    paymentStatus: result.data.paymentStatus,
    paymentProvider: result.data.paymentProvider,
    paymentTerm: result.data.paymentTerm,
    orderNoteForClient: result.data.orderNoteForClient,
    orderNoteForCustomer: result.data.orderNoteForCustomer,
    orderNoteOnInvoice: result.data.orderNoteOnInvoice,
    shippingPrice: result.data.shippingFeeAmountNetto,
    shippingPriceGross: result.data.shippingFeeAmountGross,
    totalItemPrice: result.data.subTotal,
    totalItemPriceGross: result.data.subTotalGross,
    useShippingAddressAsBillingAddress: result.data.useShippingAddressAsBillingAddress,
    isPaid: result.data.isPaid,
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
      stateOrProvinceId: result.data.billingAddress?.stateOrProvinceId ?? '',
      countryId: result.data.billingAddress?.countryId ?? ''
    },
    shippingAddress: result.data.shippingAddress
      ? {
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
          stateOrProvinceId: result.data.shippingAddress?.stateOrProvinceId ?? '',
          countryId: result.data.shippingAddress?.countryId ?? ''
        }
      : null,
    products: result.data.products.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      slug: item.slug,
      name: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      identificationCode: item.identificationCode,
      taxAmount: item.taxAmount,
      taxPercent: item.taxPercent,
      startingPriceNetto: item.startingPriceNetto,
      brandId: item.brandId ?? null,
      sku: item.sku ?? null,
      priceNetto: item.priceNetto,
      priceGross: item.priceGross,
      tax: item.tax,
      producerPriceNetto: item.producerPriceNetto,
      totalPriceNetto: item.totalPriceNetto,
      totalPriceGross: item.totalPriceGross,
      noteForProducer: item.noteForProducer,
        shippingRule: item.shippingRule
    ? {
        shippingRuleId: item.shippingRule.shippingRuleId,
        name: item.shippingRule.name,
        orderValue: item.shippingRule.orderValue,
        active: item.shippingRule.active,
        combineProducts: item.shippingRule.combineProducts,
        shipmentPrice: item.shippingRule.shipmentPrice,
        partitioningForQuantity: item.shippingRule.partitioningForQuantity,
        conditionMinQuantity: item.shippingRule.conditionMinQuantity,
        conditionMaxQuantity: item.shippingRule.conditionMaxQuantity,
        stackPallet: item.shippingRule.stackPallet,
        shipmentPricePallet: item.shippingRule.shipmentPricePallet,
        conditionMinForQuantityPallet: item.shippingRule.conditionMinForQuantityPallet,
        conditionMaxForQuantityPallet: item.shippingRule.conditionMaxForQuantityPallet
      }
    : null
    }))
  }
})


</script>

<template>
  <div v-if="currentOrder != null">
    <CreateOrder :order="currentOrder" :updated="true"/>
  </div>
</template>
