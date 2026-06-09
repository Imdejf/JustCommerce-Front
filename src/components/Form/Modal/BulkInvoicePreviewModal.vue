<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

type PreviewPosition = {
  name: string
  quantity: number
  unitPriceGross: number
  totalPriceGross: number
  taxPercent: number
}

type PreviewOrder = {
  orderId: string
  numberOrder: string
  buyerName: string
  buyerNip?: string | null
  buyerEmail?: string | null
  orderTotal: number
  invoiceTotalGross: number
  amountDifference: number
  invoiceKind: string
  paymentMethod: string
  isPaid: boolean
  positions: PreviewPosition[]
}

type PreviewData = {
  totalCount: number
  totalOrderAmount: number
  totalInvoiceAmount: number
  orders: PreviewOrder[]
}

const props = defineProps<{
  visible: boolean
  storeId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'completed'): void
}>()

const toast = useToast()
const loading = ref(false)
const generating = ref(false)
const preview = ref<PreviewData | null>(null)
const selectedOrderIds = ref<string[]>([])
const tableRef = ref<any>(null)

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

const selectedOrders = computed(() => {
  if (!preview.value) return []
  return preview.value.orders.filter((order) => selectedOrderIds.value.includes(order.orderId))
})

const selectedOrderTotal = computed(() =>
  selectedOrders.value.reduce((sum, order) => sum + Number(order.orderTotal ?? 0), 0)
)

const selectedInvoiceTotal = computed(() =>
  selectedOrders.value.reduce((sum, order) => sum + Number(order.invoiceTotalGross ?? 0), 0)
)

const formatPrice = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0)
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`
}

const translatePaymentMethod = (value: string) => {
  switch (value) {
    case 'Przelewy24':
      return 'Przelewy24'
    case 'StandardTransfer':
      return 'Przelew standardowy'
    case 'CashOnDelivery':
      return 'Płatność przy odbiorze'
    case 'PayPo':
      return 'PayPo'
    case 'Blik':
      return 'BLIK'
    case 'Term':
      return 'Termin płatności'
    case 'Allegro':
      return 'Allegro'
    default:
      return value || '—'
  }
}

const translateInvoiceKind = (value: string) => (value === 'final' ? 'Faktura końcowa' : 'Faktura VAT')

const hasDifference = (order: PreviewOrder) => Math.abs(Number(order.amountDifference ?? 0)) >= 0.01

const loadPreview = async () => {
  if (!props.storeId) {
    toast.warning('Wybierz sklep')
    return
  }

  loading.value = true
  preview.value = null
  selectedOrderIds.value = []

  try {
    const data = await Api.invoices.getBulkInvoicePreview(props.storeId)
    preview.value = data
    selectedOrderIds.value = (data.orders ?? []).map((order: PreviewOrder) => order.orderId)

    await nextTick()
    tableRef.value?.clearSelection?.()
    for (const order of data.orders ?? []) {
      tableRef.value?.toggleRowSelection?.(order, true)
    }
  } catch (error: any) {
    toast.error(error?.message || 'Nie udało się wczytać podglądu faktur')
    dialogVisible.value = false
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows: PreviewOrder[]) => {
  selectedOrderIds.value = rows.map((row) => row.orderId)
}

const generateSelected = async () => {
  if (!props.storeId || selectedOrderIds.value.length === 0) {
    toast.warning('Wybierz co najmniej jedno zamówienie')
    return
  }

  generating.value = true

  try {
    const result = await Api.invoices.createBulkInvoices(props.storeId, selectedOrderIds.value)

    if (result.failedCount > 0) {
      toast.warning(`Wygenerowano ${result.successCount} faktur, błędów: ${result.failedCount}`)
    } else {
      toast.success(`Wygenerowano ${result.successCount} faktur`)
    }

    dialogVisible.value = false
    emit('completed')
  } catch (error: any) {
    toast.error(error?.message || 'Nie udało się wygenerować faktur')
  } finally {
    generating.value = false
  }
}

watch(
  () => props.visible,
  (isOpen) => {
    if (isOpen) {
      loadPreview()
    }
  }
)
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="Podgląd masowego generowania faktur"
    width="min(1200px, 96vw)"
    top="4vh"
    destroy-on-close
    class="bulk-invoice-dialog"
  >
    <el-skeleton :loading="loading" animated :rows="8">
      <template #default>
        <div v-if="preview" class="bulk-invoice">
          <div class="bulk-invoice__summary">
            <div class="bulk-invoice__stat">
              <span class="bulk-invoice__stat-label">Zamówień do faktury</span>
              <strong>{{ preview.totalCount }}</strong>
            </div>
            <div class="bulk-invoice__stat">
              <span class="bulk-invoice__stat-label">Suma zamówień (wszystkie)</span>
              <strong>{{ formatPrice(preview.totalOrderAmount) }}</strong>
            </div>
            <div class="bulk-invoice__stat">
              <span class="bulk-invoice__stat-label">Suma na fakturach (wszystkie)</span>
              <strong>{{ formatPrice(preview.totalInvoiceAmount) }}</strong>
            </div>
            <div class="bulk-invoice__stat bulk-invoice__stat--selected">
              <span class="bulk-invoice__stat-label">Wybrane: {{ selectedOrderIds.length }}</span>
              <strong>{{ formatPrice(selectedOrderTotal) }} → {{ formatPrice(selectedInvoiceTotal) }}</strong>
            </div>
          </div>

          <el-empty v-if="!preview.orders.length" description="Brak zamówień kwalifikujących się do wystawienia faktury" />

          <el-table
            v-else
            ref="tableRef"
            :data="preview.orders"
            row-key="orderId"
            max-height="58vh"
            border
            stripe
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="48" />
            <el-table-column type="expand" width="48">
              <template #default="{ row }">
                <div class="bulk-invoice__positions">
                  <h4>Pozycje na fakturze</h4>
                  <el-table :data="row.positions" size="small" border>
                    <el-table-column prop="name" label="Nazwa" min-width="260" />
                    <el-table-column prop="quantity" label="Ilość" width="80" align="center" />
                    <el-table-column label="Cena brutto" width="130" align="right">
                      <template #default="{ row: position }">
                        {{ formatPrice(position.unitPriceGross) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="Wartość brutto" width="140" align="right">
                      <template #default="{ row: position }">
                        {{ formatPrice(position.totalPriceGross) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="taxPercent" label="VAT %" width="80" align="center" />
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="numberOrder" label="Zamówienie" min-width="120" />
            <el-table-column label="Nabywca" min-width="180">
              <template #default="{ row }">
                <div class="bulk-invoice__buyer">
                  <strong>{{ row.buyerName }}</strong>
                  <span v-if="row.buyerNip">NIP: {{ row.buyerNip }}</span>
                  <span v-if="row.buyerEmail">{{ row.buyerEmail }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Kwota zamówienia" width="140" align="right">
              <template #default="{ row }">
                {{ formatPrice(row.orderTotal) }}
              </template>
            </el-table-column>
            <el-table-column label="Kwota na fakturze" width="150" align="right">
              <template #default="{ row }">
                {{ formatPrice(row.invoiceTotalGross) }}
              </template>
            </el-table-column>
            <el-table-column label="Różnica" width="110" align="right">
              <template #default="{ row }">
                <span :class="{ 'bulk-invoice__diff': hasDifference(row) }">
                  {{ formatPrice(row.amountDifference) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="Typ" width="130">
              <template #default="{ row }">
                {{ translateInvoiceKind(row.invoiceKind) }}
              </template>
            </el-table-column>
            <el-table-column label="Płatność" width="150">
              <template #default="{ row }">
                {{ translatePaymentMethod(row.paymentMethod) }}
                <span class="bulk-invoice__paid">{{ row.isPaid ? '· opłacone' : '· nieopłacone' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-skeleton>

    <template #footer>
      <el-button @click="dialogVisible = false">Anuluj</el-button>
      <el-button
        type="primary"
        :loading="generating"
        :disabled="loading || !selectedOrderIds.length"
        @click="generateSelected"
      >
        Generuj wybrane faktury ({{ selectedOrderIds.length }})
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.bulk-invoice__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.bulk-invoice__stat {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bulk-invoice__stat--selected {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.bulk-invoice__stat-label {
  font-size: 12px;
  color: #64748b;
}

.bulk-invoice__buyer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}

.bulk-invoice__buyer span {
  color: #64748b;
  font-size: 12px;
}

.bulk-invoice__positions {
  padding: 8px 12px 12px;
}

.bulk-invoice__positions h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #334155;
}

.bulk-invoice__diff {
  color: #b45309;
  font-weight: 600;
}

.bulk-invoice__paid {
  display: block;
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 960px) {
  .bulk-invoice__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
