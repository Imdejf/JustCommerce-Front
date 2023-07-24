<script lang="ts" setup>
import ProductOption from '../Form/ProductOption/ProductOption.vue'
import ProductVariation from '../Form/ProductVariation/ProductVariation.vue'
import { ProductOptionDTO } from '/@/types/product/ProductOption'
import { onMounted, ref } from 'vue'
import type { ProductDTO } from '/@/types/product/Product.ts'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  },
  productOptions: {
    type: Array as () => ProductOptionDTO[],
    default: () => []
  }
})

const addedOptions = ref<Array<ProductOptionDTO>>(props.product.options)

const updateOptions = (options: ProductOptionDTO[]) => {
  addedOptions.value = options
}

const existCombinations = () => {
  props.product?.productOptionCombinations.forEach((combination) => {
    const optionIdToCheck = combination.optionId
    const existsInOptions = props.product?.options.some(
      (option) => option.optionId === optionIdToCheck
    )

    if (!existsInOptions) {
      const newCombination: ProductOptionDTO = {
        optionId: combination.optionId,
        displayType: 0,
        name: combination.optionName,
        values: []
      }
      addedOptions.value.push(newCombination)
    }
  })
}

existCombinations()

onMounted(() => {})
</script>
<template>
  <div class="block">
    <ProductOption
      @updateOptions="updateOptions"
      :product="product"
      :productOptions="addedOptions"
    />
    <ProductVariation
      v-if="addedOptions.length > 0"
      :productOptions="addedOptions"
      :product="product"
    />
  </div>
</template>
