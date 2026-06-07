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
            <el-col :span="3">
              <label class="filter-label">Nr zamówienia</label>
              <el-input v-model="filter.numberOrder" placeholder="Nr..." clearable @keyup.enter="applyFilters" />
            </el-col>

            <el-col :span="4">
              <label class="filter-label">Produkt / kod</label>
              <el-input v-model="filter.productName" placeholder="Nazwa lub kod..." clearable @keyup.enter="applyFilters" />
            </el-col>

            <el-col :span="4">
              <label class="filter-label">Dane klienta</label>
              <el-input v-model="filter.clientData" placeholder="Imię, firma, NIP..." clearable @keyup.enter="applyFilters" />
            </el-col>

            <el-col :span="4">
              <label class="filter-label">Adres wysyłki</label>
              <el-input v-model="filter.shipmentData" placeholder="Adres, miasto..." clearable @keyup.enter="applyFilters" />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Data od</label>
              <el-date-picker
                v-model="filter.dateFrom"
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
                v-model="filter.dateTo"
                type="date"
                placeholder="Do"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="!w-full"
                clearable
              />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Status</label>
              <el-select v-model="filter.orderStatus" clearable placeholder="Wszystkie" class="!w-full">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-col>
          </el-row>

          <el-row :gutter="12" class="mt-3">
            <el-col :span="3">
              <label class="filter-label">Kwota od</label>
              <el-input-number v-model="filter.amountMin" :controls="false" :precision="2" class="!w-full" />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Kwota do</label>
              <el-input-number v-model="filter.amountMax" :controls="false" :precision="2" class="!w-full" />
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Opłacone</label>
              <el-select v-model="filter.isPaid" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Tak" :value="true" />
                <el-option label="Nie" :value="false" />
              </el-select>
            </el-col>

            <el-col :span="3">
              <label class="filter-label">Faktura</label>
              <el-select v-model="filter.sendInvoice" clearable placeholder="Wszystkie" class="!w-full">
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
          <svg xmlns="http://www.w3.org/2000/svg" class="m-auto text-green-500" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M11 13v3q0 .425.288.713T12 17t.713-.288T13 16v-3h3q.425 0 .713-.288T17 12t-.288-.712T16 11h-3V8q0-.425-.288-.712T12 7t-.712.288T11 8v3H8q-.425 0-.712.288T7 12t.288.713T8 13zm1 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
          <router-link :to="'/sale/order/createorder'" class="rounded-md p-1 text-xs font-semibold">Dodaj zamówienie</router-link>
        </span>

        <span class="ml-4 flex hover:bg-sky-100 p-1">
          <a @click="editSelectedRecord" class="rounded-md p-1 text-xs font-semibold cursor-pointer">Edytuj zamówienie</a>
        </span>

        <span class="ml-4 flex hover:bg-sky-100 p-1">
          <a @click="invoiceGenerate" class="rounded-md p-1 text-xs font-semibold cursor-pointer">Generuj fakturę</a>
        </span>

        <span class="ml-4 flex hover:bg-sky-100 p-1">
          <a @click="openExistingInvoiceModal" class="rounded-md p-1 text-xs font-semibold cursor-pointer">
            Dodaj istniejącą fakturę
          </a>
        </span>
      </div>
    </div>

    <div class="table-container">
      <el-table
        class="pt-[1px] !bg-[#d6dfe9]"
        ref="table"
        :data="dataTable.items"
        :row-key="row_key"
        @row-click="handleRowClick"
        @row-dblclick="showOrderHandle"
        :border="true"
        style="width: 100%; min-height: 81vh;"
        :row-class-name="rowClassName"
        :cell-style="cellStyle"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="">
              <div class="flex w-full gap-[30%] p-2">
                <div>
                  <span class="font-bold text-base">Dane Klienta</span>
                  <p v-show="props.row.billingAddress.companyName">Firma: {{ props.row.billingAddress.companyName }}</p>
                  <p v-show="props.row.billingAddress.nip">Nip: {{ props.row.billingAddress.nip }}</p>
                  <p>
                    Imię i nazwisko:
                    {{ props.row.billingAddress.firstName + ' ' + props.row.billingAddress.lastName }}
                  </p>
                  <p>Adres: {{ props.row.billingAddress.addressLine1 }}</p>
                  <p>Kod pocztowy: {{ props.row.billingAddress.zipCode }}</p>
                  <p>Miasto: {{ props.row.billingAddress.city }}</p>
                  <p>Email: {{ props.row.billingAddress.email }}</p>
                  <p>Telefon: {{ props.row.billingAddress.phone }}</p>
                </div>

                <div>
                  <span class="font-bold text-base">Dane Wysyłki</span>
                  <p v-show="props.row.shippingAddress.companyName">Firma: {{ props.row.shippingAddress.companyName }}</p>
                  <p>
                    Imię i nazwisko:
                    {{ props.row.shippingAddress.firstName + ' ' + props.row.shippingAddress.lastName }}
                  </p>
                  <p>Adres: {{ props.row.shippingAddress.addressLine1 }}</p>
                  <p>Kod pocztowy: {{ props.row.shippingAddress.zipCode }}</p>
                  <p>Miasto: {{ props.row.shippingAddress.city }}</p>
                  <p>Telefon: {{ props.row.shippingAddress.phone }}</p>
                </div>

                <div>
                  <span class="font-bold text-base">Pozostałe dane</span>
                  <p>Płatność: {{ translatePaymentProvider(props.row.payment) }}</p>
                  <p>Numer Faktury: {{ props.row.invoiceNumber }}</p>
                  <p>Numer Proformy: {{ props.row.proformaNumber }}</p>
                </div>
              </div>

              <div class="px-8 flex gap-5 my-5">
                <strong>Informacje dodatkowe: </strong>
                <p class="w-[75%] text-wrap">{{ props.row.orderNote }}</p>
              </div>

              <div class="table__product py-4 px-8">
                <el-table :data="props.row.orderItems" :border="true" :cell-style="styleProductTable">
                  <el-table-column label="Zdjęcie" width="120">
                    <template #default="prop">
                      <a :href="'https://olmag.pl/' + prop.row.slug" target="_blank">
                        <img :src="prop.row.productImage" class="object-contain w-[40px] h-[40px] m-auto" />
                      </a>
                    </template>
                  </el-table-column>
                  <el-table-column label="Nazwa produktu" prop="productName">
                    <template #default="prop">
                      <a :href="'https://olmag.pl/' + prop.row.slug" target="_blank">{{ prop.row.productName }}</a>
                    </template>
                  </el-table-column>
                  <el-table-column label="Data zamówienia" width="140" prop="itemOrderedFromManufacturerDate">
                    <template #default="scope">
                      <span>
                        {{ scope.row.itemOrderedFromManufacturerDate
                          ? new Date(scope.row.itemOrderedFromManufacturerDate).toLocaleDateString('pl-PL')
                          : '—' }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Ilość" width="70" prop="quantity" />
                  <el-table-column label="Kod" width="140" prop="identificationCode" />
                  <el-table-column label="Cena producenta" width="140">
                    <template #default="prop">
                      <span>{{ prop.row.producerPrice }} zł</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Cena produktu" width="140">
                    <template #default="prop">
                      <span>{{ prop.row.productPrice }} zł</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Nr. zam." prop="numberOrder" width="130" label-class-name="order_label" />
        <el-table-column label="Data" width="140" label-class-name="order_label">
          <template #default="prop">{{ formatDate(prop.row.createdOn) }}</template>
        </el-table-column>
        <el-table-column label="Dane klienta" prop="billingData" label-class-name="order_label">
          <template #default="{ row }">
            <div class="cell-tight">{{ row.billingData }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Adres wysyłki" prop="shippingData" label-class-name="order_label">
          <template #default="{ row }">
            <div class="cell-tight">{{ row.shippingData }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Informacje dodatkowe" width="90" label-class-name="order_label">
          <template #default="prop">
            <el-row class="justify-center">
              <div class="text-center">
                <span class="font-bold cursor-pointer" v-if="prop.row.orderNote">Sprwadź</span>
                <span v-else>-</span>
              </div>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column label="Kwota" prop="orderTotal" width="120" label-class-name="order_label" />
        <el-table-column label="Status" width="200" label-class-name="order_label">
          <template #default="prop">
            <el-row class="justify-center">
              <el-select
                v-model="prop.row.orderStatus"
                class="filter-compact"
                placeholder="Select"
                @change="handleChangeStatus($event, prop.row.id)"
              >
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column label="Opłacone" width="120" label-class-name="order_label">
          <template #default="prop">
            <el-row class="justify-center">
              <el-select
                v-model="prop.row.isPaid"
                @change="handleChangePaid(prop.row.isPaid, prop.row.id)"
                class="filter-compact"
                placeholder="Select"
                :class="`${prop.row.isPaid ? 'paid' : 'notpaid'}`"
              >
                <el-option label="Tak" :value="true" />
                <el-option label="Nie" :value="false" />
              </el-select>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column label="Faktura" width="120" label-class-name="order_label">
          <template #default="prop">
            <el-row class="justify-center">
              <el-select
                v-model="prop.row.sendInvoice"
                @change="handleChangeSendInvoice(prop.row.sendInvoice, prop.row.id)"
                class="filter-compact"
                placeholder="Select"
                :class="`${prop.row.sendInvoice ? 'paid' : 'notpaid'}`"
              >
                <el-option label="Tak" :value="true" />
                <el-option label="Nie" :value="false" />
              </el-select>
            </el-row>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-pagination
      background
      layout="prev, pager, next"
      :current-page="filter.pageNumber"
      :page-size="filter.pageSize"
      :total="dataTable.totalCount"
      @current-change="handlePageChange"
      class="m-2"
    />
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import { useOrderStore } from '/@/stores/order'
import { useInvoiceStore } from '/@/stores/invoice'
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

enum PaymentProvider {
  Przelewy24 = 0,
  StandardTransfer = 1,
  CashOnDelivery = 2,
  PayPo = 3,
  Blik = 4,
  Term = 5
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
const invoiceStore = useInvoiceStore()
const order = useOrderStore()
const table = ref(null)
const filtersExpanded = ref<string[]>(['filters'])
const isSyncingFromRoute = ref(false)

const dataTable = ref<any>({
  items: [],
  totalCount: 0,
  pageNumber: 1
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
  pageSize: 15
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
    pageSize: parseQueryNumber(route.query, 'pageSize', 15) || 15
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

function row_key(row: any) {
  return row.id
}

const handleRowClick = (row: any) => {
  selectedRowId.value = row.id
  selectedRow.value = row
}

const rowClassName = ({ row }: any) => {
  return row.id === selectedRowId.value ? 'selected-row' : ''
}

const editSelectedRecord = () => {
  if (selectedRow.value) {
    router.push({
      path: `/sale/order/edit/${selectedRow.value.id}`,
      query: route.query
    })
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

const formatDate = (dateIso: string) => {
  const date = new Date(dateIso)
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  })
}

const fetchTableData = async () => {
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
        orderStatus: item.orderStatus > 0 ? item.orderStatus : OrderStatus.New
      }))
    }

    dataTable.value = tableData
  } catch (error) {
    console.error('Błąd podczas pobierania danych:', error)
    toast.error('Wystąpił problem z pobraniem danych')
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
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const clearFilters = async () => {
  filter.value = {
    ...createDefaultFilters(),
    pageNumber: 1,
    pageSize: filter.value.pageSize
  }
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const handlePageChange = async (page: number) => {
  filter.value.pageNumber = page
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const handleChangeStatus = async (status: number, orderId: string) => {
  const payload = {
    body: JSON.stringify({ orderStatus: status, orderId })
  }
  await Api.orders.changeOrderStatus(payload)
  toast.success('Zmieniono status zamówienia')
}

const showOrderHandle = async () => {
  await order.showOrder(selectedRowId.value)
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
  toast.success('Faktura wysłana')
}

function translatePaymentProvider(value: number): string | null {
  switch (value) {
    case PaymentProvider.Przelewy24:
      return 'Przelewy24'
    case PaymentProvider.StandardTransfer:
      return 'Przelew Standardowy'
    case PaymentProvider.CashOnDelivery:
      return 'Płatność przy odbiorze'
    case PaymentProvider.PayPo:
      return 'PayPo'
    case PaymentProvider.Blik:
      return 'Blik'
    case PaymentProvider.Term:
      return 'Termin'
    default:
      return null
  }
}

const cellStyle = ({ row, column }: any) => {
  if (column.type === 'expand') {
    const allOrdered = row.orderItems.every((item: any) => item.itemOrderedFromManufacturer === true)
    if (!allOrdered) return { backgroundColor: '#FF6600' }
    return { backgroundColor: '#4ade80' }
  }
  return {}
}

const styleProductTable = ({ row }: any) => {
  if (!row.itemOrderedFromManufacturer) {
    return { backgroundColor: '#FF6600' }
  }
  return { backgroundColor: '#4ade80' }
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

.paid .el-input__wrapper {
  background: #4ade80;
}

.notpaid .el-input__wrapper {
  background: #dc2626;
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
  margin-top: 1px;
}

.selected-row {
  background-color: #cce7ff !important;
}

.el-table .cell {
  font-size: 11px;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.filter-compact {
  width: 100% !important;
}

.filter-compact .el-input__wrapper,
.filter-compact.el-select .el-input__wrapper {
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
</style>
