<script lang="ts" setup>
import type { CategoryDTO } from '/@/types/category/Category.ts'
import CategoryFaq from '../Form/CategoryFaq/CategoryFaq.vue'

defineProps({
  category: {
    type: Object as () => CategoryDTO,
    default: () => null
  }
})
</script>

<template>
  <div>
    <CategoryFaq :category="category" />
  </div>
</template>