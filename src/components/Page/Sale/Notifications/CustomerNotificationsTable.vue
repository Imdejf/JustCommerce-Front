<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

type NotificationRow = {
  id: string
  orderId: string
  orderNumber: string
  customerEmail: string
  customerName?: string | null
  channel: string
  notificationType: string
  deliveryStatus: string
  previousOrderStatus?: number | null
  newOrderStatus?: number | null
  subject?: string | null
  skipReason?: string | null
  errorMessage?: string | null
  createdAtUtc: string
  deliveredAtUtc?: string | null
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const rows = ref<NotificationRow[]>([])
const totalCount = ref(0)
const page = ref(Number(route.query.page ?? 1) || 1)
const pageSize = ref(50)

const filter = ref({
  search: (route.query.search as string) || '',
  customerEmail: (route.query.customerEmail as string) || '',
  deliveryStatus: (route.query.deliveryStatus as string) || '',
  orderId: (route.query.orderId as string) || ''
})

const orderStatusLabels: Record<number, string> = {
  1: 'Nowe',
  10: 'Wstrzymane',
  20: 'W realizacji',
  30: 'Wysłane',
  40: 'Zakończone',
  50: 'Anulowane'
}

const deliveryStatusOptions = [
  { value: '', label: 'Wszystkie' },
  { value: 'Skipped', label: 'Pominięte' },
  { value: 'Queued', label: 'W kolejce' },
  { value: 'Sent', label: 'Wysłane' },
  { value: 'Failed', label: 'Błąd' }
]

const pageCount = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const statusLabel = (value?: number | null) => {
  if (!value) return '—'
  return orderStatusLabels[value] ?? String(value)
}

const deliveryTone = (status: string) => {
  switch (status) {
    case 'Sent': return 'sent'
    case 'Queued': return 'queued'
    case 'Skipped': return 'skipped'
    case 'Failed': return 'failed'
    default: return 'neutral'
  }
}

const deliveryLabel = (status: string) => {
  switch (status) {
    case 'Sent': return 'Wysłane'
    case 'Queued': return 'W kolejce'
    case 'Skipped': return 'Pominięte'
    case 'Failed': return 'Błąd'
    default: return status
  }
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('pl-PL')
}

const syncRoute = async () => {
  const query: Record<string, string> = {}
  if (filter.value.search) query.search = filter.value.search
  if (filter.value.customerEmail) query.customerEmail = filter.value.customerEmail
  if (filter.value.deliveryStatus) query.deliveryStatus = filter.value.deliveryStatus
  if (filter.value.orderId) query.orderId = filter.value.orderId
  if (page.value > 1) query.page = String(page.value)
  await router.replace({ query })
}

const fetchRows = async () => {
  loading.value = true
  try {
    const response = await Api.customerNotifications.getLogs({
      search: filter.value.search || undefined,
      customerEmail: filter.value.customerEmail || undefined,
      deliveryStatus: filter.value.deliveryStatus || undefined,
      orderId: filter.value.orderId || undefined,
      page: page.value,
      pageSize: pageSize.value
    })

    const data = response?.data ?? response
    rows.value = data?.items ?? []
    totalCount.value = data?.totalCount ?? 0
  } catch {
    toast.error('Nie udało się pobrać powiadomień klientów')
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => {
  page.value = 1
  await syncRoute()
  await fetchRows()
}

const changePage = async (nextPage: number) => {
  page.value = nextPage
  await syncRoute()
  await fetchRows()
}

onMounted(fetchRows)

watch(
  () => route.query.orderId,
  (orderId) => {
    filter.value.orderId = String(orderId ?? '')
    page.value = 1
    fetchRows()
  }
)
</script>

<template>
  <div class="notifications-page">
    <div class="notifications-page__header">
      <div>
        <h1 class="notifications-page__title">Powiadomienia klientów</h1>
        <p class="notifications-page__subtitle">
          Historia e-maili wysłanych lub pominiętych przy zmianie statusu zamówienia.
        </p>
      </div>
      <div class="notifications-page__count">{{ totalCount }} wpisów</div>
    </div>

    <div class="notifications-page__filters">
      <el-input v-model="filter.search" clearable placeholder="Szukaj: numer, e-mail, temat, powód" class="filter-item filter-item--wide" />
      <el-input v-model="filter.customerEmail" clearable placeholder="E-mail klienta" class="filter-item" />
      <el-input v-model="filter.orderId" clearable placeholder="ID zamówienia (GUID)" class="filter-item filter-item--wide" />
      <el-select v-model="filter.deliveryStatus" clearable placeholder="Status dostarczenia" class="filter-item">
        <el-option v-for="option in deliveryStatusOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
      <el-button type="primary" :loading="loading" @click="applyFilters">Filtruj</el-button>
    </div>

    <div v-loading="loading" class="notifications-page__table-wrap">
      <table class="notifications-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Zamówienie</th>
            <th>Klient</th>
            <th>Status zamówienia</th>
            <th>Temat / powód</th>
            <th>Dostarczenie</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>
              <div class="cell-main">{{ formatDate(row.createdAtUtc) }}</div>
              <div v-if="row.deliveredAtUtc" class="cell-sub">Dostarczono: {{ formatDate(row.deliveredAtUtc) }}</div>
            </td>
            <td>
              <RouterLink :to="`/sale/order/${row.orderNumber}`" class="order-link">
                {{ row.orderNumber }}
              </RouterLink>
            </td>
            <td>
              <div class="cell-main">{{ row.customerEmail }}</div>
              <div v-if="row.customerName" class="cell-sub">{{ row.customerName }}</div>
            </td>
            <td>
              <div class="cell-main">{{ statusLabel(row.previousOrderStatus) }} → {{ statusLabel(row.newOrderStatus) }}</div>
            </td>
            <td>
              <div v-if="row.subject" class="cell-main">{{ row.subject }}</div>
              <div v-if="row.skipReason" class="cell-sub cell-sub--warn">{{ row.skipReason }}</div>
              <div v-if="row.errorMessage" class="cell-sub cell-sub--error">{{ row.errorMessage }}</div>
            </td>
            <td>
              <span class="status-chip" :class="`status-chip--${deliveryTone(row.deliveryStatus)}`">
                {{ deliveryLabel(row.deliveryStatus) }}
              </span>
            </td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="6" class="empty-row">Brak powiadomień dla wybranych filtrów.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pageCount > 1" class="notifications-page__pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :total="totalCount"
        @current-change="changePage"
      />
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  padding: 24px;
}

.notifications-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.notifications-page__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.notifications-page__subtitle {
  margin: 6px 0 0;
  color: #64748b;
}

.notifications-page__count {
  padding: 8px 14px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
}

.notifications-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-item {
  width: 220px;
}

.filter-item--wide {
  width: 320px;
}

.notifications-page__table-wrap {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

.notifications-table {
  width: 100%;
  border-collapse: collapse;
}

.notifications-table th,
.notifications-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.notifications-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.cell-main {
  color: #0f172a;
  font-weight: 500;
}

.cell-sub {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.cell-sub--warn {
  color: #b45309;
}

.cell-sub--error {
  color: #b91c1c;
}

.order-link {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.order-link:hover {
  text-decoration: underline;
}

.status-chip {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-chip--sent { background: #dcfce7; color: #166534; }
.status-chip--queued { background: #e0f2fe; color: #0369a1; }
.status-chip--skipped { background: #f1f5f9; color: #475569; }
.status-chip--failed { background: #fee2e2; color: #b91c1c; }
.status-chip--neutral { background: #f8fafc; color: #64748b; }

.empty-row {
  text-align: center;
  color: #64748b;
  padding: 28px !important;
}

.notifications-page__pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
