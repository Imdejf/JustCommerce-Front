<template>
  <div class="cosmos-stats">
    <header class="cosmos-stats__header">
      <div>
        <p class="cosmos-stats__eyebrow">Sprzedaż · analityka</p>
        <h1 class="cosmos-stats__title">Statystyki zamówień</h1>
        <p class="cosmos-stats__subtitle">Podsumowanie sprzedaży, przychodu i produktów w wybranym okresie</p>
      </div>
      <div class="cosmos-stats__actions">
        <el-button type="primary" :loading="loading" @click="fetchRaport">Generuj raport</el-button>
        <el-button @click="resetFilters">Wyczyść</el-button>
      </div>
    </header>

    <section class="cosmos-filters">
      <button type="button" class="cosmos-filters__toggle" @click="filtersOpen = !filtersOpen">
        <span class="cosmos-filters__toggle-left">
          <el-icon><Filter /></el-icon>
          Filtry raportu
          <el-tag v-if="activeFiltersCount" size="small" type="warning" effect="dark" round>
            {{ activeFiltersCount }}
          </el-tag>
        </span>
        <el-icon :class="{ 'cosmos-filters__chevron--open': filtersOpen }"><ArrowDown /></el-icon>
      </button>

      <el-collapse-transition>
        <div v-show="filtersOpen" class="cosmos-filters__body">
          <div class="cosmos-filters__grid">
            <label class="cosmos-field">
              <span>Zakres dat</span>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="→"
                start-placeholder="Od"
                end-placeholder="Do"
                value-format="YYYY-MM-DD"
                class="!w-full"
              />
            </label>

            <label class="cosmos-field">
              <span>Sklep</span>
              <el-select v-model="filters.storeId" placeholder="Wszystkie" clearable filterable class="!w-full">
                <el-option :value="null" label="Wszystkie" />
                <el-option v-for="s in stores" :key="String(s.value)" :value="s.value" :label="s.label" />
              </el-select>
            </label>

            <label class="cosmos-field">
              <span>Opłacone</span>
              <el-select v-model="filters.isPaid" placeholder="Wszystkie" clearable class="!w-full">
                <el-option :value="null" label="Wszystkie" />
                <el-option :value="true" label="Tak" />
                <el-option :value="false" label="Nie" />
              </el-select>
            </label>

            <label class="cosmos-field">
              <span>Wysłane</span>
              <el-select v-model="filters.isShipped" placeholder="Wszystkie" clearable class="!w-full">
                <el-option :value="null" label="Wszystkie" />
                <el-option :value="true" label="Tak" />
                <el-option :value="false" label="Nie" />
              </el-select>
            </label>

            <label class="cosmos-field">
              <span>Dostawa</span>
              <el-select v-model="filters.deliveryMethod" placeholder="Wszystkie" clearable class="!w-full">
                <el-option :value="null" label="Wszystkie" />
                <el-option v-for="o in deliveryMethodOptions" :key="String(o.value)" :value="o.value" :label="o.label" />
              </el-select>
            </label>

            <label class="cosmos-field">
              <span>Płatność</span>
              <el-select v-model="filters.paymentProvider" placeholder="Wszystkie" clearable class="!w-full">
                <el-option :value="null" label="Wszystkie" />
                <el-option v-for="o in paymentProviderOptions" :key="String(o.value)" :value="o.value" :label="o.label" />
              </el-select>
            </label>

            <label class="cosmos-field">
              <span>Źródło</span>
              <el-select v-model="filters.orderSourceType" placeholder="Wszystkie" clearable class="!w-full">
                <el-option :value="null" label="Wszystkie" />
                <el-option v-for="o in orderSourceOptions" :key="String(o.value)" :value="o.value" :label="o.label" />
              </el-select>
            </label>

            <label class="cosmos-field">
              <span>Producent</span>
              <el-select v-model="filters.brandId" placeholder="Wszyscy" clearable filterable class="!w-full">
                <el-option v-for="b in brands" :key="String(b.value)" :value="b.value" :label="b.label" />
              </el-select>
            </label>

            <label class="cosmos-field cosmos-field--wide">
              <span>Produkt</span>
              <el-select v-model="filters.productId" placeholder="Wszystkie" clearable filterable class="!w-full">
                <el-option :value="null" label="Wszystkie" />
                <el-option v-for="p in products" :key="String(p.value)" :value="p.value" :label="p.label" />
              </el-select>
            </label>
          </div>

          <div class="cosmos-filters__foot">
            <el-tag effect="dark" round>{{ rangeLabel }}</el-tag>
            <span class="cosmos-filters__hint">Zysk liczony netto: cena netto − cena producenta</span>
          </div>
        </div>
      </el-collapse-transition>
    </section>

    <el-skeleton :loading="loading" animated>
      <template #template>
        <div class="cosmos-stats__kpi">
          <div v-for="i in 4" :key="i" class="cosmos-skel" />
        </div>
        <div class="cosmos-stats__grid">
          <div v-for="i in 4" :key="`p-${i}`" class="cosmos-skel cosmos-skel--panel" />
        </div>
      </template>

      <template #default>
        <div v-if="!raport" class="cosmos-empty">
          <div class="cosmos-empty__icon">📊</div>
          <h3>Brak danych raportu</h3>
          <p>Ustaw filtry i kliknij „Generuj raport”, aby zobaczyć statystyki sprzedaży.</p>
          <el-button type="primary" @click="fetchRaport">Generuj raport</el-button>
        </div>

        <template v-else>
          <div class="cosmos-stats__kpi">
            <div class="cosmic-card cosmic-card--net">
              <div class="cosmic-card__stars" />
              <div class="cosmic-card__content">
                <div class="cosmic-card__head">
                  <span class="cosmic-card__label">Towar brutto</span>
                  <span class="cosmic-card__glyph">◎</span>
                </div>
                <div class="cosmic-card__value cosmic-card__value--money">{{ money(raport.revenueWithoutShipping) }}</div>
                <div class="cosmic-card__foot">przychód bez transportu</div>
                <v-chart class="cosmic-card__chart" :option="revenueSparkOption" autoresize />
              </div>
            </div>

            <div class="cosmic-card cosmic-card--gross">
              <div class="cosmic-card__stars" />
              <div class="cosmic-card__content">
                <div class="cosmic-card__head">
                  <span class="cosmic-card__label">Razem brutto</span>
                  <span class="cosmic-card__glyph">◈</span>
                </div>
                <div class="cosmic-card__value cosmic-card__value--money">{{ money(raport.revenueWithShipping) }}</div>
                <div class="cosmic-card__foot">z transportem · {{ summary.ordersTotal }} zamówień</div>
                <v-chart class="cosmic-card__chart" :option="ordersSparkOption" autoresize />
              </div>
            </div>

            <div class="cosmic-card cosmic-card--profit">
              <div class="cosmic-card__stars" />
              <div class="cosmic-card__content">
                <div class="cosmic-card__head">
                  <span class="cosmic-card__label">Zysk netto</span>
                  <span class="cosmic-card__glyph">✦</span>
                </div>
                <div class="cosmic-card__value cosmic-card__value--money">{{ moneyNet(raport.profit) }}</div>
                <div class="cosmic-card__foot">
                  marża {{ percent(summary.marginPct) }} · baza {{ moneyNet(summary.revenueNet) }}
                </div>
                <v-chart class="cosmic-card__chart" :option="profitProductsSparkOption" autoresize />
              </div>
            </div>

            <div class="cosmic-card cosmic-card--aov">
              <div class="cosmic-card__stars" />
              <div class="cosmic-card__content">
                <div class="cosmic-card__head">
                  <span class="cosmic-card__label">Średnia wartość</span>
                  <span class="cosmic-card__glyph">❖</span>
                </div>
                <div class="cosmic-card__value cosmic-card__value--money">{{ money(raport.averageOrderValue) }}</div>
                <div class="cosmic-card__foot">AOV brutto · {{ productsTable.length }} produktów w raporcie</div>
                <v-chart class="cosmic-card__chart cosmic-card__chart--donut" :option="qtyDonutOption" autoresize />
              </div>
            </div>
          </div>

          <div class="cosmos-stats__kpi mt-4">
            <div class="cosmic-card cosmic-card--net">
              <div class="cosmic-card__stars" />
              <div class="cosmic-card__content">
                <div class="cosmic-card__head">
                  <span class="cosmic-card__label">Allegro przychód</span>
                  <span class="cosmic-card__glyph">A</span>
                </div>
                <div class="cosmic-card__value cosmic-card__value--money">{{ money(allegroStats.revenue) }}</div>
                <div class="cosmic-card__foot">{{ allegroStats.ordersCount }} zamówień · produkty {{ money(allegroStats.productsRevenue) }}</div>
                <v-chart class="cosmic-card__chart" :option="allegroRevenueSparkOption" autoresize />
              </div>
            </div>

            <div class="cosmic-card cosmic-card--profit">
              <div class="cosmic-card__stars" />
              <div class="cosmic-card__content">
                <div class="cosmic-card__head">
                  <span class="cosmic-card__label">Allegro zysk netto</span>
                  <span class="cosmic-card__glyph">✦</span>
                </div>
                <div class="cosmic-card__value cosmic-card__value--money">{{ moneyNet(allegroStats.netProfit) }}</div>
                <div class="cosmic-card__foot">marża {{ percent(allegroStats.marginPct) }} · koszt {{ moneyNet(allegroStats.productCost) }}</div>
                <v-chart class="cosmic-card__chart" :option="allegroProfitSparkOption" autoresize />
              </div>
            </div>

            <div class="cosmic-card cosmic-card--gross">
              <div class="cosmic-card__stars" />
              <div class="cosmic-card__content">
                <div class="cosmic-card__head">
                  <span class="cosmic-card__label">Allegro prowizje</span>
                  <span class="cosmic-card__glyph">%</span>
                </div>
                <div class="cosmic-card__value cosmic-card__value--money">{{ moneyNet(allegroStats.commission) }}</div>
                <div class="cosmic-card__foot">wszystkie opłaty {{ moneyNet(allegroStats.totalFees) }}</div>
                <v-chart class="cosmic-card__chart" :option="allegroCommissionSparkOption" autoresize />
              </div>
            </div>

            <div class="cosmic-card cosmic-card--aov">
              <div class="cosmic-card__stars" />
              <div class="cosmic-card__content">
                <div class="cosmic-card__head">
                  <span class="cosmic-card__label">Allegro AOV</span>
                  <span class="cosmic-card__glyph">◈</span>
                </div>
                <div class="cosmic-card__value cosmic-card__value--money">{{ money(allegroStats.averageOrderValue) }}</div>
                <div class="cosmic-card__foot">średnia wartość zamówienia Allegro</div>
              </div>
            </div>
          </div>

          <div class="cosmos-stats__grid cosmos-stats__grid--main">
            <section class="cosmos-panel">
              <div class="cosmos-panel__head">
                <div>
                  <h2>Allegro: przychód i zysk</h2>
                  <p>Oddzielne statystyki Allegro w wybranym okresie</p>
                </div>
              </div>
              <v-chart class="cosmos-panel__chart" :option="allegroRevenueProfitOption" autoresize />
            </section>
          </div>

          <div class="cosmos-stats__grid cosmos-stats__grid--main">
            <section class="cosmos-panel">
              <div class="cosmos-panel__head">
                <div>
                  <h2>Liczba zamówień</h2>
                  <p>Dzień lub miesiąc w zależności od zakresu</p>
                </div>
              </div>
              <v-chart class="cosmos-panel__chart" :option="ordersCountOption" autoresize />
            </section>

            <section class="cosmos-panel">
              <div class="cosmos-panel__head">
                <div>
                  <h2>Przychód brutto</h2>
                  <p>Z transportem vs bez transportu</p>
                </div>
              </div>
              <v-chart class="cosmos-panel__chart" :option="revenueOption" autoresize />
            </section>
          </div>

          <div class="cosmos-stats__grid cosmos-stats__grid--wide">
            <section class="cosmos-panel">
              <div class="cosmos-panel__head">
                <div>
                  <h2>Top produkty — ilość</h2>
                  <p>10 najczęściej sprzedawanych pozycji</p>
                </div>
              </div>
              <v-chart class="cosmos-panel__chart" :option="topProductsQtyOption" autoresize />
            </section>

            <section class="cosmos-panel">
              <div class="cosmos-panel__head">
                <div>
                  <h2>Top produkty — zysk netto</h2>
                  <p>10 pozycji z najwyższym zyskiem</p>
                </div>
              </div>
              <v-chart class="cosmos-panel__chart" :option="topProductsProfitOption" autoresize />
            </section>
          </div>

          <section class="cosmos-panel cosmos-panel--table">
            <div class="cosmos-panel__head">
              <div>
                <h2>Szczegóły produktów</h2>
                <p>Przychód brutto/netto, koszt i zysk netto w wybranym okresie</p>
              </div>
            </div>

            <el-table
              :data="productsTable"
              stripe
              class="cosmos-table"
              :default-sort="{ prop: 'profit', order: 'descending' }"
            >
              <el-table-column prop="name" label="Produkt" min-width="220" show-overflow-tooltip />
              <el-table-column prop="sku" label="SKU" width="120" show-overflow-tooltip />
              <el-table-column prop="brandName" label="Marka" width="140" show-overflow-tooltip />
              <el-table-column prop="quantity" label="Ilość" width="80" sortable align="center" />
              <el-table-column prop="revenueGross" label="Przychód brutto" width="130" sortable align="right">
                <template #default="{ row }">{{ money(row.revenueGross) }}</template>
              </el-table-column>
              <el-table-column prop="revenueNet" label="Przychód netto" width="130" sortable align="right">
                <template #default="{ row }">{{ moneyNet(row.revenueNet) }}</template>
              </el-table-column>
              <el-table-column prop="cost" label="Koszt netto" width="120" sortable align="right">
                <template #default="{ row }">{{ moneyNet(row.cost) }}</template>
              </el-table-column>
              <el-table-column prop="profit" label="Zysk netto" width="130" sortable align="right">
                <template #default="{ row }">
                  <span class="profit-net">{{ moneyNet(row.profit) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </template>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import { Api } from '/@/services/api'
import * as echarts from 'echarts/core'
import { useToast } from 'vue-toastification'
import { ArrowDown, Filter } from '@element-plus/icons-vue'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

type OrderRaportPeriodDTO = {
  period: string
  ordersCount: number
  revenueWithShipping: number
  revenueWithoutShipping: number
}

type OrderRaportProductDTO = {
  name: string
  sku?: string | null
  brandName?: string | null
  quantity: number
  revenueGross: number
  revenueNet: number
  cost: number
  profit: number
}

type OrderRaportDTO = {
  revenueWithoutShipping: number
  revenueWithShipping: number
  profit: number
  averageOrderValue: number
  ordersByPeriod: OrderRaportPeriodDTO[]
  products: OrderRaportProductDTO[]
}

type AllegroStatisticsPeriodDTO = {
  period: string
  ordersCount: number
  revenue: number
  productsRevenue: number
  commission: number
  productCost: number
  netProfit: number
}

type AllegroStatisticsDTO = {
  ordersCount: number
  revenue: number
  productsRevenue: number
  commission: number
  totalFees: number
  productCost: number
  netProfit: number
  marginPct: number
  averageOrderValue: number
  trend: AllegroStatisticsPeriodDTO[]
}

const loading = ref(false)
const raport = ref<OrderRaportDTO | null>(null)
const filtersOpen = ref(true)
const dateRange = ref<[string, string] | null>(null)
const toast = useToast()

const brands = ref<{ value: string | null; label: string }[]>([{ value: null, label: 'Wszyscy' }])

const filters = ref({
  storeId: null as string | null,
  isPaid: null as boolean | null,
  isShipped: null as boolean | null,
  deliveryMethod: null as number | null,
  paymentProvider: null as number | null,
  orderSourceType: null as number | null,
  productId: null as string | null,
  brandId: null as string | null
})

const stores = ref<{ value: string | null; label: string }[]>([{ value: null, label: 'Wszystkie' }])
const products = ref<{ value: string | null; label: string }[]>([{ value: null, label: 'Wszystkie' }])
const allegroStats = ref({
  ordersCount: 0,
  revenue: 0,
  productsRevenue: 0,
  commission: 0,
  totalFees: 0,
  productCost: 0,
  netProfit: 0,
  marginPct: 0,
  averageOrderValue: 0
})
const allegroPeriods = ref<{
  label: string
  ordersCount: number
  revenue: number
  productsRevenue: number
  commission: number
  productCost: number
  netProfit: number
}[]>([])

const deliveryMethodOptions = [
  { value: 0, label: 'Kurier' },
  { value: 1, label: 'Odbiór osobisty' }
]

const paymentProviderOptions = [
  { value: 0, label: 'Przelewy24' },
  { value: 1, label: 'Przelew standardowy' },
  { value: 2, label: 'Za pobraniem' },
  { value: 3, label: 'PayPo' },
  { value: 4, label: 'BLIK' },
  { value: 5, label: 'Termin' },
  { value: 6, label: 'Allegro' }
]

const orderSourceOptions = [
  { value: 0, label: 'Koszyk' },
  { value: 1, label: 'Stały klient' },
  { value: 2, label: 'Oferta' },
  { value: 3, label: 'Telefon' },
  { value: 4, label: 'Czat' },
  { value: 5, label: 'E-mail' },
  { value: 6, label: 'Allegro' }
]

const chartTheme = {
  axis: '#94a3b8',
  split: 'rgba(148, 163, 184, 0.15)',
  cur: '#60a5fa',
  alt: '#a78bfa',
  profit: '#34d399',
  text: '#e2e8f0'
}

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.storeId) count++
  if (filters.value.isPaid !== null) count++
  if (filters.value.isShipped !== null) count++
  if (filters.value.deliveryMethod !== null) count++
  if (filters.value.paymentProvider !== null) count++
  if (filters.value.orderSourceType !== null) count++
  if (filters.value.productId) count++
  if (filters.value.brandId) count++
  return count
})

const rangeLabel = computed(() => `${dateRange.value?.[0] ?? '—'} → ${dateRange.value?.[1] ?? '—'}`)

const periods = computed(() => raport.value?.ordersByPeriod ?? [])
const productsTable = computed(() => raport.value?.products ?? [])

const summary = computed(() => {
  const items = productsTable.value
  const revenueNet = items.reduce((sum, item) => sum + Number(item.revenueNet ?? 0), 0)
  const profit = Number(raport.value?.profit ?? 0)
  const marginPct = revenueNet > 0 ? (profit / revenueNet) * 100 : 0
  const ordersTotal = periods.value.reduce((sum, p) => sum + Number(p.ordersCount ?? 0), 0)
  return { revenueNet, profit, marginPct, ordersTotal }
})

function money(v?: number | null) {
  return Number(v ?? 0).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
}

function moneyNet(v?: number | null) {
  return `${Number(v ?? 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł netto`
}

function percent(v: number) {
  return `${Number(v ?? 0).toFixed(1)}%`
}

function formatPeriodLabel(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return dd === '01' ? `${yyyy}-${mm}` : `${yyyy}-${mm}-${dd}`
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const spark = (values: number[], color: string) => ({
  grid: { left: 0, right: 0, top: 0, bottom: 0 },
  xAxis: { type: 'category', show: false, data: values.map((_, i) => i) },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'line',
    data: values,
    smooth: true,
    symbol: 'none',
    lineStyle: { width: 2, color },
    areaStyle: { color: `${color}33` }
  }]
})

const revenueSparkOption = computed(() =>
  spark(periods.value.map((p) => p.revenueWithoutShipping), '#93c5fd')
)

const ordersSparkOption = computed(() =>
  spark(periods.value.map((p) => p.ordersCount), '#c4b5fd')
)

const profitProductsSparkOption = computed(() => {
  const top = [...productsTable.value].sort((a, b) => b.profit - a.profit).slice(0, 8)
  return spark(top.map((p) => p.profit), '#6ee7b7')
})

const allegroRevenueSparkOption = computed(() =>
  spark(allegroPeriods.value.map((p) => p.revenue), '#93c5fd')
)

const allegroProfitSparkOption = computed(() =>
  spark(allegroPeriods.value.map((p) => p.netProfit), '#6ee7b7')
)

const allegroCommissionSparkOption = computed(() =>
  spark(allegroPeriods.value.map((p) => p.commission), '#c4b5fd')
)

const qtyDonutOption = computed(() => {
  const top = [...productsTable.value].sort((a, b) => b.quantity - a.quantity).slice(0, 3)
  const rest = productsTable.value.reduce((sum, p) => sum + p.quantity, 0) -
    top.reduce((sum, p) => sum + p.quantity, 0)

  return {
    series: [{
      type: 'pie',
      radius: ['58%', '78%'],
      center: ['50%', '55%'],
      label: { show: false },
      data: [
        ...top.map((p, i) => ({
          value: p.quantity,
          name: p.name,
          itemStyle: { color: ['#60a5fa', '#a78bfa', '#34d399'][i] }
        })),
        ...(rest > 0 ? [{ value: rest, name: 'Pozostałe', itemStyle: { color: '#94a3b8' } }] : [])
      ]
    }]
  }
})

const baseChart = (x: string[], formatter?: (v: number) => string) => ({
  color: [chartTheme.cur, chartTheme.alt, chartTheme.profit],
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    textStyle: { color: chartTheme.text },
    valueFormatter: (val: number) => (formatter ? formatter(Number(val)) : String(val))
  },
  legend: { top: 0, textStyle: { color: '#64748b' } },
  grid: { left: 48, right: 20, top: 36, bottom: 48 },
  dataZoom: [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 4 }],
  xAxis: {
    type: 'category',
    data: x,
    axisLine: { lineStyle: { color: chartTheme.split } },
    axisLabel: { color: chartTheme.axis }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartTheme.split } },
    axisLabel: { color: chartTheme.axis }
  }
})

const trendX = computed(() => periods.value.map((p) => formatPeriodLabel(p.period)))

const ordersCountOption = computed(() => ({
  ...baseChart(trendX.value),
  series: [{
    type: 'bar',
    name: 'Zamówienia',
    data: periods.value.map((p) => p.ordersCount),
    barMaxWidth: 28,
    itemStyle: { borderRadius: [6, 6, 0, 0] }
  }]
}))

const revenueOption = computed(() => ({
  ...baseChart(trendX.value, (v) => money(v)),
  series: [
    {
      type: 'line',
      name: 'Z transportem',
      data: periods.value.map((p) => p.revenueWithShipping),
      smooth: true,
      areaStyle: { color: 'rgba(96, 165, 250, 0.12)' }
    },
    {
      type: 'line',
      name: 'Bez transportu',
      data: periods.value.map((p) => p.revenueWithoutShipping),
      smooth: true,
      lineStyle: { type: 'dashed' }
    }
  ]
}))

const allegroRevenueProfitOption = computed(() => ({
  ...baseChart(allegroPeriods.value.map((p) => p.label), (v) => money(v)),
  series: [
    {
      type: 'line',
      name: 'Przychód Allegro',
      data: allegroPeriods.value.map((p) => p.revenue),
      smooth: true,
      areaStyle: { color: 'rgba(96, 165, 250, 0.12)' }
    },
    {
      type: 'bar',
      name: 'Zysk Allegro',
      data: allegroPeriods.value.map((p) => p.netProfit),
      barMaxWidth: 28,
      itemStyle: { color: chartTheme.profit, borderRadius: [6, 6, 0, 0] }
    },
    {
      type: 'line',
      name: 'Prowizje Allegro',
      data: allegroPeriods.value.map((p) => p.commission),
      smooth: true,
      lineStyle: { color: chartTheme.alt, type: 'dashed' }
    }
  ]
}))

function clearAllegroStats() {
  allegroStats.value = {
    ordersCount: 0,
    revenue: 0,
    productsRevenue: 0,
    commission: 0,
    totalFees: 0,
    productCost: 0,
    netProfit: 0,
    marginPct: 0,
    averageOrderValue: 0
  }
  allegroPeriods.value = []
}

const topProductsQtyOption = computed(() => {
  const top = [...productsTable.value].sort((a, b) => b.quantity - a.quantity).slice(0, 10)
  return {
    ...baseChart(top.map((p) => p.name)),
    grid: { left: 48, right: 20, top: 36, bottom: 90 },
    xAxis: {
      type: 'category',
      data: top.map((p) => p.name),
      axisLabel: { color: chartTheme.axis, rotate: 28, fontSize: 10 }
    },
    series: [{
      type: 'bar',
      name: 'Ilość',
      data: top.map((p) => p.quantity),
      barMaxWidth: 24,
      itemStyle: { color: chartTheme.cur, borderRadius: [6, 6, 0, 0] }
    }]
  }
})

const topProductsProfitOption = computed(() => {
  const top = [...productsTable.value].sort((a, b) => b.profit - a.profit).slice(0, 10)
  return {
    ...baseChart(top.map((p) => p.name), (v) => moneyNet(v)),
    grid: { left: 48, right: 20, top: 36, bottom: 90 },
    xAxis: {
      type: 'category',
      data: top.map((p) => p.name),
      axisLabel: { color: chartTheme.axis, rotate: 28, fontSize: 10 }
    },
    series: [{
      type: 'bar',
      name: 'Zysk netto',
      data: top.map((p) => p.profit),
      barMaxWidth: 24,
      itemStyle: { color: chartTheme.profit, borderRadius: [6, 6, 0, 0] }
    }]
  }
})

function resetFilters() {
  dateRange.value = null
  filters.value = {
    storeId: null,
    isPaid: null,
    isShipped: null,
    deliveryMethod: null,
    paymentProvider: null,
    orderSourceType: null,
    productId: null,
    brandId: null
  }
  raport.value = null
  clearAllegroStats()
}

async function fetchRaport() {
  loading.value = true
  try {
    const defaultTo = new Date()
    const defaultFrom = new Date()
    defaultFrom.setDate(defaultTo.getDate() - 30)

    const from = dateRange.value?.[0] ?? toYmd(defaultFrom)
    const to = dateRange.value?.[1] ?? toYmd(defaultTo)

    if (!dateRange.value) dateRange.value = [from, to]

    const [data, allegroData] = await Promise.all([
      Api.orders.getOrderRaport({
        from,
        to,
        storeId: filters.value.storeId,
        isPaid: filters.value.isPaid,
        isShipped: filters.value.isShipped,
        deliveryMethod: filters.value.deliveryMethod,
        paymentProvider: filters.value.paymentProvider,
        orderSourceType: filters.value.orderSourceType,
        productId: filters.value.productId,
        brandId: filters.value.brandId
      }),
      Api.allegro.getStatistics({ from, to }) as Promise<AllegroStatisticsDTO>
    ])

    raport.value = data as OrderRaportDTO
    allegroStats.value = {
      ordersCount: Number(allegroData.ordersCount ?? 0),
      revenue: Number(allegroData.revenue ?? 0),
      productsRevenue: Number(allegroData.productsRevenue ?? 0),
      commission: Number(allegroData.commission ?? 0),
      totalFees: Number(allegroData.totalFees ?? 0),
      productCost: Number(allegroData.productCost ?? 0),
      netProfit: Number(allegroData.netProfit ?? 0),
      marginPct: Number(allegroData.marginPct ?? 0),
      averageOrderValue: Number(allegroData.averageOrderValue ?? 0)
    }
    allegroPeriods.value = (allegroData.trend ?? []).map((p) => ({
      label: formatPeriodLabel(p.period),
      ordersCount: Number(p.ordersCount ?? 0),
      revenue: Number(p.revenue ?? 0),
      productsRevenue: Number(p.productsRevenue ?? 0),
      commission: Number(p.commission ?? 0),
      productCost: Number(p.productCost ?? 0),
      netProfit: Number(p.netProfit ?? 0)
    }))
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać raportu zamówień.')
    raport.value = null
    clearAllegroStats()
  } finally {
    loading.value = false
  }
}

async function allBrands() {
  try {
    const result = await Api.brands.listByStoreId()
    brands.value = [
      { value: null, label: 'Wszyscy' },
      ...result.items.map((item: any) => ({ value: item.id, label: item.name }))
    ]
  } catch (error) {
    console.error('Błąd podczas pobierania producentów:', error)
  }
}

onMounted(async () => {
  await allBrands()
  await fetchRaport()
})
</script>

<style scoped>
.cosmos-stats {
  min-height: calc(100vh - 72px);
  padding: 16px 18px 28px;
  background:
    radial-gradient(ellipse 90% 60% at 0% 0%, rgba(99, 102, 241, 0.14), transparent),
    radial-gradient(ellipse 70% 50% at 100% 0%, rgba(14, 165, 233, 0.12), transparent),
    linear-gradient(180deg, #eef2ff 0%, #f8fafc 45%, #f1f5f9 100%);
}

.cosmos-stats__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.cosmos-stats__eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
}

.cosmos-stats__title {
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.cosmos-stats__subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #64748b;
}

.cosmos-stats__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.cosmos-filters {
  margin-bottom: 14px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.94);
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.cosmos-filters__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 18px;
  border: none;
  background: linear-gradient(180deg, #f8fafc, #fff);
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  color: #334155;
}

.cosmos-filters__toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cosmos-filters__chevron--open {
  transform: rotate(180deg);
}

.cosmos-filters__body {
  padding: 0 18px 16px;
  border-top: 1px solid #e2e8f0;
}

.cosmos-filters__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding-top: 14px;
}

.cosmos-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.cosmos-field--wide {
  grid-column: span 2;
}

.cosmos-field > span {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.cosmos-filters__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.cosmos-filters__hint {
  font-size: 12px;
  color: #94a3b8;
}

.cosmos-stats__kpi {
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

.cosmic-card--net {
  background: linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #4338ca 100%);
}

.cosmic-card--gross {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);
}

.cosmic-card--profit {
  background: linear-gradient(135deg, #042f2e 0%, #134e4a 45%, #115e59 100%);
}

.cosmic-card--aov {
  background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #6b21a8 100%);
}

.cosmic-card__stars {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 70% 20%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 40% 70%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 55% 45%, rgba(255, 255, 255, 0.5), transparent);
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

.cosmic-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cosmic-card__label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.85);
}

.cosmic-card__glyph {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}

.cosmic-card__value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.03em;
}

.cosmic-card__value--money {
  font-size: 19px;
}

.cosmic-card__foot {
  margin-top: 4px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.75);
  line-height: 1.35;
}

.cosmic-card__chart {
  height: 42px;
  margin-top: auto;
}

.cosmic-card__chart--donut {
  height: 52px;
}

.cosmos-stats__grid {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.cosmos-stats__grid--main {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cosmos-stats__grid--wide {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cosmos-panel {
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.94);
  padding: 16px 16px 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
}

.cosmos-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.cosmos-panel__head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.cosmos-panel__head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.cosmos-panel__chart {
  width: 100%;
  height: 300px;
}

.cosmos-panel--table {
  margin-bottom: 8px;
}

.cosmos-table {
  width: 100%;
}

.profit-net {
  font-weight: 800;
  color: #047857;
}

.cosmos-empty {
  padding: 56px 24px;
  text-align: center;
  border-radius: 18px;
  border: 1px dashed #cbd5e1;
  background: rgba(255, 255, 255, 0.7);
}

.cosmos-empty__icon {
  font-size: 42px;
  margin-bottom: 8px;
}

.cosmos-empty h3 {
  margin: 0 0 6px;
  color: #0f172a;
}

.cosmos-empty p {
  margin: 0 0 16px;
  color: #64748b;
}

.cosmos-skel {
  height: 148px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

.cosmos-skel--panel {
  height: 300px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1200px) {
  .cosmos-stats__kpi,
  .cosmos-filters__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cosmos-field--wide {
    grid-column: span 2;
  }

  .cosmos-stats__grid--main,
  .cosmos-stats__grid--wide {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .cosmos-stats__header {
    flex-direction: column;
  }

  .cosmos-stats__kpi,
  .cosmos-filters__grid {
    grid-template-columns: 1fr;
  }

  .cosmos-field--wide {
    grid-column: span 1;
  }

  .cosmos-filters__foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
