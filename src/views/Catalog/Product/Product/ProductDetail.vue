<script lang="ts" setup>
//tabs
import ProductCategoryTab from '../../../../components/Page/Catalog/Product/Tabs/ProductCategory.vue'
import ProductRelatedTab from '../../../../components/Page/Catalog/Product/Tabs/ProductRelated.vue'
import ProductVariationTab from '../../../../components/Page/Catalog/Product/Tabs/ProductVariation.vue'

import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import type { ProductDTO } from '/@/types/product/Product.ts'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import ProductNavbar from '/@/components/Page/Catalog/Product/ProductNavbar.vue'
const route = useRoute()
const product = ref<ProductDTO | null>(null)

const activeTab = ref('productAttribute')

const productOptions = ref([
  {
    optionId: '1',
    name: 'Test',
    displayType: 1,
    values: [
      {
        key: 'Test22',
        display: 'Test22',
        productOptionValueLangs: [
          {
            languageId: '1',
            key: 'Test22',
            display: 'Test22'
          }
        ]
      },
      {
        key: 'Test223',
        display: 'Test322',
        productOptionValueLangs: [
          {
            languageId: '1',
            key: 'Test223',
            display: 'Test322'
          }
        ]
      }
    ]
  }
])

const tabs = [
  {
    id: 'productVariation',
    title: 'Warianty',
    component: ProductVariationTab,
    props: {
      productOptions: productOptions.value
    }
  },
  { id: 'productRelated', title: 'Relacje', component: ProductRelatedTab },
  { id: 'productCategory', title: 'Kategorie', component: ProductCategoryTab }
]

const getById = (id: string) => {
  return Api.products.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  product.value = result.data
})
</script>

<template>
  <ContentContainer>
    <template #navbar>
      <ProductNavbar :id="route.params.id" :product="product" />
    </template>
    <div v-if="product" class="h-full">
      <InfoBox>
        <template #picture>
          <img :src="product.thumbnailImage.filePath" />
        </template>

        <FormKit type="text" :label="'Nazwa'" :placeholder="product.name" :disabled="true" />
        <FormKit type="text" label="Meta tytuł" :placeholder="product.metaTitle" :disabled="true" />
        <FormKit
          type="textarea"
          label="Meta opis"
          rows="5"
          :placeholder="product.metaDescription"
          :disabled="true"
        />
        <FormKit
          type="textarea"
          label="Meta opis"
          rows="10"
          :placeholder="product.description"
          :disabled="true"
        />
        <FormKit type="text" :label="'Nazwa'" :placeholder="product.name" :disabled="true" />
        <FormKit type="text" :label="'Nazwa'" :placeholder="product.name" :disabled="true" />
        <FormKit type="text" :label="'Nazwa'" :placeholder="product.name" :disabled="true" />
        <FormKit type="text" :label="'Nazwa'" :placeholder="product.name" :disabled="true" />
      </InfoBox>
    </div>
    <template #tabs>
      <TabsView :tabs="tabs" />
    </template>
  </ContentContainer>
</template>
