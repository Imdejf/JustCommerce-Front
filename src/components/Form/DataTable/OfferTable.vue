<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import { Plus, Edit, View, Filter, ArrowDown } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Api } from '/@/services/api'
import { useOfferStore } from '/@/stores/offer'

use([LineChart, PieChart, GridComponent, TooltipComponent, CanvasRenderer])

const emit = defineEmits<{ 'stats-loaded': [stats: any] }>()

const router = useRouter()
const toast = useToast()
const cookies = new Cookies()
const offerStore = useOfferStore()

const loading = ref(false)
const filtersOpen = ref(false)
const stats = ref<any>(null)
const dataTable = ref<any>({ items: [], pageNumber: 1, totalCount: 0 })
const selectedRowId = ref<string | null>(null)

const filter = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 12,
  SmartTableParam: {
    Search: {
      PredicateObject: {
        OfferNumber: null as string | null,
        AmountMin: null as number | null,
        AmountMax: null as number | null,
        DateFrom: null as string | null,
        DateTo: null as string | null,
        ClientData: null as string | null,
        ShipmentData: null as string | null,
        OfferStatus: null as number | null
      }
    }
  }
})

enum OfferStatus {
  PendingShipment = 0,
  ShippedToCustomer = 1,
  WaitingForDecision = 2,
  Completed = 3,
  Rejected = 4,
  Canceled = 5
}

const statusOptions = [
  { value: OfferStatus.PendingShipment, label: 'Oczekuje na wysłanie' },
  { value: OfferStatus.ShippedToCustomer, label: 'Wysłane do klienta' },
  { value: OfferStatus.WaitingForDecision, label: 'Oczekuje na decyzję' },
  { value: OfferStatus.Completed, label: 'Zaakceptowana' },
  { value: OfferStatus.Rejected, label: 'Odrzucona' },
  { value: OfferStatus.Canceled, label: 'Anulowana' }
]

const activeFiltersCount = computed(() => {
  const p = filter.value.SmartTableParam.Search.PredicateObject
  return [
    p.OfferNumber, p.ClientData, p.ShipmentData, p.OfferStatus,
    p.DateFrom, p.DateTo, p.AmountMin, p.AmountMax
  ].filter((v) => v !== null && v !== '' && v !== undefined).length
})

const pageStats = computed(() => {
  const items = dataTable.value?.items ?? []
  const pipeline = items.filter((o: any) =>
    [OfferStatus.PendingShipment, OfferStatus.ShippedToCustomer, OfferStatus.WaitingForDecision].includes(o.offerStatus)
  )
  return {
    pageCount: items.length,
    pipelineValue: items.reduce((s: number, o: any) => s + (o.totalPriceGross ?? 0), 0),
    pipelineProfit: items.reduce((s: number, o: any) => s + (o.profitNet ?? 0), 0),
    lowMargin: items.filter((o: any) => (o.marginPct ?? 0) < 12).length,
    expiring: items.filter((o: any) => isExpiringSoon(o)).length
  }
})

const sparkData = (current: number, previous: number) => {
  const prev = Math.max(previous, 1)
  const ratio = Math.min(Math.max(current / prev, 0.2), 2)
  return [0.6, 0.75, 0.7, 0.85, 0.9, ratio, Math.min(ratio * 1.05, 2)]
}

const monthSparkOption = computed(() => ({
  grid: { left: 0, right: 0, top: 4, bottom: 0 },
  xAxis: { type: 'category', show: false, data: ['', '', '', '', '', '', ''] },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'line',
    smooth: true,
    symbol: 'none',
    lineStyle: { width: 2, color: '#818cf8' },
    areaStyle: { color: 'rgba(129, 140, 248, 0.25)' },
    data: sparkData(stats.value?.currentMonthOffers ?? 0, stats.value?.previousMonthOffers ?? 1)
  }]
}))

const completedSparkOption = computed(() => ({
  grid: { left: 0, right: 0, top: 4, bottom: 0 },
  xAxis: { type: 'category', show: false, data: ['', '', '', '', '', '', ''] },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'line',
    smooth: true,
    symbol: 'none',
    lineStyle: { width: 2, color: '#34d399' },
    areaStyle: { color: 'rgba(52, 211, 153, 0.22)' },
    data: sparkData(stats.value?.completedCurrentMonth ?? 0, stats.value?.completedPreviousMonth ?? 1)
  }]
}))

const pipelineDonutOption = computed(() => ({
  series: [{
    type: 'pie',
    radius: ['58%', '88%'],
    silent: true,
    label: { show: false },
    data: [
      { value: stats.value?.pipelineProfitNet ?? 1, itemStyle: { color: '#22d3ee' } },
      { value: Math.max((stats.value?.pipelineValueGross ?? 0) - (stats.value?.pipelineProfitNet ?? 0), 1), itemStyle: { color: 'rgba(255,255,255,0.12)' } }
    ]
  }]
}))

const conversionDonutOption = computed(() => ({
  series: [{
    type: 'pie',
    radius: ['58%', '88%'],
    silent: true,
    label: { show: false },
    data: [
      { value: stats.value?.conversionRatePct ?? 0, itemStyle: { color: '#f97316' } },
      { value: Math.max(100 - (stats.value?.conversionRatePct ?? 0), 0.1), itemStyle: { color: 'rgba(255,255,255,0.12)' } }
    ]
  }]
}))

const money = (v?: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v ?? 0)

const moneyNet = (v?: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 }).format(v ?? 0)

const percent = (v?: number) => `${(v ?? 0).toFixed(1)}%`

const deltaBadge = (v?: number) => {
  const val = v ?? 0
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
}

const deltaClass = (v?: number) => (v ?? 0) >= 0 ? 'up' : 'down'

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const daysToExpire = (row: any) => {
  if (!row?.expirationTime) return null
  return Math.ceil((new Date(row.expirationTime).getTime() - Date.now()) / 86400000)
}

const isExpiringSoon = (row: any) => {
  const days = daysToExpire(row)
  return days !== null && days >= 0 && days <= 7
}

const isExpired = (row: any) => row?.isExpired || (daysToExpire(row) !== null && (daysToExpire(row) as number) < 0)

const splitClientData = (data?: string) => {
  if (!data) return { primary: '—', secondary: '' }
  const parts = data.split(',').map((p) => p.trim()).filter(Boolean)
  return { primary: parts[0] ?? '—', secondary: parts.slice(1).join(', ') }
}

const clientPrimary = (row: any) => row.customerName || splitClientData(row.billingData).primary

const clientSecondary = (row: any) => {
  if (row.customerEmail) return row.customerEmail
  return splitClientData(row.billingData).secondary
}

const statusLabel = (status: number) =>
  statusOptions.find((o) => o.value === status)?.label ?? 'Nieznany'

const statusTone = (status: number) => {
  switch (status) {
    case OfferStatus.PendingShipment: return 'slate'
    case OfferStatus.ShippedToCustomer: return 'blue'
    case OfferStatus.WaitingForDecision: return 'amber'
    case OfferStatus.Completed: return 'green'
    case OfferStatus.Rejected:
    case OfferStatus.Canceled: return 'red'
    default: return 'slate'
  }
}

const marginTone = (margin?: number) => {
  if ((margin ?? 0) >= 25) return 'good'
  if ((margin ?? 0) >= 12) return 'ok'
  return 'low'
}

const fetchStatistics = async () => {
  try {
    const storeId = filter.value.StoreId
    if (!storeId) return
    stats.value = await Api.offers.getStatistics(storeId)
    emit('stats-loaded', stats.value)
  } catch (e) {
    console.error(e)
  }
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const payload = { body: JSON.stringify(filter.value) }
    const result = await Api.offers.smartTable(payload)
    dataTable.value = result.data ?? { items: [], pageNumber: 1, totalCount: 0 }
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać ofert')
  } finally {
    loading.value = false
  }
}

const reload = async () => {
  await Promise.all([fetchTableData(), fetchStatistics()])
}

const applyFilters = async () => {
  filter.value.PageNumber = 1
  await fetchTableData()
}

const clearFilters = async () => {
  const storeId = filter.value.StoreId
  filter.value = {
    StoreId: storeId,
    PageNumber: 1,
    PageSize: 12,
    SmartTableParam: {
      Search: {
        PredicateObject: {
          OfferNumber: null,
          AmountMin: null,
          AmountMax: null,
          DateFrom: null,
          DateTo: null,
          ClientData: null,
          ShipmentData: null,
          OfferStatus: null
        }
      }
    }
  }
  await fetchTableData()
}

const handlePageChange = async (page: number) => {
  filter.value.PageNumber = page
  await fetchTableData()
}

const selectRow = (row: any) => {
  selectedRowId.value = row.offerId
}

const openOffer = async (row: any) => {
  selectedRowId.value = row.offerId
  await offerStore.showOffer(row.offerId)
}

const editSelected = () => {
  if (!selectedRowId.value) {
    toast.warning('Wybierz ofertę do edycji')
    return
  }
  router.push(`/sale/offer/edit/${selectedRowId.value}`)
}

const handleChangeStatus = async (status: number, offerId: string) => {
  try {
    await Api.offers.changeOfferStatus({
      body: JSON.stringify({ offerStatus: status, offerId })
    })
    toast.success('Zmieniono status oferty')
    await reload()
  } catch (e) {
    toast.error('Nie udało się zmienić statusu')
  }
}

onMounted(reload)
</script>

<template>
  <div class="offers-page">
    <header class="offers-page__header">
      <div>
        <p class="offers-page__eyebrow">Sprzedaż B2B</p>
        <h1 class="offers-page__title">Oferty handlowe</h1>
        <p class="offers-page__subtitle">Zarządzaj pipeline, marżą i konwersją ofert</p>
      </div>
      <div class="offers-page__actions">
        <el-button type="primary" :icon="Plus" @click="router.push('/sale/offer/createoffer')">
          Nowa oferta
        </el-button>
        <el-button :loading="loading" @click="reload">Odśwież</el-button>
      </div>
    </header>

    <div class="offers-kpi">
      <div class="cosmic-card cosmic-card--pipeline">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head">
            <span class="cosmic-card__label">Pipeline</span>
            <span class="cosmic-card__glyph">◎</span>
          </div>
          <div class="cosmic-card__value cosmic-card__value--money">{{ money(stats?.pipelineValueGross) }}</div>
          <div class="cosmic-card__foot">zysk netto {{ moneyNet(stats?.pipelineProfitNet) }} · {{ stats?.waitingForDecisionCount ?? 0 }} czeka</div>
          <div class="cosmic-card__delta" :class="deltaClass(stats?.currentMonthOffersDeltaPct)">
            {{ deltaBadge(stats?.currentMonthOffersDeltaPct) }} m/m
          </div>
          <v-chart class="cosmic-card__chart cosmic-card__chart--donut" :option="pipelineDonutOption" autoresize />
        </div>
      </div>

      <div class="cosmic-card cosmic-card--conversion">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head">
            <span class="cosmic-card__label">Konwersja</span>
            <span class="cosmic-card__glyph">◈</span>
          </div>
          <div class="cosmic-card__value">{{ percent(stats?.conversionRatePct) }}</div>
          <div class="cosmic-card__foot">{{ stats?.completedOffers ?? 0 }} zaakceptowanych · śr. marża {{ percent(stats?.averageMarginPct) }}</div>
          <div class="cosmic-card__delta" :class="deltaClass(stats?.completedDeltaPct)">
            {{ deltaBadge(stats?.completedDeltaPct) }} realizacji
          </div>
          <v-chart class="cosmic-card__chart cosmic-card__chart--donut" :option="conversionDonutOption" autoresize />
        </div>
      </div>

      <div class="cosmic-card cosmic-card--month">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head">
            <span class="cosmic-card__label">Ten miesiąc</span>
            <span class="cosmic-card__glyph">✦</span>
          </div>
          <div class="cosmic-card__value">{{ stats?.currentMonthOffers ?? 0 }}</div>
          <div class="cosmic-card__foot">poprzedni {{ stats?.previousMonthOffers ?? 0 }} · łącznie {{ stats?.totalOffers ?? 0 }}</div>
          <div class="cosmic-card__delta up">{{ stats?.completedCurrentMonth ?? 0 }} zaakceptowanych</div>
          <v-chart class="cosmic-card__chart" :option="monthSparkOption" autoresize />
        </div>
      </div>

      <div class="cosmic-card cosmic-card--avg">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head">
            <span class="cosmic-card__label">Średnia oferta</span>
            <span class="cosmic-card__glyph">❖</span>
          </div>
          <div class="cosmic-card__value cosmic-card__value--money">{{ money(stats?.averageOfferValueGross) }}</div>
          <div class="cosmic-card__foot">{{ stats?.expiringSoonCount ?? 0 }} wygasa ≤7 dni · {{ stats?.expiredActiveCount ?? 0 }} po terminie</div>
          <div class="cosmic-card__delta" :class="pageStats.lowMargin > 0 ? 'down' : 'up'">
            {{ pageStats.lowMargin }} niskiej marży na stronie
          </div>
          <v-chart class="cosmic-card__chart" :option="completedSparkOption" autoresize />
        </div>
      </div>
    </div>

    <el-card shadow="never" class="filters-card">
      <div class="filters-card__head" @click="filtersOpen = !filtersOpen">
        <div class="filters-card__title">
          <el-icon><Filter /></el-icon>
          <span>Filtry</span>
          <el-tag v-if="activeFiltersCount > 0" size="small" type="warning" effect="dark" round>
            {{ activeFiltersCount }}
          </el-tag>
        </div>
        <el-icon class="filters-card__chevron" :class="{ 'filters-card__chevron--open': filtersOpen }">
          <ArrowDown />
        </el-icon>
      </div>
      <el-collapse-transition>
        <div v-show="filtersOpen" class="filters-card__body">
          <el-row :gutter="12">
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Nr oferty</label>
              <el-input v-model="filter.SmartTableParam.Search.PredicateObject.OfferNumber" placeholder="Nr..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <label class="filter-label">Klient / firma</label>
              <el-input v-model="filter.SmartTableParam.Search.PredicateObject.ClientData" placeholder="Nazwa, NIP..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <label class="filter-label">Adres wysyłki</label>
              <el-input v-model="filter.SmartTableParam.Search.PredicateObject.ShipmentData" placeholder="Adres..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <label class="filter-label">Status</label>
              <el-select v-model="filter.SmartTableParam.Search.PredicateObject.OfferStatus" clearable placeholder="Wszystkie" class="!w-full">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <label class="filter-label">Data od</label>
              <el-date-picker v-model="filter.SmartTableParam.Search.PredicateObject.DateFrom" type="date" placeholder="Od" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="!w-full" clearable />
            </el-col>
          </el-row>
          <el-row :gutter="12" class="mt-3">
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Data do</label>
              <el-date-picker v-model="filter.SmartTableParam.Search.PredicateObject.DateTo" type="date" placeholder="Do" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="!w-full" clearable />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Kwota od</label>
              <el-input-number v-model="filter.SmartTableParam.Search.PredicateObject.AmountMin" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Kwota do</label>
              <el-input-number v-model="filter.SmartTableParam.Search.PredicateObject.AmountMax" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8" class="flex items-end gap-2">
              <el-button type="primary" @click="applyFilters">Zastosuj</el-button>
              <el-button @click="clearFilters">Wyczyść</el-button>
            </el-col>
          </el-row>
        </div>
      </el-collapse-transition>
    </el-card>

    <el-card shadow="never" class="list-card">
      <div class="list-toolbar">
        <div class="list-toolbar__group">
          <el-button type="primary" :icon="Plus" @click="router.push('/sale/offer/createoffer')">Nowa oferta</el-button>
          <el-button :icon="Edit" :disabled="!selectedRowId" @click="editSelected">Edytuj</el-button>
          <el-button :icon="View" :disabled="!selectedRowId" @click="selectedRowId && offerStore.showOffer(selectedRowId)">Podgląd</el-button>
        </div>
        <span class="list-toolbar__hint">Kliknij wiersz · dwuklik — szczegóły · marża &lt;12% wyróżniona</span>
      </div>

      <div class="list-body">
        <div class="list-head">
          <span>Oferta</span>
          <span>Klient</span>
          <span>Kwota</span>
          <span>Zysk / marża</span>
          <span>Status / ważność</span>
          <span></span>
        </div>

        <div class="list-scroll-wrap">
          <el-skeleton :loading="loading" animated :count="4">
            <template #template>
              <div class="offer-skeleton"><el-skeleton-item variant="h3" style="width: 100%; height: 72px; border-radius: 14px" /></div>
            </template>
            <template #default>
              <div v-if="!dataTable.items?.length" class="offers-empty">
                <div class="offers-empty__icon">📋</div>
                <h3>Brak ofert</h3>
                <p>Nie znaleziono ofert dla wybranych filtrów.</p>
                <el-button @click="clearFilters">Wyczyść filtry</el-button>
              </div>

              <div v-else class="offers-list">
                <article
                  v-for="row in dataTable.items"
                  :key="row.offerId"
                  class="offer-card"
                  :class="{
                    'offer-card--selected': selectedRowId === row.offerId,
                    'offer-card--low-margin': marginTone(row.marginPct) === 'low',
                    'offer-card--expired': isExpired(row),
                    'offer-card--expiring': isExpiringSoon(row) && !isExpired(row)
                  }"
                  @click="selectRow(row)"
                  @dblclick="openOffer(row)"
                >
                  <div class="offer-card__stripe" :class="`offer-card__stripe--${statusTone(row.offerStatus)}`" />

                  <div class="offer-card__main">
                    <div class="offer-card__col offer-card__col--offer">
                      <div class="offer-card__number">#{{ row.offerNumber }}</div>
                      <div class="offer-card__meta">{{ formatDate(row.createdOn) }}</div>
                      <div class="offer-card__meta">{{ row.itemsCount ?? 0 }} pozycji</div>
                    </div>

                    <div class="offer-card__col offer-card__col--client">
                      <div class="offer-card__client">{{ clientPrimary(row) }}</div>
                      <div class="offer-card__sub">{{ clientSecondary(row) }}</div>
                    </div>

                    <div class="offer-card__col offer-card__col--amount">
                      <div class="offer-card__amount">{{ money(row.totalPriceGross) }}</div>
                      <div class="offer-card__sub">netto {{ money(row.totalPrice) }}</div>
                    </div>

                    <div class="offer-card__col offer-card__col--profit">
                      <div class="offer-card__profit" :class="`offer-card__profit--${marginTone(row.marginPct)}`">
                        {{ moneyNet(row.profitNet) }}
                      </div>
                      <div class="margin-chip" :class="`margin-chip--${marginTone(row.marginPct)}`">
                        marża {{ percent(row.marginPct) }}
                      </div>
                    </div>

                    <div class="offer-card__col offer-card__col--status">
                      <el-dropdown trigger="click" @click.stop>
                        <button type="button" class="status-pill" :class="`status-pill--${statusTone(row.offerStatus)}`" @click.stop>
                          <span class="status-pill__dot" />
                          <span class="status-pill__label">{{ statusLabel(row.offerStatus) }}</span>
                          <span class="status-pill__arrow">▾</span>
                        </button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item
                              v-for="opt in statusOptions"
                              :key="opt.value"
                              @click="handleChangeStatus(opt.value, row.offerId)"
                            >
                              {{ opt.label }}
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>

                      <div class="expire-chip" :class="{ 'expire-chip--warn': isExpiringSoon(row), 'expire-chip--bad': isExpired(row) }">
                        <template v-if="isExpired(row)">Po terminie</template>
                        <template v-else-if="daysToExpire(row) === 0">Wygasa dziś</template>
                        <template v-else-if="daysToExpire(row) !== null && (daysToExpire(row) as number) <= 7">Za {{ daysToExpire(row) }} dni</template>
                        <template v-else>Ważna do {{ formatDate(row.expirationTime) }}</template>
                      </div>
                    </div>

                    <div class="offer-card__col offer-card__col--actions">
                      <button type="button" class="quick-btn" title="Edytuj" @click.stop="router.push(`/sale/offer/edit/${row.offerId}`)">✎</button>
                      <button type="button" class="quick-btn" title="Podgląd" @click.stop="openOffer(row)">👁</button>
                    </div>
                  </div>
                </article>
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>

      <div class="list-footer">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :current-page="dataTable.pageNumber"
          :page-size="filter.PageSize"
          :total="dataTable.totalCount"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.offers-page {
  padding: 18px 20px 28px;
  min-height: 100%;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
}

.offers-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.offers-page__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6366f1;
}

.offers-page__title {
  margin: 4px 0 0;
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.offers-page__subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.offers-page__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.offers-kpi {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.cosmic-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  min-height: 148px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
}

.cosmic-card--pipeline { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%); }
.cosmic-card--conversion { background: linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #4338ca 100%); }
.cosmic-card--month { background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #6b21a8 100%); }
.cosmic-card--avg { background: linear-gradient(135deg, #042f2e 0%, #134e4a 45%, #115e59 100%); }

.cosmic-card__stars {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 70% 20%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 40% 70%, rgba(255, 255, 255, 0.8), transparent);
  pointer-events: none;
}

.cosmic-card__content {
  position: relative;
  z-index: 1;
  padding: 14px 14px 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cosmic-card__head { display: flex; align-items: center; justify-content: space-between; }
.cosmic-card__label { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(226, 232, 240, 0.85); }
.cosmic-card__glyph { font-size: 14px; color: rgba(255, 255, 255, 0.55); }
.cosmic-card__value { margin-top: 8px; font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -0.03em; }
.cosmic-card__value--money { font-size: 20px; }
.cosmic-card__foot { margin-top: 4px; font-size: 11px; color: rgba(226, 232, 240, 0.75); line-height: 1.35; }
.cosmic-card__delta {
  margin-top: 6px;
  display: inline-flex;
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.25);
  color: #e2e8f0;
}
.cosmic-card__delta.up { background: rgba(34, 197, 94, 0.22); color: #bbf7d0; }
.cosmic-card__delta.down { background: rgba(239, 68, 68, 0.22); color: #fecaca; }
.cosmic-card__chart { height: 42px; margin-top: auto; }
.cosmic-card__chart--donut { height: 52px; }

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
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
}

.filters-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #334155;
}

.filters-card__chevron { transition: transform 0.2s ease; }
.filters-card__chevron--open { transform: rotate(180deg); }
.filters-card__body { padding: 0 16px 16px; }
.filter-label { display: block; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.list-toolbar__group { display: flex; gap: 8px; flex-wrap: wrap; }
.list-toolbar__hint { font-size: 12px; color: #94a3b8; }

.list-body { padding: 0 12px 12px; }
.list-head {
  display: grid;
  grid-template-columns: 1.1fr 1.4fr 0.9fr 1fr 1.3fr 56px;
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
}

.offers-list { display: flex; flex-direction: column; gap: 8px; }

.offer-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.offer-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.1);
}

.offer-card--selected {
  border-color: #818cf8;
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.25);
}

.offer-card--low-margin {
  background: linear-gradient(90deg, #fff 0%, #fffbeb 100%);
}

.offer-card--expiring {
  border-color: #fde68a;
}

.offer-card--expired {
  border-color: #fecaca;
  background: linear-gradient(90deg, #fff 0%, #fef2f2 100%);
}

.offer-card__stripe {
  height: 3px;
  background: #e2e8f0;
}

.offer-card__stripe--blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.offer-card__stripe--amber { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.offer-card__stripe--green { background: linear-gradient(90deg, #22c55e, #4ade80); }
.offer-card__stripe--red { background: linear-gradient(90deg, #ef4444, #f87171); }
.offer-card__stripe--slate { background: linear-gradient(90deg, #64748b, #94a3b8); }

.offer-card__main {
  display: grid;
  grid-template-columns: 1.1fr 1.4fr 0.9fr 1fr 1.3fr 56px;
  gap: 10px;
  padding: 12px 14px;
  align-items: center;
}

.offer-card__number { font-size: 15px; font-weight: 900; color: #0f172a; }
.offer-card__meta { font-size: 11px; color: #64748b; margin-top: 2px; }
.offer-card__client { font-size: 13px; font-weight: 700; color: #1e293b; }
.offer-card__sub { font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.35; }
.offer-card__amount { font-size: 14px; font-weight: 800; color: #0f172a; }

.offer-card__profit { font-size: 14px; font-weight: 800; }
.offer-card__profit--good { color: #047857; }
.offer-card__profit--ok { color: #1d4ed8; }
.offer-card__profit--low { color: #b45309; }

.margin-chip {
  display: inline-flex;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.margin-chip--good { background: #ecfdf5; color: #047857; }
.margin-chip--ok { background: #eff6ff; color: #1d4ed8; }
.margin-chip--low { background: #fffbeb; color: #b45309; }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  background: #f8fafc;
}

.status-pill__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.status-pill__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-pill__arrow { font-size: 12px; opacity: 0.7; }
.status-pill--blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.status-pill--blue .status-pill__dot { background: #3b82f6; }
.status-pill--amber { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.status-pill--amber .status-pill__dot { background: #f59e0b; }
.status-pill--green { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.status-pill--green .status-pill__dot { background: #22c55e; }
.status-pill--red { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.status-pill--red .status-pill__dot { background: #ef4444; }
.status-pill--slate { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
.status-pill--slate .status-pill__dot { background: #94a3b8; }

.expire-chip {
  margin-top: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
}

.expire-chip--warn { color: #b45309; }
.expire-chip--bad { color: #b91c1c; }

.offer-card__col--actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.quick-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #475569;
  cursor: pointer;
}

.quick-btn:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.offers-empty {
  text-align: center;
  padding: 48px 20px;
  color: #64748b;
}

.offers-empty__icon { font-size: 40px; margin-bottom: 8px; }
.offers-empty h3 { margin: 0 0 6px; color: #334155; }

.list-footer {
  display: flex;
  justify-content: center;
  padding: 12px 16px 16px;
  border-top: 1px solid #f1f5f9;
}

.offer-skeleton { padding: 6px 2px; }

@media (max-width: 1200px) {
  .offers-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .list-head { display: none; }
  .offer-card__main { grid-template-columns: 1fr 1fr; }
  .offer-card__col--actions { grid-column: span 2; flex-direction: row; justify-content: flex-end; }
}

@media (max-width: 760px) {
  .offers-page__header { flex-direction: column; }
  .offers-kpi { grid-template-columns: 1fr; }
  .offer-card__main { grid-template-columns: 1fr; }
}
</style>
