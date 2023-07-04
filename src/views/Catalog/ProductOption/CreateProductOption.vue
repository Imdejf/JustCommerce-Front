<script lang="ts" setup>
import ProductOptionForm from '/@/components/Page/Catalog/ProductOption/ProductOptionForm.vue'
import type { ProductOptionDTO } from '/@/types/productOption/ProductOption'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'
import type { LanguageDTO } from '/@/types/language/Language'

const language = useLanguageStore()
const store = useStoreStore()
const productOption = computed(() => {
  return {
    storeId: store.selectedStore.id,
    groupId: '',
    name: '',
    productOptionLangs: language.languages.map((lang: LanguageDTO) => ({
      languageId: lang.id,
      name: ''
    }))
  }
})
</script>

<template>
  <div v-if="store.selectedStore">
    <ProductOptionForm :productOption="productOption" />
  </div>
</template>
