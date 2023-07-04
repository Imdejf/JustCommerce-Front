<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRouter } from 'vue-router'

const cookies = new Cookies()
const router = useRouter()
const tableColumns = [{ prop: 'name', label: 'Name' }]

const productOption = ref([])

onMounted(async () => {
  try {
    productOption.value = await Api.productOptions.filterList(cookies.get('dsStore'), '', 1, 1)
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/catalog/product-option/add')
}
</script>

<template>
  <DataTable
    :dataTable="productOption?.items"
    :columns="tableColumns"
    :link="'/catalog/product-option/detail'"
  >
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
    </template>
  </DataTable>
</template>
