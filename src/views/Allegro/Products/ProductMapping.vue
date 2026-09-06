<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AllegroProductMappingForm from '/@/components/Page/Allegro/Products/AllegroProductMappingForm.vue'

const route = useRoute()

const productId = computed(() => {
  return String(route.params.productId || route.params.id || '')
})

const initialGtin = computed(() => {
  const fromQuery = route.query.gtin ?? route.query.Gtin
  return String(Array.isArray(fromQuery) ? fromQuery[0] : fromQuery || '').trim()
})
</script>

<template>
  <AllegroProductMappingForm
    :product-id="productId"
    :initial-gtin="initialGtin"
  />
</template>
