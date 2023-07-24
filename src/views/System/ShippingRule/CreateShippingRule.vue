<script lang="ts" setup>
import RuleForm from '/@/components/Page/System/Rule/RuleForm.vue'
import type { ShippingRuleDTO } from '/@/types/shippingRule/ShippingRule'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'
import type { LanguageDTO } from '/@/types/language/Language'

const language = useLanguageStore()
const store = useStoreStore()
const rule = computed(() => {
  return {
    storeId: store.selectedStore.id,
    name: '',
    orderValue: 0,
    active: true,
    combineProducts: false,
    stackPallet: false,
    partitioningForQuantity: false,
    shipmentPrice: 0,
    conditionMinQuantity: 0,
    conditionMaxQuantity: 0,
    shipmentPricePallet: 0,
    conditionMinForQuantityPallet: 0,
    conditionMaxForQuantityPallet: 0
  }
})
</script>

<template>
  <div v-if="store.selectedStore">
    <RuleForm :rule="rule" />
  </div>
</template>
