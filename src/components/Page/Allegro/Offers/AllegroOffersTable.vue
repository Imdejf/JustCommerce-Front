<template>
  <div class="p-3 h-[100%]">
    <div class="bg-[#f1f4f9] p-2 border-t-[3px] border-[#64748b] rounded-t-xl">
      <div class="flex justify-between">
        <div class="flex">
          <span class="flex hover:bg-sky-100 p-1">
            <a @click="fetchTableData" class="rounded-md p-1 text-xs font-semibold">
              Odśwież oferty
            </a>
          </span>

          <span class="ml-4 flex hover:bg-sky-100 p-1">
            <a @click="syncOffersFromAllegro" class="rounded-md p-1 text-xs font-semibold">
              Połącz oferty ze sklepem
            </a>
          </span>

          <span class="ml-4 flex hover:bg-sky-100 p-1">
            <a @click="showSelectedOffer" class="rounded-md p-1 text-xs font-semibold">
              Szczegóły oferty
            </a>
          </span>
        </div>

        <el-input
          style="border-radius: 1px !important; font-size:12px;"
          placeholder="Szukaj oferty Allegro..."
          v-model="filter.search"
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
        @row-dblclick="showSelectedOffer"
        :border="true"
        style="width: 100%; min-height: 81vh;"
        :row-class-name="rowClassName"
      >
        <el-table-column label="ID oferty" width="170" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                ID oferty
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1">
                <el-input
                  placeholder="Szukaj..."
                  class="filter-compact"
                  v-model="filter.search"
                  @blur="sendFilterUpdate"
                />
              </div>
            </div>
          </template>

          <template #default="prop">
            <div class="cell-tight">
              {{ prop.row.offerId || prop.row.id || '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Produkt" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Produkt
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1">
                <el-input
                  placeholder="Nazwa produktu..."
                  class="filter-compact"
                  v-model="filter.search"
                  @blur="sendFilterUpdate"
                />
              </div>
            </div>
          </template>

          <template #default="{ row }">
            <div class="cell-tight">
              <strong>{{ row.productName || row.name || row.title || '-' }}</strong>
              <div v-if="row.productIdentificationCode || row.externalId || row.productId">
                Kod: {{ row.productIdentificationCode || row.externalId || row.productId }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Status" width="170" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Status
              </div>
              <div class="bg-[#e0e8f0] h-[50px] py-2 px-2 block">
                <el-select
                  v-model="filter.status"
                  clearable
                  class="filter-compact"
                  placeholder="Status"
                  @change="sendFilterUpdate"
                >
                  <el-option label="Aktywne" value="ACTIVE" />
                  <el-option label="Nieaktywne" value="INACTIVE" />
                  <el-option label="Zakończone" value="ENDED" />
                  <el-option label="Szkic" value="DRAFT" />
                </el-select>
              </div>
            </div>
          </template>

          <template #default="prop">
            <el-tag>
              {{ prop.row.status || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Cena" width="160" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Cena
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            <el-input-number
              v-model="prop.row.price"
              :controls="false"
              :precision="2"
              class="filter-compact"
              @change="updatePrice(prop.row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="Stan" width="120" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Stan
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            <el-input-number
              v-model="prop.row.stock"
              :controls="false"
              :precision="0"
              class="filter-compact"
              @change="updateStock(prop.row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="Kategoria" width="170" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Kategoria
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            <div class="cell-tight">
              {{ prop.row.categoryName || prop.row.categoryId || '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Ostatnia synchronizacja" width="180" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Synchronizacja
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            {{ formatDate(prop.row.updatedAt || prop.row.modifiedAt || prop.row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-pagination
      background
      layout="prev, pager, next"
      :current-page="filter.page"
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

const route = useRoute()
const router = useRouter()
const toast = useToast()

const selectedRow = ref<any>(null)
const selectedRowId = ref<string | null>(null)

const dataTable = ref<any>({
  items: [],
  totalCount: 0,
  pageNumber: 1
})

const filter = ref({
  status: null as string | null,
  search: null as string | null,
  page: 1,
  pageSize: 15
})

const getPageFromQuery = () => {
  const raw = route.query.page
  const p = Number(raw)
  return Number.isFinite(p) && p > 0 ? p : 1
}

filter.value.page = getPageFromQuery()

const rowKey = (row: any) => {
  return getOfferId(row)
}

const handleRowClick = (row: any) => {
  selectedRow.value = row
  selectedRowId.value = getOfferId(row)
}

const rowClassName = ({ row }: any) => {
  const id = row.offerId || row.id
  return id === selectedRowId.value ? 'selected-row' : ''
}

const getOfferId = (row: any) => {
  return row.allegroOfferId
}

const fetchTableData = async () => {
  try {
    const result = await Api.allegro.getOffers(
      filter.value.status,
      filter.value.search,
      filter.value.page,
      filter.value.pageSize
    )

    dataTable.value = normalizeTableResult(result)
  } catch (error) {
    console.error(error)
    toast.error('Wystąpił problem z pobraniem ofert Allegro')
  }
}

const normalizeTableResult = (result: any) => {
  const data = result?.data || result

  return {
    items: data?.items || data || [],
    totalCount: data?.totalCount || data?.total || data?.items?.length || 0,
    pageNumber: data?.pageNumber || filter.value.page
  }
}

const sendFilterUpdate = async () => {
  filter.value.page = 1

  router.replace({
    query: {
      ...route.query,
      page: '1'
    }
  })

  await fetchTableData()
}

const syncOffersFromAllegro = async () => {
  try {
    const result = await Api.allegro.syncOffersFromAllegro()
    const data = result?.data || result

    toast.success(
      `Połączono oferty: pobrano ${data?.downloadedCount ?? 0}, nowe ${data?.createdCount ?? 0}, zaktualizowane ${data?.updatedCount ?? 0}, pominięte ${data?.skippedCount ?? 0}.`
    )

    await fetchTableData()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się połączyć ofert Allegro ze sklepem')
  }
}

const showSelectedOffer = () => {
  if (!selectedRow.value) {
    toast.warning('Wybierz ofertę Allegro')
    return
  }

  const offerId = getOfferId(selectedRow.value)
  router.push(`/allegro/offers/${offerId}`)
}

const updatePrice = async (row: any) => {
  try {
    const offerId = row.offerId || row.id

    if (!offerId) {
      toast.error('Brak ID oferty Allegro')
      return
    }

    await Api.allegro.updateOfferPrice(offerId, Number(row.price))
    toast.success('Cena oferty została zaktualizowana')
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zaktualizować ceny')
  }
}

const updateStock = async (row: any) => {
  try {
    const offerId = row.offerId || row.id

    if (!offerId) {
      toast.error('Brak ID oferty Allegro')
      return
    }

    await Api.allegro.updateOfferStock(offerId, Number(row.stock))
    toast.success('Stan oferty został zaktualizowany')
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zaktualizować stanu')
  }
}

const handlePageChange = async (page: number) => {
  filter.value.page = page

  router.replace({
    query: {
      ...route.query,
      page: String(page)
    }
  })

  await fetchTableData()
}

const formatDate = (dateIso: string) => {
  if (!dateIso) return '-'

  return new Date(dateIso).toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })
}

watch(
  () => route.query.page,
  async () => {
    const page = getPageFromQuery()

    if (page !== filter.value.page) {
      filter.value.page = page
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