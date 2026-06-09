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
  { prop: 'name', label: 'Nazwa' },
  { prop: 'slug', label: 'Slug', type: 'slug' }
]

const attributeGroups = ref<any>({ items: [] })

onMounted(async () => {
  loading.value = true
  try {
    attributeGroups.value = await Api.categoryBlogs.filterList(cookies.get('dsStore'), '', 1, 999)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})

const handleAdd = () => {
  router.push('/manager-content/category-blogs/add')
}
</script>

<template>
  <DataTable
    :data-table="attributeGroups?.items"
    :columns="tableColumns"
    :link="'/manager-content/category-blogs/detail'"
    title="Kategorie blog"
    subtitle="Zarządzaj kategoriami wpisów na blogu sklepu."
    search-placeholder="Szukaj po nazwie lub slugu..."
    :loading="loading"
  >
    <template #topbar>
      <el-button type="primary" @click="handleAdd">Dodaj kategorię</el-button>
    </template>
  </DataTable>
</template>
