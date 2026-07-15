<script lang="ts" setup>
//tabs
import ProductCategoryTab from '../../../../components/Page/Catalog/Product/Tabs/ProductCategory.vue'
import ProductRelatedTab from '../../../../components/Page/Catalog/Product/Tabs/ProductRelated.vue'
import ProductVariationTab from '../../../../components/Page/Catalog/Product/Tabs/ProductVariation.vue'
import ProductAttributeTab from '../../../../components/Page/Catalog/Product/Tabs/ProductAttribute.vue'
import ProductVolumePricing from '../../../../components/Page/Catalog/Product/Tabs/ProductValuePrice.vue'
import ProductFaq from '../../../../components/Page/Catalog/Product/Tabs/ProductFaq.vue'
import ProductBlog from '../../../../components/Page/Catalog/Product/Tabs/ProductBlog.vue'

import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import type { ProductDTO } from '/@/types/product/Product.ts'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import ProductNavbar from '/@/components/Page/Catalog/Product/ProductNavbar.vue'
import ProductDetailOverview from '/@/components/Page/Catalog/Product/ProductDetailOverview.vue'

const route = useRoute()
const product = ref<ProductDTO | null>(null)
const isLoading = ref(false)

const tabs = computed(() => [
  {
    id: 'productVariation',
    title: 'Warianty',
    component: ProductVariationTab,
    props: {
      productOptions: product.value?.options ?? [],
      product: product.value,
      onRefresh: handleProductRefresh
    }
  },
  {
    id: 'productAttribute',
    title: 'Atrybuty',
    component: ProductAttributeTab,
    props: { product: product.value }
  },
  {
    id: 'productRelated',
    title: 'Relacje',
    component: ProductRelatedTab,
    props: {
      product: product.value
    }
  },
  {
    id: 'productCategory',
    title: 'Kategorie',
    component: ProductCategoryTab,
    props: {
      product: product.value
    }
  },
  {
    id: 'productVolumePricing',
    title: 'Rabatowanie',
    component: ProductVolumePricing,
    props: {
      product: product.value,
      initialTiers: []
    }
  },
  {
    id: 'productFaq',
    title: 'FAQ',
    component: ProductFaq,
    props: {
      product: product.value
    }
  },
  {
    id: 'productBlog',
    title: 'Blog',
    component: ProductBlog,
    props: {
      product: product.value
    }
  }
])

const handleProductRefresh = (updatedProduct: ProductDTO) => {
  product.value = updatedProduct
}

const getById = (id: string) => {
  return Api.products.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  product.value = result.data
  isLoading.value = true
})
</script>

<template>
  <ContentContainer>
    <template #navbar>
      <ProductNavbar :id="route.params.id" :product="product" />
    </template>

    <div v-if="product" class="h-full">
      <ProductDetailOverview :product="product" />
    </div>
    <el-skeleton v-else animated :rows="6" />

    <template #tabs>
      <TabsView :tabs="tabs" default-tab-id="productAttribute" v-if="isLoading" />
    </template>
  </ContentContainer>
</template>
