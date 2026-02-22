<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRouter } from 'vue-router'

const cookies = new Cookies()
const router = useRouter()

const tableColumns = [
  { prop: 'warehouseName', label: 'Nazwa magazynu' },
  { prop: 'city', label: 'Miasto' },
  { prop: 'isPublished', label: 'Aktywny' }
]

const warehouses = ref<any[]>([])

onMounted(async () => {
  try {
    const storeId = cookies.get('dsStore')
    var result = await Api.brands.getAllWarehouseBrand(storeId)
    warehouses.value = result?.data ?? []
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/system/warehousebrand/add')
}
</script>

<template>
  <DataTable
    :dataTable="warehouses"
    :columns="tableColumns"
    :link="'/system/warehousebrand/detail'"
  >
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>
        Dodaj magazyn
      </el-button>
    </template>
  </DataTable>
</template>
