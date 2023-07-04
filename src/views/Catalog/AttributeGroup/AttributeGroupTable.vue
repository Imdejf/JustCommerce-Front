<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import { useRouter } from 'vue-router'

const cookies = new Cookies()
const router = useRouter()
const tableColumns = [{ prop: 'name', label: 'Name' }]

const attributeGroups = ref([])

onMounted(async () => {
  try {
    attributeGroups.value = await Api.attributeGroups.filterList(cookies.get('dsStore'), '', 1, 1)
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/catalog/attribute-group/add')
}
</script>

<template>
  <DataTable
    :dataTable="attributeGroups?.items"
    :columns="tableColumns"
    :link="'/catalog/attribute-group/detail'"
  >
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
    </template>
  </DataTable>
</template>
