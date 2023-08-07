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
  { prop: 'displayOrder', label: 'DisplayOrder' }
]

const productAttributes = ref([])

onMounted(async () => {
  try {
    productAttributes.value = await Api.productAttributes.filterList(
      cookies.get('dsStore'),
      '',
      1,
      30
    )
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/catalog/product-attribute/add')
}
</script>

<template>
  <DataTable
    :dataTable="productAttributes?.items"
    :columns="tableColumns"
    :link="'/catalog/product-attribute/detail'"
  >
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
    </template>
  </DataTable>
</template>
