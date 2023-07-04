<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import InfoBox from '/@/components/Form/Box/InfoBox.vue'
import { Api } from '/@/services/api'
import type { ProductAttributeDTO } from '/@/types/productAttribute/ProductAttribute.ts'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import ProductAttributeNavbar from '/@/components/Page/Catalog/ProductAttribute/ProductAttributeNavbar.vue'

const route = useRoute()
const productAttribute = ref<ProductAttributeDTO | null>(null)

const getById = (id: string) => {
  return Api.productAttributes.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  productAttribute.value = result.data
})
</script>

<template>
  <ContentContainer>
    <template #navbar>
      <ProductAttributeNavbar :id="route.params.id" :productAttribute="productAttribute" />
    </template>
    <div v-if="productAttribute" class="h-full">
      <InfoBox>
        <FormKit
          type="text"
          label="Meta tytuł"
          :placeholder="productAttribute.name"
          :disabled="true"
        />
      </InfoBox>
    </div>
  </ContentContainer>
</template>
