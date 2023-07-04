<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import InfoBox from '/@/components/Form/Box/InfoBox.vue'
import { Api } from '/@/services/api'
import type { ProductOptionDTO } from '/@/types/productOption/ProductOption'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import ProductOptionNavbar from '/@/components/Page/Catalog/ProductOption/ProductOptionNavbar.vue'

const route = useRoute()
const productOption = ref<ProductOptionDTO | null>(null)

const getById = (id: string) => {
  return Api.productOptions.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  productOption.value = result.data
})
</script>

<template>
  <ContentContainer>
    <template #navbar>
      <ProductOptionNavbar :id="route.params.id" :productOption="productOption" />
    </template>
    <div v-if="productOption" class="h-full">
      <InfoBox>
        <FormKit
          type="text"
          label="Meta tytuł"
          :placeholder="productOption.name"
          :disabled="true"
        />
      </InfoBox>
    </div>
  </ContentContainer>
</template>
