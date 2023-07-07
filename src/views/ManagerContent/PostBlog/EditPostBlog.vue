<script lang="ts" setup>
import { Api } from '/@/services/api'
import type { PostBlogDTO } from '/@/types/postBlog/PostBlog'
import { onMounted, ref } from 'vue'
import PostBlogForm from '/@/components/Page/ManagerContent/PostBlog/PostBlogForm.vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '/@/stores/language'

const language = useLanguageStore()
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
  <div v-if="postBlog">
    <PostBlogForm :postBlog="postBlog" :updated="true" />
  </div>
</template>
