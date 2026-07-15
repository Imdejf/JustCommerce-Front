<script lang="ts" setup>
import ProductOption from '../Form/ProductOption/ProductOption.vue'
import ProductVariation from '../Form/ProductVariation/ProductVariation.vue'
import { ProductOptionDTO } from '/@/types/product/ProductOption'
import { computed, ref, watch } from 'vue'
import type { ProductDTO } from '/@/types/product/Product.ts'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  },
  productOptions: {
    type: Array as () => ProductOptionDTO[],
    default: () => []
  },
  onRefresh: {
    type: Function as () => (product: ProductDTO) => void,
    default: null
  }
})

const emit = defineEmits(['refresh'])

const addedOptions = ref<ProductOptionDTO[]>([])

const syncOptions = () => {
  const baseOptions = [...(props.productOptions ?? props.product?.options ?? [])]

  props.product?.productOptionCombinations?.forEach((combination) => {
    const existsInOptions = baseOptions.some((option) => option.optionId === combination.optionId)

    if (!existsInOptions) {
      baseOptions.push({
        optionId: combination.optionId,
        displayType: 0,
        name: combination.optionName,
        values: []
      })
    }
  })

  addedOptions.value = baseOptions
}

watch(
  () => [props.product?.options, props.productOptions, props.product?.productOptionCombinations],
  () => syncOptions(),
  { deep: true, immediate: true }
)

const updateOptions = (options: ProductOptionDTO[]) => {
  addedOptions.value = options
}

const handleRefresh = (product: ProductDTO) => {
  if (props.onRefresh) {
    props.onRefresh(product)
  }
  emit('refresh', product)
}

const hasOptions = computed(() => addedOptions.value.length > 0)
</script>

<template>
  <div class="block w-full max-w-none">
    <ProductOption
      @updateOptions="updateOptions"
      :product="product"
      :productOptions="addedOptions"
    />
    <ProductVariation
      v-if="hasOptions"
      :productOptions="addedOptions"
      :product="product"
      @refresh="handleRefresh"
    />
    <el-alert
      v-else
      class="mt-4"
      type="info"
      :closable="false"
      title="Dodaj co najmniej jedną opcję produktu, aby tworzyć warianty."
      show-icon
    />
  </div>
</template>
