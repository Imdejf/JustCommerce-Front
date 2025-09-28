<script lang="ts" setup>
import type { CategoryDTO } from '/@/types/category/Category.ts'
import CategoryBlog from '../Form/CategoryBlog/CategoryBlog.vue';

const props = defineProps({
  category: {
    type: Object as () => CategoryDTO,
    default: () => null
  }
})
</script>

<template>
  <div>
    <CategoryBlog :category="category" />
  </div>
</template>
