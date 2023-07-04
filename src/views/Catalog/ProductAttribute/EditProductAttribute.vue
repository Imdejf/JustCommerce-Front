<script lang="ts" setup>
import { Api } from '/@/services/api'
import type { ProductAttributeDTO } from '/@/types/productAttribute/ProductAttribute'
import { onMounted, ref } from 'vue'
import ProductAttributeForm from '/@/components/Page/Catalog/ProductAttribute/ProductAttributeForm.vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '/@/stores/language'

const language = useLanguageStore()
const route = useRoute()
const productAttribute = ref<ProductAttributeDTO | null>(null)

const getById = (id: string) => {
  return Api.productAttributes.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  productAttribute.value = result.data
})
</script>
<template>
  <div v-if="productAttribute">
    <ProductAttributeForm :productAttribute="productAttribute" :updated="true" />
  </div>
</template>
