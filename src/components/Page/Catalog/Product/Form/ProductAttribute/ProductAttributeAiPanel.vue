<script lang="ts" setup>
import { computed, isRef, unref } from 'vue'
import type { Ref } from 'vue'
import type { ProductDTO } from '/@/types/product/Product'
import ProductAttributeAiReviewModal from '/@/components/Form/Modal/ProductAttributeAiReviewModal.vue'
import { useProductAttributesFromDescriptionAi } from '/@/composables/useProductAttributesFromDescriptionAi'

const props = defineProps<{
  product: ProductDTO | null | Ref<ProductDTO | null>
}>()

const productRef: Ref<ProductDTO | null> = computed(() => {
  const value = props.product
  return isRef(value) ? value.value : (value as ProductDTO | null) ?? null
})

const productName = computed(() => unref(productRef)?.name ?? '')

const {
  loading,
  applyLoading,
  reviewVisible,
  reviewItems,
  availableAttributeSource,
  productId,
  hasProductDescription,
  generateFromDescription,
  applySelectedAttributes
} = useProductAttributesFromDescriptionAi(productRef)

const handleApply = async (payload: Parameters<typeof applySelectedAttributes>[0]) => {
  await applySelectedAttributes(payload)
}
</script>

<template>
  <div
    class="mb-6 rounded-xl border-2 border-amber-400 bg-amber-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm"
  >
    <div>
      <p class="text-base font-bold text-amber-950">Uzupełnij atrybuty z AI</p>
      <p class="text-sm text-amber-900 mt-1 max-w-2xl">
        AI przeanalizuje opis, opis skrócony i specyfikację produktu, a następnie zaproponuje wartości
        dla atrybutów z grup przypisanych do kategorii produktu. Wybierzesz checkboxami, które zapisać.
      </p>
      <p v-if="availableAttributeSource" class="text-xs text-amber-800 mt-2">
        {{ availableAttributeSource }}
      </p>
      <p v-if="!hasProductDescription" class="text-xs text-red-700 mt-2 font-medium">
        Brak opisu produktu — najpierw uzupełnij opis lub specyfikację w edycji produktu.
      </p>
    </div>

    <el-button
      type="warning"
      size="large"
      :loading="loading"
      :disabled="!productId"
      @click="generateFromDescription"
    >
      Uzupełnij atrybuty z opisu
    </el-button>
  </div>

  <ProductAttributeAiReviewModal
    v-if="reviewVisible && reviewItems.length > 0"
    :loading="applyLoading"
    :product-name="productName"
    :attribute-items="reviewItems"
    @close="reviewVisible = false"
    @apply="handleApply"
  />
</template>
