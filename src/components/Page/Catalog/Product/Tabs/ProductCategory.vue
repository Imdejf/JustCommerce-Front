<script lang="ts" setup>
import type { ProductDTO } from '/@/types/product/Product.ts'
import ProductCategory from '../Form/ProductCategory/ProductCategory.vue'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  }
})
</script>

<template>
  <div><ProductCategory :product="product" /></div>
</template>
