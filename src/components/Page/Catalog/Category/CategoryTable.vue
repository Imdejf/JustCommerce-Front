<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRouter } from 'vue-router'

const cookies = new Cookies()
const router = useRouter()
const tableColumns = [
  { prop: 'name', label: 'Nazwa' },
  { prop: 'slug', label: 'Slug' },
  { prop: 'isPublished', label: 'Aktywne' },
  { prop: 'main', label: 'Kategoria głowna' },
]

const categories = ref([])

onMounted(async () => {
  try {
    categories.value = await Api.categories.filterList(cookies.get('dsStore'), '', 1000, 1)
    console.log(categories.value)
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/catalog/category/add')
}
</script>

<template>
  <DataTable
    :dataTable="categories?.items"
    :columns="tableColumns"
    :link="'/catalog/category/detail'"
  >
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
    </template>
  </DataTable>
</template>
