<template>
  <div class="p-3 h-[100%]">
    <el-collapse v-model="filtersExpanded" class="mb-2">
      <el-collapse-item name="filters">
        <template #title>
          <span class="font-bold text-sm px-2">
            Filtry zamówień
            <el-tag v-if="activeFiltersCount > 0" size="small" class="ml-2" type="warning">
              {{ activeFiltersCount }}
            </el-tag>
          </span>
        </template>

        <div class="px-3 py-3 bg-white border border-[#d6dfe9] rounded">
          <el-row :gutter="12">
            <el-col :span="6">
              <label class="filter-label">Szukaj</label>
              <el-input
                v-model="filter.search"
                placeholder="ID, kupujący, e-mail, telefon..."
                clearable
                @keyup.enter="applyFilters"
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Data od</label>
              <el-date-picker
                v-model="filter.from"
                type="date"
                placeholder="Od"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="!w-full"
                clearable
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Data do</label>
              <el-date-picker
                v-model="filter.to"
                type="date"
                placeholder="Do"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="!w-full"
                clearable
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Status Allegro</label>
              <el-select v-model="filter.status" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Nowe" value="READY_FOR_PROCESSING" />
                <el-option label="Anulowane" value="CANCELLED" />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Realizacja</label>
              <el-select v-model="filter.fulfillmentStatus" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Nowe" value="NEW" />
                <el-option label="W trakcie" value="PROCESSING" />
                <el-option label="Wysłane" value="SENT" />
                <el-option label="Anulowane" value="CANCELLED" />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Sandbox</label>
              <el-select v-model="filter.sandbox" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" />
                <el-option label="Nie" :value="false" />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Zamówienie lokalne</label>
              <el-select v-model="filter.hasLocalOrder" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" />
                <el-option label="Nie" :value="false" />
              </el-select>
            </el-col>
          </el-row>

          <el-row :gutter="12" class="mt-3">
            <el-col :span="4">
              <label class="filter-label">Dostawa</label>
              <el-input
                v-model="filter.deliveryMethod"
                placeholder="Metoda dostawy..."
                clearable
                @keyup.enter="applyFilters"
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Kwota od</label>
              <el-input-number
                v-model="filter.minTotal"
                :controls="false"
                :precision="2"
                placeholder="Min"
                class="!w-full"
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Kwota do</label>
              <el-input-number
                v-model="filter.maxTotal"
                :controls="false"
                :precision="2"
                placeholder="Max"
                class="!w-full"
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Zysk od</label>
              <el-input-number
                v-model="filter.minProfit"
                :controls="false"
                :precision="2"
                placeholder="Min"
                class="!w-full"
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Zysk do</label>
              <el-input-number
                v-model="filter.maxProfit"
                :controls="false"
                :precision="2"
                placeholder="Max"
                class="!w-full"
              />
            </el-col>

            <el-col :span="4">
              <label class="filter-label">Prowizja zsynchronizowana</label>
              <el-select v-model="filter.billingSynced" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" />
                <el-option label="Nie" :value="false" />
              </el-select>
            </el-col>

            <el-col :span="4" class="flex items-end gap-2">
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
          <a @click="openImportDialog" class="rounded-md p-1 text-xs font-semibold cursor-pointer">
            Pobierz z Allegro
          </a>
        </span>

        <span class="ml-4 flex hover:bg-sky-100 p-1">
          <a @click="showSelectedOrder" class="rounded-md p-1 text-xs font-semibold cursor-pointer">
            Szczegóły zamówienia
          </a>
        </span>

        <span class="ml-4 flex hover:bg-sky-100 p-1">
          <a @click="createLocalOrder" class="rounded-md p-1 text-xs font-semibold cursor-pointer">
            Utwórz zamówienie lokalne
          </a>
        </span>

        <span class="ml-4 flex hover:bg-sky-100 p-1">
          <a @click="syncBillingForVisibleOrders" class="rounded-md p-1 text-xs font-semibold cursor-pointer">
            Synchronizuj prowizje
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
        @row-dblclick="showSelectedOrder"
        :border="true"
        style="width: 100%; min-height: 81vh;"
        :row-class-name="rowClassName"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="p-4">
              <div class="flex w-full gap-[12%] p-2">
                <div>
                  <span class="font-bold text-base">Kupujący</span>
                  <p>Login: {{ props.row.buyerLogin || '-' }}</p>
                  <p>Email: {{ props.row.buyerEmail || '-' }}</p>
                  <p>Imię i nazwisko: {{ props.row.buyerName || fullName(props.row.buyerFirstName, props.row.buyerLastName) }}</p>
                  <p>Telefon: {{ props.row.phoneNumber || props.row.buyerPhoneNumber || '-' }}</p>
                </div>

                <div>
                  <span class="font-bold text-base">Dostawa</span>
                  <p>Metoda: {{ props.row.deliveryMethod || props.row.deliveryMethodName || '-' }}</p>
                  <p>Adres: {{ props.row.deliveryAddress || '-' }}</p>
                  <p>Miasto: {{ props.row.deliveryCity || '-' }}</p>
                  <p>Kod pocztowy: {{ props.row.deliveryZipCode || '-' }}</p>
                </div>

                <div>
                  <span class="font-bold text-base">Płatność</span>
                  <p>Status płatności: {{ props.row.paymentStatus || '-' }}</p>
                  <p>Status realizacji: {{ props.row.fulfillmentStatus || '-' }}</p>
                  <p>Sandbox: {{ props.row.sandbox ? 'Tak' : 'Nie' }}</p>
                  <p>Lokalne zamówienie: {{ props.row.localOrderId ? 'Tak' : 'Nie' }}</p>
                </div>

                <div>
                  <span class="font-bold text-base">Zysk</span>
                  <p>Sprzedaż produktów: {{ formatPrice(props.row.productsRevenueAmount) }}</p>
                  <p>Prowizja Allegro: {{ formatPrice(props.row.commissionAmount) }}</p>
                  <p>Koszt produktów: {{ formatPrice(props.row.productCostAmount) }}</p>
                  <p class="font-semibold">Zysk netto: {{ formatPrice(props.row.netProfitAmount) }}</p>
                  <p v-if="!props.row.billingSyncedAtUtc" class="text-[#b45309]">
                    Prowizja niezsynchronizowana — użyj „Synchronizuj prowizje”.
                  </p>
                </div>
              </div>

              <div class="table__product py-4 px-8">
                <el-table :data="props.row.items || props.row.lineItems || []" :border="true">
                  <el-table-column label="Nazwa produktu">
                    <template #default="scope">
                      {{ scope.row.name || scope.row.offerName || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="Oferta Allegro" width="160">
                    <template #default="scope">
                      {{ scope.row.offerId || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="Ilość" width="80" prop="quantity" />
                  <el-table-column label="Cena" width="120">
                    <template #default="scope">
                      {{ formatPrice(scope.row.price || scope.row.amount) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="Prowizja" width="100">
                    <template #default="scope">
                      {{ formatPrice(scope.row.commissionAmount) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="Koszt" width="100">
                    <template #default="scope">
                      {{ formatPrice(scope.row.productCostAmount) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="Zysk" width="100">
                    <template #default="scope">
                      {{ formatPrice(scope.row.netProfit) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Checkout ID" width="210" prop="checkoutFormId" label-class-name="order_label">
          <template #default="prop">
            <div class="cell-tight">
              {{ prop.row.checkoutFormId || prop.row.id }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Data" width="150" label-class-name="order_label">
          <template #default="prop">
            {{ formatDate(prop.row.createdAt || prop.row.boughtAt || prop.row.createdOn) }}
          </template>
        </el-table-column>

        <el-table-column label="Kupujący" label-class-name="order_label">
          <template #default="{ row }">
            <div class="cell-tight">
              {{ row.buyerLogin || row.buyerEmail || row.buyerName || '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Dostawa" label-class-name="order_label">
          <template #default="{ row }">
            <div class="cell-tight">
              {{ row.deliveryMethod || row.deliveryMethodName || '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Kwota" width="120" label-class-name="order_label">
          <template #default="prop">
            {{ formatPrice(prop.row.totalAmount || prop.row.amount || prop.row.orderTotal || prop.row.totalToPay) }}
          </template>
        </el-table-column>

        <el-table-column label="Prowizja" width="100" label-class-name="order_label">
          <template #default="prop">
            {{ formatPrice(prop.row.commissionAmount) }}
          </template>
        </el-table-column>

        <el-table-column label="Zysk" width="100" label-class-name="order_label">
          <template #default="prop">
            <span :class="profitClass(prop.row.netProfitAmount)">
              {{ formatPrice(prop.row.netProfitAmount) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Status Allegro" width="180" label-class-name="order_label">
          <template #default="prop">
            <el-tag>
              {{ prop.row.status || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Realizacja" width="180" label-class-name="order_label">
          <template #default="prop">
            <el-tag>
              {{ prop.row.fulfillmentStatus || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Lokalne" width="120" label-class-name="order_label">
          <template #default="prop">
            <el-tag :type="prop.row.localOrderId ? 'success' : 'danger'">
              {{ prop.row.localOrderId ? 'Tak' : 'Nie' }}
            </el-tag>
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

    <el-dialog
      v-model="importDialogVisible"
      title="Pobierz zamówienia z Allegro"
      width="520px"
      :close-on-click-modal="!importing"
      :close-on-press-escape="!importing"
      :show-close="!importing"
    >
      <div class="space-y-4 text-sm text-[#334155]">
        <p>
          System pobierze zamówienia z Allegro i zapisze je lokalnie.
          Istniejące zamówienia zostaną zaktualizowane.
        </p>

        <el-checkbox v-model="importOptions.importAll">
          Pobierz wszystkie strony wyników (pełny import)
        </el-checkbox>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#64748b] mb-1">Data od</label>
            <el-date-picker
              v-model="importOptions.from"
              type="date"
              placeholder="Od"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="!w-full"
              clearable
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#64748b] mb-1">Data do</label>
            <el-date-picker
              v-model="importOptions.to"
              type="date"
              placeholder="Do"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="!w-full"
              clearable
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-[#64748b] mb-1">Status Allegro</label>
            <el-select v-model="importOptions.status" clearable placeholder="Wszystkie" class="!w-full">
              <el-option label="Nowe" value="READY_FOR_PROCESSING" />
              <el-option label="Anulowane" value="CANCELLED" />
            </el-select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#64748b] mb-1">Realizacja</label>
            <el-select v-model="importOptions.fulfillmentStatus" clearable placeholder="Wszystkie" class="!w-full">
              <el-option label="Nowe" value="NEW" />
              <el-option label="W trakcie" value="PROCESSING" />
              <el-option label="Wysłane" value="SENT" />
              <el-option label="Anulowane" value="CANCELLED" />
            </el-select>
          </div>
        </div>

        <p v-if="!importOptions.from" class="text-xs text-[#64748b]">
          Bez daty „od” zostanie użyty domyślny zakres z ustawień Allegro.
        </p>
      </div>

      <template #footer>
        <el-button :disabled="importing" @click="importDialogVisible = false">
          Anuluj
        </el-button>

        <el-button
          type="primary"
          :loading="importing"
          @click="importOrders"
        >
          {{ importing ? 'Pobieram...' : 'Pobierz zamówienia' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
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

type OrderFilters = {
  sandbox: boolean | null
  status: string | null
  fulfillmentStatus: string | null
  search: string | null
  from: string | null
  to: string | null
  hasLocalOrder: boolean | null
  deliveryMethod: string | null
  minTotal: number | null
  maxTotal: number | null
  minProfit: number | null
  maxProfit: number | null
  billingSynced: boolean | null
  page: number
  pageSize: number
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const selectedRow = ref<any>(null)
const selectedRowId = ref<string | null>(null)
const importDialogVisible = ref(false)
const importing = ref(false)
const filtersExpanded = ref<string[]>(['filters'])
const isSyncingFromRoute = ref(false)

const importOptions = ref({
  importAll: true,
  from: null as string | null,
  to: null as string | null,
  status: null as string | null,
  fulfillmentStatus: null as string | null,
})

const dataTable = ref<any>({
  items: [],
  totalCount: 0,
  pageNumber: 1
})

const createDefaultFilters = (): OrderFilters => ({
  sandbox: null,
  status: null,
  fulfillmentStatus: null,
  search: null,
  from: null,
  to: null,
  hasLocalOrder: null,
  deliveryMethod: null,
  minTotal: null,
  maxTotal: null,
  minProfit: null,
  maxProfit: null,
  billingSynced: null,
  page: 1,
  pageSize: 15
})

const buildFiltersFromQuery = (): OrderFilters => {
  const defaults = createDefaultFilters()

  return {
    ...defaults,
    search: parseQueryString(route.query, 'search', null),
    status: parseQueryString(route.query, 'status', null),
    fulfillmentStatus: parseQueryString(route.query, 'fulfillmentStatus', null),
    from: parseDateQuery(route.query, 'from'),
    to: parseDateQuery(route.query, 'to'),
    sandbox: parseQueryBoolean(route.query, 'sandbox', null),
    hasLocalOrder: parseQueryBoolean(route.query, 'hasLocalOrder', null),
    deliveryMethod: parseQueryString(route.query, 'deliveryMethod', null),
    minTotal: parseQueryNumber(route.query, 'minTotal', null),
    maxTotal: parseQueryNumber(route.query, 'maxTotal', null),
    minProfit: parseQueryNumber(route.query, 'minProfit', null),
    maxProfit: parseQueryNumber(route.query, 'maxProfit', null),
    billingSynced: parseQueryBoolean(route.query, 'billingSynced', null),
    page: parseQueryPage(route.query, 1),
    pageSize: parseQueryNumber(route.query, 'pageSize', 15) || 15
  }
}

const buildQueryFromFilters = (filters: OrderFilters) => {
  const query: Record<string, string> = {}

  setQueryString(query, 'search', filters.search)
  setQueryString(query, 'status', filters.status)
  setQueryString(query, 'fulfillmentStatus', filters.fulfillmentStatus)
  setDateQuery(query, 'from', filters.from)
  setDateQuery(query, 'to', filters.to)
  setQueryBoolean(query, 'sandbox', filters.sandbox)
  setQueryBoolean(query, 'hasLocalOrder', filters.hasLocalOrder)
  setQueryString(query, 'deliveryMethod', filters.deliveryMethod)
  setQueryNumber(query, 'minTotal', filters.minTotal)
  setQueryNumber(query, 'maxTotal', filters.maxTotal)
  setQueryNumber(query, 'minProfit', filters.minProfit)
  setQueryNumber(query, 'maxProfit', filters.maxProfit)
  setQueryBoolean(query, 'billingSynced', filters.billingSynced)
  setQueryNumber(query, 'page', filters.page)
  setQueryNumber(query, 'pageSize', filters.pageSize)

  return query
}

const filter = ref<OrderFilters>(buildFiltersFromQuery())

const activeFiltersCount = computed(() => {
  let count = 0

  if (filter.value.search) count++
  if (filter.value.status) count++
  if (filter.value.fulfillmentStatus) count++
  if (filter.value.from) count++
  if (filter.value.to) count++
  if (filter.value.sandbox !== null) count++
  if (filter.value.hasLocalOrder !== null) count++
  if (filter.value.deliveryMethod) count++
  if (filter.value.minTotal !== null) count++
  if (filter.value.maxTotal !== null) count++
  if (filter.value.minProfit !== null) count++
  if (filter.value.maxProfit !== null) count++
  if (filter.value.billingSynced !== null) count++

  return count
})

const syncFiltersToUrl = (filters: OrderFilters) => {
  router.replace({ query: buildQueryFromFilters(filters) })
}

const rowKey = (row: any) => {
  return row.checkoutFormId || row.id
}

const handleRowClick = (row: any) => {
  selectedRow.value = row
  selectedRowId.value = row.checkoutFormId || row.id
}

const rowClassName = ({ row }: any) => {
  const id = row.checkoutFormId || row.id
  return id === selectedRowId.value ? 'selected-row' : ''
}

const toIsoDate = (value: string | null, endOfDay = false) => {
  if (!value) return null

  const date = new Date(value)

  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }

  return date.toISOString()
}

const fetchTableData = async () => {
  try {
    const result = await Api.allegro.getImportedOrders({
      sandbox: filter.value.sandbox,
      status: filter.value.status,
      fulfillmentStatus: filter.value.fulfillmentStatus,
      search: filter.value.search,
      page: filter.value.page,
      pageSize: filter.value.pageSize,
      fromUtc: toIsoDate(filter.value.from),
      toUtc: toIsoDate(filter.value.to, true),
      hasLocalOrder: filter.value.hasLocalOrder,
      deliveryMethod: filter.value.deliveryMethod,
      minTotal: filter.value.minTotal,
      maxTotal: filter.value.maxTotal,
      minProfit: filter.value.minProfit,
      maxProfit: filter.value.maxProfit,
      billingSynced: filter.value.billingSynced
    })

    dataTable.value = normalizeTableResult(result)
  } catch (error) {
    console.error(error)
    toast.error('Wystąpił problem z pobraniem zamówień Allegro')
  }
}

const normalizeTableResult = (result: any) => {
  const data = result?.data || result

  return {
    items: data?.items || [],
    totalCount: data?.totalCount || 0,
    pageNumber: data?.pageNumber || filter.value.page
  }
}

const applyFilters = async () => {
  filter.value.page = 1
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const clearFilters = async () => {
  filter.value = {
    ...createDefaultFilters(),
    page: 1,
    pageSize: filter.value.pageSize
  }
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const openImportDialog = () => {
  importOptions.value = {
    importAll: true,
    from: filter.value.from,
    to: filter.value.to,
    status: filter.value.status,
    fulfillmentStatus: filter.value.fulfillmentStatus,
  }

  importDialogVisible.value = true
}

const importOrders = async () => {
  importing.value = true

  try {
    const result = await Api.allegro.importOrders({
      status: importOptions.value.status,
      fulfillmentStatus: importOptions.value.fulfillmentStatus,
      from: toIsoDate(importOptions.value.from),
      to: toIsoDate(importOptions.value.to, true),
      limit: 100,
      importAll: importOptions.value.importAll,
    })

    const data = result?.data || result
    const created = data?.createdCount ?? 0
    const updated = data?.updatedCount ?? 0
    const total = data?.totalFetchedFromAllegro ?? data?.importedCount ?? 0
    const pages = data?.pagesProcessed ?? 1

    toast.success(
      `Pobrano ${total} zamówień z Allegro (${pages} stron). Nowe: ${created}, zaktualizowane: ${updated}.`
    )

    importDialogVisible.value = false
    filter.value.page = 1
    syncFiltersToUrl(filter.value)
    await fetchTableData()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać zamówień z Allegro')
  } finally {
    importing.value = false
  }
}

const listQuery = computed(() => JSON.stringify(route.query))

const showSelectedOrder = () => {
  if (!selectedRow.value) {
    toast.warning('Wybierz zamówienie Allegro')
    return
  }

  const checkoutFormId = selectedRow.value.checkoutFormId || selectedRow.value.id
  router.push({
    path: `/allegro/orders/${checkoutFormId}`,
    query: route.query
  })
}

const syncingBilling = ref(false)

const syncBillingForVisibleOrders = async () => {
  syncingBilling.value = true

  try {
    const result = await Api.allegro.syncOrdersBilling({
      sandbox: filter.value.sandbox,
      fromUtc: toIsoDate(filter.value.from),
      toUtc: toIsoDate(filter.value.to, true),
      page: filter.value.page,
      pageSize: filter.value.pageSize,
      onlyMissingBilling: true
    })

    const data = result?.data || result
    const synced = data?.syncedCount ?? 0
    const failed = data?.failedCount ?? 0

    toast.success(`Zsynchronizowano prowizje: ${synced}. Błędy: ${failed}.`)
    await fetchTableData()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zsynchronizować prowizji Allegro')
  } finally {
    syncingBilling.value = false
  }
}

const profitClass = (value?: number | null) => {
  if (value === null || value === undefined) return ''
  if (value > 0) return 'text-[#15803d] font-semibold'
  if (value < 0) return 'text-[#b91c1c] font-semibold'
  return ''
}

const createLocalOrder = async () => {
  if (!selectedRow.value) {
    toast.warning('Wybierz zamówienie Allegro')
    return
  }

  if (selectedRow.value.localOrderId) {
    toast.warning('To zamówienie ma już utworzone zamówienie lokalne')
    return
  }

  try {
    const checkoutFormId = selectedRow.value.checkoutFormId || selectedRow.value.id

    const settingsResult = await Api.allegro.getSettings()
    const settings = settingsResult?.data || settingsResult

    await Api.allegro.createLocalOrder(checkoutFormId, Api.allegro.buildCreateLocalOrderBody(settings))

    toast.success('Utworzono zamówienie lokalne')
    await fetchTableData()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się utworzyć zamówienia lokalnego')
  }
}

const handlePageChange = async (page: number) => {
  filter.value.page = page
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const fullName = (firstName?: string | null, lastName?: string | null) => {
  const full = `${firstName || ''} ${lastName || ''}`.trim()
  return full || '-'
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

const formatPrice = (value: any) => {
  if (value === null || value === undefined) return '-'

  if (typeof value === 'object') {
    const amount = value.amount || value.value
    const currency = value.currency || 'PLN'
    return `${amount} ${currency}`
  }

  return `${value} zł`
}

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

  await fetchTableData()
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

.el-table .cell .cell-tight {
  margin: 0;
}

.el-range-input {
  font-size: 10px !important;
}

.el-select-dropdown__item.selected {
  color: #fb923c !important;
}

.table__product .cell {
  font-size: 12px;
  font-weight: 500;
}

.el-scrollbar__thumb {
  display: none !important;
}

.order_label {
  color: #435368;
  background-color: #f1f4f9 !important;
  border-right: 1px solid #fafbfd !important;
  border-top: 1.1px solid #fafbfd !important;
  margin: 2px !important;
}

.el-table__body-wrapper {
  margin-top: 1px;
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
