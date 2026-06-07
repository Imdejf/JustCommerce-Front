<script lang="ts" setup>
import { Api } from '/@/services/api'
import { computed, onMounted, ref, watch } from 'vue'
import Cookies from 'universal-cookie'
import DataTable from '/@/components/Form/DataTable/DataTable.vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  filtersChanged,
  parseDateQuery,
  parseQueryBoolean,
  parseQueryNumber,
  parseQueryPage,
  parseQueryString,
  setDateQuery,
  setQueryBoolean,
  setQueryNumber,
  setQueryString
} from '/@/utils/urlTableFilters'

type ProductFilters = {
  storeId: string | number | null
  name: string | null
  identificationCode: string | null
  brandId: string | null
  categoryId: string | null
  isPublished: boolean | null
  isVisibleIndividually: boolean | null
  hasOptions: boolean | null
  minPrice: number | null
  maxPrice: number | null
  minStock: number | null
  maxStock: number | null
  createdFrom: string | null
  pageNumber: number
  pageSize: number
}

const cookies = new Cookies()
const router = useRouter()
const route = useRoute()
const brands = ref<Array<{ value: string | null; label: string }>>([])
const categories = ref<Array<{ value: string | null; label: string }>>([])
const emit = defineEmits(['open-import'])
const filtersExpanded = ref<string[]>(['filters'])
const isSyncingFromRoute = ref(false)

const createDefaultFilters = (): ProductFilters => ({
  storeId: cookies.get('dsStore'),
  name: null,
  identificationCode: null,
  brandId: null,
  categoryId: null,
  isPublished: null,
  isVisibleIndividually: null,
  hasOptions: null,
  minPrice: null,
  maxPrice: null,
  minStock: null,
  maxStock: null,
  createdFrom: null,
  pageNumber: 1,
  pageSize: 120
})

const buildFiltersFromQuery = (): ProductFilters => {
  const defaults = createDefaultFilters()

  return {
    ...defaults,
    name: parseQueryString(route.query, 'name', null),
    identificationCode: parseQueryString(route.query, 'identificationCode', null),
    brandId: parseQueryString(route.query, 'brandId', null),
    categoryId: parseQueryString(route.query, 'categoryId', null),
    isPublished: parseQueryBoolean(route.query, 'isPublished', null),
    isVisibleIndividually: parseQueryBoolean(route.query, 'isVisibleIndividually', null),
    hasOptions: parseQueryBoolean(route.query, 'hasOptions', null),
    minPrice: parseQueryNumber(route.query, 'minPrice', null),
    maxPrice: parseQueryNumber(route.query, 'maxPrice', null),
    minStock: parseQueryNumber(route.query, 'minStock', null),
    maxStock: parseQueryNumber(route.query, 'maxStock', null),
    createdFrom: parseDateQuery(route.query, 'createdFrom'),
    pageNumber: parseQueryPage(route.query, 1),
    pageSize: parseQueryNumber(route.query, 'pageSize', 120) || 120
  }
}

const buildQueryFromFilters = (filters: ProductFilters) => {
  const query: Record<string, string> = {}

  setQueryString(query, 'name', filters.name)
  setQueryString(query, 'identificationCode', filters.identificationCode)
  setQueryString(query, 'brandId', filters.brandId)
  setQueryString(query, 'categoryId', filters.categoryId)
  setQueryBoolean(query, 'isPublished', filters.isPublished)
  setQueryBoolean(query, 'isVisibleIndividually', filters.isVisibleIndividually)
  setQueryBoolean(query, 'hasOptions', filters.hasOptions)
  setQueryNumber(query, 'minPrice', filters.minPrice)
  setQueryNumber(query, 'maxPrice', filters.maxPrice)
  setQueryNumber(query, 'minStock', filters.minStock)
  setQueryNumber(query, 'maxStock', filters.maxStock)
  setDateQuery(query, 'createdFrom', filters.createdFrom)
  setQueryNumber(query, 'page', filters.pageNumber)
  setQueryNumber(query, 'pageSize', filters.pageSize)

  return query
}

const filter = ref<ProductFilters>(buildFiltersFromQuery())

const activeFiltersCount = computed(() => {
  let count = 0

  if (filter.value.name) count++
  if (filter.value.identificationCode) count++
  if (filter.value.brandId) count++
  if (filter.value.categoryId) count++
  if (filter.value.isPublished !== null) count++
  if (filter.value.isVisibleIndividually !== null) count++
  if (filter.value.hasOptions !== null) count++
  if (filter.value.minPrice !== null) count++
  if (filter.value.maxPrice !== null) count++
  if (filter.value.minStock !== null) count++
  if (filter.value.maxStock !== null) count++
  if (filter.value.createdFrom) count++

  return count
})

const tableColumns = [
  { prop: 'filePath', label: 'Zdjęcie' },
  { prop: 'name', label: 'Nazwa' },
  { prop: 'slug', label: 'Slug' },
  { prop: 'identificationCode', label: 'Kod produktu' },
  { prop: 'price', label: 'Cena' },
  { prop: 'producentPrice', label: 'Cena producenta' },
  { prop: 'priceMarkup', label: 'Narzut' }
]

const products = ref<any>({ items: [], totalCount: 0 })

const syncFiltersToUrl = (filters: ProductFilters) => {
  router.replace({ query: buildQueryFromFilters(filters) })
}

const buildPredicateObject = () => {
  const predicate: Record<string, unknown> = {}

  if (filter.value.name) predicate.Name = filter.value.name
  if (filter.value.identificationCode) predicate.IdentificationCode = filter.value.identificationCode
  if (filter.value.brandId) predicate.BrandId = filter.value.brandId
  if (filter.value.categoryId) predicate.CategoryId = filter.value.categoryId
  if (filter.value.isPublished !== null) predicate.IsPublished = filter.value.isPublished
  if (filter.value.isVisibleIndividually !== null) {
    predicate.IsVisibleIndividually = filter.value.isVisibleIndividually
  }
  if (filter.value.hasOptions !== null) predicate.HasOptions = filter.value.hasOptions
  if (filter.value.minPrice !== null) predicate.MinPrice = filter.value.minPrice
  if (filter.value.maxPrice !== null) predicate.MaxPrice = filter.value.maxPrice
  if (filter.value.minStock !== null) predicate.MinStock = filter.value.minStock
  if (filter.value.maxStock !== null) predicate.MaxStock = filter.value.maxStock

  if (filter.value.createdFrom) {
    predicate.CreatedOn = {
      after: new Date(filter.value.createdFrom).toISOString()
    }
  }

  return predicate
}

const fetchTableData = async () => {
  try {
    const payload = {
      body: JSON.stringify({
        StoreId: filter.value.storeId,
        PageNumber: filter.value.pageNumber,
        PageSize: filter.value.pageSize,
        SmartTableParam: {
          Search: {
            PredicateObject: buildPredicateObject()
          }
        }
      })
    }

    const result = await Api.products.smartTable(payload)
    products.value = result.data
  } catch (error) {
    console.error(error)
  }
}

const applyFilters = async () => {
  filter.value.pageNumber = 1
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const clearFilters = async () => {
  filter.value = {
    ...createDefaultFilters(),
    pageNumber: 1,
    pageSize: filter.value.pageSize
  }
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const handlePageChange = async (page: number) => {
  filter.value.pageNumber = page
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

function handleClick() {
  emit('open-import')
}

const allBrands = async () => {
  try {
    const result = await Api.brands.listByStoreId()
    brands.value = [
      { value: null, label: 'Wszyscy' },
      ...result.items.map((item: any) => ({
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
      { value: null, label: 'Wszystkie' },
      ...result.items.map((item: any) => ({
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

const exportProductToExcel = async () => {
  const body = {
    storeId: cookies.get('dsStore')
  }
  const payload = {
    body: JSON.stringify(body)
  }
  const result = await Api.products.exportProductToExcel(payload)
  const blob = await result.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Produkty_${new Date().toISOString().replace(/[:.]/g, '_')}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const listQuery = computed(() => JSON.stringify(route.query))

watch(listQuery, async () => {
  if (isSyncingFromRoute.value) return

  const parsed = buildFiltersFromQuery()
  if (!filtersChanged(filter.value, parsed)) return

  isSyncingFromRoute.value = true
  filter.value = parsed
  await fetchTableData()
  isSyncingFromRoute.value = false
})

onMounted(async () => {
  if (activeFiltersCount.value > 0) {
    filtersExpanded.value = ['filters']
  }

  await Promise.all([allBrands(), allCategories(), fetchTableData()])
})
</script>

<template>
  <div class="py-5 px-10">
    <el-collapse v-model="filtersExpanded" class="mb-4">
      <el-collapse-item name="filters">
        <template #title>
          <span class="font-bold text-lg px-2">
            Filtry produktów
            <el-tag v-if="activeFiltersCount > 0" size="small" class="ml-2" type="warning">
              {{ activeFiltersCount }}
            </el-tag>
          </span>
        </template>

        <div class="px-4 py-4 bg-white rounded-lg shadow border border-[#d6dfe9]">
          <el-row :gutter="12">
            <el-col :span="6">
              <label class="filter-label">Nazwa produktu</label>
              <el-input v-model="filter.name" placeholder="Wpisz nazwę..." clearable @keyup.enter="applyFilters" />
            </el-col>

            <el-col :span="4">
              <label class="filter-label">Kod producenta</label>
              <el-input
                v-model="filter.identificationCode"
                placeholder="Kod..."
                clearable
                @keyup.enter="applyFilters"
              />
            </el-col>

            <el-col :span="4">
              <label class="filter-label">Producent</label>
              <el-select v-model="filter.brandId" clearable placeholder="Wszyscy" class="!w-full">
                <el-option
                  v-for="brand in brands"
                  :key="String(brand.value)"
                  :label="brand.label"
                  :value="brand.value"
                />
              </el-select>
            </el-col>

            <el-col :span="4">
              <label class="filter-label">Kategoria</label>
              <el-select v-model="filter.categoryId" clearable placeholder="Wszystkie" class="!w-full">
                <el-option
                  v-for="category in categories"
                  :key="String(category.value)"
                  :label="category.label"
                  :value="category.value"
                />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Publikacja</label>
              <el-select v-model="filter.isPublished" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Opublikowane" :value="true" />
                <el-option label="Nieopublikowane" :value="false" />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Główne produkty</label>
              <el-select v-model="filter.isVisibleIndividually" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Główne" :value="true" />
                <el-option label="Warianty" :value="false" />
              </el-select>
            </el-col>
          </el-row>

          <el-row :gutter="12" class="mt-3">
            <el-col :span="3">
              <label class="filter-label">Warianty</label>
              <el-select v-model="filter.hasOptions" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Z wariantami" :value="true" />
                <el-option label="Bez wariantów" :value="false" />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Cena od</label>
              <el-input-number v-model="filter.minPrice" :controls="false" :precision="2" class="!w-full" />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Cena do</label>
              <el-input-number v-model="filter.maxPrice" :controls="false" :precision="2" class="!w-full" />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Stan od</label>
              <el-input-number v-model="filter.minStock" :controls="false" :precision="0" class="!w-full" />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Stan do</label>
              <el-input-number v-model="filter.maxStock" :controls="false" :precision="0" class="!w-full" />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Utworzono od</label>
              <el-date-picker
                v-model="filter.createdFrom"
                type="date"
                placeholder="Od"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="!w-full"
                clearable
              />
            </el-col>

            <el-col :span="6" class="flex items-end gap-2">
              <el-button type="primary" @click="applyFilters">Filtruj</el-button>
              <el-button @click="clearFilters">Wyczyść</el-button>
            </el-col>
          </el-row>
        </div>
      </el-collapse-item>
    </el-collapse>

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

      <template #topbar>
        <el-button @click="handleAdd" type="primary" round>Dodaj</el-button>
      </template>
    </DataTable>

    <el-pagination
      v-if="products?.totalCount"
      background
      layout="prev, pager, next"
      :current-page="filter.pageNumber"
      :page-size="filter.pageSize"
      :total="products.totalCount"
      @current-change="handlePageChange"
      class="mt-4"
    />
  </div>
</template>

<style>
.filter-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}
</style>
