<script lang="ts" setup>
import { Api } from '/@/services/api'
import WarehouseBrandForm from '/@/components/Page/System/WarehouseBrand/WarehouseBrandForm.vue'
import type { WarehouseBrandDto } from '/@/types/brand/WarehouseBrand'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const warehouse = ref<WarehouseBrandDto | null>(null)

const getById = (id: string) => {
  return Api.brands.getWarehouseBrandById(id)
}
onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  warehouse.value = result.data
})
</script>

<template>
  <div v-if="warehouse">
    <WarehouseBrandForm :warehouse="warehouse" :updated="true" />
  </div>
</template>
