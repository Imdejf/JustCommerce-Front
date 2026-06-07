<template>
  <div class="p-3 h-[100%]">
    <el-collapse v-model="filtersExpanded" class="mb-2">
      <el-collapse-item name="filters">
        <template #title>
          <span class="font-bold text-sm px-2">
            Filtry produktów
            <el-tag v-if="activeFiltersCount > 0" size="small" class="ml-2" type="warning">
              {{ activeFiltersCount }}
            </el-tag>
          </span>
        </template>

        <div class="px-3 py-3 bg-white border border-[#d6dfe9] rounded">
          <el-row :gutter="12">
            <el-col :span="5">
              <label class="filter-label">Nazwa produktu</label>
              <el-input
                v-model="filter.name"
                placeholder="Wpisz nazwę..."
                clearable
                @keyup.enter="applyFilters"
              />
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
                  :key="brand.value"
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
                  :key="category.value"
                  :label="category.label"
                  :value="category.value"
                />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Mapowanie Allegro</label>
              <el-select v-model="filter.hasAllegroMapping" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" />
                <el-option label="Nie" :value="false" />
              </el-select>
            </el-col>

            <el-col :span="4">
              <label class="filter-label">Publikacja</label>
              <el-select v-model="filter.isPublished" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Opublikowane" :value="true" />
                <el-option label="Nieopublikowane" :value="false" />
              </el-select>
            </el-col>
          </el-row>

          <el-row :gutter="12" class="mt-3">
            <el-col :span="3">
              <label class="filter-label">Główne produkty</label>
              <el-select v-model="filter.isVisibleIndividually" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Główne" :value="true" />
                <el-option label="Warianty" :value="false" />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Warianty</label>
              <el-select v-model="filter.hasOptions" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Z wariantami" :value="true" />
                <el-option label="Bez wariantów" :value="false" />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Cena od</label>
              <el-input-number
                v-model="filter.minPrice"
                :controls="false"
                :precision="2"
                placeholder="Min"
                class="!w-full"
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Cena do</label>
              <el-input-number
                v-model="filter.maxPrice"
                :controls="false"
                :precision="2"
                placeholder="Max"
                class="!w-full"
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Stan od</label>
              <el-input-number
                v-model="filter.minStock"
                :controls="false"
                :precision="0"
                placeholder="Min"
                class="!w-full"
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Stan do</label>
              <el-input-number
                v-model="filter.maxStock"
                :controls="false"
                :precision="0"
                placeholder="Max"
                class="!w-full"
              />
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

            <el-col :span="3" class="flex items-end gap-2">
              <el-button type="primary" @click="applyFilters">Filtruj</el-button>
              <el-button @click="clearFilters">Wyczyść</el-button>
            </el-col>
          </el-row>
        </div>
      </el-collapse-item>
    </el-collapse>

    <div class="bg-[#f1f4f9] p-2 border-t-[3px] border-[#64748b] rounded-t-xl">
      <div class="flex">
        <span class="flex hover:bg-sky-100 p-1">
          <a @click="fetchTableData" class="rounded-md p-1 text-xs font-semibold cursor-pointer">
            Odśwież produkty
          </a>
        </span>

        <span class="ml-4 flex hover:bg-sky-100 p-1">
          <a @click="openMapping" class="rounded-md p-1 text-xs font-semibold cursor-pointer">
            Mapowanie Allegro
          </a>
        </span>
      </div>
    </div>

    <div class="table-container">
      <el-table
        class="pt-[1px] !bg-[#d6dfe9]"
        :data="dataTable.items"
        :row-key="rowKey"
        @row-click="handleRowClick"
        @row-dblclick="openMapping"
        :border="true"
        style="width: 100%; min-height: 81vh;"
        :row-class-name="rowClassName"
      >
        <el-table-column label="Zdjęcie" width="100" label-class-name="order_label">
          <template #default="prop">
            <img
              v-if="getProductImage(prop.row)"
              :src="getProductImage(prop.row)"
              class="object-contain w-[45px] h-[45px] m-auto"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="Nazwa produktu" label-class-name="order_label">
          <template #default="{ row }">
            <div class="cell-tight">
              <strong>{{ row.name || row.productName || '-' }}</strong>
              <div v-if="row.identificationCode">
                Kod producenta: {{ row.identificationCode }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Cena" width="120" label-class-name="order_label">
          <template #default="prop">
            {{ formatPrice(prop.row.price || prop.row.netPrice || prop.row.grossPrice) }}
          </template>
        </el-table-column>

        <el-table-column label="Stan" width="100" label-class-name="order_label">
          <template #default="prop">
            {{ prop.row.stockQuantity ?? prop.row.stock ?? prop.row.quantity ?? '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Producent" width="160" label-class-name="order_label">
          <template #default="prop">
            {{ prop.row.brandName || prop.row.brand?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Mapowanie" width="140" label-class-name="order_label">
          <template #default="prop">
            <el-tag :type="prop.row.hasAllegroMapping || prop.row.allegroMappingId || prop.row.allegroOfferId ? 'success' : 'danger'">
              {{ prop.row.hasAllegroMapping || prop.row.allegroMappingId || prop.row.allegroOfferId ? 'Tak' : 'Nie' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Oferta Allegro" width="160" label-class-name="order_label">
          <template #default="prop">
            <span v-if="prop.row.allegroOfferId">
              {{ prop.row.allegroOfferId }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="Akcje" width="150" label-class-name="order_label">
          <template #default="prop">
            <el-button size="small" color="#ea580c" @click.stop="openMappingByRow(prop.row)">
              Allegro
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-pagination
      background
      layout="prev, pager, next"
      :current-page="filter.pageNumber"
      :page-size="filter.pageSize"
      :total="dataTable.totalCount"
      @current-change="handlePageChange"
      class="m-2"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
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
  hasAllegroMapping: boolean | null
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

const route = useRoute()
const router = useRouter()
const toast = useToast()
const cookies = new Cookies()

const selectedRow = ref<any>(null)
const selectedRowId = ref<string | null>(null)
const filtersExpanded = ref<string[]>(['filters'])
const isSyncingFromRoute = ref(false)
const brands = ref<Array<{ value: string | null; label: string }>>([])
const categories = ref<Array<{ value: string | null; label: string }>>([])

const dataTable = ref<any>({
  items: [],
  totalCount: 0,
  pageNumber: 1
})

const createDefaultFilters = (): ProductFilters => ({
  storeId: cookies.get('dsStore'),
  name: null,
  identificationCode: null,
  brandId: null,
  categoryId: null,
  hasAllegroMapping: null,
  isPublished: null,
  isVisibleIndividually: null,
  hasOptions: null,
  minPrice: null,
  maxPrice: null,
  minStock: null,
  maxStock: null,
  createdFrom: null,
  pageNumber: 1,
  pageSize: 15
})

const buildFiltersFromQuery = (): ProductFilters => {
  const defaults = createDefaultFilters()

  return {
    ...defaults,
    name: parseQueryString(route.query, 'name', null),
    identificationCode: parseQueryString(route.query, 'identificationCode', null),
    brandId: parseQueryString(route.query, 'brandId', null),
    categoryId: parseQueryString(route.query, 'categoryId', null),
    hasAllegroMapping: parseQueryBoolean(route.query, 'hasAllegroMapping', null),
    isPublished: parseQueryBoolean(route.query, 'isPublished', null),
    isVisibleIndividually: parseQueryBoolean(route.query, 'isVisibleIndividually', null),
    hasOptions: parseQueryBoolean(route.query, 'hasOptions', null),
    minPrice: parseQueryNumber(route.query, 'minPrice', null),
    maxPrice: parseQueryNumber(route.query, 'maxPrice', null),
    minStock: parseQueryNumber(route.query, 'minStock', null),
    maxStock: parseQueryNumber(route.query, 'maxStock', null),
    createdFrom: parseDateQuery(route.query, 'createdFrom'),
    pageNumber: parseQueryPage(route.query, 1),
    pageSize: parseQueryNumber(route.query, 'pageSize', 15) || 15
  }
}

const buildQueryFromFilters = (filters: ProductFilters) => {
  const query: Record<string, string> = {}

  setQueryString(query, 'name', filters.name)
  setQueryString(query, 'identificationCode', filters.identificationCode)
  setQueryString(query, 'brandId', filters.brandId)
  setQueryString(query, 'categoryId', filters.categoryId)
  setQueryBoolean(query, 'hasAllegroMapping', filters.hasAllegroMapping)
  setQueryBoolean(query, 'isPublished', filters.isPublished)
  setQueryBoolean(query, 'hasOptions', filters.hasOptions)
  setQueryBoolean(query, 'isVisibleIndividually', filters.isVisibleIndividually)
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
  if (filter.value.hasAllegroMapping !== null) count++
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

const syncFiltersToUrl = (filters: ProductFilters) => {
  router.replace({ query: buildQueryFromFilters(filters) })
}

const buildPredicateObject = () => {
  const predicate: Record<string, unknown> = {}

  if (filter.value.name) predicate.Name = filter.value.name
  if (filter.value.identificationCode) predicate.IdentificationCode = filter.value.identificationCode
  if (filter.value.brandId) predicate.BrandId = filter.value.brandId
  if (filter.value.categoryId) predicate.CategoryId = filter.value.categoryId
  if (filter.value.hasAllegroMapping !== null) predicate.HasAllegroMapping = filter.value.hasAllegroMapping
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

const rowKey = (row: any) => {
  return row.id || row.productId
}

const handleRowClick = (row: any) => {
  selectedRow.value = row
  selectedRowId.value = row.id || row.productId
}

const rowClassName = ({ row }: any) => {
  const id = row.id || row.productId
  return id === selectedRowId.value ? 'selected-row' : ''
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

    dataTable.value = normalizeTableResult(result)
  } catch (error) {
    console.error(error)
    toast.error('Wystąpił problem z pobraniem produktów')
  }
}

const normalizeTableResult = (result: any) => {
  const data = result?.data || result
  const table = data?.data || data

  return {
    items: table?.items || [],
    totalCount: table?.totalCount || 0,
    pageNumber: table?.pageNumber || filter.value.pageNumber
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

const loadBrands = async () => {
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
    console.error(error)
  }
}

const loadCategories = async () => {
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
    console.error(error)
  }
}

const openMapping = () => {
  if (!selectedRow.value) {
    toast.warning('Wybierz produkt')
    return
  }

  openMappingByRow(selectedRow.value)
}

const openMappingByRow = (row: any) => {
  const productId = row.id || row.productId

  if (!productId) {
    toast.error('Brak ID produktu')
    return
  }

  router.push({
    path: `/allegro/products/${productId}`,
    query: route.query
  })
}

const handlePageChange = async (page: number) => {
  filter.value.pageNumber = page
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const getProductImage = (row: any) => {
  return (
    row.filePath ||
    row.thumbnailImage?.filePath ||
    row.productImage ||
    row.imageUrl ||
    row.mainImageUrl ||
    null
  )
}

const formatPrice = (value: any) => {
  if (value === null || value === undefined) return '-'

  if (typeof value === 'object') {
    const amount = value.amount || value.value
    const currency = value.currency || 'PLN'
    return `${amount} ${currency}`
  }

  return `${value} zł`
}

const listQuery = computed(() => JSON.stringify(route.query))

watch(listQuery, async () => {
  if (isSyncingFromRoute.value) {
    return
  }

  const parsed = buildFiltersFromQuery()

  if (!filtersChanged(filter.value, parsed)) {
    return
  }

  isSyncingFromRoute.value = true
  filter.value = parsed
  await fetchTableData()
  isSyncingFromRoute.value = false
})

onMounted(async () => {
  if (activeFiltersCount.value > 0) {
    filtersExpanded.value = ['filters']
  }

  await Promise.all([loadBrands(), loadCategories(), fetchTableData()])
})
</script>

<style>
.filter-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}

.cell {
  text-align: center;
  font-size: 11px;
}

.cell-tight {
  font-size: 11px;
  line-height: 16px;
  padding: 2px 4px;
  white-space: pre-line;
}

.order_label {
  color: #435368;
  background-color: #f1f4f9 !important;
  border-right: 1px solid #fafbfd !important;
  border-top: 1.1px solid #fafbfd !important;
  margin: 2px !important;
}

.table-container {
  overflow-y: hidden;
  overflow-x: hidden;
  border: 1px solid #d6dfe9;
}

.el-table__body-wrapper {
  max-height: 68vh !important;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid #d6dfe9;
}

.selected-row {
  background-color: #cce7ff !important;
}

.el-table .cell {
  font-size: 11px;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
</style>
