<template>
  <div class="cosmos-dash">
    <header class="cosmos-dash__header">
      <div>
        <p class="cosmos-dash__eyebrow">Panel sprzedaży</p>
        <h1 class="cosmos-dash__title">Dashboard</h1>
        <p class="cosmos-dash__subtitle">Szybki podgląd sprzedaży i trendów</p>
      </div>
      <div class="cosmos-dash__actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="→"
          start-placeholder="Od"
          end-placeholder="Do"
          value-format="YYYY-MM-DD"
          class="cosmos-dash__date"
        />
        <el-button type="primary" :loading="loading" @click="loadDashboard">Odśwież</el-button>
      </div>
    </header>

    <el-skeleton :loading="loading" animated>
      <template #template>
        <div class="cosmos-dash__kpi">
          <div v-for="i in 4" :key="i" class="cosmos-skel" />
        </div>
        <div class="cosmos-dash__grid">
          <div v-for="i in 3" :key="`p-${i}`" class="cosmos-skel cosmos-skel--panel" />
        </div>
      </template>

      <template #default>
        <div class="cosmos-dash__kpi">
          <div class="cosmic-card cosmic-card--revenue">
            <div class="cosmic-card__stars" />
            <div class="cosmic-card__content">
              <div class="cosmic-card__head">
                <span class="cosmic-card__label">Przychód brutto</span>
                <span class="cosmic-card__glyph">◎</span>
              </div>
              <div class="cosmic-card__value cosmic-card__value--money">{{ money(kpi.revenueWithShipping) }}</div>
              <div class="cosmic-card__foot">z transportem · {{ kpi.ordersCount }} zamówień</div>
              <div class="cosmic-card__delta" :class="deltaClass(delta.revenueWithShippingPct)">
                {{ deltaBadge(delta.revenueWithShippingPct) }}
              </div>
              <v-chart class="cosmic-card__chart" :option="revenueSparkOption" autoresize />
            </div>
          </div>

          <div class="cosmic-card cosmic-card--orders">
            <div class="cosmic-card__stars" />
            <div class="cosmic-card__content">
              <div class="cosmic-card__head">
                <span class="cosmic-card__label">Średnia wartość</span>
                <span class="cosmic-card__glyph">◈</span>
              </div>
              <div class="cosmic-card__value cosmic-card__value--money">{{ money(kpi.aov) }}</div>
              <div class="cosmic-card__foot">AOV brutto · towar {{ money(kpi.revenueWithoutShipping) }}</div>
              <div class="cosmic-card__delta" :class="deltaClass(delta.averageOrderValuePct ?? 0)">
                {{ deltaBadge(delta.averageOrderValuePct ?? 0) }}
              </div>
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
              <div class="cosmic-card__value cosmic-card__value--money">{{ moneyNet(kpi.profit) }}</div>
              <div class="cosmic-card__foot">
                marża {{ percent(kpi.marginPct) }} · baza {{ moneyNet(kpi.revenueNetWithoutShipping) }} netto
              </div>
              <div class="cosmic-card__delta" :class="deltaClass(delta.profitPct)">
                {{ deltaBadge(delta.profitPct) }}
              </div>
              <v-chart class="cosmic-card__chart" :option="profitSparkOption" autoresize />
            </div>
          </div>

          <div class="cosmic-card cosmic-card--ops">
            <div class="cosmic-card__stars" />
            <div class="cosmic-card__content">
              <div class="cosmic-card__head">
                <span class="cosmic-card__label">Realizacja</span>
                <span class="cosmic-card__glyph">❖</span>
              </div>
              <div class="cosmic-card__value">
                {{ kpi.shippedCount }}<span class="cosmic-card__value-sub">/{{ kpi.ordersCount }}</span>
              </div>
              <div class="cosmic-card__foot">{{ kpi.notShippedCount }} niewysłanych · {{ kpi.paidCount }} opłaconych</div>
              <div class="cosmic-card__delta" :class="deltaClass(delta.ordersCountPct)">
                {{ deltaBadge(delta.ordersCountPct) }}
              </div>
              <v-chart class="cosmic-card__chart cosmic-card__chart--donut" :option="opsDonutOption" autoresize />
            </div>
          </div>
        </div>

        <div class="cosmos-dash__grid cosmos-dash__grid--main">
          <section class="cosmos-panel">
            <div class="cosmos-panel__head">
              <div>
                <h2>Trend zamówień</h2>
                <p>Bieżący okres vs poprzedni</p>
              </div>
              <el-tag effect="dark" round>{{ rangeLabel }}</el-tag>
            </div>
            <v-chart class="cosmos-panel__chart" :option="ordersTrendOption" autoresize />
          </section>

          <section class="cosmos-panel">
            <div class="cosmos-panel__head">
              <div>
                <h2>Przychód brutto</h2>
                <p>Z transportem — porównanie okresów</p>
              </div>
            </div>
            <v-chart class="cosmos-panel__chart" :option="revenueTrendOption" autoresize />
          </section>

          <section class="cosmos-panel">
            <div class="cosmos-panel__head">
              <div>
                <h2>Zysk netto</h2>
                <p>Marża na pozycjach (cena netto − cena producenta)</p>
              </div>
            </div>
            <v-chart class="cosmos-panel__chart" :option="profitTrendOption" autoresize />
          </section>
        </div>

        <div class="cosmos-dash__kpi mt-4">
          <div class="cosmic-card cosmic-card--revenue">
            <div class="cosmic-card__stars" />
            <div class="cosmic-card__content">
              <div class="cosmic-card__head">
                <span class="cosmic-card__label">Allegro przychód</span>
                <span class="cosmic-card__glyph">A</span>
              </div>
              <div class="cosmic-card__value cosmic-card__value--money">{{ money(allegroKpi.revenue) }}</div>
              <div class="cosmic-card__foot">{{ allegroKpi.ordersCount }} zamówień · produkty {{ money(allegroKpi.productsRevenue) }}</div>
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
              <div class="cosmic-card__value cosmic-card__value--money">{{ moneyNet(allegroKpi.netProfit) }}</div>
              <div class="cosmic-card__foot">marża {{ percent(allegroKpi.marginPct) }} · koszt {{ moneyNet(allegroKpi.productCost) }}</div>
              <v-chart class="cosmic-card__chart" :option="allegroProfitSparkOption" autoresize />
            </div>
          </div>

          <div class="cosmic-card cosmic-card--orders">
            <div class="cosmic-card__stars" />
            <div class="cosmic-card__content">
              <div class="cosmic-card__head">
                <span class="cosmic-card__label">Allegro prowizje</span>
                <span class="cosmic-card__glyph">%</span>
              </div>
              <div class="cosmic-card__value cosmic-card__value--money">{{ moneyNet(allegroKpi.commission) }}</div>
              <div class="cosmic-card__foot">wszystkie opłaty {{ moneyNet(allegroKpi.totalFees) }}</div>
              <v-chart class="cosmic-card__chart" :option="allegroCommissionSparkOption" autoresize />
            </div>
          </div>

          <div class="cosmic-card cosmic-card--ops">
            <div class="cosmic-card__stars" />
            <div class="cosmic-card__content">
              <div class="cosmic-card__head">
                <span class="cosmic-card__label">Allegro AOV</span>
                <span class="cosmic-card__glyph">◈</span>
              </div>
              <div class="cosmic-card__value cosmic-card__value--money">{{ money(allegroKpi.averageOrderValue) }}</div>
              <div class="cosmic-card__foot">średnia wartość zamówienia Allegro</div>
            </div>
          </div>
        </div>

        <div class="cosmos-dash__grid cosmos-dash__grid--main">
          <section class="cosmos-panel">
            <div class="cosmos-panel__head">
              <div>
                <h2>Allegro: przychód i zysk</h2>
                <p>Osobny trend wyników Allegro</p>
              </div>
            </div>
            <v-chart class="cosmos-panel__chart" :option="allegroRevenueProfitOption" autoresize />
          </section>
        </div>

        <div class="cosmos-dash__grid cosmos-dash__grid--bottom">
          <section class="cosmos-panel">
            <div class="cosmos-panel__head">
              <div>
                <h2>Płatności</h2>
                <p>Rozkład metod płatności</p>
              </div>
            </div>
            <v-chart class="cosmos-panel__chart cosmos-panel__chart--donut" :option="paymentDonutOption" autoresize />
          </section>

          <section class="cosmos-panel">
            <div class="cosmos-panel__head">
              <div>
                <h2>Źródła zamówień</h2>
                <p>Skąd pochodzą zamówienia</p>
              </div>
            </div>
            <v-chart class="cosmos-panel__chart cosmos-panel__chart--donut" :option="sourceDonutOption" autoresize />
          </section>

          <section class="cosmos-panel cosmos-panel--table">
            <div class="cosmos-panel__head">
              <div>
                <h2>Top produkty</h2>
                <p>Najczęściej sprzedawane · zysk netto</p>
              </div>
            </div>
            <el-table :data="topProducts" stripe class="cosmos-table">
              <el-table-column prop="name" label="Produkt" min-width="200" show-overflow-tooltip />
              <el-table-column prop="qty" label="Ilość" width="80" sortable align="center" />
              <el-table-column prop="profit" label="Zysk netto" width="130" sortable align="right">
                <template #default="{ row }">
                  <span class="profit-net">{{ moneyNet(row.profit) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <section class="cosmos-panel cosmos-panel--table">
            <div class="cosmos-panel__head">
              <div>
                <h2>Ostatnie zamówienia</h2>
                <p>Najnowsze w wybranym okresie</p>
              </div>
            </div>
            <el-table :data="recentOrders" stripe class="cosmos-table">
              <el-table-column prop="numberOrder" label="Nr" width="100" />
              <el-table-column prop="customerName" label="Klient" min-width="140" show-overflow-tooltip />
              <el-table-column prop="orderTotal" label="Brutto" width="110" align="right">
                <template #default="{ row }">{{ money(row.orderTotal) }}</template>
              </el-table-column>
              <el-table-column label="Status" width="100" align="center">
                <template #default="{ row }">
                  <span class="status-chip" :class="row.isPaid ? 'status-chip--paid' : 'status-chip--unpaid'">
                    {{ row.isPaid ? 'Opł.' : 'Nieopł.' }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { Api } from '/@/services/api'
import Cookies from 'universal-cookie'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

const cookies = new Cookies()
const storeId = ref<string | null>(cookies.get('dsStore') ?? null)

type OrderDashboardPeriodDTO = {
  period: string
  ordersCount: number
  revenueWithShipping: number
  revenueWithoutShipping: number
  profit: number
}

type OrderDashboardBreakdownDTO = {
  key: number
  name: string
  count: number
  revenue: number
}

type OrderDashboardTopProductDTO = {
  name: string
  quantity: number
  profit: number
}

type OrderDashboardRecentOrderDTO = {
  id: string
  numberOrder: string
  createdOn: string
  orderTotal: number
  isPaid: boolean
  isShipped: boolean
  customerName?: string | null
}

type OrderDashboardKpiDTO = {
  ordersCount: number
  paidCount: number
  shippedCount: number
  revenueWithShipping: number
  revenueWithoutShipping: number
  revenueNetWithoutShipping: number
  profit: number
  marginPct: number
  averageOrderValue: number
}

type OrderDashboardDeltaDTO = {
  ordersCountPct: number
  revenueWithShippingPct: number
  profitPct: number
  averageOrderValuePct?: number
}

type OrderDashboardDTO = {
  ordersCount: number
  paidCount: number
  shippedCount: number
  revenueWithShipping: number
  revenueWithoutShipping: number
  revenueNetWithoutShipping: number
  profit: number
  marginPct: number
  averageOrderValue: number
  trend: OrderDashboardPeriodDTO[]
  trendPrevious: OrderDashboardPeriodDTO[]
  previous?: OrderDashboardKpiDTO
  delta: OrderDashboardDeltaDTO
  paymentBreakdown: OrderDashboardBreakdownDTO[]
  sourceBreakdown: OrderDashboardBreakdownDTO[]
  topProducts: OrderDashboardTopProductDTO[]
  recentOrders: OrderDashboardRecentOrderDTO[]
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
const dateRange = ref<[string, string] | null>(null)

type KPI = {
  revenueWithShipping: number
  revenueWithoutShipping: number
  revenueNetWithoutShipping: number
  profit: number
  marginPct: number
  aov: number
  ordersCount: number
  shippedCount: number
  notShippedCount: number
  paidCount: number
}

const kpi = ref<KPI>({
  revenueWithShipping: 0,
  revenueWithoutShipping: 0,
  revenueNetWithoutShipping: 0,
  profit: 0,
  marginPct: 0,
  aov: 0,
  ordersCount: 0,
  shippedCount: 0,
  notShippedCount: 0,
  paidCount: 0
})

const delta = ref<OrderDashboardDeltaDTO>({
  ordersCountPct: 0,
  revenueWithShippingPct: 0,
  profitPct: 0,
  averageOrderValuePct: 0
})

const periodsCurrent = ref<{ label: string; ordersCount: number; revWith: number; profit: number }[]>([])
const periodsPrev = ref<{ label: string; ordersCount: number; revWith: number; profit: number }[]>([])
const paymentBreakdown = ref<{ name: string; value: number }[]>([])
const sourceBreakdown = ref<{ name: string; value: number }[]>([])
const topProducts = ref<{ name: string; qty: number; profit: number }[]>([])
const recentOrders = ref<OrderDashboardRecentOrderDTO[]>([])
const allegroKpi = ref({
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

const chartTheme = {
  axis: '#94a3b8',
  split: 'rgba(148, 163, 184, 0.15)',
  cur: '#60a5fa',
  prev: '#a78bfa',
  profit: '#34d399',
  text: '#e2e8f0'
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const rangeLabel = computed(() => `${dateRange.value?.[0] ?? '—'} → ${dateRange.value?.[1] ?? '—'}`)

function money(v: number) {
  return Number(v ?? 0).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
}

function moneyNet(v: number) {
  return `${Number(v ?? 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł netto`
}

function percent(v: number) {
  return `${Number(v ?? 0).toFixed(1)}%`
}

function periodLabel(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return dd === '01' ? `${yyyy}-${mm}` : `${yyyy}-${mm}-${dd}`
}

function isGuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v)
}

function pct(cur: number, prev: number) {
  if (!prev) return cur ? 100 : 0
  return ((cur - prev) / prev) * 100
}

function deltaClass(v: number) {
  if (v > 0.0001) return 'up'
  if (v < -0.0001) return 'down'
  return 'flat'
}

function deltaBadge(v: number) {
  const sign = v > 0.0001 ? '↑' : v < -0.0001 ? '↓' : '•'
  return `${sign} ${percent(Math.abs(v))}`
}

const paymentLabels: Record<string, string> = {
  Przelewy24: 'Przelewy24',
  StandardTransfer: 'Przelew',
  CashOnDelivery: 'Za pobraniem',
  PayPo: 'PayPo',
  Blik: 'BLIK',
  Term: 'Termin',
  Allegro: 'Allegro'
}

const sourceLabels: Record<string, string> = {
  Cart: 'Koszyk',
  RegularCustomer: 'Stały klient',
  Offer: 'Oferta',
  Phone: 'Telefon',
  Chat: 'Czat',
  Email: 'E-mail',
  Allegro: 'Allegro'
}

function mapBreakdownName(name: string, dict: Record<string, string>) {
  return dict[name] ?? name
}

async function loadDashboard() {
  loading.value = true
  try {
    storeId.value = cookies.get('dsStore') ?? null

    if (!dateRange.value) {
      const to = new Date()
      const from = new Date()
      from.setDate(to.getDate() - 30)
      dateRange.value = [toYmd(from), toYmd(to)]
    }

    const query: Record<string, string | number> = {
      from: dateRange.value[0],
      to: dateRange.value[1],
      takeRecent: 8,
      takeTopProducts: 10
    }

    if (storeId.value && isGuid(storeId.value)) query.storeId = storeId.value

    const [data, allegroData] = await Promise.all([
      Api.orders.getOrderDashboard(query) as Promise<OrderDashboardDTO>,
      Api.allegro.getStatistics({ from: dateRange.value[0], to: dateRange.value[1] }) as Promise<AllegroStatisticsDTO>
    ])

    const ordersCount = Number(data.ordersCount ?? 0)
    const shippedCount = Number(data.shippedCount ?? 0)
    const revenueNet = Number(data.revenueNetWithoutShipping ?? 0)
    const profit = Number(data.profit ?? 0)

    kpi.value = {
      revenueWithShipping: Number(data.revenueWithShipping ?? 0),
      revenueWithoutShipping: Number(data.revenueWithoutShipping ?? 0),
      revenueNetWithoutShipping: revenueNet,
      profit,
      marginPct: Number(data.marginPct ?? (revenueNet > 0 ? (profit / revenueNet) * 100 : 0)),
      aov: Number(data.averageOrderValue ?? 0),
      ordersCount,
      shippedCount,
      notShippedCount: Math.max(ordersCount - shippedCount, 0),
      paidCount: Number(data.paidCount ?? 0)
    }

    const d = data.delta ?? ({} as OrderDashboardDeltaDTO)
    const prevAov = Number(data.previous?.averageOrderValue ?? 0)
    const curAov = Number(data.averageOrderValue ?? 0)

    delta.value = {
      ordersCountPct: Number(d.ordersCountPct ?? 0),
      revenueWithShippingPct: Number(d.revenueWithShippingPct ?? 0),
      profitPct: Number(d.profitPct ?? 0),
      averageOrderValuePct: typeof d.averageOrderValuePct === 'number' ? d.averageOrderValuePct : pct(curAov, prevAov)
    }

    periodsCurrent.value = (data.trend ?? []).map((t) => ({
      label: periodLabel(t.period),
      ordersCount: Number(t.ordersCount ?? 0),
      revWith: Number(t.revenueWithShipping ?? 0),
      profit: Number(t.profit ?? 0)
    }))

    periodsPrev.value = (data.trendPrevious ?? []).map((t) => ({
      label: periodLabel(t.period),
      ordersCount: Number(t.ordersCount ?? 0),
      revWith: Number(t.revenueWithShipping ?? 0),
      profit: Number(t.profit ?? 0)
    }))

    paymentBreakdown.value = (data.paymentBreakdown ?? []).map((x) => ({
      name: mapBreakdownName(x.name, paymentLabels),
      value: Number(x.count ?? 0)
    }))

    sourceBreakdown.value = (data.sourceBreakdown ?? []).map((x) => ({
      name: mapBreakdownName(x.name, sourceLabels),
      value: Number(x.count ?? 0)
    }))

    topProducts.value = (data.topProducts ?? []).map((p) => ({
      name: p.name,
      qty: Number(p.quantity ?? 0),
      profit: Number(p.profit ?? 0)
    }))

    recentOrders.value = data.recentOrders ?? []

    allegroKpi.value = {
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
      label: periodLabel(p.period),
      ordersCount: Number(p.ordersCount ?? 0),
      revenue: Number(p.revenue ?? 0),
      productsRevenue: Number(p.productsRevenue ?? 0),
      commission: Number(p.commission ?? 0),
      productCost: Number(p.productCost ?? 0),
      netProfit: Number(p.netProfit ?? 0)
    }))
  } catch (err) {
    console.error('OrderDashboard error:', err)
    kpi.value = {
      revenueWithShipping: 0,
      revenueWithoutShipping: 0,
      revenueNetWithoutShipping: 0,
      profit: 0,
      marginPct: 0,
      aov: 0,
      ordersCount: 0,
      shippedCount: 0,
      notShippedCount: 0,
      paidCount: 0
    }
    periodsCurrent.value = []
    periodsPrev.value = []
    paymentBreakdown.value = []
    sourceBreakdown.value = []
    topProducts.value = []
    recentOrders.value = []
    allegroKpi.value = {
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
  } finally {
    loading.value = false
  }
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
  spark(periodsCurrent.value.map((p) => p.revWith), '#93c5fd')
)

const ordersSparkOption = computed(() =>
  spark(periodsCurrent.value.map((p) => p.ordersCount), '#c4b5fd')
)

const profitSparkOption = computed(() =>
  spark(periodsCurrent.value.map((p) => p.profit), '#6ee7b7')
)

const allegroRevenueSparkOption = computed(() =>
  spark(allegroPeriods.value.map((p) => p.revenue), '#93c5fd')
)

const allegroProfitSparkOption = computed(() =>
  spark(allegroPeriods.value.map((p) => p.netProfit), '#6ee7b7')
)

const allegroCommissionSparkOption = computed(() =>
  spark(allegroPeriods.value.map((p) => p.commission), '#c4b5fd')
)

const opsDonutOption = computed(() => ({
  series: [{
    type: 'pie',
    radius: ['58%', '78%'],
    center: ['50%', '55%'],
    label: { show: false },
    data: [
      { value: kpi.value.shippedCount, name: 'Wysłane', itemStyle: { color: '#34d399' } },
      { value: kpi.value.notShippedCount, name: 'Niewysłane', itemStyle: { color: '#fbbf24' } }
    ]
  }]
}))

const baseTrendOption = (x: string[], formatter?: (v: number) => string) => ({
  color: [chartTheme.cur, chartTheme.prev, chartTheme.profit],
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

const trendXAxis = computed(() => periodsCurrent.value.map((p) => p.label))

const ordersTrendOption = computed(() => {
  const x = trendXAxis.value
  const yCur = periodsCurrent.value.map((p) => p.ordersCount)
  const yPrev = x.map((_, idx) => periodsPrev.value[idx]?.ordersCount ?? 0)

  return {
    ...baseTrendOption(x),
    series: [
      { type: 'bar', name: 'Bieżący', data: yCur, barMaxWidth: 28, itemStyle: { borderRadius: [6, 6, 0, 0] } },
      { type: 'line', name: 'Poprzedni', data: yPrev, smooth: true }
    ]
  }
})

const revenueTrendOption = computed(() => {
  const x = trendXAxis.value
  const cur = periodsCurrent.value.map((p) => p.revWith)
  const prev = x.map((_, idx) => periodsPrev.value[idx]?.revWith ?? 0)

  return {
    ...baseTrendOption(x, (v) => money(v)),
    series: [
      { type: 'line', name: 'Bieżący', data: cur, smooth: true, areaStyle: { color: 'rgba(96, 165, 250, 0.12)' } },
      { type: 'line', name: 'Poprzedni', data: prev, smooth: true, lineStyle: { type: 'dashed' } }
    ]
  }
})

const profitTrendOption = computed(() => {
  const x = trendXAxis.value
  const cur = periodsCurrent.value.map((p) => p.profit)
  const prev = x.map((_, idx) => periodsPrev.value[idx]?.profit ?? 0)

  return {
    ...baseTrendOption(x, (v) => moneyNet(v)),
    series: [
      { type: 'bar', name: 'Zysk netto', data: cur, barMaxWidth: 28, itemStyle: { color: chartTheme.profit, borderRadius: [6, 6, 0, 0] } },
      { type: 'line', name: 'Poprzedni okres', data: prev, smooth: true, lineStyle: { color: chartTheme.prev } }
    ]
  }
})

const allegroRevenueProfitOption = computed(() => {
  const x = allegroPeriods.value.map((p) => p.label)

  return {
    ...baseTrendOption(x, (v) => money(v)),
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
        lineStyle: { color: chartTheme.prev, type: 'dashed' }
      }
    ]
  }
})

const donutBase = (data: { name: string; value: number }[]) => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    textStyle: { color: chartTheme.text }
  },
  legend: { bottom: 0, textStyle: { color: '#64748b' } },
  color: ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#22d3ee'],
  series: [{
    type: 'pie',
    radius: ['42%', '68%'],
    center: ['50%', '44%'],
    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: { label: { show: true, fontWeight: 'bold' } },
    data
  }]
})

const paymentDonutOption = computed(() => donutBase(paymentBreakdown.value))
const sourceDonutOption = computed(() => donutBase(sourceBreakdown.value))

onMounted(loadDashboard)
</script>

<style scoped>
.cosmos-dash {
  min-height: calc(100vh - 72px);
  padding: 16px 18px 28px;
  background:
    radial-gradient(ellipse 90% 60% at 0% 0%, rgba(99, 102, 241, 0.14), transparent),
    radial-gradient(ellipse 70% 50% at 100% 0%, rgba(14, 165, 233, 0.12), transparent),
    linear-gradient(180deg, #eef2ff 0%, #f8fafc 45%, #f1f5f9 100%);
}

.cosmos-dash__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.cosmos-dash__eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
}

.cosmos-dash__title {
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.cosmos-dash__subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #64748b;
}

.cosmos-dash__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

.cosmos-dash__date {
  min-width: 280px;
}

.cosmos-dash__kpi {
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

.cosmic-card--revenue {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);
}

.cosmic-card--orders {
  background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #6b21a8 100%);
}

.cosmic-card--profit {
  background: linear-gradient(135deg, #042f2e 0%, #134e4a 45%, #115e59 100%);
}

.cosmic-card--ops {
  background: linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #4338ca 100%);
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
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.03em;
}

.cosmic-card__value--money {
  font-size: 20px;
}

.cosmic-card__value-sub {
  font-size: 16px;
  opacity: 0.75;
}

.cosmic-card__foot {
  margin-top: 4px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.75);
  line-height: 1.35;
}

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

.cosmic-card__delta.up {
  background: rgba(34, 197, 94, 0.22);
  color: #bbf7d0;
}

.cosmic-card__delta.down {
  background: rgba(239, 68, 68, 0.22);
  color: #fecaca;
}

.cosmic-card__chart {
  height: 42px;
  margin-top: auto;
}

.cosmic-card__chart--donut {
  height: 52px;
}

.cosmos-dash__grid {
  display: grid;
  gap: 12px;
}

.cosmos-dash__grid--main {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 12px;
}

.cosmos-dash__grid--bottom {
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

.cosmos-panel__chart--donut {
  height: 280px;
}

.cosmos-panel--table {
  min-height: 280px;
}

.cosmos-table {
  width: 100%;
}

.profit-net {
  font-weight: 800;
  color: #047857;
}

.status-chip {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.status-chip--paid {
  background: #ecfdf5;
  color: #047857;
}

.status-chip--unpaid {
  background: #fef2f2;
  color: #b91c1c;
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
  .cosmos-dash__kpi {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cosmos-dash__grid--main,
  .cosmos-dash__grid--bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .cosmos-dash__header {
    flex-direction: column;
  }

  .cosmos-dash__actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .cosmos-dash__date {
    width: 100%;
    min-width: 0;
  }

  .cosmos-dash__kpi {
    grid-template-columns: 1fr;
  }
}
</style>
