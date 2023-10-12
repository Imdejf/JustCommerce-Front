<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRouter } from 'vue-router'

const cookies = new Cookies()
const router = useRouter()
const tableColumns = [
  { prop: 'name', label: 'Name' },
  { prop: 'isPublished', label: 'Aktywny' }
]

const brands = ref([])

onMounted(async () => {
  try {
    brands.value = await Api.brands.filterList(cookies.get('dsStore'), '', 1, 999)
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/system/brand/add')
}
</script>

<template>
  <DataTable :dataTable="brands?.items" :columns="tableColumns" :link="'/system/brand/detail'">
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
    </template>
  </DataTable>
</template>
