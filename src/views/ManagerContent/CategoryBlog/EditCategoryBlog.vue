<script lang="ts" setup>
import { Api } from '/@/services/api'
import type { ProductOptionDTO } from '/@/types/blogCategory/BlogCategory'
import { onMounted, ref } from 'vue'
import CategoryBlogForm from '/@/components/Page/ManagerContent/CategoryBlog/CategoryBlogForm.vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '/@/stores/language'

const language = useLanguageStore()
const route = useRoute()
const blogCategory = ref<ProductOptionDTO | null>(null)

const getById = (id: string) => {
  return Api.categoryBlogs.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  blogCategory.value = result.data
})
</script>
<template>
  <div v-if="blogCategory">
    <CategoryBlogForm :categoryBlog="blogCategory" :updated="true" />
  </div>
</template>
