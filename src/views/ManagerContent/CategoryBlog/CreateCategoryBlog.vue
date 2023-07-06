<script lang="ts" setup>
import CategoryBlogForm from '/@/components/Page/ManagerContent/CategoryBlog/CategoryBlogForm.vue'
import type { BlogCategoryDTO } from '/@/types/blogCategory/BlogCategory'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'
import type { LanguageDTO } from '/@/types/language/Language'

const language = useLanguageStore()
const store = useStoreStore()
const categoryBlog = computed(() => {
  return {
    storeId: store.selectedStore.id,
    name: '',
    slug: '',
    metaTitle: '',
    metaKeywords: '',
    metaDescription: '',
    shortDescription: '',
    description: '',
    displayOrder: 0,
    isPublished: false,
    thumbnailImage: {
      filePath: '',
      seoFileName: '',
      altAttribute: '',
      titleAttribute: '',
      displayOrder: 0,
      mediaLangs: language.languages.map((lang: LanguageDTO) => ({
        languageId: lang.id,
        seoFileName: '',
        altAttribute: '',
        titleAttribute: '',
        filePath: ''
      }))
    },
    blogCategoryLangs: language.languages.map((lang: LanguageDTO) => ({
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
    <CategoryBlogForm :categoryBlog="categoryBlog" />
  </div>
</template>
