<script lang="ts" setup>
import type { ProductDTO } from '/@/types/product/Product.ts'
import ProductAttribute from '../Form/ProductAttribute/ProductAttribute.vue'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  }
})
</script>

<template>
  <div>
    <ProductAttribute :product="product" />
  </div>
</template>
