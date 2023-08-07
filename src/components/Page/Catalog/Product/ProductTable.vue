<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref, watch } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRouter } from 'vue-router'

const cookies = new Cookies()
const router = useRouter()
const filter = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 30,
  SmartTableParam: {
    Search: {
      PredicateObject: {
        Name: null,
        HasOptions: null,
        IsVisibleIndividually: null,
        IsPublished: null,
        CreatedOn: null
      }
    }
  }
})

const tableColumns = [{ prop: 'name', label: 'Name' }]

const products = ref([])

onMounted(async () => {
  try {
    const payload = {
      body: JSON.stringify(filter.value)
    }
    const result = await Api.products.smartTable(payload)
    products.value = result.data
  } catch (error) {
    console.error(error)
  }
})

const handleAdd = () => {
  router.push('/catalog/product/add')
}

watch(
  filter.value,
  async (newFilter, oldFilter) => {
    try {
      const payload = {
        body: JSON.stringify(filter.value)
      }
      const result = await Api.products.smartTable(payload)
      products.value = result.data
    } catch (error) {
      console.error(error)
    }
  },
  { deep: true }
)
</script>

<template>
  <DataTable :dataTable="products?.items" :columns="tableColumns" :link="'/catalog/product/detail'">
    <template #filter>
      <div className="flex section__filter flex-wrap items-center justify-end gap-x-6 gap-y-2 ">
        <FormKit
          type="select"
          name="country"
          placeholder="Produkty"
          v-model="filter.SmartTableParam.Search.PredicateObject.IsVisibleIndividually"
          :options="[
            { label: 'Główne', value: 'true' },
            { label: 'Wszystkie', value: 'false' }
          ]"
        />
        <FormKit
          type="search"
          placeholder="Szukaj..."
          v-model="filter.SmartTableParam.Search.PredicateObject.Name"
        />
      </div>
    </template>
    <template #topbar>
      <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
    </template>
  </DataTable>
</template>

<style>
.section__filter .formkit-outer {
  margin: auto;
}
.section__filter .formkit-inner {
  height: 30px;
}
</style>
