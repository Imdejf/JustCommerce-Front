<script setup lang="ts">
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRouter } from 'vue-router'

const cookies = new Cookies()
const router = useRouter()
const loading = ref(false)

const tableColumns = [
  { prop: 'name', label: 'Nazwa' },
  { prop: 'description', label: 'Opis' }
]

const certyficatiesAndSafeties = ref<any>({ items: [] })

onMounted(async () => {
  loading.value = true
  try {
    certyficatiesAndSafeties.value = await Api.certyficationAndSafeties.filterList(
      cookies.get('dsStore'),
      '',
      1,
      999
    )
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})

const handleAdd = () => {
  router.push('/safety/CertyficationAndSafety/add')
}
</script>

<template>
  <DataTable
    :data-table="certyficatiesAndSafeties?.items"
    :columns="tableColumns"
    :link="'/safety/CertyficationAndSafety/detail'"
    title="Certyfikaty i bezpieczeństwo"
    subtitle="Dokumenty, certyfikaty oraz informacje o bezpieczeństwie produktów."
    search-placeholder="Szukaj po nazwie lub opisie..."
    :loading="loading"
  >
    <template #topbar>
      <el-button type="primary" @click="handleAdd">Dodaj wpis</el-button>
    </template>
  </DataTable>
</template>
