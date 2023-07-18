<script lang="ts" setup>
import ProductOption from '../Form/ProductOption/ProductOption.vue'
import ProductVariation from '../Form/ProductVariation/ProductVariation.vue'
import { ProductOptionDTO } from '/@/types/product/ProductOption'
import { ref } from 'vue'

const props = defineProps({
  productOptions: {
    type: Array as () => ProductOptionDTO[],
    default: () => []
  }
})

const addedOptions = ref<Array<ProductOptionDTO>>(props.productOptions)

const updateOptions = (options: ProductOptionDTO[]) => {
  addedOptions.value = options
}
</script>
<template>
  <div class="block">
    <ProductOption @updateOptions="updateOptions" :productOptions="productOptions" />
    <ProductVariation v-if="addedOptions.length > 0" :productOptions="addedOptions" />
  </div>
</template>
