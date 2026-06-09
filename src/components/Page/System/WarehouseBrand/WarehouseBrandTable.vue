<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRouter } from 'vue-router'

const cookies = new Cookies()
const router = useRouter()
const loading = ref(false)

const tableColumns = [
  { prop: 'warehouseName', label: 'Magazyn' },
  { prop: 'city', label: 'Miasto' },
  { prop: 'isPublished', label: 'Status', type: 'boolean' }
]

const warehouses = ref<any[]>([])

onMounted(async () => {
  loading.value = true
  try {
    const storeId = cookies.get('dsStore')
    const result = await Api.brands.getAllWarehouseBrand(storeId)
    warehouses.value = result?.data ?? []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})

const handleAdd = () => {
  router.push('/system/warehousebrand/add')
}
</script>

<template>
  <DataTable
    :data-table="warehouses"
    :columns="tableColumns"
    :link="'/system/warehousebrand/detail'"
    title="Magazyny"
    subtitle="Magazyny powiązane z producentami i dostępnością towaru."
    search-placeholder="Szukaj magazynu lub miasta..."
    :loading="loading"
  >
    <template #topbar>
      <el-button type="primary" @click="handleAdd">Dodaj magazyn</el-button>
    </template>
  </DataTable>
</template>
