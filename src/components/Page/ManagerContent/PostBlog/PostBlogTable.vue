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
  { prop: 'name', label: 'Tytuł' },
  { prop: 'slug', label: 'Slug', type: 'slug' }
]

const postBlogs = ref<any>({ items: [] })

onMounted(async () => {
  loading.value = true
  try {
    postBlogs.value = await Api.postBlogs.filterList(cookies.get('dsStore'), '', 1, 999)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})

const handleAdd = () => {
  router.push('/manager-content/post-blogs/add')
}
</script>

<template>
  <DataTable
    :data-table="postBlogs?.items"
    :columns="tableColumns"
    :link="'/manager-content/post-blogs/detail'"
    title="Posty blog"
    subtitle="Lista artykułów i wpisów publikowanych w blogu."
    search-placeholder="Szukaj po tytule lub slugu..."
    :loading="loading"
  >
    <template #topbar>
      <el-button type="primary" @click="handleAdd">Dodaj post</el-button>
    </template>
  </DataTable>
</template>
