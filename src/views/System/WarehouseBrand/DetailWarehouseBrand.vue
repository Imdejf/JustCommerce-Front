<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import ContentContainer from '/@/layouts/ContentContainer.vue'
import WarehouseBrandNavbar from '/@/components/Page/System/WarehouseBrand/WarehouseBrandNavbar.vue'
import type { WarehouseBrandDto } from '/@/types/brand/WarehouseBrand'

const route = useRoute()
const warehouse = ref<WarehouseBrandDto | null>(null)

const getById = (id: string) => {
  return Api.brands.getWarehouseBrandById(id)
}

onMounted(async () => {
  const id = route.params.id as string
  const result = await getById(id)
  warehouse.value = result.data
})
</script>

<template>
  <ContentContainer>
    <template #navbar>
      <WarehouseBrandNavbar :id="route.params.id" :warehouse="warehouse" />
    </template>

    <div v-if="warehouse" class="h-full">
      <InfoBox>
        <FormKit type="text" label="Nazwa magazynu" :placeholder="warehouse.warehouseName" disabled />
        <FormKit type="text" label="Miasto" :placeholder="warehouse.city" disabled />
        <FormKit
          type="text"
          label="Adres"
          :placeholder="`${warehouse.street} ${warehouse.number}`"
          disabled
        />
        <FormKit type="text" label="Kod pocztowy" :placeholder="warehouse.postCode" disabled />
      </InfoBox>
    </div>
  </ContentContainer>
</template>
