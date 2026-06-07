<template>
  <div class="orders-page">
    <div class="orders-kpi">
      <div class="cosmic-card cosmic-card--total">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head">
            <span class="cosmic-card__label">Wszystkie</span>
            <span class="cosmic-card__glyph">◎</span>
          </div>
          <div class="cosmic-card__value">{{ dataTable.totalCount ?? 0 }}</div>
          <div class="cosmic-card__foot">zamówień w bazie</div>
          <v-chart class="cosmic-card__chart" :option="allOrdersChartOption" autoresize />
        </div>
      </div>

      <div class="cosmic-card cosmic-card--paid">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head">
            <span class="cosmic-card__label">Na tej stronie</span>
            <span class="cosmic-card__glyph">◈</span>
          </div>
          <div class="cosmic-card__value">{{ pageStats.paid }}<span class="cosmic-card__value-sub">/{{ pageStats.pageCount }}</span></div>
          <div class="cosmic-card__foot">{{ pageStats.unpaid }} nieopłaconych</div>
          <v-chart class="cosmic-card__chart cosmic-card__chart--donut" :option="paidChartOption" autoresize />
        </div>
      </div>

      <div class="cosmic-card cosmic-card--new">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head">
            <span class="cosmic-card__label">Nowe</span>
            <span class="cosmic-card__glyph">✦</span>
          </div>
          <div class="cosmic-card__value">{{ pageStats.newCount }}</div>
          <div class="cosmic-card__foot">do realizacji na stronie</div>
          <v-chart class="cosmic-card__chart" :option="newOrdersChartOption" autoresize />
        </div>
      </div>

      <div class="cosmic-card cosmic-card--value">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head">
            <span class="cosmic-card__label">Wartość strony</span>
            <span class="cosmic-card__glyph">❖</span>
          </div>
          <div class="cosmic-card__value cosmic-card__value--money">{{ formatPrice(pageStats.totalValue) }}</div>
          <div class="cosmic-card__foot">suma widocznych zamówień</div>
          <v-chart class="cosmic-card__chart" :option="valueChartOption" autoresize />
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
              <label class="filter-label">Nr zamówienia</label>
              <el-input v-model="filter.numberOrder" placeholder="Nr..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <label class="filter-label">Produkt / kod</label>
              <el-input v-model="filter.productName" placeholder="Nazwa lub kod..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <label class="filter-label">Dane klienta</label>
              <el-input v-model="filter.clientData" placeholder="Imię, firma, NIP..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <label class="filter-label">Adres wysyłki</label>
              <el-input v-model="filter.shipmentData" placeholder="Adres, miasto..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="5">
              <label class="filter-label">Status</label>
              <el-select v-model="filter.orderStatus" clearable placeholder="Wszystkie" class="!w-full">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-col>
          </el-row>

          <el-row :gutter="12" class="mt-3">
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Data od</label>
              <el-date-picker v-model="filter.dateFrom" type="date" placeholder="Od" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="!w-full" clearable />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Data do</label>
              <el-date-picker v-model="filter.dateTo" type="date" placeholder="Do" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="!w-full" clearable />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Kwota od</label>
              <el-input-number v-model="filter.amountMin" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Kwota do</label>
              <el-input-number v-model="filter.amountMax" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Opłacone</label>
              <el-select v-model="filter.isPaid" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" />
                <el-option label="Nie" :value="false" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <label class="filter-label">Faktura</label>
              <el-select v-model="filter.sendInvoice" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" />
                <el-option label="Nie" :value="false" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="8" class="flex items-end gap-2">
              <el-button type="primary" @click="applyFilters">Zastosuj filtry</el-button>
              <el-button @click="clearFilters">Wyczyść</el-button>
            </el-col>
          </el-row>
        </div>
      </el-collapse-transition>
    </el-card>

    <el-card shadow="never" class="list-card">
      <div class="list-toolbar">
        <div class="list-toolbar__group">
          <el-button type="primary" :icon="Plus" @click="router.push('/sale/order/createorder')">
            Nowe zamówienie
          </el-button>
          <el-button :icon="Edit" :disabled="!selectedRow" @click="editSelectedRecord">Edytuj</el-button>
          <el-button :icon="View" :disabled="!selectedRow" @click="showOrderHandle">Podgląd</el-button>
          <el-button :icon="Document" :disabled="!selectedRow" @click="invoiceGenerate">Faktura</el-button>
          <el-button :icon="FolderAdd" :disabled="!selectedRow" @click="openExistingInvoiceModal">Dodaj fakturę</el-button>
        </div>
        <span class="list-toolbar__hint">Kliknij wiersz, aby zaznaczyć · dwuklik — podgląd</span>
      </div>

      <div class="list-body">
        <div class="list-head">
          <span>Zamówienie</span>
          <span>Klient / wysyłka</span>
          <span>Kwota</span>
          <span>Status</span>
          <span>Płatność / faktura</span>
          <span></span>
        </div>

        <div class="list-scroll-wrap">
      <el-skeleton :loading="loading" animated :count="5">
        <template #template>
          <div class="order-skeleton">
            <el-skeleton-item variant="circle" class="order-skeleton__avatar" />
            <div class="order-skeleton__lines">
              <el-skeleton-item variant="h3" style="width: 40%" />
              <el-skeleton-item variant="text" style="width: 70%" />
            </div>
          </div>
        </template>

        <template #default>
          <div class="list-content">
          <div v-if="!dataTable.items?.length" class="orders-empty">
            <div class="orders-empty__icon">📦</div>
            <h3>Brak zamówień</h3>
            <p>Nie znaleziono zamówień dla wybranych filtrów.</p>
            <el-button @click="clearFilters">Wyczyść filtry</el-button>
          </div>

          <div v-else class="orders-list">
            <article
              v-for="row in dataTable.items"
              :key="row.id"
              :data-order-id="row.id"
              class="order-card"
              :class="{
                'order-card--selected': selectedRowId === row.id,
                'order-card--expanded': expandedOrderId === row.id,
                [`order-card--producer-${producerStatus(row)}`]: true
              }"
              @click="selectOrder(row)"
              @dblclick="openOrder(row)"
            >
              <div class="order-card__stripe" :title="producerStatusLabel(row)" />

              <div class="order-card__main">
                <div class="order-card__col order-card__col--order">
                  <button
                    class="order-card__expand"
                    type="button"
                    :aria-expanded="expandedOrderId === row.id"
                    @click.stop="toggleExpand(row.id)"
                  >
                    <el-icon :class="{ 'order-card__expand-icon--open': expandedOrderId === row.id }">
                      <ArrowRight />
                    </el-icon>
                  </button>
                  <div class="order-card__id-block">
                    <span class="order-card__number">#{{ row.numberOrder }}</span>
                    <span class="order-card__date">{{ formatDateShort(row.createdOn) }} · {{ formatTime(row.createdOn) }}</span>
                    <span v-if="row.orderNote" class="order-card__note-badge">Uwagi</span>
                  </div>
                </div>

                <div class="order-card__col order-card__col--client">
                  <div class="order-card__party">
                    <div
                      class="order-card__avatar"
                      :class="orderSourceAvatarClass(row)"
                      :title="orderSourceLabel(row)"
                    >
                      {{ orderSourceBadge(row) }}
                    </div>
                    <div class="order-card__party-text">
                      <div class="order-card__party-name">{{ splitOrderData(row.billingData).primary }}</div>
                      <div class="order-card__party-detail">{{ splitOrderData(row.billingData).secondary }}</div>
                      <div class="order-card__shipping-line">
                        <el-icon class="order-card__shipping-icon"><Van /></el-icon>
                        <div class="order-card__shipping-text">
                          <span class="order-card__shipping-name">{{ shippingRecipient(row) }}</span>
                          <span class="order-card__shipping-address">{{ shippingAddressText(row) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="order-card__col order-card__col--amount">
                  <span class="order-card__amount">{{ formatPrice(row.orderTotal) }}</span>
                  <span v-if="row.discountAmount" class="order-card__amount-sub">
                    rabat {{ formatPrice(row.discountAmount) }}
                  </span>
                </div>

                <div class="order-card__col order-card__col--status" @click.stop>
                  <el-dropdown trigger="click" @command="(status: number) => handleChangeStatus(status, row.id)">
                    <button type="button" class="status-pill" :class="`status-pill--${statusTone(row.orderStatus)}`">
                      <span class="status-pill__dot" />
                      <span class="status-pill__label">{{ statusLabel(row.orderStatus) }}</span>
                      <el-icon class="status-pill__arrow"><ArrowDown /></el-icon>
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item
                          v-for="item in options"
                          :key="item.value"
                          :command="item.value"
                          :class="{ 'is-active': item.value === row.orderStatus }"
                        >
                          {{ item.label }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>

                <div class="order-card__col order-card__col--payment" @click.stop>
                  <span class="order-card__payment-method">{{ translatePaymentProvider(row.payment) || '—' }}</span>
                  <div class="order-card__payment-flags">
                    <el-dropdown trigger="click" @command="(paid: boolean) => changePaidStatus(row, paid)">
                      <button
                        type="button"
                        class="flag-chip"
                        :class="row.isPaid ? 'flag-chip--yes' : 'flag-chip--no'"
                      >
                        {{ row.isPaid ? 'Opłacone' : 'Nieopłacone' }}
                        <el-icon class="flag-chip__arrow"><ArrowDown /></el-icon>
                      </button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item :command="true" :class="{ 'is-active': row.isPaid }">
                            Opłacone
                          </el-dropdown-item>
                          <el-dropdown-item :command="false" :class="{ 'is-active': !row.isPaid }">
                            Nieopłacone
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <el-dropdown trigger="click" @command="(send: boolean) => changeInvoiceStatus(row, send)">
                      <button
                        type="button"
                        class="flag-chip"
                        :class="row.sendInvoice ? 'flag-chip--yes' : 'flag-chip--neutral'"
                      >
                        Faktura: {{ row.sendInvoice ? 'tak' : 'nie' }}
                        <el-icon class="flag-chip__arrow"><ArrowDown /></el-icon>
                      </button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item :command="true" :class="{ 'is-active': row.sendInvoice }">
                            Faktura: tak
                          </el-dropdown-item>
                          <el-dropdown-item :command="false" :class="{ 'is-active': !row.sendInvoice }">
                            Faktura: nie
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>

                <div class="order-card__col order-card__col--actions" @click.stop>
                  <el-tooltip content="Edytuj" placement="top">
                    <button type="button" class="quick-btn" @click="editOrder(row)">
                      <el-icon><Edit /></el-icon>
                    </button>
                  </el-tooltip>
                  <el-tooltip content="Podgląd" placement="top">
                    <button type="button" class="quick-btn" @click="openOrder(row)">
                      <el-icon><View /></el-icon>
                    </button>
                  </el-tooltip>
                </div>
              </div>

              <el-collapse-transition>
                <div v-show="expandedOrderId === row.id" class="order-card__detail">
                  <div class="detail-grid">
                    <section class="detail-panel">
                      <h4><el-icon><User /></el-icon> Klient</h4>
                      <ul>
                        <li v-if="row.billingAddress?.companyName"><strong>Firma</strong> {{ row.billingAddress.companyName }}</li>
                        <li v-if="row.billingAddress?.nip"><strong>NIP</strong> {{ row.billingAddress.nip }}</li>
                        <li><strong>Osoba</strong> {{ row.billingAddress?.firstName }} {{ row.billingAddress?.lastName }}</li>
                        <li><strong>Adres</strong> {{ row.billingAddress?.addressLine1 }}</li>
                        <li><strong>Miasto</strong> {{ row.billingAddress?.zipCode }} {{ row.billingAddress?.city }}</li>
                        <li><strong>Email</strong> {{ row.billingAddress?.email || '—' }}</li>
                        <li><strong>Tel.</strong> {{ row.billingAddress?.phone || '—' }}</li>
                      </ul>
                    </section>

                    <section class="detail-panel">
                      <h4><el-icon><Van /></el-icon> Wysyłka</h4>
                      <ul>
                        <li v-if="row.shippingAddress?.companyName"><strong>Firma</strong> {{ row.shippingAddress.companyName }}</li>
                        <li><strong>Osoba</strong> {{ row.shippingAddress?.firstName }} {{ row.shippingAddress?.lastName }}</li>
                        <li><strong>Adres</strong> {{ row.shippingAddress?.addressLine1 }}</li>
                        <li><strong>Miasto</strong> {{ row.shippingAddress?.zipCode }} {{ row.shippingAddress?.city }}</li>
                        <li><strong>Tel.</strong> {{ row.shippingAddress?.phone || '—' }}</li>
                      </ul>
                    </section>

                    <section class="detail-panel">
                      <h4><el-icon><Wallet /></el-icon> Płatność</h4>
                      <ul>
                        <li><strong>Metoda</strong> {{ translatePaymentProvider(row.payment) || '—' }}</li>
                        <li><strong>Faktura</strong> {{ row.invoiceNumber || '—' }}</li>
                        <li><strong>Proforma</strong> {{ row.proformaNumber || '—' }}</li>
                      </ul>
                    </section>
                  </div>

                  <div v-if="row.orderNote" class="detail-note">
                    <strong>Uwagi klienta</strong>
                    <p>{{ row.orderNote }}</p>
                  </div>

                  <div class="detail-products">
                    <h4>Produkty ({{ row.orderItems?.length ?? 0 }})</h4>
                    <div class="product-rows">
                      <div
                        v-for="item in row.orderItems"
                        :key="item.id || item.productName"
                        class="product-row"
                        :class="{ 'product-row--pending': !item.itemOrderedFromManufacturer }"
                      >
                        <a :href="'https://olmag.pl/' + item.slug" target="_blank" class="product-row__thumb">
                          <img :src="item.productImage" alt="" />
                        </a>
                        <div class="product-row__info">
                          <a :href="'https://olmag.pl/' + item.slug" target="_blank" class="product-row__name">
                            {{ item.productName }}
                          </a>
                          <span class="product-row__code">{{ item.identificationCode }}</span>
                        </div>
                        <span class="product-row__qty">×{{ item.quantity }}</span>
                        <span class="product-row__price">{{ formatPrice(item.productPrice) }}</span>
                        <span
                          class="product-row__status"
                          :class="item.itemOrderedFromManufacturer ? 'product-row__status--ok' : 'product-row__status--wait'"
                        >
                          {{ item.itemOrderedFromManufacturer ? 'U producenta' : 'Do zamówienia' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-collapse-transition>
            </article>
          </div>
          </div>
        </template>
      </el-skeleton>
        </div>
      </div>

      <div class="list-footer">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="filter.pageNumber"
          :page-size="filter.pageSize"
          :page-sizes="[12, 24, 48, 100]"
          :total="dataTable.totalCount"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import { useOrderStore } from '/@/stores/order'
import { useInvoiceStore } from '/@/stores/invoice'
import {
  ArrowDown,
  ArrowRight,
  Document,
  Edit,
  Filter,
  FolderAdd,
  Plus,
  User,
  Van,
  View,
  Wallet
} from '@element-plus/icons-vue'
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

echarts.use([BarChart, LineChart, PieChart, GridComponent, CanvasRenderer])

const cosmicGrid = { left: 0, right: 0, top: 2, bottom: 0 }

enum PaymentProvider {
  Przelewy24 = 0,
  StandardTransfer = 1,
  CashOnDelivery = 2,
  PayPo = 3,
  Blik = 4,
  Term = 5,
  Allegro = 6
}

enum OrderSourceType {
  Cart = 0,
  RegularCustomer = 1,
  Offer = 2,
  Phone = 3,
  Chat = 4,
  Email = 5,
  Allegro = 6
}

enum OrderStatus {
  New = 1,
  OnHold = 10,
  InProgress = 20,
  Shipped = 30,
  Complete = 40,
  Canceled = 50,
  Refunded = 60,
  Closed = 70,
  OverduePayment = 80,
  WorkOrder = 100
}

type OrderFilters = {
  storeId: string | number | null
  numberOrder: string | null
  productName: string | null
  clientData: string | null
  shipmentData: string | null
  dateFrom: string | null
  dateTo: string | null
  amountMin: number | null
  amountMax: number | null
  orderStatus: number | null
  isPaid: boolean | null
  sendInvoice: boolean | null
  pageNumber: number
  pageSize: number
}

const options = [
  { value: OrderStatus.New, label: 'Nowe' },
  { value: OrderStatus.OnHold, label: 'Wstrzymane' },
  { value: OrderStatus.InProgress, label: 'W trakcie realizacji' },
  { value: OrderStatus.Shipped, label: 'Wysłane' },
  { value: OrderStatus.Complete, label: 'Zakończone' },
  { value: OrderStatus.Canceled, label: 'Anulowane' },
  { value: OrderStatus.Refunded, label: 'Zwrot' },
  { value: OrderStatus.Closed, label: 'Zamknięte' },
  { value: OrderStatus.OverduePayment, label: 'Opóźniona płatność' },
  { value: OrderStatus.WorkOrder, label: 'Zamówienie robocze' }
]

const route = useRoute()
const router = useRouter()
const toast = useToast()
const cookies = new Cookies()
const selectedRow = ref<any>(null)
const selectedRowId = ref<string | null>(null)
const expandedOrderId = ref<string | null>(null)
const invoiceStore = useInvoiceStore()
const order = useOrderStore()
const loading = ref(false)
const filtersOpen = ref(false)
const isSyncingFromRoute = ref(false)

const dataTable = ref<any>({
  items: [],
  totalCount: 0,
  pageNumber: 1
})

const pageStats = computed(() => {
  const items = dataTable.value.items ?? []
  return {
    pageCount: items.length,
    paid: items.filter((item: any) => item.isPaid).length,
    unpaid: items.filter((item: any) => !item.isPaid).length,
    newCount: items.filter((item: any) => item.orderStatus === OrderStatus.New).length,
    inProgressCount: items.filter((item: any) => item.orderStatus === OrderStatus.InProgress).length,
    shippedCount: items.filter((item: any) => item.orderStatus === OrderStatus.Shipped).length,
    totalValue: items.reduce((sum: number, item: any) => sum + Number(item.orderTotal ?? 0), 0)
  }
})

const sortedPageItems = computed(() => {
  return [...(dataTable.value.items ?? [])].sort(
    (a: any, b: any) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()
  )
})

const allOrdersChartOption = computed(() => {
  const items = sortedPageItems.value
  let cumulative = 0
  const data = items.map((item: any) => {
    cumulative += 1
    return cumulative
  })

  return {
    grid: cosmicGrid,
    xAxis: { type: 'category', show: false, data: items.map((_: any, i: number) => i) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: data.length ? data : [0],
      lineStyle: { color: '#67e8f9', width: 2, shadowColor: 'rgba(103,232,249,0.8)', shadowBlur: 10 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103,232,249,0.45)' },
          { offset: 1, color: 'rgba(103,232,249,0)' }
        ])
      }
    }]
  }
})

const paidChartOption = computed(() => ({
  series: [{
    type: 'pie',
    radius: ['58%', '82%'],
    center: ['50%', '50%'],
    label: { show: false },
    data: [
      { value: pageStats.value.paid || 0, name: 'Opłacone', itemStyle: { color: '#34d399' } },
      { value: pageStats.value.unpaid || 0, name: 'Nieopłacone', itemStyle: { color: '#f87171' } }
    ]
  }]
}))

const newOrdersChartOption = computed(() => ({
  grid: cosmicGrid,
  xAxis: {
    type: 'category',
    show: false,
    data: ['Nowe', 'W trakcie', 'Wysłane', 'Inne']
  },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'bar',
    barWidth: '55%',
    data: [
      { value: pageStats.value.newCount, itemStyle: { color: '#a78bfa', borderRadius: [4, 4, 0, 0] } },
      { value: pageStats.value.inProgressCount, itemStyle: { color: '#60a5fa', borderRadius: [4, 4, 0, 0] } },
      { value: pageStats.value.shippedCount, itemStyle: { color: '#4ade80', borderRadius: [4, 4, 0, 0] } },
      {
        value: Math.max(
          pageStats.value.pageCount
            - pageStats.value.newCount
            - pageStats.value.inProgressCount
            - pageStats.value.shippedCount,
          0
        ),
        itemStyle: { color: '#94a3b8', borderRadius: [4, 4, 0, 0] }
      }
    ]
  }]
}))

const valueChartOption = computed(() => {
  const items = sortedPageItems.value
  const data = items.map((item: any) => Number(item.orderTotal ?? 0))

  return {
    grid: cosmicGrid,
    xAxis: { type: 'category', show: false, data: items.map((_: any, i: number) => i) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: data.length ? data : [0],
      lineStyle: { color: '#fbbf24', width: 2, shadowColor: 'rgba(251,191,36,0.8)', shadowBlur: 8 },
      itemStyle: { color: '#fde68a' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(251,191,36,0.35)' },
          { offset: 1, color: 'rgba(251,191,36,0)' }
        ])
      }
    }]
  }
})

const createDefaultFilters = (): OrderFilters => ({
  storeId: cookies.get('dsStore'),
  numberOrder: null,
  productName: null,
  clientData: null,
  shipmentData: null,
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
  orderStatus: null,
  isPaid: null,
  sendInvoice: null,
  pageNumber: 1,
  pageSize: 12
})

const buildFiltersFromQuery = (): OrderFilters => {
  const defaults = createDefaultFilters()

  return {
    ...defaults,
    numberOrder: parseQueryString(route.query, 'numberOrder', null),
    productName: parseQueryString(route.query, 'productName', null),
    clientData: parseQueryString(route.query, 'clientData', null),
    shipmentData: parseQueryString(route.query, 'shipmentData', null),
    dateFrom: parseDateQuery(route.query, 'dateFrom'),
    dateTo: parseDateQuery(route.query, 'dateTo'),
    amountMin: parseQueryNumber(route.query, 'amountMin', null),
    amountMax: parseQueryNumber(route.query, 'amountMax', null),
    orderStatus: parseQueryNumber(route.query, 'orderStatus', null),
    isPaid: parseQueryBoolean(route.query, 'isPaid', null),
    sendInvoice: parseQueryBoolean(route.query, 'sendInvoice', null),
    pageNumber: parseQueryPage(route.query, 1),
    pageSize: parseQueryNumber(route.query, 'pageSize', 12) || 12
  }
}

const buildQueryFromFilters = (filters: OrderFilters) => {
  const query: Record<string, string> = {}

  setQueryString(query, 'numberOrder', filters.numberOrder)
  setQueryString(query, 'productName', filters.productName)
  setQueryString(query, 'clientData', filters.clientData)
  setQueryString(query, 'shipmentData', filters.shipmentData)
  setDateQuery(query, 'dateFrom', filters.dateFrom)
  setDateQuery(query, 'dateTo', filters.dateTo)
  setQueryNumber(query, 'amountMin', filters.amountMin)
  setQueryNumber(query, 'amountMax', filters.amountMax)
  setQueryNumber(query, 'orderStatus', filters.orderStatus)
  setQueryBoolean(query, 'isPaid', filters.isPaid)
  setQueryBoolean(query, 'sendInvoice', filters.sendInvoice)
  setQueryNumber(query, 'page', filters.pageNumber)
  setQueryNumber(query, 'pageSize', filters.pageSize)

  return query
}

const filter = ref<OrderFilters>(buildFiltersFromQuery())

const activeFiltersCount = computed(() => {
  let count = 0

  if (filter.value.numberOrder) count++
  if (filter.value.productName) count++
  if (filter.value.clientData) count++
  if (filter.value.shipmentData) count++
  if (filter.value.dateFrom) count++
  if (filter.value.dateTo) count++
  if (filter.value.amountMin !== null) count++
  if (filter.value.amountMax !== null) count++
  if (filter.value.orderStatus !== null) count++
  if (filter.value.isPaid !== null) count++
  if (filter.value.sendInvoice !== null) count++

  return count
})

const syncFiltersToUrl = (filters: OrderFilters) => {
  router.replace({ query: buildQueryFromFilters(filters) })
}

const buildPredicateObject = () => {
  const predicate: Record<string, unknown> = {}

  if (filter.value.numberOrder) predicate.NumberOrder = filter.value.numberOrder
  if (filter.value.productName) predicate.ProductName = filter.value.productName
  if (filter.value.clientData) predicate.ClientData = filter.value.clientData
  if (filter.value.shipmentData) predicate.ShipmentData = filter.value.shipmentData
  if (filter.value.amountMin !== null) predicate.AmountMin = filter.value.amountMin
  if (filter.value.amountMax !== null) predicate.AmountMax = filter.value.amountMax
  if (filter.value.orderStatus !== null) predicate.OrderStatus = filter.value.orderStatus
  if (filter.value.isPaid !== null) predicate.IsPaid = filter.value.isPaid
  if (filter.value.sendInvoice !== null) predicate.SendInvoice = filter.value.sendInvoice

  if (filter.value.dateFrom || filter.value.dateTo) {
    predicate.CreatedOn = {}

    if (filter.value.dateFrom) {
      ;(predicate.CreatedOn as Record<string, string>).after = new Date(filter.value.dateFrom).toISOString()
    }

    if (filter.value.dateTo) {
      const endDate = new Date(filter.value.dateTo)
      endDate.setHours(23, 59, 59, 999)
      ;(predicate.CreatedOn as Record<string, string>).before = endDate.toISOString()
    }
  }

  return predicate
}

const selectOrder = (row: any) => {
  selectedRowId.value = row.id
  selectedRow.value = row
}

const scrollExpandedIntoView = (id: string) => {
  const card = document.querySelector(`[data-order-id="${id}"]`) as HTMLElement | null
  const scroller = card?.closest('.list-scroll-wrap') as HTMLElement | null
  if (!card || !scroller) return

  const cardRect = card.getBoundingClientRect()
  const scrollerRect = scroller.getBoundingClientRect()

  if (cardRect.bottom > scrollerRect.bottom) {
    scroller.scrollTop += cardRect.bottom - scrollerRect.bottom + 24
  } else if (cardRect.top < scrollerRect.top) {
    scroller.scrollTop -= scrollerRect.top - cardRect.top + 8
  }
}

const toggleExpand = async (id: string) => {
  const willExpand = expandedOrderId.value !== id
  expandedOrderId.value = willExpand ? id : null

  if (!willExpand) return

  await nextTick()
  scrollExpandedIntoView(id)
  window.setTimeout(() => scrollExpandedIntoView(id), 320)
}

const editOrder = (row: any) => {
  router.push({ path: `/sale/order/edit/${row.id}`, query: route.query })
}

const openOrder = async (row: any) => {
  selectedRowId.value = row.id
  selectedRow.value = row
  await order.showOrder(row.id)
}

const editSelectedRecord = () => {
  if (selectedRow.value) {
    editOrder(selectedRow.value)
  } else {
    toast.warning('Wybierz zamówienie do edycji')
  }
}

const invoiceGenerate = async () => {
  if (!selectedRow.value) {
    toast.warning('Wybierz zamówienie')
    return
  }

  if (!selectedRow.value.isPaid) {
    toast.warning('Zamówienie musi być opłacone')
    return
  }

  await Api.invoices.createInvoice(selectedRow.value.id)
}

const formatPrice = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0)
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`
}

const formatDateShort = (dateIso: string) => {
  return new Date(dateIso).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatTime = (dateIso: string) => {
  return new Date(dateIso).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const splitOrderData = (data?: string) => {
  if (!data) return { primary: '—', secondary: '' }

  const parts = data.split(',').map((part) => part.trim()).filter(Boolean)
  if (!parts.length) return { primary: '—', secondary: '' }

  return {
    primary: parts[0],
    secondary: parts.slice(1).join(', ')
  }
}

const shippingRecipient = (row: any) => {
  const addr = row?.shippingAddress
  if (addr) {
    if (addr.isCompany && addr.companyName) return addr.companyName
    const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ')
    if (name) return name
  }

  return splitOrderData(row?.shippingData).primary
}

const shippingAddressText = (row: any) => {
  const addr = row?.shippingAddress
  if (addr) {
    const parts = [
      addr.addressLine1,
      addr.addressLine2,
      [addr.zipCode, addr.city].filter(Boolean).join(' ')
    ].filter(Boolean)

    if (parts.length) return parts.join(', ')
  }

  const split = splitOrderData(row?.shippingData)
  return split.secondary || '—'
}

const parseEnumValue = (raw: unknown): number | null => {
  if (raw === null || raw === undefined || raw === '') return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw

  const normalized = String(raw).trim().toLowerCase()
  if (!normalized) return null

  if (normalized === 'allegro') return OrderSourceType.Allegro

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const resolveOrderSourceType = (row: any): number => {
  const sourceType = parseEnumValue(row?.orderSourceType ?? row?.OrderSourceType)
  if (sourceType !== null) return sourceType

  const payment = parseEnumValue(row?.payment ?? row?.Payment)
  if (payment === PaymentProvider.Allegro) return OrderSourceType.Allegro

  const orderNote = String(row?.orderNote ?? row?.OrderNote ?? '').toLowerCase()
  if (orderNote.includes('allegro checkoutformid')) return OrderSourceType.Allegro

  return OrderSourceType.Cart
}

const isAllegroOrder = (row: any) => resolveOrderSourceType(row) === OrderSourceType.Allegro

const orderSourceBadge = (row: any) => (isAllegroOrder(row) ? 'A' : 'OM')

const orderSourceLabel = (row: any) =>
  isAllegroOrder(row) ? 'Zamówienie Allegro' : 'Zamówienie ze sklepu Olmag'

const orderSourceAvatarClass = (row: any) =>
  isAllegroOrder(row) ? 'order-card__avatar--allegro' : 'order-card__avatar--shop'

const statusLabel = (status: number) => {
  return options.find((item) => item.value === status)?.label ?? 'Nieznany'
}

const statusTone = (status: number) => {
  switch (status) {
    case OrderStatus.New:
      return 'blue'
    case OrderStatus.InProgress:
    case OrderStatus.WorkOrder:
      return 'amber'
    case OrderStatus.Shipped:
    case OrderStatus.Complete:
      return 'green'
    case OrderStatus.Canceled:
    case OrderStatus.Refunded:
    case OrderStatus.OverduePayment:
      return 'red'
    default:
      return 'slate'
  }
}

const producerStatus = (row: any) => {
  if (!row.orderItems?.length) return 'neutral'
  return row.orderItems.every((item: any) => item.itemOrderedFromManufacturer) ? 'ok' : 'wait'
}

const producerStatusLabel = (row: any) => {
  return producerStatus(row) === 'ok'
    ? 'Wszystkie produkty zamówione u producenta'
    : 'Produkty oczekujące na zamówienie u producenta'
}

const fetchTableData = async () => {
  loading.value = true
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

    const result = await Api.orders.smartTable(payload)
    const tableData = result.data

    if (tableData?.items?.length) {
      tableData.items = tableData.items.map((item: any) => ({
        ...item,
        orderStatus: item.orderStatus > 0 ? item.orderStatus : OrderStatus.New,
        orderSourceType: resolveOrderSourceType(item)
      }))
    }

    dataTable.value = tableData
  } catch (error) {
    console.error('Błąd podczas pobierania danych:', error)
    toast.error('Wystąpił problem z pobraniem danych')
  } finally {
    loading.value = false
  }
}

const openExistingInvoiceModal = async () => {
  if (!selectedRow.value) {
    toast.warning('Wybierz zamówienie')
    return
  }
  await invoiceStore.open(selectedRow.value)
}

const applyFilters = async () => {
  filter.value.pageNumber = 1
  expandedOrderId.value = null
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const clearFilters = async () => {
  filter.value = {
    ...createDefaultFilters(),
    pageNumber: 1,
    pageSize: filter.value.pageSize
  }
  expandedOrderId.value = null
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const handlePageChange = async (page: number) => {
  filter.value.pageNumber = page
  expandedOrderId.value = null
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const handlePageSizeChange = async (size: number) => {
  filter.value.pageSize = size
  filter.value.pageNumber = 1
  expandedOrderId.value = null
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const handleChangeStatus = async (status: number, orderId: string) => {
  const row = dataTable.value.items?.find((item: any) => item.id === orderId)
  if (row) row.orderStatus = status

  const payload = {
    body: JSON.stringify({ orderStatus: status, orderId })
  }
  await Api.orders.changeOrderStatus(payload)
  toast.success('Zmieniono status zamówienia')
}

const showOrderHandle = async () => {
  if (!selectedRowId.value) {
    toast.warning('Wybierz zamówienie')
    return
  }
  await order.showOrder(selectedRowId.value)
}

const changePaidStatus = async (row: any, isPaid: boolean) => {
  if (row.isPaid === isPaid) return
  row.isPaid = isPaid
  await handleChangePaid(isPaid, row.id)
}

const changeInvoiceStatus = async (row: any, sendInvoice: boolean) => {
  if (row.sendInvoice === sendInvoice) return
  row.sendInvoice = sendInvoice
  await handleChangeSendInvoice(sendInvoice, row.id)
}

const handleChangePaid = async (status: boolean, orderId: string) => {
  const payload = {
    body: JSON.stringify({ isPaid: status, orderId })
  }
  await Api.orders.changePaidStatus(payload)
  toast.success('Zmieniono status płatności')
}

const handleChangeSendInvoice = async (status: boolean, orderId: string) => {
  const payload = {
    body: JSON.stringify({ sendInvoice: status, orderId })
  }
  await Api.orders.changeInvoiceStatus(payload)
  toast.success('Zaktualizowano status faktury')
}

function translatePaymentProvider(value: number): string | null {
  switch (value) {
    case PaymentProvider.Przelewy24:
      return 'Przelewy24'
    case PaymentProvider.StandardTransfer:
      return 'Przelew standardowy'
    case PaymentProvider.CashOnDelivery:
      return 'Płatność przy odbiorze'
    case PaymentProvider.PayPo:
      return 'PayPo'
    case PaymentProvider.Blik:
      return 'Blik'
    case PaymentProvider.Term:
      return 'Termin'
    case PaymentProvider.Allegro:
      return 'Allegro'
    default:
      return null
  }
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
  await fetchTableData()
})
</script>

<style scoped>
.orders-page {
  padding: 8px 10px 60px;
  max-width: 100%;
  box-sizing: border-box;
  background:
    radial-gradient(ellipse 90% 60% at 10% -10%, rgba(99, 102, 241, 0.12), transparent),
    radial-gradient(ellipse 70% 50% at 90% 0%, rgba(14, 165, 233, 0.1), transparent),
    linear-gradient(180deg, #eef2ff 0%, #f8fafc 45%, #f1f5f9 100%);
}

.orders-kpi {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
  min-width: 0;
}

.cosmic-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  min-height: 88px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cosmic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.28);
}

.cosmic-card--total {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);
}

.cosmic-card--paid {
  background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #6b21a8 100%);
}

.cosmic-card--new {
  background: linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #4338ca 100%);
}

.cosmic-card--value {
  background: linear-gradient(135deg, #042f2e 0%, #134e4a 45%, #115e59 100%);
}

.cosmic-card__stars {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 70% 20%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 40% 70%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 85% 65%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 55% 45%, rgba(255, 255, 255, 0.5), transparent);
  pointer-events: none;
}

.cosmic-card__content {
  position: relative;
  z-index: 1;
  padding: 10px 12px 6px;
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
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
}

.cosmic-card__value {
  margin-top: 2px;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #f8fafc;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.25);
  line-height: 1.1;
}

.cosmic-card__value-sub {
  font-size: 16px;
  font-weight: 700;
  color: rgba(226, 232, 240, 0.65);
  margin-left: 2px;
}

.cosmic-card__value--money {
  font-size: 17px;
}

.cosmic-card__foot {
  margin-top: 2px;
  font-size: 10px;
  color: rgba(203, 213, 225, 0.75);
}

.cosmic-card__chart {
  margin-top: auto;
  width: 100%;
  height: 26px;
}

.cosmic-card__chart--donut {
  height: 30px;
  margin-top: 2px;
}

.filters-card {
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 8px;
  overflow: hidden;
  max-width: 100%;
  min-width: 0;
}

.list-card {
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 0;
  overflow: hidden;
  max-width: 100%;
  min-width: 0;
  min-height: calc(100vh - 72px);
  display: flex;
  flex-direction: column;
}

.list-card :deep(.el-card__body) {
  flex: 1;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.list-body {
  min-width: 0;
  max-width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.filters-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
}

.filters-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 14px;
  color: #334155;
}

.filters-card__chevron {
  transition: transform 0.2s ease;
  color: #94a3b8;
}

.filters-card__chevron--open {
  transform: rotate(180deg);
}

.filters-card__body {
  padding: 0 18px 18px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.filter-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  background: rgba(248, 250, 252, 0.8);
  flex-shrink: 0;
}

.list-toolbar__group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.list-toolbar__hint {
  font-size: 12px;
  color: #94a3b8;
}

.list-head,
.order-card__main {
  display: grid;
  grid-template-columns:
    minmax(108px, 0.9fr)
    minmax(0, 2.4fr)
    minmax(78px, 0.72fr)
    minmax(108px, 0.95fr)
    minmax(168px, 1.25fr)
    48px;
  gap: 8px 10px;
  align-items: center;
}

.list-head {
  padding: 6px 12px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  flex-shrink: 0;
}

.list-scroll-wrap {
  flex: 1 1 0;
  min-height: calc(100vh - 220px);
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}

.list-scroll-wrap::-webkit-scrollbar {
  width: 10px;
}

.list-scroll-wrap::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 8px;
}

.list-scroll-wrap::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 8px;
  border: 2px solid #f1f5f9;
}

.list-scroll-wrap::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.list-scroll-wrap :deep(.el-skeleton) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.list-content {
  display: block;
  padding-bottom: 8px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px 10px 16px;
}

.order-card {
  position: relative;
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.order-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.order-card--selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.order-card__stripe {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #cbd5e1;
}

.order-card--producer-ok .order-card__stripe {
  background: linear-gradient(180deg, #22c55e, #16a34a);
}

.order-card--producer-wait .order-card__stripe {
  background: linear-gradient(180deg, #f97316, #ea580c);
}

.order-card__main {
  padding: 6px 10px;
}

.order-card__col {
  min-width: 0;
}

.order-card__col--order {
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-card__expand {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.order-card__expand:hover {
  background: #e2e8f0;
  color: #334155;
}

.order-card__expand-icon--open {
  transform: rotate(90deg);
}

.order-card__id-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.order-card__number {
  font-size: 13px;
  font-weight: 900;
  color: #1d4ed8;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-card__date {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-card__note-badge {
  margin-top: 4px;
  width: fit-content;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #b45309;
}

.order-card__party {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.order-card__party-text {
  min-width: 0;
  flex: 1;
}

.order-card__avatar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-weight: 900;
  font-size: 10px;
  letter-spacing: -0.03em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-card__avatar--shop {
  background: linear-gradient(135deg, #dcfce7, #ecfdf5);
  color: #15803d;
  border: 1px solid #86efac;
}

.order-card__avatar--allegro {
  background: linear-gradient(135deg, #ffedd5, #fed7aa);
  color: #c2410c;
  border: 1px solid #fdba74;
  font-size: 14px;
}

.order-card__party-name {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-card__party-detail {
  font-size: 11px;
  color: #64748b;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-card__shipping-line {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-top: 3px;
  min-width: 0;
}

.order-card__shipping-icon {
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 12px;
  color: #94a3b8;
}

.order-card__shipping-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.order-card__shipping-name {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-card__shipping-address {
  font-size: 10px;
  color: #94a3b8;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.order-card__shipping-extra {
  flex-shrink: 1;
}

.order-card__col--amount {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}

.order-card__amount {
  font-size: 13px;
  font-weight: 900;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.order-card__amount-sub {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}

.order-card__col--status {
  display: flex;
  align-items: center;
  min-width: 0;
}

.order-card__col--payment {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.order-card__payment-method {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.order-card__payment-flags {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.order-card__payment-flags :deep(.el-dropdown) {
  display: inline-flex;
  flex-shrink: 0;
  vertical-align: top;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 3px 7px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.status-pill__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill:hover {
  opacity: 0.85;
}

.status-pill__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-pill__arrow {
  font-size: 12px;
  opacity: 0.7;
}

.status-pill--blue {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}
.status-pill--blue .status-pill__dot { background: #3b82f6; }

.status-pill--amber {
  background: #fffbeb;
  color: #b45309;
  border-color: #fde68a;
}
.status-pill--amber .status-pill__dot { background: #f59e0b; }

.status-pill--green {
  background: #f0fdf4;
  color: #15803d;
  border-color: #bbf7d0;
}
.status-pill--green .status-pill__dot { background: #22c55e; }

.status-pill--red {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}
.status-pill--red .status-pill__dot { background: #ef4444; }

.status-pill--slate {
  background: #f8fafc;
  color: #475569;
  border-color: #e2e8f0;
}
.status-pill--slate .status-pill__dot { background: #94a3b8; }

.flag-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 3px 6px;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.flag-chip:hover {
  opacity: 0.85;
}

.flag-chip__arrow {
  font-size: 11px;
  opacity: 0.65;
  flex-shrink: 0;
}

.flag-chip--yes {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.flag-chip--no {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.flag-chip--neutral {
  background: #f8fafc;
  color: #64748b;
  border-color: #e2e8f0;
}

.order-card__col--actions {
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
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.quick-btn:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.order-card__detail {
  padding: 0 14px 14px;
  border-top: 1px solid var(--el-border-color-extra-light);
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-top: 16px;
}

.detail-panel {
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 14px 16px;
}

.detail-panel h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 800;
  color: #334155;
}

.detail-panel ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.detail-panel li {
  font-size: 13px;
  color: #475569;
  line-height: 1.4;
}

.detail-panel strong {
  color: #94a3b8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-right: 6px;
}

.detail-note {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.detail-note strong {
  display: block;
  font-size: 12px;
  color: #b45309;
  margin-bottom: 4px;
}

.detail-note p {
  margin: 0;
  font-size: 13px;
  color: #78350f;
  white-space: pre-wrap;
}

.detail-products {
  margin-top: 14px;
}

.detail-products h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 800;
  color: #334155;
}

.product-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-row {
  display: grid;
  grid-template-columns: 48px 1fr 60px 100px 130px;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
}

.product-row--pending {
  background: #fff7ed;
  border-color: #fed7aa;
}

.product-row__thumb img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.product-row__name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #1d4ed8;
  text-decoration: none;
}

.product-row__name:hover {
  text-decoration: underline;
}

.product-row__code {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.product-row__qty {
  font-weight: 700;
  color: #334155;
  text-align: center;
}

.product-row__price {
  font-weight: 800;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.product-row__status {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  padding: 4px 8px;
  border-radius: 999px;
}

.product-row__status--ok {
  background: #dcfce7;
  color: #15803d;
}

.product-row__status--wait {
  background: #ffedd5;
  color: #c2410c;
}

.orders-empty {
  text-align: center;
  padding: 48px 24px;
}

.orders-empty__icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.orders-empty h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 800;
  color: #334155;
}

.orders-empty p {
  margin: 0 0 16px;
  color: #94a3b8;
  font-size: 14px;
}

.order-skeleton {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.order-skeleton__avatar {
  width: 36px;
  height: 36px;
}

.order-skeleton__lines {
  flex: 1;
}

.list-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px 10px;
  border-top: 1px solid var(--el-border-color-extra-light);
  flex-shrink: 0;
}

:deep(.el-dropdown-menu__item.is-active) {
  color: #1d4ed8;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .list-head {
    display: none;
  }

  .list-head,
  .order-card__main {
    grid-template-columns:
      minmax(96px, 0.85fr)
      minmax(0, 2fr)
      minmax(72px, 0.65fr)
      minmax(96px, 0.9fr)
      minmax(150px, 1.15fr)
      44px;
  }
}

@media (max-width: 760px) {
  .list-head,
  .order-card__main {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .order-card__col--payment {
    width: 100%;
  }

  .order-card__col--actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}

@media (max-width: 900px) {
  .orders-kpi {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .product-row {
    grid-template-columns: 48px 1fr;
    grid-template-rows: auto auto;
  }

  .product-row__qty,
  .product-row__price,
  .product-row__status {
    grid-column: 2;
  }
}
</style>
