<script lang="ts" setup>
import BrandForm from '/@/components/Page/System/Brand/BrandForm.vue'
import type { BrandDto } from '/@/types/Brand/brand'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'
import type { LanguageDTO } from '/@/types/language/Language'

const language = useLanguageStore()
const store = useStoreStore()
const brand = computed(() => {
  return {
    storeId: store.selectedStore.id,
    name: '',
    shortName: '',
    slug: '',
    description: '',
    country: '',
    phone: '',
    addressLine: '',
    postalCode: '',
    city: '',
    email: '',
    isPublished: true,
    brandLangs: language.languages.map((lang: LanguageDTO) => ({
      languageId: lang.id,
      description: ''
    }))
  }
})
</script>

<template>
  <div v-if="store.selectedStore">
    <BrandForm :brand="brand" />
  </div>
</template>
