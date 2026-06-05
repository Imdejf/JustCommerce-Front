<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AllegroProductMappingForm from '/@/components/Page/Allegro/Products/AllegroProductMappingForm.vue'

const route = useRoute()

const productId = computed(() => {
  return String(route.params.productId || route.params.id || '')
})
</script>

<template>
  <AllegroProductMappingForm :product-id="productId" />
</template>