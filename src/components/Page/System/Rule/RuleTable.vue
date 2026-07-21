<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import ImportFile from '/@/components/Form/Modal/ImportFile.vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Download, Upload } from '@element-plus/icons-vue'

const cookies = new Cookies()
const router = useRouter()
const toast = useToast()
const loading = ref(false)
const exportLoading = ref(false)
const showImportModal = ref(false)

const tableColumns = [
  { prop: 'name', label: 'Nazwa reguły' },
  { prop: 'active', label: 'Status', type: 'boolean' }
]

const rules = ref<any>({ items: [] })

const loadRules = async () => {
  loading.value = true
  try {
    rules.value = await Api.rules.filterList(cookies.get('dsStore'), '', 1, 999)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(loadRules)

const handleAdd = () => {
  router.push('/system/rule/add')
}

const exportRules = async () => {
  exportLoading.value = true
  try {
    const result = await Api.rules.exportToExcel({
      body: JSON.stringify({ storeId: cookies.get('dsStore') })
    })
    const blob = await result.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Reguly_transportowe_${new Date().toISOString().replace(/[:.]/g, '_')}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success('Eksport reguł zakończony')
  } catch {
    toast.error('Błąd eksportu reguł')
  } finally {
    exportLoading.value = false
  }
}

const onImportClose = async (success?: boolean) => {
  showImportModal.value = false
  if (success) await loadRules()
}
</script>

<template>
  <div>
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
        <el-button :icon="Download" :loading="exportLoading" @click="exportRules">Eksport Excel</el-button>
        <el-button :icon="Upload" @click="showImportModal = true">Import Excel</el-button>
      </template>
    </DataTable>

    <ImportFile
      :visible="showImportModal"
      title="Import reguł transportowych"
      :endpoints="['administration/rule/ImportFromExcel']"
      :extra-payload="{ storeId: cookies.get('dsStore') }"
      @close="onImportClose"
    />
  </div>
</template>
