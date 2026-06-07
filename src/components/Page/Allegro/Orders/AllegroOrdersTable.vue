<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Filter, ArrowDown, Refresh, Download, View, Plus, Coin } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Api } from '/@/services/api'
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
import {
  ALLEGRO_FULFILLMENT_STATUS_OPTIONS,
  ALLEGRO_ORDER_STATUS_OPTIONS,
  allegroFulfillmentStatusTone,
  allegroOrderStatusTone,
  paymentStatusTone,
  translateAllegroFulfillmentStatus,
  translateAllegroOrderStatus
} from '/@/utils/allegroStatus'

use([PieChart, GridComponent, TooltipComponent, CanvasRenderer])

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

const loading = ref(false)
const filtersOpen = ref(false)
const selectedRow = ref<any>(null)
const selectedRowId = ref<string | null>(null)
const expandedRowId = ref<string | null>(null)
const importDialogVisible = ref(false)
const importing = ref(false)
const syncingBilling = ref(false)
const creatingLocalOrders = ref(false)
const isSyncingFromRoute = ref(false)
const selectedOrderIds = ref<Set<string>>(new Set())

const importOptions = ref({
  importAll: true,
  from: null as string | null,
  to: null as string | null,
  status: null as string | null,
  fulfillmentStatus: null as string | null
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
const items = computed(() => dataTable.value?.items ?? [])

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

const kpi = computed(() => {
  const rows = items.value
  return {
    total: dataTable.value?.totalCount ?? rows.length,
    pageCount: rows.length,
    withoutLocal: rows.filter((r: any) => !r.localOrderId).length,
    codCount: rows.filter((r: any) => (r.paymentStatus || '').toLowerCase().includes('pobrani')).length,
    totalValue: rows.reduce((s: number, r: any) => s + (r.totalToPay ?? r.totalAmount ?? r.orderTotal ?? 0), 0),
    totalProfit: rows.reduce((s: number, r: any) => s + (r.netProfitAmount ?? 0), 0),
    newOrders: rows.filter((r: any) => r.fulfillmentStatus === 'NEW').length
  }
})

const profitDonutOption = computed(() => ({
  series: [{
    type: 'pie',
    radius: ['58%', '88%'],
    silent: true,
    label: { show: false },
    data: [
      { value: Math.max(kpi.value.totalProfit, 0.1), itemStyle: { color: '#34d399' } },
      { value: Math.max(kpi.value.totalValue - kpi.value.totalProfit, 0.1), itemStyle: { color: 'rgba(255,255,255,0.12)' } }
    ]
  }]
}))

const money = (v?: number | null) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v ?? 0)

const syncFiltersToUrl = (filters: OrderFilters) => {
  router.replace({ query: buildQueryFromFilters(filters) })
}

const rowKey = (row: any) => row.checkoutFormId || row.id

const canSelectForLocal = (row: any) => !row.localOrderId

const selectableOnPage = computed(() => items.value.filter(canSelectForLocal))

const selectedCreatableCount = computed(() => selectedOrderIds.value.size)

const isOrderChecked = (row: any) => selectedOrderIds.value.has(rowKey(row))

const toggleOrderSelection = (row: any, checked: boolean) => {
  if (!canSelectForLocal(row)) return
  const id = rowKey(row)
  const next = new Set(selectedOrderIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedOrderIds.value = next
}

const isAllPageSelected = computed(() => {
  const selectable = selectableOnPage.value
  if (!selectable.length) return false
  return selectable.every((row: any) => selectedOrderIds.value.has(rowKey(row)))
})

const isPageIndeterminate = computed(() => {
  const selectable = selectableOnPage.value
  if (!selectable.length) return false
  const checked = selectable.filter((row: any) => selectedOrderIds.value.has(rowKey(row))).length
  return checked > 0 && checked < selectable.length
})

const toggleSelectAllOnPage = (checked: boolean) => {
  const next = new Set(selectedOrderIds.value)
  if (checked) {
    selectableOnPage.value.forEach((row: any) => next.add(rowKey(row)))
  } else {
    selectableOnPage.value.forEach((row: any) => next.delete(rowKey(row)))
  }
  selectedOrderIds.value = next
}

const clearSelection = () => {
  selectedOrderIds.value = new Set()
}

const handleRowClick = (row: any) => {
  selectedRow.value = row
  selectedRowId.value = rowKey(row)
}

const toggleExpand = (row: any) => {
  const id = rowKey(row)
  expandedRowId.value = expandedRowId.value === id ? null : id
  handleRowClick(row)
}

const toIsoDate = (value: string | null, endOfDay = false) => {
  if (!value) return null
  const date = new Date(value)
  if (endOfDay) date.setHours(23, 59, 59, 999)
  else date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

const fetchTableData = async () => {
  loading.value = true
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
  } finally {
    loading.value = false
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
  filter.value = { ...createDefaultFilters(), page: 1, pageSize: filter.value.pageSize }
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const openImportDialog = () => {
  importOptions.value = {
    importAll: true,
    from: filter.value.from,
    to: filter.value.to,
    status: filter.value.status,
    fulfillmentStatus: filter.value.fulfillmentStatus
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
      importAll: importOptions.value.importAll
    })
    const data = result?.data || result
    toast.success(
      `Pobrano ${data?.totalFetchedFromAllegro ?? data?.importedCount ?? 0} zamówień. Nowe: ${data?.createdCount ?? 0}, zaktualizowane: ${data?.updatedCount ?? 0}.`
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
  router.push({
    path: `/allegro/orders/${selectedRow.value.checkoutFormId || selectedRow.value.id}`,
    query: route.query
  })
}

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
    toast.success(`Zsynchronizowano prowizje: ${data?.syncedCount ?? 0}. Błędy: ${data?.failedCount ?? 0}.`)
    await fetchTableData()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zsynchronizować prowizji Allegro')
  } finally {
    syncingBilling.value = false
  }
}

const createLocalOrders = async () => {
  const ids = Array.from(selectedOrderIds.value)
  if (!ids.length) {
    toast.warning('Zaznacz zamówienia Allegro bez lokalnego zamówienia')
    return
  }

  creatingLocalOrders.value = true
  let created = 0
  let skipped = 0
  let failed = 0

  try {
    const settingsResult = await Api.allegro.getSettings()
    const settings = settingsResult?.data || settingsResult
    const body = Api.allegro.buildCreateLocalOrderBody(settings)

    for (const checkoutFormId of ids) {
      try {
        const result = await Api.allegro.createLocalOrder(checkoutFormId, body)
        const data = result?.data || result
        if (data?.created === false) skipped++
        else created++
      } catch (error) {
        console.error(error)
        failed++
      }
    }

    if (created > 0) {
      toast.success(`Utworzono ${created} zamówień lokalnych`)
    }
    if (skipped > 0) {
      toast.info(`Pominięto ${skipped} zamówień (już mają lokalne)`)
    }
    if (failed > 0) {
      toast.error(`Nie udało się utworzyć ${failed} zamówień`)
    }

    clearSelection()
    await fetchTableData()
  } finally {
    creatingLocalOrders.value = false
  }
}

const handlePageChange = async (page: number) => {
  filter.value.page = page
  clearSelection()
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const fullName = (firstName?: string | null, lastName?: string | null) => {
  const full = `${firstName || ''} ${lastName || ''}`.trim()
  return full || '—'
}

const formatDate = (dateIso?: string) => {
  if (!dateIso) return '—'
  return new Date(dateIso).toLocaleString('pl-PL', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

const formatPrice = (value: any) => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') {
    return `${value.amount || value.value} ${value.currency || 'PLN'}`
  }
  return money(Number(value))
}

const profitClass = (value?: number | null) => {
  if (value === null || value === undefined) return ''
  if (value > 0) return 'profit--pos'
  if (value < 0) return 'profit--neg'
  return ''
}

const buyerLabel = (row: any) =>
  row.buyerLogin || row.buyerName || row.buyerEmail || '—'

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
  if (activeFiltersCount.value > 0) filtersOpen.value = true
  await fetchTableData()
})
</script>

<template>
  <div class="allegro-orders-page">
    <header class="allegro-orders-page__header">
      <div>
        <p class="allegro-orders-page__eyebrow">Integracja Allegro</p>
        <h1 class="allegro-orders-page__title">Zamówienia Allegro</h1>
        <p class="allegro-orders-page__subtitle">Import, prowizje i tworzenie zamówień lokalnych</p>
      </div>
      <div class="allegro-orders-page__actions">
        <el-button :icon="Refresh" :loading="loading" @click="fetchTableData">Odśwież</el-button>
        <el-button type="warning" :icon="Download" @click="openImportDialog">Pobierz z Allegro</el-button>
        <el-button :icon="View" :disabled="!selectedRow" @click="showSelectedOrder">Szczegóły</el-button>
        <el-button
          type="primary"
          :icon="Plus"
          :loading="creatingLocalOrders"
          :disabled="selectedCreatableCount === 0"
          @click="createLocalOrders"
        >
          Utwórz lokalne{{ selectedCreatableCount ? ` (${selectedCreatableCount})` : '' }}
        </el-button>
        <el-button :icon="Coin" :loading="syncingBilling" @click="syncBillingForVisibleOrders">
          Synchronizuj prowizje
        </el-button>
      </div>
    </header>

    <div class="allegro-kpi">
      <div class="cosmic-card cosmic-card--total">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">Wszystkie</span><span class="cosmic-card__glyph">◎</span></div>
          <div class="cosmic-card__value">{{ kpi.total }}</div>
          <div class="cosmic-card__foot">{{ kpi.pageCount }} na tej stronie</div>
        </div>
      </div>
      <div class="cosmic-card cosmic-card--local">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">Bez lokalnego</span><span class="cosmic-card__glyph">◈</span></div>
          <div class="cosmic-card__value">{{ kpi.withoutLocal }}</div>
          <div class="cosmic-card__foot">do utworzenia w systemie</div>
        </div>
      </div>
      <div class="cosmic-card cosmic-card--cod">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">Za pobraniem</span><span class="cosmic-card__glyph">❖</span></div>
          <div class="cosmic-card__value">{{ kpi.codCount }}</div>
          <div class="cosmic-card__foot">na bieżącej stronie</div>
        </div>
      </div>
      <div class="cosmic-card cosmic-card--profit">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">Zysk strony</span><span class="cosmic-card__glyph">✦</span></div>
          <div class="cosmic-card__value cosmic-card__value--sm">{{ money(kpi.totalProfit) }}</div>
          <div class="cosmic-card__foot">{{ money(kpi.totalValue) }} sprzedaży</div>
          <v-chart class="cosmic-card__chart cosmic-card__chart--donut" :option="profitDonutOption" autoresize />
        </div>
      </div>
    </div>

    <el-card shadow="never" class="filters-card">
      <div class="filters-card__head" @click="filtersOpen = !filtersOpen">
        <div class="filters-card__title">
          <el-icon><Filter /></el-icon>
          <span>Filtry zamówień</span>
          <el-tag v-if="activeFiltersCount" size="small" type="warning" effect="dark" round>{{ activeFiltersCount }}</el-tag>
        </div>
        <el-icon class="filters-card__chevron" :class="{ 'filters-card__chevron--open': filtersOpen }"><ArrowDown /></el-icon>
      </div>
      <el-collapse-transition>
        <div v-show="filtersOpen" class="filters-card__body">
          <el-row :gutter="12">
            <el-col :xs="24" :sm="12" :md="6">
              <label class="filter-label">Szukaj</label>
              <el-input v-model="filter.search" placeholder="ID, kupujący, e-mail..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="6" :md="3">
              <label class="filter-label">Data od</label>
              <el-date-picker v-model="filter.from" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="!w-full" clearable />
            </el-col>
            <el-col :xs="24" :sm="6" :md="3">
              <label class="filter-label">Data do</label>
              <el-date-picker v-model="filter.to" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="!w-full" clearable />
            </el-col>
            <el-col :xs="24" :sm="6" :md="3">
              <label class="filter-label">Status Allegro</label>
              <el-select v-model="filter.status" clearable placeholder="Wszystkie" class="!w-full">
                <el-option v-for="opt in ALLEGRO_ORDER_STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="6" :md="3">
              <label class="filter-label">Realizacja</label>
              <el-select v-model="filter.fulfillmentStatus" clearable placeholder="Wszystkie" class="!w-full">
                <el-option v-for="opt in ALLEGRO_FULFILLMENT_STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="6" :md="3">
              <label class="filter-label">Sandbox</label>
              <el-select v-model="filter.sandbox" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" /><el-option label="Nie" :value="false" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="6" :md="3">
              <label class="filter-label">Zamówienie lokalne</label>
              <el-select v-model="filter.hasLocalOrder" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" /><el-option label="Nie" :value="false" />
              </el-select>
            </el-col>
          </el-row>
          <el-row :gutter="12" class="mt-3">
            <el-col :xs="24" :sm="8" :md="4">
              <label class="filter-label">Dostawa</label>
              <el-input v-model="filter.deliveryMethod" placeholder="Metoda dostawy..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="12" :sm="4" :md="3">
              <label class="filter-label">Kwota od</label>
              <el-input-number v-model="filter.minTotal" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="12" :sm="4" :md="3">
              <label class="filter-label">Kwota do</label>
              <el-input-number v-model="filter.maxTotal" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="12" :sm="4" :md="3">
              <label class="filter-label">Zysk od</label>
              <el-input-number v-model="filter.minProfit" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="12" :sm="4" :md="3">
              <label class="filter-label">Zysk do</label>
              <el-input-number v-model="filter.maxProfit" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="24" :sm="8" :md="4">
              <label class="filter-label">Prowizja zsynchronizowana</label>
              <el-select v-model="filter.billingSynced" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" /><el-option label="Nie" :value="false" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="24" :md="4" class="flex items-end gap-2">
              <el-button type="primary" @click="applyFilters">Zastosuj</el-button>
              <el-button @click="clearFilters">Wyczyść</el-button>
            </el-col>
          </el-row>
        </div>
      </el-collapse-transition>
    </el-card>

    <el-card shadow="never" class="list-card">
      <div v-if="selectedCreatableCount > 0" class="selection-bar">
        <span>Zaznaczono <strong>{{ selectedCreatableCount }}</strong> zamówień do utworzenia lokalnego</span>
        <el-button size="small" text @click="clearSelection">Wyczyść zaznaczenie</el-button>
      </div>

      <div class="list-head">
        <span class="list-head__check">
          <el-checkbox
            :model-value="isAllPageSelected"
            :indeterminate="isPageIndeterminate"
            :disabled="!selectableOnPage.length"
            @change="(v: any) => toggleSelectAllOnPage(!!v)"
            @click.stop
          />
        </span>
        <span>Zamówienie</span>
        <span>Kupujący / dostawa</span>
        <span>Kwota / zysk</span>
        <span>Statusy</span>
        <span>Lokalne</span>
      </div>

      <div class="list-scroll-wrap">
        <el-skeleton :loading="loading" animated :count="4">
          <template #template>
            <div class="order-skeleton"><el-skeleton-item variant="h3" style="width:100%;height:72px;border-radius:16px" /></div>
          </template>
          <template #default>
            <div v-if="!items.length" class="orders-empty">
              <div class="orders-empty__icon">🛒</div>
              <h3>Brak zamówień Allegro</h3>
              <p>Pobierz zamówienia z Allegro lub zmień filtry.</p>
              <el-button type="warning" @click="openImportDialog">Pobierz z Allegro</el-button>
            </div>

            <div v-else class="orders-list">
              <article
                v-for="row in items"
                :key="rowKey(row)"
                class="order-card"
                :class="{
                  'order-card--selected': rowKey(row) === selectedRowId,
                  'order-card--checked': isOrderChecked(row),
                  'order-card--expanded': expandedRowId === rowKey(row)
                }"
                @click="handleRowClick(row)"
                @dblclick="showSelectedOrder"
              >
                <div class="order-card__stripe" />

                <div class="order-card__main">
                  <div class="order-card__col order-card__col--toggle">
                    <el-checkbox
                      :model-value="isOrderChecked(row)"
                      :disabled="!canSelectForLocal(row)"
                      @change="(v: any) => toggleOrderSelection(row, !!v)"
                      @click.stop
                    />
                    <button type="button" class="expand-btn" @click.stop="toggleExpand(row)">
                      {{ expandedRowId === rowKey(row) ? '▾' : '▸' }}
                    </button>
                  </div>

                  <div class="order-card__col order-card__col--order">
                    <div class="order-card__id">{{ row.checkoutFormId || row.id }}</div>
                    <div class="order-card__date">{{ formatDate(row.boughtAtUtc || row.boughtAt || row.importedAtUtc) }}</div>
                    <span v-if="row.sandbox" class="sandbox-badge">Sandbox</span>
                  </div>

                  <div class="order-card__col order-card__col--buyer">
                    <div class="order-card__buyer">{{ buyerLabel(row) }}</div>
                    <div class="order-card__delivery">{{ row.deliveryMethod || row.deliveryMethodName || '—' }}</div>
                    <span
                      v-if="row.paymentStatus"
                      class="status-chip"
                      :class="`status-chip--${paymentStatusTone(row.paymentStatus)}`"
                    >
                      {{ row.paymentStatus }}
                    </span>
                  </div>

                  <div class="order-card__col order-card__col--money">
                    <div class="order-card__amount">{{ formatPrice(row.totalToPay || row.totalAmount || row.orderTotal) }}</div>
                    <div class="order-card__profit" :class="profitClass(row.netProfitAmount)">
                      Zysk: {{ formatPrice(row.netProfitAmount) }}
                    </div>
                    <div class="order-card__commission">Prowizja: {{ formatPrice(row.commissionAmount) }}</div>
                  </div>

                  <div class="order-card__col order-card__col--status">
                    <span class="status-chip" :class="`status-chip--${allegroOrderStatusTone(row.status)}`">
                      {{ translateAllegroOrderStatus(row.status) }}
                    </span>
                    <span class="status-chip" :class="`status-chip--${allegroFulfillmentStatusTone(row.fulfillmentStatus)}`">
                      {{ translateAllegroFulfillmentStatus(row.fulfillmentStatus) }}
                    </span>
                  </div>

                  <div class="order-card__col order-card__col--local">
                    <span class="local-chip" :class="row.localOrderId ? 'local-chip--yes' : 'local-chip--no'">
                      {{ row.localOrderId ? 'Tak' : 'Nie' }}
                    </span>
                  </div>
                </div>

                <div v-if="expandedRowId === rowKey(row)" class="order-card__detail" @click.stop>
                  <div class="detail-grid">
                    <div class="detail-panel">
                      <h4>Kupujący</h4>
                      <p>Login: {{ row.buyerLogin || '—' }}</p>
                      <p>Email: {{ row.buyerEmail || '—' }}</p>
                      <p>{{ fullName(row.buyerFirstName, row.buyerLastName) }}</p>
                      <p>{{ row.phoneNumber || row.buyerPhoneNumber || '—' }}</p>
                    </div>
                    <div class="detail-panel">
                      <h4>Dostawa</h4>
                      <p>{{ row.deliveryMethod || row.deliveryMethodName || '—' }}</p>
                      <p>{{ row.deliveryAddress || '—' }}</p>
                      <p>{{ row.deliveryZipCode }} {{ row.deliveryCity }}</p>
                    </div>
                    <div class="detail-panel">
                      <h4>Płatność</h4>
                      <p>Status: {{ row.paymentStatus || '—' }}</p>
                      <p>Metoda: {{ row.paymentMethod || '—' }}</p>
                      <p>Realizacja: {{ translateAllegroFulfillmentStatus(row.fulfillmentStatus) }}</p>
                    </div>
                    <div class="detail-panel">
                      <h4>Zysk</h4>
                      <p>Sprzedaż: {{ formatPrice(row.productsRevenueAmount) }}</p>
                      <p>Prowizja: {{ formatPrice(row.commissionAmount) }}</p>
                      <p>Koszt: {{ formatPrice(row.productCostAmount) }}</p>
                      <p class="detail-profit" :class="profitClass(row.netProfitAmount)">
                        Netto: {{ formatPrice(row.netProfitAmount) }}
                      </p>
                      <p v-if="!row.billingSyncedAtUtc" class="detail-warn">Prowizja niezsynchronizowana</p>
                    </div>
                  </div>

                  <div class="products-table">
                    <div class="products-head">
                      <span>Produkt</span><span>Oferta</span><span>Ilość</span><span>Cena</span><span>Prowizja</span><span>Koszt</span><span>Zysk</span>
                    </div>
                    <div
                      v-for="(item, idx) in (row.lineItems || row.items || [])"
                      :key="idx"
                      class="product-row"
                    >
                      <span class="product-row__name">{{ item.name || item.offerName || '—' }}</span>
                      <span>{{ item.offerId || '—' }}</span>
                      <span>{{ item.quantity }}</span>
                      <span>{{ formatPrice(item.price || item.amount) }}</span>
                      <span>{{ formatPrice(item.commissionAmount) }}</span>
                      <span>{{ formatPrice(item.productCostAmount) }}</span>
                      <span :class="profitClass(item.netProfit)">{{ formatPrice(item.netProfit) }}</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </template>
        </el-skeleton>
      </div>

      <div class="list-footer">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :current-page="filter.page"
          :page-size="filter.pageSize"
          :total="dataTable.totalCount"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="importDialogVisible"
      title="Pobierz zamówienia z Allegro"
      width="520px"
      :close-on-click-modal="!importing"
      :close-on-press-escape="!importing"
      :show-close="!importing"
    >
      <div class="import-dialog">
        <p>System pobierze zamówienia z Allegro i zapisze je lokalnie. Istniejące zamówienia zostaną zaktualizowane.</p>
        <el-checkbox v-model="importOptions.importAll">Pobierz wszystkie strony wyników</el-checkbox>
        <div class="import-dialog__grid">
          <div>
            <label class="filter-label">Data od</label>
            <el-date-picker v-model="importOptions.from" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="!w-full" clearable />
          </div>
          <div>
            <label class="filter-label">Data do</label>
            <el-date-picker v-model="importOptions.to" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="!w-full" clearable />
          </div>
          <div>
            <label class="filter-label">Status Allegro</label>
            <el-select v-model="importOptions.status" clearable placeholder="Wszystkie" class="!w-full">
              <el-option v-for="opt in ALLEGRO_ORDER_STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
          <div>
            <label class="filter-label">Realizacja</label>
            <el-select v-model="importOptions.fulfillmentStatus" clearable placeholder="Wszystkie" class="!w-full">
              <el-option v-for="opt in ALLEGRO_FULFILLMENT_STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
        </div>
        <p v-if="!importOptions.from" class="import-dialog__hint">Bez daty „od” zostanie użyty domyślny zakres z ustawień Allegro.</p>
      </div>
      <template #footer>
        <el-button :disabled="importing" @click="importDialogVisible = false">Anuluj</el-button>
        <el-button type="primary" :loading="importing" @click="importOrders">
          {{ importing ? 'Pobieram...' : 'Pobierz zamówienia' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.allegro-orders-page {
  padding: 18px 20px 28px;
  min-height: 100%;
  background: linear-gradient(180deg, #fff7ed 0%, #f8fafc 100%);
}

.allegro-orders-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.allegro-orders-page__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ea580c;
}

.allegro-orders-page__title {
  margin: 4px 0 0;
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
}

.allegro-orders-page__subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.allegro-orders-page__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.allegro-kpi {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.cosmic-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  min-height: 120px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
}

.cosmic-card--total { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%); }
.cosmic-card--local { background: linear-gradient(135deg, #7c2d12 0%, #c2410c 55%, #ea580c 100%); }
.cosmic-card--cod { background: linear-gradient(135deg, #042f2e 0%, #134e4a 45%, #115e59 100%); }
.cosmic-card--profit { background: linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #4338ca 100%); }

.cosmic-card__stars {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 70% 20%, rgba(255, 255, 255, 0.7), transparent);
  pointer-events: none;
}

.cosmic-card__content {
  position: relative;
  z-index: 1;
  padding: 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cosmic-card__head { display: flex; justify-content: space-between; }
.cosmic-card__label { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(226, 232, 240, 0.85); }
.cosmic-card__glyph { color: rgba(255, 255, 255, 0.55); }
.cosmic-card__value { margin-top: 8px; font-size: 26px; font-weight: 900; color: #fff; }
.cosmic-card__value--sm { font-size: 20px; }
.cosmic-card__foot { margin-top: 4px; font-size: 11px; color: rgba(226, 232, 240, 0.75); }
.cosmic-card__chart { height: 40px; margin-top: auto; }
.cosmic-card__chart--donut { height: 44px; }

.filters-card,
.list-card {
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
  margin-bottom: 12px;
}

.filters-card__head {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
}

.filters-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #334155;
}

.filters-card__chevron { transition: transform 0.2s; }
.filters-card__chevron--open { transform: rotate(180deg); }
.filters-card__body { padding: 0 16px 16px; }

.filter-label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid #ffedd5;
  background: #fff7ed;
  font-size: 13px;
  color: #9a3412;
}

.list-head {
  display: grid;
  grid-template-columns: 72px 1.2fr 1.3fr 1fr 1.1fr 70px;
  gap: 10px;
  padding: 10px 14px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
}

.list-scroll-wrap {
  max-height: calc(100vh - 420px);
  min-height: 280px;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.list-footer {
  padding: 8px 14px 12px;
  border-top: 1px solid #f1f5f9;
}

.orders-list { display: flex; flex-direction: column; gap: 10px; }

.order-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.order-card:hover {
  border-color: #fdba74;
  box-shadow: 0 8px 24px rgba(234, 88, 12, 0.08);
}

.order-card--selected {
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.18);
}

.order-card--checked {
  border-color: #fb923c;
  background: #fffaf5;
}

.order-card__stripe {
  height: 3px;
  background: linear-gradient(90deg, #ea580c, #fb923c);
}

.order-card__main {
  display: grid;
  grid-template-columns: 72px 1.2fr 1.3fr 1fr 1.1fr 70px;
  gap: 10px;
  padding: 12px 14px;
  align-items: center;
}

.order-card__col--toggle {
  display: flex;
  align-items: center;
  gap: 6px;
}

.list-head__check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-btn {
  border: none;
  background: #f8fafc;
  color: #64748b;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

.order-card__id {
  font-size: 11px;
  font-weight: 700;
  color: #334155;
  word-break: break-all;
}

.order-card__date { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.sandbox-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background: #fef3c7;
  color: #b45309;
}

.order-card__buyer { font-weight: 700; font-size: 13px; color: #0f172a; }
.order-card__delivery { font-size: 11px; color: #64748b; margin-top: 2px; }

.order-card__amount { font-weight: 800; font-size: 14px; color: #0f172a; }
.order-card__profit { font-size: 11px; margin-top: 2px; }
.order-card__commission { font-size: 10px; color: #94a3b8; }

.profit--pos { color: #15803d; font-weight: 700; }
.profit--neg { color: #b91c1c; font-weight: 700; }

.status-chip {
  display: inline-block;
  margin: 2px 4px 2px 0;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.status-chip--ready { background: #dcfce7; color: #166534; }
.status-chip--pending { background: #fef3c7; color: #b45309; }
.status-chip--cancelled { background: #fee2e2; color: #b91c1c; }
.status-chip--neutral { background: #f1f5f9; color: #475569; }
.status-chip--new { background: #e0f2fe; color: #0369a1; }
.status-chip--progress { background: #ede9fe; color: #6d28d9; }
.status-chip--done { background: #dcfce7; color: #166534; }
.status-chip--warning { background: #ffedd5; color: #c2410c; }
.status-chip--paid { background: #dcfce7; color: #166534; }
.status-chip--cod { background: #ffedd5; color: #c2410c; }

.local-chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
}

.local-chip--yes { background: #dcfce7; color: #166534; }
.local-chip--no { background: #fee2e2; color: #b91c1c; }

.order-card__detail {
  border-top: 1px solid #f1f5f9;
  padding: 14px;
  background: #fafbfc;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.detail-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 12px;
  color: #475569;
}

.detail-panel h4 {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.detail-panel p { margin: 2px 0; }
.detail-profit { font-weight: 800; }
.detail-warn { color: #b45309; font-weight: 600; }

.products-table {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.products-head,
.product-row {
  display: grid;
  grid-template-columns: 2fr 1fr 0.5fr 0.8fr 0.8fr 0.8fr 0.8fr;
  gap: 8px;
  padding: 8px 12px;
  font-size: 11px;
  align-items: center;
}

.products-head {
  background: #f8fafc;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  font-size: 10px;
}

.product-row { border-top: 1px solid #f1f5f9; }
.product-row__name { font-weight: 600; color: #334155; }

.orders-empty {
  text-align: center;
  padding: 48px 20px;
  color: #64748b;
}

.orders-empty__icon { font-size: 40px; margin-bottom: 8px; }
.orders-empty h3 { margin: 0 0 6px; color: #334155; }

.order-skeleton { padding: 6px 8px; }

.import-dialog { display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: #334155; }
.import-dialog__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.import-dialog__hint { font-size: 12px; color: #64748b; margin: 0; }

@media (max-width: 1200px) {
  .allegro-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .list-head { display: none; }
  .order-card__main { grid-template-columns: 72px 1fr; gap: 8px; }
  .order-card__col--money,
  .order-card__col--status,
  .order-card__col--local { grid-column: 2; }
  .detail-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .allegro-kpi { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .products-head,
  .product-row { grid-template-columns: 1fr 1fr; }
}
</style>
