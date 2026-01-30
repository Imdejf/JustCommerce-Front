<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref, watch } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'


const cookies = new Cookies()
const router = useRouter()
const brands = ref([])
const categories = ref([])
const emit = defineEmits(['open-import'])

function handleClick() {
  emit('open-import')
}

const filter = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 120,
  SmartTableParam: {
    Search: {
      PredicateObject: {
        Name: null,
        HasOptions: null,
        IsVisibleIndividually: 1,
        IsPublished: null,
        CreatedOn: null,
        BrandId: null
      }
    }
  }
})

const filterStorage = sessionStorage.getItem('filter')
const parsedFilter = JSON.parse(filterStorage)

if (parsedFilter) {
  filter.value = parsedFilter
}

const tableColumns = [
  { prop: 'filePath', label:'Zdjęcie'},
  { prop: 'name', label: 'Nazwa' },
  { prop: 'slug', label: 'Slug' },
  { prop: 'identificationCode', label: 'Kod produktu' },
    { prop: 'price', label: 'Cena' },
  { prop: 'producentPrice', label: 'Cena producenta' },
  { prop: 'priceMarkup', label: 'Narzut' }
]

const products = ref([])

onMounted(async () => {
  allBrands()
  allCategories()
  try {
    const payload = {
      body: JSON.stringify(filter.value)
    }
    const result = await Api.products.smartTable(payload)
    products.value = result.data
    console.log(products.value)
  } catch (error) {
    console.error(error)
  }
})

const allBrands = async () => {
  try {
    const result = await Api.brands.listByStoreId()
    brands.value = [
      { value: null, label: 'Wszyscy' },
      ...result.items.map((item) => ({
        value: item.id,
        label: item.name
      }))
    ]
  } catch (error) {
    console.error('Błąd podczas pobierania producentów:', error)
  }
}

const allCategories = async () => {
  try {
    const result = await Api.categories.listByStoreId()

    categories.value = [
      { value: null, label: 'Wszyscy' },
      ...result.items.map((item) => ({
        value: item.id,
        label: item.name
      }))
    ]
  } catch (error) {
    console.error('Błąd podczas pobierania kategorii:', error)
  }
}

const handleAdd = () => {
  router.push('/catalog/product/add')
}

const activeNames = ref(['1'])
const handleCollapse = (val: CollapseModelValue) => {
  console.log(val)
}

const exportProductToExcel = async () => {
  const body = {
    storeId: cookies.get('dsStore')
  }
  const payload = {
    body: JSON.stringify(body)
  }
  const result = await Api.products.exportProductToExcel(payload)
  const blob = await result.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Produkty_${new Date().toISOString().replace(/[:.]/g, '_')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

const exportProductFromExcel = () => {
  
}

watch(
  filter.value,
  async (newFilter, oldFilter) => {
    newFilter.PageSize = 120
    try {
      const payload = {
        body: JSON.stringify(filter.value)
      }

      window.sessionStorage.setItem('filter', JSON.stringify(newFilter))

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
  <div class="py-5 px-10">
    <el-collapse v-model="activeNames">
    <el-collapse-item name="1">
      <template #title>
        <span class="font-bold text-lg p-5">
          <el-icon class="mr-2"><Search /></el-icon> Szukaj
        </span>
      </template>

      <div class="px-10 py-4 bg-white rounded-lg shadow">
        <el-row :gutter="20">
          <el-col :span="6">
            <FormKit type="text"  label="Nazwa produktu" placeholder="Wpisz nazwę produktu..."  v-model="filter.SmartTableParam.Search.PredicateObject.Name" />
            <div class="mt-6">
              <FormKit
                label="Producenci"
                type="select"
                name="producer"
                v-model="filter.SmartTableParam.Search.PredicateObject.BrandId"
                :options="brands"
              />
            </div>
            <div class="mt-6">
              <FormKit
                label="Główne produkty"
                type="select"
                name="isVisibleIndividually"
                placeholder="Produkty"
                v-model="filter.SmartTableParam.Search.PredicateObject.IsVisibleIndividually"
                :options="[
                  { label: 'Główne', value: 'true' },
                  { label: 'Wszystkie', value: 'false' }
                ]"
              />
            </div>
            <div class="mt-6">
              <FormKit
                type="checkbox"
                label="Pokaż tylko ukryte"
                help=""
                :value="false"
              />
            </div>
          </el-col>
          <el-col :span="10">
            <el-col>
            <div class="">
              <FormKit
                label="Producenci"
                type="select"
                name="producer"
                v-model="filter.SmartTableParam.Search.PredicateObject.CategoryId"
                :options="categories"
              />
            </div>
          </el-col>
          </el-col>
        </el-row>
      </div>
    </el-collapse-item>
  </el-collapse>
  </div>
  <DataTable :dataTable="products?.items" :columns="tableColumns" :link="'/catalog/product/detail'">
    <template #control>
          <el-dropdown>
            <el-button type="primary">
              Akcje<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="exportProductToExcel()">Eksportuj produkty</el-dropdown-item>
                <el-dropdown-item @click="handleClick">Importuj produkty</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
    </template>
    <template #filter>
      <div className="flex section__filter flex-wrap items-center justify-between gap-x-6 gap-y-2 ">
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
