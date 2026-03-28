<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import type { PostBlogDTO } from '/@/types/postBlog/PostBlog'

import ContentContainer from '/@/layouts/ContentContainer.vue'
import PostBlogNavbar from '/@/components/Page/ManagerContent/PostBlog/PostBlogNavbar.vue'
import PostBlogFaqTable from '/@/components/Page/ManagerContent/PostBlog/Tabs/PostBlogFaqTable.vue'

const route = useRoute()
const postBlog = ref<PostBlogDTO | null>(null)

const activeTab = ref('faq')

const tabs = [
  {
    id: 'faq',
    title: 'FAQ',
    component: PostBlogFaqTable
  }
]

const activeComponent = computed(() => {
  return tabs.find(x => x.id === activeTab.value)?.component
})

const activeProps = computed(() => {
  return {
    postBlog: postBlog.value
  }
})

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

    <div class="mt-6">
      <div class="border-b border-gray-200 mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-4 py-2 text-sm font-medium border-b-2"
          :class="activeTab === tab.id
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500'"
          @click="activeTab = tab.id"
        >
          {{ tab.title }}
        </button>
      </div>

      <component
        v-if="postBlog"
        :is="activeComponent"
        v-bind="activeProps"
      />
    </div>
  </ContentContainer>
</template>