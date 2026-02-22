<template>
  <div class="p-3 h-[100%]">
    <!-- GÓRA: przełączniki providera + filtr -->
    <div class="bg-[#f1f4f9] p-2 border-t-[3px] border-[#64748b] rounded-t-xl">
      <div class="flex items-center justify-between gap-3">
        <div class="flex gap-2">
          <button
            class="px-3 py-1 text-xs font-semibold rounded-md border"
            :class="provider === ShipmentProvider.Geodis ? 'bg-sky-200 border-sky-400' : 'bg-white border-[#d6dfe9]'"
            @click="setProvider(ShipmentProvider.Geodis)"
          >
            GEODIS
          </button>

          <button
            class="px-3 py-1 text-xs font-semibold rounded-md border"
            :class="provider === ShipmentProvider.Dpd ? 'bg-sky-200 border-sky-400' : 'bg-white border-[#d6dfe9]'"
            @click="setProvider(ShipmentProvider.Dpd)"
          >
            DPD
          </button>

          <button
            class="px-3 py-1 text-xs font-semibold rounded-md border"
            :class="provider === ShipmentProvider.Gls ? 'bg-sky-200 border-sky-400' : 'bg-white border-[#d6dfe9]'"
            @click="setProvider(ShipmentProvider.Gls)"
          >
            GLS
          </button>

          <button
            class="px-3 py-1 text-xs font-semibold rounded-md border"
            :class="provider === ShipmentProvider.Jas ? 'bg-sky-200 border-sky-400' : 'bg-white border-[#d6dfe9]'"
            @click="setProvider(ShipmentProvider.Jas)"
          >
            JAS
          </button>

          <button
            class="px-3 py-1 text-xs font-semibold rounded-md border"
            :class="provider === ShipmentProvider.Unknown ? 'bg-sky-200 border-sky-400' : 'bg-white border-[#d6dfe9]'"
            @click="setProvider(ShipmentProvider.Unknown)"
          >
            WSZYSTKO
          </button>
        </div>

        <div class="flex items-center gap-2">
          <el-input
            class="!w-[320px]"
            style="border-radius: 1px !important; font-size:12px;"
            placeholder="Szukaj tracking / nr zamówienia"
            v-model="quickSearch"
            @keyup.enter="applyQuickSearch"
            @blur="applyQuickSearch"
          />
        </div>
      </div>

      <!-- AKCJE ZAZNACZENIA -->
      <div class="mt-2 flex items-center gap-2">
        <el-button
          size="small"
          type="primary"
          :disabled="selectedRows.length === 0"
          @click="downloadSelectedLabels"
        >
          Pobierz etykiety (ZIP) — {{ selectedRows.length }}
        </el-button>

        <el-button
          size="small"
          type="success"
          :disabled="selectedRows.length === 0"
          @click="generateLabelsForSelected"
        >
          Wygeneruj etykiety dla zaznaczonych
        </el-button>

        <el-button
          size="small"
          :disabled="selectedRows.length === 0"
          @click="clearSelection"
        >
          Wyczyść zaznaczenie
        </el-button>

        <el-button
          size="small"
          type="warning"
          :disabled="selectedRows.length === 0"
          @click="confirmSelectedShipments"
        >
          Zatwierdź przesyłki
        </el-button>

        <div class="ml-auto text-xs text-slate-600">
          Zaznaczone: <b>{{ selectedRows.length }}</b>
        </div>
      </div>
    </div>

    <!-- TABELA -->
    <div class="table-container">
      <el-table
        ref="tableRef"
        class="pt-[1px] !bg-[#d6dfe9]"
        :data="dataTable.items"
        :row-key="row_key"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        :border="true"
        style="width: 100%; min-height: 81vh;"
        :row-class-name="rowClassName"
      >
        <!-- ✅ CHECKBOXY -->
        <el-table-column type="selection" width="48" />

        <el-table-column label="Data" prop="createdOn" width="160">
          <template #default="scope">
            {{ formatDate(scope.row.createdOn) }}
          </template>
        </el-table-column>

        <el-table-column label="Provider" prop="provider" width="90">
          <template #default="scope">
            <span class="text-xs font-bold">
              {{ providerLabel(scope.row.provider) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Nr zam." prop="orderNumber" width="150" />

        <el-table-column label="Tracking" prop="trackingNumber" width="220">
          <template #default="scope">
            <span v-if="scope.row.trackingNumber" class="font-mono text-xs">
              {{ scope.row.trackingNumber }}
            </span>
            <span v-else class="text-xs text-slate-400">—</span>
          </template>
        </el-table-column>

        <el-table-column label="Oddział/Branch" prop="branch" width="180">
          <template #default="scope">
            <span class="text-xs">{{ scope.row.branch ?? '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Magazyn" prop="warehouseName" width="220">
          <template #default="scope">
            <span class="text-xs">{{ scope.row.warehouseName ?? '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Adres dostawy" prop="deliveryAddressLine" min-width="320">
          <template #default="scope">
            <span class="text-xs">{{ scope.row.deliveryAddressLine ?? '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="COD" prop="cashOnDelivery" width="80" align="center">
          <template #default="scope">
            <span
              class="text-xs font-bold"
              :class="scope.row.cashOnDelivery ? 'text-orange-600' : 'text-slate-400'"
            >
              {{ scope.row.cashOnDelivery ? 'TAK' : 'NIE' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Do pobrania" prop="amountPayable" width="120" align="right">
          <template #default="scope">
            <span class="text-xs font-bold">
              {{ formatMoney(scope.row.amountPayable) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Manual" prop="isManual" width="80" align="center">
          <template #default="scope">
            <span class="text-xs" :class="scope.row.isManual ? 'text-purple-600 font-bold' : 'text-slate-400'">
              {{ scope.row.isManual ? 'TAK' : 'NIE' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Potw." prop="confirmOrder" width="80" align="center">
          <template #default="scope">
            <span class="text-xs" :class="scope.row.confirmOrder ? 'text-green-600 font-bold' : 'text-slate-400'">
              {{ scope.row.confirmOrder ? 'TAK' : 'NIE' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Akcje" width="210" fixed="right">
          <template #default="scope">
            <div class="flex gap-2">
              <el-button size="small" @click="copyTracking(scope.row.trackingNumber)">
                Kopiuj
              </el-button>

              <el-button
                size="small"
                type="primary"
                :disabled="!scope.row.orderId"
                @click="downloadSingleLabel(scope.row.orderId)"
              >
                ZIP
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click.stop="removeShipment(scope.row)"
              >
                Usuń
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- PAGINACJA -->
    <el-pagination
      background
      layout="prev, pager, next"
      :current-page="filter.PageNumber"
      :page-size="filter.PageSize"
      :total="dataTable.totalCount"
      @current-change="handlePageChange"
      class="m-2"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import { useToast } from 'vue-toastification'
import { Api } from '/@/services/api'
import jwt_decode from 'jwt-decode'

enum ShipmentProvider {
  Unknown = 0,
  Dpd = 1,
  Geodis = 2,
  Gls = 3,
  Jas = 4
}

const toast = useToast()
const cookies = new Cookies()

const provider = ref<ShipmentProvider>(ShipmentProvider.Geodis)
const quickSearch = ref('')

const selectedRow = ref<any>(null)
const selectedRowId = ref<string | null>(null)

/** ✅ zaznaczone wiersze (pod ZIP / akcje) */
const selectedRows = ref<any[]>([])

/** ✅ ref do tabeli (żeby czyścić zaznaczenie) */
const tableRef = ref<any>(null)

const dataTable = ref<any>({
  items: [],
  totalCount: 0,
  pageNumber: 1
})

const filter = ref<any>({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 20,
  ShipmentProvider: provider.value,
  SmartTableParam: {
    Search: {
      PredicateObject: {
        TrackingNumber: null,
        OrderNumber: null,
        CreatedOn: null
      }
    }
  }
})


const getUserIdFromToken = () => {
  const token = cookies.get('Authorization')
  const decoded: any = token ? jwt_decode(token) : null
  return decoded?.UserId
}

const confirmSelectedShipments = async () => {
  try {
    if (!selectedRows.value.length) {
      toast.warning('Zaznacz przynajmniej 1 przesyłkę')
      return
    }

    if (provider.value === ShipmentProvider.Unknown) {
      toast.warning('Wybierz providera (Release jest per przewoźnik).')
      return
    }

    const userId = getUserIdFromToken()
    if (!userId) {
      toast.error('Brak userId w tokenie')
      return
    }

    const shipmentNumbers = Array.from(new Set(
      selectedRows.value
        .map((r: any) => (r.trackingNumber ?? '').toString().trim())
        .filter((x: string) => !!x)
    ))

    if (!shipmentNumbers.length) {
      toast.warning('Zaznaczone wiersze nie mają trackingów (LP)')
      return
    }

    const payloadObj = {
      userId,
      provider: provider.value,
      shipmentNumbers,
      reportDate: null
    }

    await Api.shipping.releaseShipments({ body: JSON.stringify(payloadObj) })

    toast.success(`Wydano przesyłki: ${shipmentNumbers.length}`)
    await fetchTableData()
    clearSelection()
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się wydać przesyłek')
  }
}


const removeShipment = async (row: any) => {
  try {
    const userId = getUserIdFromToken()
    if (!userId) {
      toast.error('Brak userId w tokenie')
      return
    }

    const shipmentId = row?.id
    if (!shipmentId) {
      toast.error('Brak shipmentId')
      return
    }

    // (opcjonalnie) proste potwierdzenie
    if (!confirm(`Usunąć przesyłkę ${row?.trackingNumber ?? ''}?`)) return

    await Api.shipping.deleteShipment({
      body: JSON.stringify({ userId, shipmentId })
    })

    toast.success('Usunięto przesyłkę')
    await fetchTableData()
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się usunąć przesyłki')
  }
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

const formatDate = (dateIso: string) => {
  if (!dateIso) return '—'
  const d = new Date(dateIso)
  return d.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  } as any)
}

const formatMoney = (v: any) => {
  const n = Number(v ?? 0) || 0
  return `${n.toFixed(2)} zł`
}

const providerLabel = (p: number) => {
  switch (p) {
    case ShipmentProvider.Dpd: return 'DPD'
    case ShipmentProvider.Geodis: return 'Geodis'
    case ShipmentProvider.Gls: return 'GLS'
    case ShipmentProvider.Jas: return 'JAS'
    default: return '—'
  }
}

const fetchTableData = async () => {
  try {
    filter.value.ShipmentProvider = provider.value

    const payload = { body: JSON.stringify(filter.value) }
    const result = await Api.shipping.smartTableShipment(payload)

    dataTable.value = result.data

    // po odświeżeniu danych czyścimy zaznaczenie (bo zmienia się lista)
    clearSelection()
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać przesyłek')
  }
}

const setProvider = async (p: ShipmentProvider) => {
  provider.value = p
  filter.value.PageNumber = 1
  await fetchTableData()
}

const applyQuickSearch = async () => {
  const s = (quickSearch.value ?? '').trim()
  filter.value.PageNumber = 1

  // w prosty sposób wpis działa na oba pola (jak u Ciebie)
  filter.value.SmartTableParam.Search.PredicateObject.TrackingNumber = s || null
  filter.value.SmartTableParam.Search.PredicateObject.OrderNumber = s || null

  await fetchTableData()
}

const handlePageChange = async (page: number) => {
  filter.value.PageNumber = page
  await fetchTableData()
}

const copyTracking = async (tracking: string) => {
  try {
    await navigator.clipboard.writeText(tracking ?? '')
    toast.success('Skopiowano')
  } catch {
    toast.warning('Nie udało się skopiować')
  }
}

/** checkboxy: aktualizacja zaznaczenia */
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows ?? []
}

/** wyczyść zaznaczenie w UI + stanie */
const clearSelection = () => {
  selectedRows.value = []
  if (tableRef.value?.clearSelection) tableRef.value.clearSelection()
}

/** pobierz ZIP etykiet dla zaznaczonych orderów */
const downloadSelectedLabels = async () => {
  try {
    if (!selectedRows.value.length) {
      toast.warning('Zaznacz przynajmniej 1 przesyłkę')
      return
    }

    const orderIds = selectedRows.value
      .map((r: any) => r.orderId ?? r.OrderId)
      .filter(Boolean)

    if (!orderIds.length) {
      toast.error('Brak OrderId w danych przesyłek (DTO musi zwracać OrderId)')
      return
    }

    await Api.shipping.getLabelsZip({ body: JSON.stringify({ orderIds }) })
    toast.success('Pobrano etykiety')
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać etykiet')
  }
}

/** pobierz ZIP dla pojedynczego zamówienia */
const downloadSingleLabel = async (orderId: string) => {
  try {
    await Api.shipping.getLabelsZip({ body: JSON.stringify({ orderIds: [orderId] }) })
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać etykiety')
  }
}

/**
 * ✅ Wygeneruj etykiety dla zaznaczonych
 * - sensowna logika: generuj tylko tam gdzie NIE MA trackingNumber albo jest manual
 * - UWAGA: to zadziała tylko, jeśli backend umie stworzyć przesyłkę na bazie samego OrderId
 */
const generateLabelsForSelected = async () => {
  try {
    if (!selectedRows.value.length) {
      toast.warning('Zaznacz przynajmniej 1 przesyłkę')
      return
    }

    const token = cookies.get('Authorization')
    const decoded: any = token ? jwt_decode(token) : null
    const userId = decoded?.UserId

    if (!userId) {
      toast.error('Brak userId w tokenie')
      return
    }

    // wybierz tylko te, które wymagają generacji
    const toGenerate = selectedRows.value.filter((r: any) => {
      const tn = (r.trackingNumber ?? '').toString().trim()
      return !tn || r.isManual === true
    })

    if (!toGenerate.length) {
      toast.info('Wszystkie zaznaczone mają tracking (brak potrzeby generowania)')
      return
    }

    // ⚠️ Minimalny payload. Jeśli backend wymaga paczek/items -> trzeba dociągnąć order detail.
    // Tu zakładam, że potrafisz stworzyć przesyłkę z samego orderId + provider.
    for (const r of toGenerate) {
      const orderId = r.orderId ?? r.OrderId
      if (!orderId) continue

      const payloadObj = {
        userId,
        orderId,
        provider: provider.value,
        // jeżeli backend wymaga BrandWarehouseId – musisz to mieć w DTO
        // brandWarehouseId: r.brandWarehouseId,
        mode: 'CREATE_LABEL',
        // reszta null -> backend może dobrać domyślne
        pickupDate: null,
        cashOnDeliveryAmount: null,
        declaredValue: null,
        currency: 'PLN',
        additionalServiceCodes: null,
        shipper: null,
        consignee: null,
        shipmentItems: [],
        packages: []
      }

      await Api.shipping.addShipment({ body: JSON.stringify(payloadObj) })
    }

    toast.success(`Wygenerowano etykiety: ${toGenerate.length}`)
    await fetchTableData()
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się wygenerować etykiet')
  }
}

onMounted(fetchTableData)
</script>

<style scoped>
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
</style>
