<script lang="ts" setup>
import { Api } from '@/services/api'
import type { CategoryDTO } from '@/types/category/Category.ts'
import { onMounted, ref } from 'vue'
import CategoryForm from '../../components/Page/Catalog/Category/CategoryForm.vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '../../stores/language'

const language = useLanguageStore()
const route = useRoute()
const category = ref<CategoryDTO | null>(null)

const getById = (id: string) => {
  return Api.categories.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  category.value = result.data
})
</script>
<template>
  <div v-if="category">
    <CategoryForm :category="category" :updated="true" />
  </div>
</template>
