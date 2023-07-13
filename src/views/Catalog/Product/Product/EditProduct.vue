<script lang="ts" setup>
import { Api } from '/@/services/api'
import type { ProductDTO } from '/@/types/product/Product'
import { onMounted, ref } from 'vue'
import ProductForm from '/@/components/Page/Catalog/Product/ProductForm.vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '/@/stores/language'

const language = useLanguageStore()
const route = useRoute()
const product = ref<ProductDTO | null>(null)

const getById = (id: string) => {
  return Api.products.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  product.value = result.data
})
</script>
<template>
  <div v-if="product">
    <ProductForm :product="product" :updated="true" />
  </div>
</template>
