<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import { Filter, ArrowDown, Refresh, Box, Van, CircleCheck } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Api } from '/@/services/api'
import CreateShipmentModal from '../Modal/CreateShipmentModal.vue'

use([PieChart, BarChart, GridComponent, TooltipComponent, CanvasRenderer])

enum ShipmentProvider {
  Unknown = 0,
  Dpd = 1,
  Geodis = 2,
  Gls = 3,
  Jas = 4
}

enum PaymentProvider {
  CashOnDelivery = 2
}

const toast = useToast()
const cookies = new Cookies()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const filtersOpen = ref(false)
const dataTable = ref<any>({ items: [], pageNumber: 1, totalCount: 0 })
const brands = ref<{ value: string | null; label: string }[]>([])
const routeProducer = typeof route.query.producerId === 'string'
  ? route.query.producerId
  : typeof route.query.brandId === 'string'
    ? route.query.brandId
    : null
const producer = ref<string | null>(routeProducer)
const expandedOrderId = ref<string | null>(null)
const selectedOrderIds = ref<Set<string>>(new Set())
const selectedOrderItems = ref<Record<string, Set<string>>>({})

const filter = ref({
  StoreId: cookies.get('dsStore'),
  SmartTableParam: {
    Page: 1,
    PageSize: 50,
    Search: {
      PredicateObject: {
        NumberOrder: null as string | null,
        ShipmentData: null as string | null,
        BrandId: routeProducer as string | null,
        IsCOD: null as boolean | null
      }
    }
  }
})

const shipmentModalOpen = ref(false)
const shipmentProvider = ref<ShipmentProvider | null>(null)
const shipmentOrder = ref<any>(null)

const items = computed(() => dataTable.value?.items ?? [])

const kpi = computed(() => {
  const rows = items.value
  const allItems = rows.flatMap((r: any) => r.orderProcessedItems ?? [])
  return {
    total: rows.length,
    pendingManufacturer: rows.filter((r: any) => !checkIfAllOrdered(r)).length,
    pendingCourier: rows.filter((r: any) => checkIfAllOrdered(r) && !checkIfAllCourierOrdered(r)).length,
    readyToShip: rows.filter((r: any) => checkIfAllCourierOrdered(r) && !checkIfAllProductShipped(r)).length,
    codCount: rows.filter((r: any) => r.paymentProvider === PaymentProvider.CashOnDelivery).length,
    totalValue: rows.reduce((s: number, r: any) => s + (r.orderPriceGross ?? 0), 0),
    itemsTotal: allItems.length,
    itemsPendingManufacturer: allItems.filter((i: any) => !i.itemOrderedFromManufacturer).length
  }
})

const pipelineDonutOption = computed(() => ({
  series: [{
    type: 'pie',
    radius: ['58%', '88%'],
    silent: true,
    label: { show: false },
    data: [
      { value: kpi.value.pendingManufacturer || 0.1, itemStyle: { color: '#f97316' } },
      { value: kpi.value.pendingCourier || 0.1, itemStyle: { color: '#3b82f6' } },
      { value: kpi.value.readyToShip || 0.1, itemStyle: { color: '#22c55e' } }
    ]
  }]
}))

const itemsBarOption = computed(() => ({
  grid: { left: 0, right: 0, top: 4, bottom: 0 },
  xAxis: { type: 'category', show: false, data: ['P', 'K', 'W'] },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'bar',
    barWidth: '55%',
    data: [
      { value: kpi.value.itemsPendingManufacturer, itemStyle: { color: '#fb923c', borderRadius: [4, 4, 0, 0] } },
      { value: kpi.value.itemsTotal - kpi.value.itemsPendingManufacturer, itemStyle: { color: '#818cf8', borderRadius: [4, 4, 0, 0] } },
      { value: kpi.value.readyToShip, itemStyle: { color: '#34d399', borderRadius: [4, 4, 0, 0] } }
    ]
  }]
}))

const activeFiltersCount = computed(() => {
  const p = filter.value.SmartTableParam.Search.PredicateObject
  return [p.NumberOrder, p.ShipmentData, p.BrandId, p.IsCOD].filter((v) => v !== null && v !== '' && v !== undefined).length
})

const selectedOrdersCount = computed(() => selectedOrderIds.value.size)

const readyToMarkShippedRows = computed(() =>
  items.value.filter((row: any) =>
    checkIfAllOrdered(row) &&
    checkIfAllCourierOrdered(row) &&
    !checkIfAllProductShipped(row)
  )
)

const money = (v?: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v ?? 0)

const currentDateTimeValue = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

function checkIfAllOrdered(row: any) {
  return row.orderProcessedItems?.every((item: any) => item.itemOrderedFromManufacturer) ?? false
}

function checkIfAllCourierOrdered(row: any) {
  return row.orderProcessedItems?.every((item: any) => item.orderedCourier) ?? false
}

function checkIfAllProductShipped(row: any) {
  return row.orderProcessedItems?.every((item: any) => item.itemShiped) ?? false
}

const workflowStep = (row: any) => {
  if (!checkIfAllOrdered(row)) return 1
  if (!checkIfAllCourierOrdered(row)) return 2
  if (!checkIfAllProductShipped(row)) return 3
  return 4
}

const workflowLabel = (row: any) => {
  const step = workflowStep(row)
  if (step === 1) return 'Zamów u producenta'
  if (step === 2) return 'Zamów kuriera'
  if (step === 3) return 'Oznacz wysłane'
  return 'Zrealizowane'
}

const orderNote = (row: any) => row.note || row.orderNote || ''

const getSelectedSet = (orderId: string) => {
  if (!selectedOrderItems.value[orderId]) selectedOrderItems.value[orderId] = new Set()
  return selectedOrderItems.value[orderId]
}

const isItemSelected = (orderId: string, orderItemId: string) => getSelectedSet(orderId).has(orderItemId)
const selectedCountForOrder = (orderId: string) => getSelectedSet(orderId).size

const toggleItemSelection = (orderId: string, orderItemId: string, checked: boolean) => {
  const set = getSelectedSet(orderId)
  if (checked) set.add(orderItemId)
  else set.delete(orderItemId)
}

const toggleOrderSelection = (orderId: string, checked: boolean) => {
  if (checked) selectedOrderIds.value.add(orderId)
  else selectedOrderIds.value.delete(orderId)
}

const isOrderSelected = (orderId: string) => selectedOrderIds.value.has(orderId)

const toggleExpand = (orderId: string) => {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const payload = { body: JSON.stringify(filter.value) }
    const result = await Api.shipping.getAllOrderShippingNotProcessed(payload)
    dataTable.value = result.data ?? { items: [], pageNumber: 1, totalCount: 0 }
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać wysyłek')
  } finally {
    loading.value = false
  }
}

const syncProducerToUrl = () => {
  const query = { ...route.query }

  if (producer.value) {
    query.producerId = producer.value
  } else {
    delete query.producerId
  }

  delete query.brandId
  router.replace({ query })
}

const applyFilters = async () => {
  filter.value.SmartTableParam.Page = 1
  await fetchTableData()
}

const clearFilters = async () => {
  const storeId = filter.value.StoreId
  filter.value = {
    StoreId: storeId,
    SmartTableParam: {
      Page: 1,
      PageSize: 50,
      Search: {
        PredicateObject: {
          NumberOrder: null,
          ShipmentData: null,
          BrandId: producer.value,
          IsCOD: null
        }
      }
    }
  }
  await fetchTableData()
}

const generateOrderForManufacturerHandle = async () => {
  if (!producer.value) {
    toast.warning('Wybierz producenta z listy')
    return
  }
  try {
    await Api.shipping.generateOrderToManufacturer({
      body: JSON.stringify({ brandId: producer.value, storeId: cookies.get('dsStore') })
    })
    toast.success('Wysłano zamówienie towarów do producenta')
    await fetchTableData()
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się wygenerować zamówienia u producenta')
  }
}

const generateSelectedOrdersToManufacturerHandle = async () => {
  if (!selectedOrdersCount.value) {
    toast.warning('Zaznacz przynajmniej jedno zamówienie')
    return
  }
  try {
    await Api.shipping.generateOrdersToManufacturerSelected({
      body: JSON.stringify({
        storeId: cookies.get('dsStore'),
        brandId: producer.value || null,
        orderIds: Array.from(selectedOrderIds.value)
      })
    })
    toast.success(`Wysłano ${selectedOrdersCount.value} zamówień do producenta`)
    selectedOrderIds.value = new Set()
    await fetchTableData()
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się wygenerować zamówień')
  }
}

const sendSelectedItemsToManufacturer = async (orderRow: any) => {
  const orderId = orderRow?.orderId
  const ids = Array.from(getSelectedSet(orderId))
  if (!ids.length) {
    toast.warning('Zaznacz przynajmniej 1 produkt')
    return
  }
  try {
    await Api.shipping.generateOrderSelectedProductsToManufacturer({
      body: JSON.stringify({ orderId, orderItemIds: ids })
    })
    toast.success(`Wysłano ${ids.length} pozycji do producenta`)
    selectedOrderItems.value[orderId] = new Set()
    await fetchTableData()
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się wysłać produktów')
  }
}

const orderAllPendingItems = async (orderRow: any) => {
  const pending = (orderRow.orderProcessedItems ?? [])
    .filter((i: any) => !i.itemOrderedFromManufacturer)
    .map((i: any) => i.orderItemId)
  if (!pending.length) {
    toast.info('Wszystkie pozycje są już zamówione u producenta')
    return
  }
  selectedOrderItems.value[orderRow.orderId] = new Set(pending)
  await sendSelectedItemsToManufacturer(orderRow)
}

const updateDateOrderedFromManufacturer = async (row: any, showToast = true) => {
  row.itemOrderedFromManufacturer = !!row.itemOrderedFromManufacturerDate
  try {
    await Api.shipping.changeManufacturerOrderedDate({
      body: JSON.stringify({ orderItemId: row.orderItemId, itemOrderedFromManufacturerDate: row.itemOrderedFromManufacturerDate })
    })
    if (showToast) toast.success('Zaktualizowano datę u producenta')
  } catch {
    toast.error('Błąd aktualizacji daty')
    throw new Error('Manufacturer status update failed')
  }
}

const setManufacturerStatus = async (row: any, enabled: boolean, showToast = false) => {
  row.itemOrderedFromManufacturerDate = enabled ? currentDateTimeValue() : null
  await updateDateOrderedFromManufacturer(row, showToast)
}

const updateDateOrderedCourier = async (row: any, showToast = true) => {
  row.orderedCourier = !!row.orderedCourierDate
  try {
    await Api.shipping.changeOrderedCourier({
      body: JSON.stringify({ orderItemId: row.orderItemId, orderedCourierDate: row.orderedCourierDate })
    })
    if (showToast) toast.success('Zaktualizowano datę kuriera')
  } catch {
    toast.error('Błąd aktualizacji daty')
    throw new Error('Courier status update failed')
  }
}

const setCourierStatus = async (row: any, enabled: boolean, showToast = false) => {
  row.orderedCourierDate = enabled ? currentDateTimeValue() : null
  await updateDateOrderedCourier(row, showToast)
}

const updateDateShipped = async (row: any, showToast = true) => {
  row.itemShiped = !!row.itemShipedDate
  try {
    await Api.shipping.changeShippingOrderState({
      body: JSON.stringify({ orderItemId: row.orderItemId, itemShipedDate: row.itemShipedDate })
    })
    if (showToast) toast.success('Zaktualizowano datę wysyłki')
  } catch {
    toast.error('Błąd aktualizacji daty')
    throw new Error('Shipped status update failed')
  }
}

const setShippedStatus = async (row: any, enabled: boolean, showToast = false) => {
  row.itemShipedDate = enabled ? currentDateTimeValue() : null
  await updateDateShipped(row, showToast)
}

const toggleOrderWorkflowStatus = async (
  orderRow: any,
  status: 'manufacturer' | 'courier' | 'shipped'
) => {
  const orderItems = orderRow.orderProcessedItems ?? []
  if (!orderItems.length) {
    return
  }

  const enabled = status === 'manufacturer'
    ? !checkIfAllOrdered(orderRow)
    : status === 'courier'
      ? !checkIfAllCourierOrdered(orderRow)
      : !checkIfAllProductShipped(orderRow)

  try {
    if (status === 'manufacturer') {
      await Promise.all(orderItems.map((item: any) => setManufacturerStatus(item, enabled)))
    } else if (status === 'courier') {
      await Promise.all(orderItems.map((item: any) => setCourierStatus(item, enabled)))
    } else {
      await Promise.all(orderItems.map((item: any) => setShippedStatus(item, enabled)))
    }

    toast.success(enabled ? 'Zaznaczono status dla zamówienia' : 'Wyczyszczono status dla zamówienia')
    await fetchTableData()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zmienić statusu zamówienia')
    await fetchTableData()
  }
}

const markReadyOrdersAsShipped = async () => {
  const readyRows = readyToMarkShippedRows.value

  if (!readyRows.length) {
    toast.info('Brak zamówień gotowych do oznaczenia jako wysłane')
    return
  }

  selectedOrderIds.value = new Set(readyRows.map((row: any) => row.orderId))

  try {
    const orderItems = readyRows.flatMap((row: any) =>
      (row.orderProcessedItems ?? []).filter((item: any) => !item.itemShiped)
    )

    await Promise.all(orderItems.map((item: any) => setShippedStatus(item, true)))
    toast.success(`Oznaczono jako wysłane: ${readyRows.length} zamówień`)
    await fetchTableData()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się oznaczyć zamówień jako wysłane')
    await fetchTableData()
  }
}

const updateOwnLabel = async (row: any) => {
  try {
    await Api.shipping.changeOwnLabel({
      body: JSON.stringify({ orderItemId: row.orderItemId, ownLabel: row.ownLabel })
    })
    toast.success('Zaktualizowano etykietę')
  } catch {
    toast.error('Błąd aktualizacji etykiety')
  }
}

const openCreateShipmentModal = (provider: ShipmentProvider, row: any) => {
  shipmentProvider.value = provider
  shipmentOrder.value = row
  shipmentModalOpen.value = true
}

const allBrands = async () => {
  try {
    const result = await Api.brands.listByStoreId()
    brands.value = [
      { value: null, label: 'Wszyscy producenci' },
      ...result.items.map((item: any) => ({ value: item.id, label: item.name }))
    ]
  } catch (e) {
    console.error(e)
  }
}

watch(producer, (val) => {
  filter.value.SmartTableParam.Search.PredicateObject.BrandId = val || null
  syncProducerToUrl()
  applyFilters()
})

onMounted(async () => {
  await allBrands()
  await fetchTableData()
})
</script>

<template>
  <div class="shipping-page">
    <header class="shipping-page__header">
      <div>
        <p class="shipping-page__eyebrow">Realizacja zamówień</p>
        <h1 class="shipping-page__title">Wysyłki</h1>
        <p class="shipping-page__subtitle">Producent → kurier → wysyłka — w jednym miejscu</p>
      </div>
      <div class="shipping-page__actions">
        <el-select v-model="producer" clearable placeholder="Producent" class="shipping-page__brand" filterable>
          <el-option v-for="b in brands" :key="String(b.value)" :label="b.label" :value="b.value" />
        </el-select>
        <el-button :icon="Refresh" :loading="loading" @click="fetchTableData">Odśwież</el-button>
        <el-button type="warning" :disabled="!producer" @click="generateOrderForManufacturerHandle">
          Zamów towary (producent)
        </el-button>
        <el-button type="primary" :disabled="!selectedOrdersCount" @click="generateSelectedOrdersToManufacturerHandle">
          Zamów zaznaczone ({{ selectedOrdersCount }})
        </el-button>
        <el-button type="success" :disabled="!readyToMarkShippedRows.length" @click="markReadyOrdersAsShipped">
          Oznacz gotowe jako wysłane ({{ readyToMarkShippedRows.length }})
        </el-button>
      </div>
    </header>

    <div class="shipping-kpi">
      <div class="cosmic-card cosmic-card--queue">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">W kolejce</span><span class="cosmic-card__glyph">◎</span></div>
          <div class="cosmic-card__value">{{ kpi.total }}</div>
          <div class="cosmic-card__foot">{{ kpi.itemsTotal }} pozycji · {{ money(kpi.totalValue) }}</div>
          <v-chart class="cosmic-card__chart cosmic-card__chart--donut" :option="pipelineDonutOption" autoresize />
        </div>
      </div>
      <div class="cosmic-card cosmic-card--producer">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">U producenta</span><span class="cosmic-card__glyph">◈</span></div>
          <div class="cosmic-card__value">{{ kpi.pendingManufacturer }}</div>
          <div class="cosmic-card__foot">{{ kpi.itemsPendingManufacturer }} pozycji czeka</div>
          <v-chart class="cosmic-card__chart" :option="itemsBarOption" autoresize />
        </div>
      </div>
      <div class="cosmic-card cosmic-card--courier">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">Kurier</span><span class="cosmic-card__glyph">✦</span></div>
          <div class="cosmic-card__value">{{ kpi.pendingCourier }}</div>
          <div class="cosmic-card__foot">{{ kpi.readyToShip }} gotowych do wysyłki</div>
        </div>
      </div>
      <div class="cosmic-card cosmic-card--cod">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">Pobranie COD</span><span class="cosmic-card__glyph">❖</span></div>
          <div class="cosmic-card__value">{{ kpi.codCount }}</div>
          <div class="cosmic-card__foot">zamówień za pobraniem</div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="filters-card">
      <div class="filters-card__head" @click="filtersOpen = !filtersOpen">
        <div class="filters-card__title">
          <el-icon><Filter /></el-icon><span>Filtry</span>
          <el-tag v-if="activeFiltersCount" size="small" type="warning" effect="dark" round>{{ activeFiltersCount }}</el-tag>
        </div>
        <el-icon class="filters-card__chevron" :class="{ 'filters-card__chevron--open': filtersOpen }"><ArrowDown /></el-icon>
      </div>
      <el-collapse-transition>
        <div v-show="filtersOpen" class="filters-card__body">
          <el-row :gutter="12">
            <el-col :xs="24" :sm="8" :md="6">
              <label class="filter-label">Nr zamówienia</label>
              <el-input v-model="filter.SmartTableParam.Search.PredicateObject.NumberOrder" clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="8" :md="8">
              <label class="filter-label">Adres wysyłki</label>
              <el-input v-model="filter.SmartTableParam.Search.PredicateObject.ShipmentData" clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="8" :md="6">
              <label class="filter-label">Pobranie COD</label>
              <el-select v-model="filter.SmartTableParam.Search.PredicateObject.IsCOD" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" /><el-option label="Nie" :value="false" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="24" :md="4" class="flex items-end gap-2">
              <el-button type="primary" @click="applyFilters">Zastosuj</el-button>
              <el-button @click="clearFilters">Wyczyść</el-button>
              <el-button :icon="Refresh" :loading="loading" @click="fetchTableData">Odśwież</el-button>
            </el-col>
          </el-row>
        </div>
      </el-collapse-transition>
    </el-card>

    <el-card shadow="never" class="list-card">
      <div class="list-head">
        <span></span>
        <span>Zamówienie</span>
        <span>Producent / adres</span>
        <span>Workflow</span>
        <span>Statusy</span>
        <span>Kurier</span>
      </div>

      <div class="list-scroll-wrap">
        <el-skeleton :loading="loading" animated :count="3">
          <template #template>
            <div class="ship-skeleton"><el-skeleton-item variant="h3" style="width:100%;height:80px;border-radius:16px" /></div>
          </template>
          <template #default>
            <div v-if="!items.length" class="shipping-empty">
              <div class="shipping-empty__icon">📦</div>
              <h3>Brak zamówień do wysyłki</h3>
              <p>Wszystko zrealizowane lub brak wyników dla filtrów.</p>
            </div>

            <div v-else class="shipping-list">
              <article
                v-for="row in items"
                :key="row.sortId"
                class="ship-card"
                :class="{
                  'ship-card--selected': isOrderSelected(row.orderId),
                  'ship-card--expanded': expandedOrderId === row.orderId,
                  [`ship-card--step-${workflowStep(row)}`]: true
                }"
              >
                <div class="ship-card__stripe" />

                <div class="ship-card__main">
                  <div class="ship-card__col ship-card__col--check">
                    <el-checkbox :model-value="isOrderSelected(row.orderId)" @change="(v: any) => toggleOrderSelection(row.orderId, !!v)" @click.stop />
                    <button type="button" class="expand-btn" @click.stop="toggleExpand(row.orderId)">
                      {{ expandedOrderId === row.orderId ? '▾' : '▸' }}
                    </button>
                  </div>

                  <div class="ship-card__col ship-card__col--order">
                    <div class="ship-card__number">#{{ row.orderNumber }}</div>
                    <div class="ship-card__meta">{{ row.brandName }}</div>
                    <div class="ship-card__amount">{{ money(row.orderPriceGross) }}</div>
                    <span v-if="row.paymentProvider === PaymentProvider.CashOnDelivery" class="cod-badge">COD</span>
                  </div>

                  <div class="ship-card__col ship-card__col--address">
                    <div class="ship-card__address">{{ row.shippingAdres }}</div>
                    <div v-if="orderNote(row)" class="ship-card__note" :title="orderNote(row)">📝 {{ orderNote(row) }}</div>
                  </div>

                  <div class="ship-card__col ship-card__col--workflow">
                    <div class="workflow-pill" :class="`workflow-pill--step-${workflowStep(row)}`">
                      <el-icon v-if="workflowStep(row) === 1"><Box /></el-icon>
                      <el-icon v-else-if="workflowStep(row) === 2"><Van /></el-icon>
                      <el-icon v-else><CircleCheck /></el-icon>
                      {{ workflowLabel(row) }}
                    </div>
                    <div class="workflow-steps">
                      <span :class="{ done: checkIfAllOrdered(row) }">1 Producent</span>
                      <span :class="{ done: checkIfAllCourierOrdered(row) }">2 Kurier</span>
                      <span :class="{ done: checkIfAllProductShipped(row) }">3 Wysłane</span>
                    </div>
                  </div>

                  <div class="ship-card__col ship-card__col--flags">
                    <button
                      type="button"
                      class="flag flag--clickable"
                      :class="checkIfAllOrdered(row) ? 'flag--yes' : 'flag--no'"
                      @click.stop="toggleOrderWorkflowStatus(row, 'manufacturer')"
                    >
                      Producent
                    </button>
                    <button
                      type="button"
                      class="flag flag--clickable"
                      :class="checkIfAllCourierOrdered(row) ? 'flag--yes' : 'flag--no'"
                      @click.stop="toggleOrderWorkflowStatus(row, 'courier')"
                    >
                      Kurier
                    </button>
                    <button
                      type="button"
                      class="flag flag--clickable"
                      :class="checkIfAllProductShipped(row) ? 'flag--yes' : 'flag--no'"
                      @click.stop="toggleOrderWorkflowStatus(row, 'shipped')"
                    >
                      Wysłane
                    </button>
                  </div>

                  <div class="ship-card__col ship-card__col--courier">
                    <div class="courier-grid">
                      <button type="button" class="courier-btn" @click.stop="openCreateShipmentModal(ShipmentProvider.Dpd, row)">DPD</button>
                      <button type="button" class="courier-btn courier-btn--geo" @click.stop="openCreateShipmentModal(ShipmentProvider.Geodis, row)">Geodis</button>
                      <button type="button" class="courier-btn" @click.stop="openCreateShipmentModal(ShipmentProvider.Gls, row)">GLS</button>
                      <button type="button" class="courier-btn" @click.stop="openCreateShipmentModal(ShipmentProvider.Jas, row)">JAS</button>
                    </div>
                  </div>
                </div>

                <div v-if="expandedOrderId === row.orderId" class="ship-card__detail">
                  <div class="detail-addresses">
                    <div class="detail-panel">
                      <h4>Klient</h4>
                      <p>{{ row.billingAddress?.companyName || `${row.billingAddress?.firstName} ${row.billingAddress?.lastName}` }}</p>
                      <p>{{ row.billingAddress?.addressLine1 }}, {{ row.billingAddress?.zipCode }} {{ row.billingAddress?.city }}</p>
                      <p>{{ row.billingAddress?.email }} · {{ row.billingAddress?.phone }}</p>
                    </div>
                    <div class="detail-panel">
                      <h4>Wysyłka</h4>
                      <p>{{ row.shippingAddress?.firstName }} {{ row.shippingAddress?.lastName }}</p>
                      <p>{{ row.shippingAddress?.addressLine1 }}, {{ row.shippingAddress?.zipCode }} {{ row.shippingAddress?.city }}</p>
                      <p>{{ row.shippingAddress?.phone }}</p>
                    </div>
                    <div class="detail-panel detail-panel--actions">
                      <el-button size="small" type="warning" @click="orderAllPendingItems(row)">Zamów wszystkie brakujące u producenta</el-button>
                      <el-button size="small" type="primary" :disabled="!selectedCountForOrder(row.orderId)" @click="sendSelectedItemsToManufacturer(row)">
                        Wyślij zaznaczone ({{ selectedCountForOrder(row.orderId) }})
                      </el-button>
                      <el-button size="small" @click="selectedOrderItems[row.orderId] = new Set()">Wyczyść zaznaczenie</el-button>
                    </div>
                  </div>

                  <div class="products-table">
                    <div class="products-head">
                      <span></span><span>Produkt</span><span>Ilość</span><span>Kod</span>
                      <span>Producent</span><span>Kurier</span><span>Wysłane</span><span>Etyk.</span>
                    </div>
                    <div
                      v-for="item in row.orderProcessedItems"
                      :key="item.orderItemId"
                      class="product-row"
                      :class="{ 'product-row--pending': !item.itemOrderedFromManufacturer }"
                    >
                      <el-checkbox
                        :model-value="isItemSelected(row.orderId, item.orderItemId)"
                        @change="(v: any) => toggleItemSelection(row.orderId, item.orderItemId, !!v)"
                      />
                      <div class="product-row__info">
                        <img v-if="item.photo" :src="item.photo" alt="" class="product-row__img" />
                        <a :href="item.slug ? `https://olmag.pl/${item.slug}` : '#'" target="_blank" class="product-row__name">{{ item.name }}</a>
                        <span v-if="item.noteForProducer" class="product-row__note">{{ item.noteForProducer }}</span>
                      </div>
                      <span>{{ item.quantity }}</span>
                      <span class="product-row__code">{{ item.productCode }}</span>
                      <button
                        type="button"
                        class="status-toggle"
                        :class="{ 'status-toggle--active': item.itemOrderedFromManufacturer }"
                        :title="item.itemOrderedFromManufacturerDate || 'Kliknij, aby zmienić status'"
                        @click="setManufacturerStatus(item, !item.itemOrderedFromManufacturer, true)"
                      >
                        Producent
                      </button>
                      <button
                        type="button"
                        class="status-toggle"
                        :class="{ 'status-toggle--active': item.orderedCourier }"
                        :title="item.orderedCourierDate || 'Kliknij, aby zmienić status'"
                        @click="setCourierStatus(item, !item.orderedCourier, true)"
                      >
                        Kurier
                      </button>
                      <button
                        type="button"
                        class="status-toggle"
                        :class="{ 'status-toggle--active': item.itemShiped }"
                        :title="item.itemShipedDate || 'Kliknij, aby zmienić status'"
                        @click="setShippedStatus(item, !item.itemShiped, true)"
                      >
                        Wysłane
                      </button>
                      <el-checkbox v-model="item.ownLabel" @change="updateOwnLabel(item)" />
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </template>
        </el-skeleton>
      </div>
    </el-card>

    <CreateShipmentModal
      v-model="shipmentModalOpen"
      :provider="shipmentProvider"
      :order="shipmentOrder"
      @created="fetchTableData"
    />
  </div>
</template>

<style scoped>
.shipping-page { padding: 18px 20px 28px; min-height: 100%; background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%); }
.shipping-page__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
.shipping-page__eyebrow { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #6366f1; }
.shipping-page__title { margin: 4px 0 0; font-size: 28px; font-weight: 900; color: #0f172a; }
.shipping-page__subtitle { margin: 6px 0 0; font-size: 13px; color: #64748b; }
.shipping-page__actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.shipping-page__brand { min-width: 200px; }

.shipping-kpi { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
.cosmic-card { position: relative; overflow: hidden; border-radius: 18px; min-height: 130px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 16px 40px rgba(15,23,42,0.18); }
.cosmic-card--queue { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%); }
.cosmic-card--producer { background: linear-gradient(135deg, #7c2d12 0%, #c2410c 55%, #ea580c 100%); }
.cosmic-card--courier { background: linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #4338ca 100%); }
.cosmic-card--cod { background: linear-gradient(135deg, #042f2e 0%, #134e4a 45%, #115e59 100%); }
.cosmic-card__stars { position: absolute; inset: 0; opacity: 0.35; background-image: radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.7), transparent); pointer-events: none; }
.cosmic-card__content { position: relative; z-index: 1; padding: 14px; height: 100%; display: flex; flex-direction: column; }
.cosmic-card__head { display: flex; justify-content: space-between; }
.cosmic-card__label { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(226,232,240,0.85); }
.cosmic-card__glyph { color: rgba(255,255,255,0.55); }
.cosmic-card__value { margin-top: 8px; font-size: 26px; font-weight: 900; color: #fff; }
.cosmic-card__foot { margin-top: 4px; font-size: 11px; color: rgba(226,232,240,0.75); }
.cosmic-card__chart { height: 40px; margin-top: auto; }
.cosmic-card__chart--donut { height: 48px; }

.filters-card, .list-card { border-radius: 18px; border: 1px solid #e2e8f0; background: rgba(255,255,255,0.94); box-shadow: 0 12px 32px rgba(15,23,42,0.05); margin-bottom: 12px; }
.filters-card__head { display: flex; justify-content: space-between; padding: 12px 16px; cursor: pointer; }
.filters-card__title { display: flex; align-items: center; gap: 8px; font-weight: 800; color: #334155; }
.filters-card__chevron { transition: transform 0.2s; }
.filters-card__chevron--open { transform: rotate(180deg); }
.filters-card__body { padding: 0 16px 16px; }
.filter-label { display: block; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }

.list-head { display: grid; grid-template-columns: 72px 1.1fr 1.4fr 1fr 0.9fr 120px; gap: 10px; padding: 10px 14px; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
.list-scroll-wrap { max-height: calc(100vh - 380px); min-height: 300px; overflow-y: auto; padding: 0 8px 12px; }

.shipping-list { display: flex; flex-direction: column; gap: 10px; }
.ship-card { border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; overflow: hidden; transition: box-shadow 0.15s, border-color 0.15s; }
.ship-card:hover { border-color: #c7d2fe; box-shadow: 0 8px 24px rgba(99,102,241,0.08); }
.ship-card--selected { border-color: #818cf8; box-shadow: 0 0 0 2px rgba(129,140,248,0.2); }
.ship-card--step-1 .ship-card__stripe { background: linear-gradient(90deg, #f97316, #fb923c); }
.ship-card--step-2 .ship-card__stripe { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.ship-card--step-3 .ship-card__stripe { background: linear-gradient(90deg, #22c55e, #4ade80); }
.ship-card--step-4 .ship-card__stripe { background: linear-gradient(90deg, #64748b, #94a3b8); }
.ship-card__stripe { height: 3px; background: #e2e8f0; }

.ship-card__main { display: grid; grid-template-columns: 72px 1.1fr 1.4fr 1fr 0.9fr 120px; gap: 10px; padding: 12px 14px; align-items: center; }
.ship-card__col--check { display: flex; align-items: center; gap: 6px; }
.expand-btn { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; width: 28px; height: 28px; cursor: pointer; color: #475569; }
.ship-card__number { font-size: 15px; font-weight: 900; color: #0f172a; }
.ship-card__meta { font-size: 11px; color: #64748b; }
.ship-card__amount { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }
.cod-badge { display: inline-flex; margin-top: 4px; padding: 2px 7px; border-radius: 999px; background: #fff7ed; color: #c2410c; font-size: 10px; font-weight: 800; }
.ship-card__address { font-size: 12px; font-weight: 600; color: #334155; line-height: 1.35; white-space: pre-line; }
.ship-card__note { margin-top: 4px; font-size: 11px; color: #b45309; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }

.workflow-pill { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }
.workflow-pill--step-1 { background: #fff7ed; color: #c2410c; }
.workflow-pill--step-2 { background: #eff6ff; color: #1d4ed8; }
.workflow-pill--step-3 { background: #f0fdf4; color: #15803d; }
.workflow-pill--step-4 { background: #f1f5f9; color: #475569; }
.workflow-steps { display: flex; gap: 6px; margin-top: 6px; font-size: 9px; font-weight: 700; color: #94a3b8; }
.workflow-steps .done { color: #15803d; }

.flag { display: inline-flex; margin: 2px 4px 2px 0; padding: 3px 7px; border-radius: 999px; font-size: 10px; font-weight: 800; }
.flag--clickable { border: 0; cursor: pointer; transition: transform 0.12s ease, box-shadow 0.12s ease; }
.flag--clickable:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12); }
.flag--yes { background: #ecfdf5; color: #047857; }
.flag--no { background: #fef2f2; color: #b91c1c; }

.courier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.courier-btn { border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 5px 4px; font-size: 10px; font-weight: 800; color: #475569; cursor: pointer; }
.courier-btn:hover { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
.courier-btn--geo { border-color: rgba(249,115,22,0.4); color: #c2410c; }
.courier-btn--geo:hover { background: #fff7ed; }

.ship-card__detail { padding: 0 14px 14px; border-top: 1px solid #f1f5f9; background: linear-gradient(180deg, #f8fafc 0%, #fff 100%); }
.detail-addresses { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; padding-top: 14px; }
.detail-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; }
.detail-panel h4 { margin: 0 0 8px; font-size: 12px; font-weight: 800; color: #334155; }
.detail-panel p { margin: 0 0 4px; font-size: 12px; color: #475569; }
.detail-panel--actions { display: flex; flex-direction: column; gap: 8px; justify-content: center; }

.products-table { margin-top: 14px; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.products-head, .product-row { display: grid; grid-template-columns: 36px 2fr 50px 80px repeat(4, minmax(120px, 1fr)); gap: 8px; padding: 10px 12px; align-items: center; }
.products-head { background: #f8fafc; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
.product-row { border-top: 1px solid #f1f5f9; font-size: 12px; }
.product-row--pending { background: linear-gradient(90deg, #fff 0%, #fff7ed 100%); }
.product-row__info { display: flex; align-items: center; gap: 8px; min-width: 0; }
.product-row__img { width: 36px; height: 36px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; }
.product-row__name { font-weight: 700; color: #1e293b; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-row__note { display: block; font-size: 10px; color: #b45309; }
.product-row__code { font-size: 11px; color: #64748b; }
.status-toggle {
  border: 1px solid #fecaca;
  border-radius: 999px;
  background: #fef2f2;
  color: #b91c1c;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.status-toggle:hover {
  border-color: #fca5a5;
  background: #fee2e2;
}
.status-toggle--active {
  border-color: #bbf7d0;
  background: #ecfdf5;
  color: #047857;
}
.status-toggle--active:hover {
  border-color: #86efac;
  background: #dcfce7;
}

.shipping-empty { text-align: center; padding: 48px 20px; color: #64748b; }
.shipping-empty__icon { font-size: 40px; }
.ship-skeleton { padding: 6px; }

@media (max-width: 1200px) {
  .shipping-kpi { grid-template-columns: repeat(2, 1fr); }
  .list-head { display: none; }
  .ship-card__main { grid-template-columns: 72px 1fr 1fr; }
  .ship-card__col--flags, .ship-card__col--courier { grid-column: span 2; }
  .detail-addresses { grid-template-columns: 1fr; }
  .products-head { display: none; }
  .product-row { grid-template-columns: 1fr; gap: 6px; }
}
@media (max-width: 760px) {
  .shipping-kpi { grid-template-columns: 1fr; }
  .ship-card__main { grid-template-columns: 1fr; }
}
</style>
