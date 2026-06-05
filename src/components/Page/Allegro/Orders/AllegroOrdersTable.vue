<template>
  <div class="p-3 h-[100%]">
    <div class="bg-[#f1f4f9] p-2 border-t-[3px] border-[#64748b] rounded-t-xl">
      <div class="flex justify-between">
        <div class="flex">
          <span class="flex hover:bg-sky-100 p-1">
            <a @click="openImportDialog" class="rounded-md p-1 text-xs font-semibold">
              Pobierz z Allegro
            </a>
          </span>

          <span class="ml-4 flex hover:bg-sky-100 p-1">
            <a @click="showSelectedOrder" class="rounded-md p-1 text-xs font-semibold">
              Szczegóły zamówienia
            </a>
          </span>

          <span class="ml-4 flex hover:bg-sky-100 p-1">
            <a @click="createLocalOrder" class="rounded-md p-1 text-xs font-semibold">
              Utwórz zamówienie lokalne
            </a>
          </span>

          <span class="ml-4 flex hover:bg-sky-100 p-1">
            <a @click="syncBillingForVisibleOrders" class="rounded-md p-1 text-xs font-semibold">
              Synchronizuj prowizje
            </a>
          </span>
        </div>

        <el-input
          style="border-radius: 1px !important; font-size:12px;"
          placeholder="Szukaj Allegro..."
          v-model="filter.search"
          class="!font-s !w-[240px]"
          @blur="fetchTableData"
        />
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

        <el-table-column label="Checkout ID" width="210" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Checkout ID
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1">
                <el-input
                  placeholder="Szukaj..."
                  class="filter-compact"
                  v-model="filter.search"
                  @blur="fetchTableData"
                />
              </div>
            </div>
          </template>

          <template #default="prop">
            <div class="cell-tight">
              {{ prop.row.checkoutFormId || prop.row.id }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Data" width="150" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Data
              </div>
              <div class="bg-[#e0e8f0] h-[50px] px-1 flex flex-col justify-center gap-[4px]">
                <el-date-picker
                  v-model="filter.from"
                  type="date"
                  placeholder="Od"
                  format="YYYY-MM-DD"
                  class="filter-compact"
                  @change="fetchTableData"
                />
                <el-date-picker
                  v-model="filter.to"
                  type="date"
                  placeholder="Do"
                  format="YYYY-MM-DD"
                  class="filter-compact"
                  @change="fetchTableData"
                />
              </div>
            </div>
          </template>

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

          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Kupujący
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1">
                <el-input
                  placeholder="Szukaj..."
                  class="filter-compact"
                  v-model="filter.search"
                  @blur="fetchTableData"
                />
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Dostawa" label-class-name="order_label">
          <template #default="{ row }">
            <div class="cell-tight">
              {{ row.deliveryMethod || row.deliveryMethodName || '-' }}
            </div>
          </template>

          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Dostawa
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Kwota" width="120" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Kwota
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

          <template #default="prop">
            {{ formatPrice(prop.row.totalAmount || prop.row.amount || prop.row.orderTotal || prop.row.totalToPay) }}
          </template>
        </el-table-column>

        <el-table-column label="Prowizja" width="100" label-class-name="order_label">
          <template #default="prop">
            {{ formatPrice(prop.row.commissionAmount) }}
          </template>
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Prowizja
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Zysk" width="100" label-class-name="order_label">
          <template #default="prop">
            <span :class="profitClass(prop.row.netProfitAmount)">
              {{ formatPrice(prop.row.netProfitAmount) }}
            </span>
          </template>
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Zysk
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Status Allegro" width="180" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Status Allegro
              </div>
              <div class="bg-[#e0e8f0] h-[50px] py-2 px-2 block">
                <el-select
                  v-model="filter.status"
                  clearable
                  class="filter-compact"
                  placeholder="Status"
                  @change="fetchTableData"
                >
                  <el-option label="Nowe" value="READY_FOR_PROCESSING" />
                  <el-option label="Anulowane" value="CANCELLED" />
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

        <el-table-column label="Realizacja" width="180" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Realizacja
              </div>
              <div class="bg-[#e0e8f0] h-[50px] py-2 px-2 block">
                <el-select
                  v-model="filter.fulfillmentStatus"
                  clearable
                  class="filter-compact"
                  placeholder="Realizacja"
                  @change="fetchTableData"
                >
                  <el-option label="Nowe" value="NEW" />
                  <el-option label="W trakcie" value="PROCESSING" />
                  <el-option label="Wysłane" value="SENT" />
                  <el-option label="Anulowane" value="CANCELLED" />
                </el-select>
              </div>
            </div>
          </template>

          <template #default="prop">
            <el-tag>
              {{ prop.row.fulfillmentStatus || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Lokalne" width="120" label-class-name="order_label">
          <template #header>
            <div class="header-content">
              <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">
                Lokalne
              </div>
              <div class="search-row search-row--compact bg-[#e0e8f0] h-[50px] flex items-center px-1"></div>
            </div>
          </template>

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
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const selectedRow = ref<any>(null)
const selectedRowId = ref<string | null>(null)
const importDialogVisible = ref(false)
const importing = ref(false)

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

const filter = ref({
  sandbox: null as boolean | null,
  status: null as string | null,
  fulfillmentStatus: null as string | null,
  search: null as string | null,
  from: null as string | null,
  to: null as string | null,
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

const fetchTableData = async () => {
  try {
    const result = await Api.allegro.getImportedOrders(
      filter.value.sandbox,
      filter.value.status,
      filter.value.fulfillmentStatus,
      filter.value.search,
      filter.value.page,
      filter.value.pageSize
    )

    dataTable.value = normalizeTableResult(result)
  } catch (error) {
    console.error(error)
    toast.error('Wystąpił problem z pobraniem zamówień Allegro')
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
    await fetchTableData()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać zamówień z Allegro')
  } finally {
    importing.value = false
  }
}

const showSelectedOrder = () => {
  if (!selectedRow.value) {
    toast.warning('Wybierz zamówienie Allegro')
    return
  }

  const checkoutFormId = selectedRow.value.checkoutFormId || selectedRow.value.id
  router.push(`/allegro/orders/${checkoutFormId}`)
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

  router.replace({
    query: {
      ...route.query,
      page: String(page)
    }
  })

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

.search-row .el-input__wrapper {
  border-radius: 0px 15px 15px 0px !important;
  padding: 0px;
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

.filter-compact {
  width: 100% !important;
}

.filter-compact .el-input__wrapper,
.filter-compact.el-date-editor .el-input__wrapper,
.filter-compact.el-select .el-input__wrapper,
.filter-compact.el-input-number .el-input__wrapper {
  height: 22px !important;
  min-height: 22px !important;
  padding: 0 8px !important;
}

.filter-compact .el-input__inner,
.filter-compact.el-date-editor .el-input__inner,
.filter-compact.el-select .el-input__inner {
  height: 22px !important;
  line-height: 22px !important;
  font-size: 11px !important;
}

.filter-compact.el-date-editor .el-range-input {
  font-size: 11px !important;
  line-height: 22px !important;
}

.filter-compact.el-input-number {
  height: 22px !important;
}

.filter-compact.el-input-number .el-input-number__increase,
.filter-compact.el-input-number .el-input-number__decrease {
  display: none !important;
}

.filter-compact .el-input__prefix {
  margin-right: 4px !important;
}

.filter-compact .el-input__icon,
.filter-compact .el-select__caret {
  font-size: 14px !important;
}
</style>