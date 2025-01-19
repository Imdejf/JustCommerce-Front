<script setup lang="ts">
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRouter } from 'vue-router'

const cookies = new Cookies()

const router = useRouter()
const tableColumns = [
  { prop: 'name', label: 'Nazwa' },
  { prop: 'description', label: 'Opis' }
]

const certyficatiesAndSafeties = ref([])

onMounted(async () => {
  try {
    certyficatiesAndSafeties.value = await Api.certyficationAndSafeties.filterList(cookies.get('dsStore'), '', 1, 50)
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/safety/CertyficationAndSafety/add')
}

</script>
<template>
  <DataTable
    :dataTable="certyficatiesAndSafeties?.items"
    :columns="tableColumns"
    :link="'/safety/CertyficationAndSafety/detail'"
  >
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
    </template>
  </DataTable>
</template>