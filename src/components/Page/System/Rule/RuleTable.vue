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
  { prop: 'name', label: 'Nazwa reguły' },
  { prop: 'active', label: 'Status', type: 'boolean' }
]

const rules = ref<any>({ items: [] })

onMounted(async () => {
  loading.value = true
  try {
    rules.value = await Api.rules.filterList(cookies.get('dsStore'), '', 1, 999)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})

const handleAdd = () => {
  router.push('/system/rule/add')
}
</script>

<template>
  <DataTable
    :data-table="rules?.items"
    :columns="tableColumns"
    :link="'/system/rule/detail'"
    title="Reguły systemowe"
    subtitle="Konfiguracja reguł biznesowych i automatyzacji w sklepie."
    search-placeholder="Szukaj reguły..."
    :loading="loading"
  >
    <template #topbar>
      <el-button type="primary" @click="handleAdd">Dodaj regułę</el-button>
    </template>
  </DataTable>
</template>
