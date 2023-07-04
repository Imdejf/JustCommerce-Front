<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '@/services/api'
import type { CategoryDTO } from '@/types/category/Category.ts'
import ContentContainer from '../../layouts/ContentContainer.vue'
import CategoryDetailNavbar from '../../components/Page/Catalog/Category/CategoryDetailNavbar.vue'
const route = useRoute()
const category = ref<CategoryDTO | null>(null)

const getById = (id: string) => {
  return Api.categories.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  category.value = result.data
})
</script>

<template>
  <ContentContainer>
    <template #navbar>
      <CategoryDetailNavbar :id="route.params.id" :category="category" />
    </template>
    <div v-if="category" class="h-full">
      <InfoBox>
        <template #picture>
          <img :src="category.thumbnailImage.filePath" />
        </template>

        <FormKit type="text" :label="'Nazwa'" :placeholder="category.name" :disabled="true" />
        <FormKit
          type="text"
          label="Meta tytuł"
          :placeholder="category.metaTitle"
          :disabled="true"
        />
        <FormKit
          type="textarea"
          label="Meta opis"
          rows="5"
          :placeholder="category.metaDescription"
          :disabled="true"
        />
        <FormKit
          type="textarea"
          label="Meta opis"
          rows="10"
          :placeholder="category.description"
          :disabled="true"
        />
        <FormKit type="text" :label="'Nazwa'" :placeholder="category.name" :disabled="true" />
        <FormKit type="text" :label="'Nazwa'" :placeholder="category.name" :disabled="true" />
        <FormKit type="text" :label="'Nazwa'" :placeholder="category.name" :disabled="true" />
        <FormKit type="text" :label="'Nazwa'" :placeholder="category.name" :disabled="true" />
      </InfoBox>
    </div>
  </ContentContainer>
</template>
