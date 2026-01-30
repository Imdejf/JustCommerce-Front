<script lang="ts" setup>
//tabs
import ProductCategoryTab from '../../../../components/Page/Catalog/Product/Tabs/ProductCategory.vue'
import ProductRelatedTab from '../../../../components/Page/Catalog/Product/Tabs/ProductRelated.vue'
import ProductVariationTab from '../../../../components/Page/Catalog/Product/Tabs/ProductVariation.vue'
import ProductAttributeTab from '../../../../components/Page/Catalog/Product/Tabs/ProductAttribute.vue'
import ProductVolumePricing from '../../../../components/Page/Catalog/Product/Tabs/ProductValuePrice.vue'

import { ProductOptionDTO } from '/@/types/product/ProductOption'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import type { ProductDTO } from '/@/types/product/Product.ts'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import ProductNavbar from '/@/components/Page/Catalog/Product/ProductNavbar.vue'
const route = useRoute()
const product = ref<ProductDTO | null>(null)

const activeTab = ref('productAttribute')

const tabs = [
  {
    id: 'productVariation',
    title: 'Warianty',
    component: ProductVariationTab,
    props: {
      productOptions: product.value?.options,
      product: product
    }
  },
  {
    id: 'productAttribute',
    title: 'Atrybuty',
    component: ProductAttributeTab,
    props: { product: product }
  },
  {
    id: 'productRelated',
    title: 'Relacje',
    component: ProductRelatedTab,
    props: {
      product: product
    }
  },
  {
    id: 'productCategory',
    title: 'Kategorie',
    component: ProductCategoryTab,
    props: {
      product: product
    }
  },
  {
    id: 'productVolumePricing',
    title: 'Rabatowanie',
    component: ProductVolumePricing,
    props: {
      product: product,
      initialTiers: []
    }
  },
]

const getById = (id: string) => {
  return Api.products.get(id)
}

// const existCombinations = () => {
//   product.value?.productOptionCombinations.forEach((combination) => {
//     const optionIdToCheck = combination.optionId
//     const existsInOptions = product.value?.options.some(
//       (option) => option.optionId === optionIdToCheck
//     )

//     if (!existsInOptions) {
//       const newCombination: ProductOptionDTO = {
//         optionId: combination.optionId,
//         displayType: 0,
//         name: combination.optionName,
//         values: []
//       }
//       product.value.options.push(newCombination)
//     }
//   })
// }
const isLoading = ref(false)

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  product.value = result.data
  // await existCombinations()
  isLoading.value = true
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
        <FormKit type="text" label="Nazwa" :placeholder="product.name" :disabled="true" />
        <FormKit type="text" label="Cena producenta (netto)" :placeholder="product.producerPrice" :disabled="true" />
        <FormKit type="text" label="Cena (netto)" :placeholder="product.price" :disabled="true" />
      </InfoBox>
    </div>
    <template #tabs>
      <TabsView :tabs="tabs" v-if="isLoading" />
    </template>
  </ContentContainer>
</template>
