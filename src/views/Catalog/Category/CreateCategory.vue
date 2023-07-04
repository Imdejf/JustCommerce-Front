<script lang="ts" setup>
import CategoryForm from '/@/components/Page/Catalog/Category/CategoryForm.vue'
import type { CategoryDTO } from '/@/types/category/Category'
import type { LanguageDTO } from '/@/types/language/Language'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'

const language = useLanguageStore()

const category = computed(() => {
  return {
    id: '',
    slug: '',
    parentCategoryId: null,
    parentCategory: null,
    name: '',
    metaTitle: '',
    metaKeywords: '',
    metaDescription: '',
    description: '',
    displayOrder: 0,
    isPublished: false,
    includeInMenu: false,
    mostVisited: false,
    highlight: false,
    deleted: false,
    thumbnailImageId: '',
    thumbnailImage: {
      id: '',
      filePath: null,
      seoFileName: null,
      altAttribute: null,
      titleAttribute: null,
      mediaLangs: language.languages.map((lang: LanguageDTO) => ({
        mediaId: '',
        languageId: lang.id,
        filePath: null,
        seoFileName: null,
        altAttribute: null,
        titleAttribute: null
      }))
    },
    storeId: '',
    childCategories: [],
    categoryLangs: language.languages.map((lang: LanguageDTO) => ({
      name: '',
      description: '',
      metaKeywords: '',
      metaDescription: '',
      metaTitle: '',
      categoryId: '',
      languageId: lang.id
    }))
  }
})
</script>

<template>
  <div v-if="language.languages.length > 0">
    {{ category }}
    <CategoryForm :category="category" />
  </div>
</template>
