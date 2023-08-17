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
  { prop: 'active', label: 'Aktywny' }
]

const rules = ref([])

onMounted(async () => {
  try {
    rules.value = await Api.rules.filterList(cookies.get('dsStore'), '', 1, 999)
    console.log(rules)
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/system/rule/add')
}
</script>

<template>
  <DataTable :dataTable="rules?.items" :columns="tableColumns" :link="'/system/rule/detail'">
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
    </template>
  </DataTable>
</template>
