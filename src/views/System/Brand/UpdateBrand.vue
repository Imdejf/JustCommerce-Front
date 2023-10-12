<script lang="ts" setup>
import { Api } from '/@/services/api'
import BrandForm from '/@/components/Page/System/Brand/BrandForm.vue'
import type { BrandDto } from '/@/types/Brand/brand'
import { useStoreStore } from '/@/stores/store'
import type { LanguageDTO } from '/@/types/language/Language'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const store = useStoreStore()
const route = useRoute()

const brand = ref<BrandDto | null>(null)

const getById = (id: string) => {
  return Api.brands.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  brand.value = result.data
})
</script>

<template>
  <div v-if="brand">
    <BrandForm :brand="brand" :updated="true" />
  </div>
</template>
