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
  { prop: 'slug', label: 'Slug' }
]

const attributeGroups = ref([])

onMounted(async () => {
  try {
    attributeGroups.value = await Api.categoryBlogs.filterList(cookies.get('dsStore'), '', 1, 1)
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/manager-content/category-blogs/add')
}
</script>

<template>
  <DataTable
    :dataTable="attributeGroups?.items"
    :columns="tableColumns"
    :link="'/manager-content/category-blogs/detail'"
  >
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
    </template>
  </DataTable>
</template>
