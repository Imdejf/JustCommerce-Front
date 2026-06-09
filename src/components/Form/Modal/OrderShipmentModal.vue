<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'
import { Api } from '/@/services/api'

enum ShipmentProvider {
  Unknown = 0,
  Dpd = 1,
  Geodis = 2,
  Gls = 3,
  Jas = 4
}

const props = defineProps<{
  visible: boolean
  order: any | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()
const cookies = new Cookies()
const storeId = cookies.get('dsStore')

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

const loading = ref(false)
const saving = ref(false)
const isAllegro = ref(false)
const allegroLinkMissing = ref(false)
const checkoutFormId = ref<string | null>(null)

const carriers = ref<any[]>([])
const carriersLoading = ref(false)
const allegroShipments = ref<any[]>([])

const allegroForm = ref({
  carrierId: '',
  waybill: ''
})

const shopForm = ref({
  provider: ShipmentProvider.Dpd,
  brandWarehouseId: '' as string,
  trackingNumber: ''
})

const warehouses = ref<any[]>([])

const providerOptions = [
  { value: ShipmentProvider.Dpd, label: 'DPD' },
  { value: ShipmentProvider.Geodis, label: 'Geodis' },
  { value: ShipmentProvider.Gls, label: 'GLS' },
  { value: ShipmentProvider.Jas, label: 'JAS' }
]

const orderNumber = computed(() => props.order?.numberOrder || props.order?.orderNumber || '—')
const buyerName = computed(() => {
  const billing = props.order?.billingAddress
  if (!billing) return props.order?.billingData || '—'
  if (billing.companyName) return billing.companyName
  return `${billing.firstName || ''} ${billing.lastName || ''}`.trim() || '—'
})

const normalizeList = (result: any) => {
  const data = result?.data ?? result
  return Array.isArray(data) ? data : []
}

const isAllegroSourceOrder = (order: any) => {
  const source = Number(order?.orderSourceType ?? order?.OrderSourceType)
  const payment = Number(order?.payment ?? order?.Payment)
  if (source === 6 || payment === 6) return true

  const note = String(order?.orderNote ?? order?.OrderNote ?? '').toLowerCase()
  return note.includes('allegro checkoutformid')
}

const extractCheckoutFormIdFromNote = (order: any) => {
  const note = String(order?.orderNote ?? order?.OrderNote ?? '')
  const match = note.match(/allegro checkoutformid:\s*(\S+)/i)
  return match?.[1] ?? null
}

const resolveAllegroContext = async () => {
  allegroLinkMissing.value = false

  if (!props.order?.id || !isAllegroSourceOrder(props.order)) {
    isAllegro.value = false
    checkoutFormId.value = null
    return
  }

  isAllegro.value = true

  let checkoutId = extractCheckoutFormIdFromNote(props.order)

  if (!checkoutId) {
    try {
      const result = await Api.allegro.getOrderByLocalOrderId(props.order.id)
      const data = result?.data ?? result
      checkoutId = data?.checkoutFormId ?? data?.CheckoutFormId ?? null
    } catch {
      checkoutId = null
    }
  }

  if (!checkoutId) {
    allegroLinkMissing.value = true
    checkoutFormId.value = null
    return
  }

  checkoutFormId.value = checkoutId
}

const loadCarriers = async () => {
  carriersLoading.value = true
  try {
    const result = await Api.allegro.getCarriers()
    carriers.value = normalizeList(result)
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać przewoźników Allegro')
  } finally {
    carriersLoading.value = false
  }
}

const loadAllegroShipments = async () => {
  if (!checkoutFormId.value) return

  try {
    const result = await Api.allegro.getOrderShipments(checkoutFormId.value)
    allegroShipments.value = normalizeList(result)
  } catch (error) {
    console.error(error)
    allegroShipments.value = []
  }
}

const loadWarehouses = async () => {
  if (!storeId) return

  try {
    const res = await Api.brands.getAllWarehouseBrand(storeId)
    warehouses.value = res.data ?? res ?? []
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać magazynów')
  }
}

const resetForms = () => {
  allegroForm.value = { carrierId: '', waybill: '' }
  shopForm.value = {
    provider: ShipmentProvider.Dpd,
    brandWarehouseId: '',
    trackingNumber: ''
  }
  allegroShipments.value = []
}

const loadModalData = async () => {
  if (!props.order) return

  loading.value = true
  resetForms()

  try {
    await resolveAllegroContext()

    if (isAllegro.value) {
      await Promise.all([loadCarriers(), loadAllegroShipments()])
    } else {
      await loadWarehouses()
    }
  } finally {
    loading.value = false
  }
}

const saveAllegroShipment = async () => {
  if (!checkoutFormId.value || !allegroForm.value.carrierId || !allegroForm.value.waybill.trim()) {
    toast.warning('Wybierz przewoźnika i podaj numer listu przewozowego')
    return
  }

  saving.value = true

  try {
    await Api.allegro.addOrderShipment(
      checkoutFormId.value,
      allegroForm.value.carrierId,
      allegroForm.value.waybill.trim()
    )

    toast.success('Dodano numer śledzenia w Allegro')
    allegroForm.value.waybill = ''
    await loadAllegroShipments()
    emit('saved')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.message || 'Nie udało się dodać numeru do Allegro')
  } finally {
    saving.value = false
  }
}

const saveShopTracking = async () => {
  const trackingNumber = shopForm.value.trackingNumber.trim()

  if (!shopForm.value.brandWarehouseId) {
    toast.warning('Wybierz magazyn')
    return
  }

  if (!trackingNumber) {
    toast.warning('Podaj numer przesyłki')
    return
  }

  const token = cookies.get('Authorization')
  if (!token) {
    toast.error('Brak autoryzacji')
    return
  }

  const decoded: any = jwt_decode(token)

  saving.value = true

  try {
    await Api.shipping.addLabelNumer({
      body: JSON.stringify({
        userId: decoded.UserId,
        orderId: props.order.id,
        brandWarehouseId: shopForm.value.brandWarehouseId,
        provider: shopForm.value.provider,
        trackingNumbers: [trackingNumber]
      })
    })

    toast.success('Zapisano numer przesyłki')
    shopForm.value.trackingNumber = ''
    emit('saved')
    dialogVisible.value = false
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zapisać numeru przesyłki')
  } finally {
    saving.value = false
  }
}

const submit = async () => {
  if (isAllegro.value) {
    await saveAllegroShipment()
    return
  }

  await saveShopTracking()
}

watch(
  () => props.visible,
  (isOpen) => {
    if (isOpen) {
      loadModalData()
    }
  }
)
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isAllegro ? 'Dodaj numer przesyłki — Allegro' : 'Dodaj numer przesyłki'"
    width="min(560px, 96vw)"
    destroy-on-close
  >
    <el-skeleton :loading="loading" animated :rows="5">
      <template #default>
        <div class="shipment-modal">
          <div class="shipment-modal__summary">
            <div><span>Zamówienie</span><strong>{{ orderNumber }}</strong></div>
            <div><span>Nabywca</span><strong>{{ buyerName }}</strong></div>
          </div>

          <template v-if="isAllegro">
            <el-alert
              v-if="allegroLinkMissing"
              type="error"
              :closable="false"
              show-icon
              title="Brak powiązania z Allegro"
              description="To zamówienie pochodzi z Allegro, ale nie znaleziono checkoutFormId. Zaimportuj zamówienie w module Allegro i utwórz lokalne zamówienie."
              class="shipment-modal__alert"
            />

            <el-alert
              v-else
              type="info"
              :closable="false"
              show-icon
              title="Zamówienie Allegro"
              description="Wybierz przewoźnika z listy Allegro i wyślij numer listu przewozowego do API Allegro."
              class="shipment-modal__alert"
            />

            <el-form v-if="!allegroLinkMissing" label-position="top">
              <el-form-item label="Przewoźnik Allegro" required>
                <el-select
                  v-model="allegroForm.carrierId"
                  class="!w-full"
                  filterable
                  placeholder="Wybierz przewoźnika"
                  :loading="carriersLoading"
                >
                  <el-option
                    v-for="carrier in carriers"
                    :key="carrier.id"
                    :label="`${carrier.name} (${carrier.id})`"
                    :value="carrier.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Numer listu przewozowego" required>
                <el-input
                  v-model="allegroForm.waybill"
                  placeholder="np. 12345678901234"
                  @keyup.enter="submit"
                />
              </el-form-item>
            </el-form>

            <div v-if="allegroShipments.length" class="shipment-modal__existing">
              <h4>Istniejące numery w Allegro</h4>
              <ul>
                <li v-for="(item, index) in allegroShipments" :key="index">
                  <strong>{{ item.carrierName || item.carrierId }}</strong>
                  · {{ item.waybill }}
                </li>
              </ul>
            </div>
          </template>

          <template v-else>
            <el-form label-position="top">
              <el-form-item label="Kurier" required>
                <el-select v-model="shopForm.provider" class="!w-full">
                  <el-option
                    v-for="option in providerOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Magazyn" required>
                <el-select
                  v-model="shopForm.brandWarehouseId"
                  class="!w-full"
                  filterable
                  placeholder="Wybierz magazyn"
                >
                  <el-option
                    v-for="warehouse in warehouses"
                    :key="warehouse.id ?? warehouse.Id"
                    :label="warehouse.warehouseName ?? warehouse.WarehouseName ?? warehouse.name"
                    :value="warehouse.id ?? warehouse.Id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Numer przesyłki" required>
                <el-input
                  v-model="shopForm.trackingNumber"
                  placeholder="Numer listu przewozowego"
                  @keyup.enter="submit"
                />
              </el-form-item>
            </el-form>
          </template>
        </div>
      </template>
    </el-skeleton>

    <template #footer>
      <el-button @click="dialogVisible = false">Anuluj</el-button>
      <el-button
        type="primary"
        :loading="saving"
        :disabled="isAllegro && allegroLinkMissing"
        @click="submit"
      >
        {{ isAllegro ? 'Wyślij do Allegro' : 'Zapisz numer' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.shipment-modal__summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.shipment-modal__summary div {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shipment-modal__summary span {
  font-size: 12px;
  color: #64748b;
}

.shipment-modal__alert {
  margin-bottom: 16px;
}

.shipment-modal__existing {
  margin-top: 8px;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid var(--el-border-color-light);
}

.shipment-modal__existing h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #334155;
}

.shipment-modal__existing ul {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  font-size: 13px;
}
</style>
