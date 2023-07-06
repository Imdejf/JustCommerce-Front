<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import type { BlogCategoryDTO } from '/@/types/blogCategory/BlogCategory'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import BlogCategoryNavbar from '/@/components/Page/ManagerContent/CategoryBlog/CategoryBlogNavbar.vue'
const route = useRoute()
const blogCategory = ref<BlogCategoryDTO | null>(null)

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
  <ContentContainer>
    <template #navbar>
      <BlogCategoryNavbar :id="route.params.id" :blogCategory="blogCategory" />
    </template>
    <div v-if="blogCategory" class="h-full">
      <InfoBox>
        <FormKit type="text" label="Nazwa" :placeholder="blogCategory.name" :disabled="true" />
        <FormKit type="text" label="Slug" :placeholder="blogCategory.slug" :disabled="true" />
        <FormKit
          type="textarea"
          label="Meta opis"
          :placeholder="blogCategory.description"
          :disabled="true"
        />
        <FormKit
          type="textarea"
          label="Opis"
          :placeholder="blogCategory.description"
          :disabled="true"
        />
      </InfoBox>
    </div>
  </ContentContainer>
</template>
