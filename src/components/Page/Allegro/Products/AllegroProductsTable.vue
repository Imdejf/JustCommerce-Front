<template>
  <div class="p-3 h-[100%]">
    <div class="bg-[#f1f4f9] p-2 border-t-[3px] border-[#64748b] rounded-t-xl">
      <div class="flex justify-between">
        <div class="flex">
          <span class="flex hover:bg-sky-100 p-1">
            <a @click="fetchTableData" class="rounded-md p-1 text-xs font-semibold">
              Odśwież produkty
            </a>
          </span>

          <span class="ml-4 flex hover:bg-sky-100 p-1">
            <a @click="openMapping" class="rounded-md p-1 text-xs font-semibold">
              Mapowanie Allegro
            </a>
          </span>
        </div>

        <el-input
          style="border-radius: 1px !important; font-size:12px;"
          placeholder="Nazwa produktu lub kod"
          v-model="filter.searchString"
          class="!font-s !w-[240px]"
          @blur="sendFilterUpdate"
        />
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
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Zdjęcie
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

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
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Nazwa produktu
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1">
                <el-input
                  placeholder="Szukaj..."
                  class="filter-compact"
                  v-model="filter.searchString"
                  @blur="sendFilterUpdate"
                />
              </div>
            </div>
          </template>

          <template #default="{ row }">
            <div class="cell-tight">
              <strong>{{ row.name || row.productName || '-' }}</strong>
              <div v-if="row.identificationCode || row.sku">
                Kod: {{ row.identificationCode || row.sku }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Cena" width="120" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Cena
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            {{ formatPrice(prop.row.price || prop.row.netPrice || prop.row.grossPrice) }}
          </template>
        </el-table-column>

        <el-table-column label="Stan" width="100" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Stan
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            {{ prop.row.stockQuantity ?? prop.row.stock ?? prop.row.quantity ?? '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Producent" width="160" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Producent
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            {{ prop.row.brandName || prop.row.brand?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Mapowanie" width="140" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Mapowanie
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            <el-tag :type="prop.row.allegroMappingId || prop.row.allegroOfferId ? 'success' : 'danger'">
              {{ prop.row.allegroMappingId || prop.row.allegroOfferId ? 'Tak' : 'Nie' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Oferta Allegro" width="160" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Oferta Allegro
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            <span v-if="prop.row.allegroOfferId">
              {{ prop.row.allegroOfferId }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="Akcje" width="150" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Akcje
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

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
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const cookies = new Cookies()

const selectedRow = ref<any>(null)
const selectedRowId = ref<string | null>(null)

const dataTable = ref<any>({
  items: [],
  totalCount: 0,
  pageNumber: 1
})

const filter = ref({
  storeId: cookies.get('dsStore'),
  searchString: '',
  pageNumber: 1,
  pageSize: 15
})

const getPageFromQuery = () => {
  const raw = route.query.page
  const p = Number(raw)
  return Number.isFinite(p) && p > 0 ? p : 1
}

filter.value.pageNumber = getPageFromQuery()

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
            PredicateObject: {
              ProductName: filter.value.searchString || null
            }
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

const sendFilterUpdate = async () => {
  filter.value.pageNumber = 1

  router.replace({
    query: {
      ...route.query,
      page: '1'
    }
  })

  await fetchTableData()
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

  router.push(`/allegro/products/${productId}`)
}

const handlePageChange = async (page: number) => {
  filter.value.pageNumber = page

  router.replace({
    query: {
      ...route.query,
      page: String(page)
    }
  })

  await fetchTableData()
}

const getProductImage = (row: any) => {
  return (
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

watch(
  () => route.query.page,
  async () => {
    const page = getPageFromQuery()

    if (page !== filter.value.pageNumber) {
      filter.value.pageNumber = page
      await fetchTableData()
    }
  }
)

onMounted(async () => {
  await fetchTableData()
})
</script>

<style>
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

.header-content > div:first-child {
  padding: 6px !important;
  font-size: 11px !important;
}

.search-row--compact {
  padding: 2px 6px !important;
}

.search-row .el-input__wrapper {
  border-radius: 0px 15px 15px 0px !important;
  padding: 0px;
}

.filter-compact {
  width: 100% !important;
}

.filter-compact .el-input__wrapper,
.filter-compact.el-select .el-input__wrapper,
.filter-compact.el-input-number .el-input__wrapper {
  height: 22px !important;
  min-height: 22px !important;
  padding: 0 8px !important;
}

.filter-compact .el-input__inner,
.filter-compact.el-select .el-input__inner {
  height: 22px !important;
  line-height: 22px !important;
  font-size: 11px !important;
}

.filter-compact.el-input-number {
  height: 22px !important;
}

.filter-compact.el-input-number .el-input-number__increase,
.filter-compact.el-input-number .el-input-number__decrease {
  display: none !important;
}
</style>