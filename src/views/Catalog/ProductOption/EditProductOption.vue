<script lang="ts" setup>
import { Api } from '/@/services/api'
import type { ProductOptionDTO } from '/@/types/productOption/ProductOption'
import { onMounted, ref } from 'vue'
import ProductOptionForm from '/@/components/Page/Catalog/ProductOption/ProductOptionForm.vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '/@/stores/language'

const language = useLanguageStore()
const route = useRoute()
const productOption = ref<ProductOptionDTO | null>(null)

const getById = (id: string) => {
  return Api.productOptions.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  productOption.value = result.data
})
</script>
<template>
  <div v-if="productOption">
    <ProductOptionForm :productOption="productOption" :updated="true" />
  </div>
</template>
