<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import BrandNavbar from '/@/components/Page/System/Brand/BrandNavbar.vue'
import type { BrandDto } from '/@/types/Brand/brand'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'
import type { LanguageDTO } from '/@/types/language/Language'

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
  <ContentContainer>
    <template #navbar>
      <BrandNavbar :id="route.params.id" :brand="brand" />
    </template>
    <div v-if="brand " class="h-full">
      <InfoBox>
        <FormKit type="text" label="Nazwa" :placeholder="brand.name" :disabled="true" />
      </InfoBox>
    </div>
  </ContentContainer>
</template>
