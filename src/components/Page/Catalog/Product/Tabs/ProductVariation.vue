<script lang="ts" setup>
import ProductOption from '../Form/ProductOption.vue'
import { ProductOptionDTO } from '/@/types/product/ProductOption'

const props = defineProps({
  productOptions: {
    type: Array as () => ProductOptionDTO[],
    default: () => []
  }
})
</script>
<template><ProductOption :productOptions="productOptions" /></template>
