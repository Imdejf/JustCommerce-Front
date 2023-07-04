<script lang="ts" setup>
import ProductAttributeForm from '/@/components/Page/Catalog/ProductAttribute/ProductAttributeForm.vue'
import type { ProudctAttributeDTO } from '/@/types/attributeAttribute/ProductAttribute'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'
import type { LanguageDTO } from '/@/types/language/Language'
import Cookies from 'universal-cookie'

const cookies = new Cookies()
const store = useStoreStore()
const language = useLanguageStore()

const productAttribute = computed(() => {
  return {
    storeId: cookies.get('dsStore'),
    name: '',
    groupId: '',
    productAttributeLangs: language.languages.map((lang: LanguageDTO) => ({
      languageId: lang.id,
      name: ''
    }))
  }
})
</script>

<template>
  <div v-if="language.languages.length > 0">
    <ProductAttributeForm :productAttribute="productAttribute" />
  </div>
</template>
