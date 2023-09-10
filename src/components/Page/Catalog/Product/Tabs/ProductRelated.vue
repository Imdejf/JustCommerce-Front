<script lang="ts" setup>
import ProductRelated from '../Form/ProductRelated/ProductRelated.vue'
import type { ProductDTO } from '/@/types/product/Product.ts'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  }
})
</script>

<template>
  <div>
    <ProductRelated :product="product"/>
  </div>
</template>
