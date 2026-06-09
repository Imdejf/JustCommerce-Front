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
  { prop: 'name', label: 'Producent' },
  { prop: 'isPublished', label: 'Status', type: 'boolean' }
]

const brands = ref<any>({ items: [] })

onMounted(async () => {
  loading.value = true
  try {
    brands.value = await Api.brands.filterList(cookies.get('dsStore'), '', 1, 999)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})

const handleAdd = () => {
  router.push('/system/brand/add')
}
</script>

<template>
  <DataTable
    :data-table="brands?.items"
    :columns="tableColumns"
    :link="'/system/brand/detail'"
    title="Producenci"
    subtitle="Lista marek i producentów przypisanych do produktów."
    search-placeholder="Szukaj producenta..."
    :loading="loading"
  >
    <template #topbar>
      <el-button type="primary" @click="handleAdd">Dodaj producenta</el-button>
    </template>
  </DataTable>
</template>
