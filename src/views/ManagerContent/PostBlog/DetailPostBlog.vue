<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import type { PostBlogDTO } from '/@/types/postBlog/PostBlog'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import PostBlogNavbar from '/@/components/Page/ManagerContent/PostBlog/PostBlogNavbar.vue'
const route = useRoute()
const postBlog = ref<PostBlogDTO | null>(null)

const getById = (id: string) => {
  return Api.postBlogs.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  postBlog.value = result.data
})
</script>

<template>
  <ContentContainer>
    <template #navbar>
      <PostBlogNavbar :id="route.params.id" :postBlog="postBlog" />
    </template>
    <div v-if="postBlog" class="h-full">
      <InfoBox>
        <FormKit type="text" label="Nazwa" :placeholder="postBlog.name" :disabled="true" />
        <FormKit type="text" label="Slug" :placeholder="postBlog.slug" :disabled="true" />
        <FormKit
          type="textarea"
          label="Meta opis"
          :placeholder="postBlog.description"
          :disabled="true"
        />
        <FormKit
          type="textarea"
          label="Opis"
          :placeholder="postBlog.description"
          :disabled="true"
        />
      </InfoBox>
    </div>
  </ContentContainer>
</template>
