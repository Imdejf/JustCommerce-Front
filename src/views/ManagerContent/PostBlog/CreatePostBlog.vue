<script lang="ts" setup>
import PostBlogForm from '/@/components/Page/ManagerContent/PostBlog/PostBlogForm.vue'
import type { PostBlogDTO } from '/@/types/postBlog/PostBlog'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'
import type { LanguageDTO } from '/@/types/language/Language'

const language = useLanguageStore()
const store = useStoreStore()
const postBlog = computed(() => {
  return {
    storeId: store.selectedStore.id,
    name: '',
    slug: '',
    metaTitle: '',
    metaKeywords: '',
    metaDescription: '',
    shortDescription: '',
    description: '',
    Author: 'Olmag.pl',
    displayOrder: 0,
    isPublished: false,
    thumbnailImage: {
      filePath: '',
      seoFileName: '',
      altAttribute: '',
      titleAttribute: '',
      displayOrder: 0,
      mediaLangs: language.languages.map((lang) => ({
        languageId: lang.id,
        seoFileName: '',
        altAttribute: '',
        titleAttribute: '',
        filePath: ''
      }))
    },
    blogItemLangs: language.languages.map((lang) => ({
      languageId: lang.id,
      name: '',
      metaTitle: '',
      metaKeywords: '',
      metaDescription: '',
      shortDescription: '',
      description: ''
    }))
  }
})
</script>

<template>
  <div v-if="store.selectedStore">
    <PostBlogForm :postBlog="postBlog" />
  </div>
</template>
