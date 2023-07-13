<script lang="ts" setup>
import ProductForm from '/@/components/Page/Catalog/Product/ProductForm.vue'
import type { ProductDTO } from '/@/types/product/Product'
import type { LanguageDTO } from '/@/types/language/Language'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'

const language = useLanguageStore()

const product = computed(() => {
  return {
    currentUserId: '',
    storeId: '',
    price: 0,
    oldPrice: null,
    specialPrice: null,
    specialPriceStart: null,
    specialPriceEnd: null,
    isCallForPricing: false,
    isAllowToOrder: false,
    isBestseller: false,
    isHomePage: false,
    isNew: false,
    isSales: false,
    name: '',
    slug: '',
    metaTitle: '',
    metaKeywords: '',
    metaDescription: '',
    sku: '',
    gtin: '',
    shortDescription: '',
    description: '',
    specification: '',
    isPublished: false,
    isFeatured: false,
    stockTrackingIsEnabled: false,
    taxId: null,
    vendorId: null,
    brandId: null,
    productLangs: language.languages.map((lang) => ({
      languageId: lang.id,
      name: '',
      normalizedName: '',
      shortDescription: '',
      description: '',
      specification: '',
      metaKeywords: '',
      metaDescription: ''
    })),
    thumbnailImage: {
      base64File: null,
      seoFileName: '',
      altAttribute: '',
      titleAttribute: '',
      filePath: null,
      displayOrder: 0,
      mediaLangs: language.languages.map((lang) => ({
        languageId: lang.id,
        seoFileName: '',
        altAttribute: '',
        titleAttribute: '',
        filePath: null
      }))
    },
    medias: []
  }
})
</script>

<template>
  <div v-if="language.languages.length > 0">
    <ProductForm :product="product" />
  </div>
</template>
