<script lang="ts" setup>
import type { ProductDTO } from '/@/types/product/Product.ts'
import ProductAttribute from '../Form/ProductAttribute/ProductAttribute.vue'
import ProductAttributeAiPanel from '../Form/ProductAttribute/ProductAttributeAiPanel.vue'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO | { value: ProductDTO | null },
    default: () => null
  }
})
</script>

<template>
  <div class="px-2 pt-2">
    <ProductAttributeAiPanel :product="props.product" />
    <ProductAttribute :product="props.product" />
  </div>
</template>
