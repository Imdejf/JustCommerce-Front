<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import { Api } from '/@/services/api'
import jwt_decode from 'jwt-decode'

enum ShipmentProvider {
  Unknown = 0,
  Dpd = 1,
  Geodis = 2,
  Gls = 3,
  Jas = 4
}

type ShipmentMode = 'CREATE_LABEL' | 'ADD_TRACKING'

type TrackingRow = {
  number: string
}

type PackageForm = {
  lengthCm: number
  widthCm: number
  heightCm: number
  weightKg: number
  contents: string
  reference: string
}

const props = defineProps<{
  modelValue: boolean
  provider: ShipmentProvider | null
  order: any | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created'): void
}>()

const toast = useToast()
const cookies = new Cookies()
const storeId = cookies.get('dsStore')

/** Widoczność dialogu */
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const close = () => (visible.value = false)

/** Tryb */
const shipmentMode = ref<ShipmentMode>('CREATE_LABEL')

/** Numery tracking (1..N) */
const trackingRows = ref<TrackingRow[]>([{ number: '' }])

const addTrackingRow = () => trackingRows.value.push({ number: '' })
const removeTrackingRow = (idx: number) => {
  if (trackingRows.value.length <= 1) return
  trackingRows.value.splice(idx, 1)
}

/** Label providera */
const providerLabel = computed(() => {
  switch (props.provider) {
    case ShipmentProvider.Dpd: return 'DPD'
    case ShipmentProvider.Geodis: return 'Geodis'
    case ShipmentProvider.Gls: return 'GLS'
    case ShipmentProvider.Jas: return 'JAS'
    default: return ''
  }
})

/** provider id do API */
const providerEnum = computed<number>(() => props.provider ?? ShipmentProvider.Unknown)

/** COD */
const isCODByPayment = computed(() => props.order?.paymentProvider === 2)

/** Warehouses */
const warehouses = ref<any[]>([])
const selectedWarehouseId = ref<string | null>(null)

/** Czy nadawca został zmieniony ręcznie (override) */
const isShipperOverridden = ref(false)
/** Snapshot shippera po załadowaniu z magazynu (do porównania) */
const shipperSnapshot = ref('')

const form = reactive({
  payerType: 'SENDER' as 'SENDER' | 'THIRD_PARTY',
  codEnabled: false,
  codAmount: null as number | null,
  pickupDate: '' as string | null,
  additionalInfo: '',

  declaredValue: null as number | null,
  reference: '',
  currency: 'PLN',

  shipper: {
    symbol: '',
    name: '',
    country: 'PL',
    city: '',
    addressLine1: '',
    zipCode: '',
    person: '',
    email: '',
    phone: '',
  },

  consignee: {
    symbol: '',
    name: '',
    country: 'PL',
    city: '',
    addressLine1: '',
    zipCode: '',
    person: '',
    email: '',
    phone: '',
  },

  packages: [] as PackageForm[],
  packageCount: 1,
})

function calcTotalWeightKg(items: any[]): number {
  let sum = 0
  for (const i of items) {
    const w = Number(i.weightKg ?? i.weight ?? i.waga ?? 0) || 0
    const q = Number(i.quantity ?? 1) || 1
    sum += w * q
  }
  return Math.round(sum * 1000) / 1000
}

const shipperSignature = () =>
  JSON.stringify({
    symbol: form.shipper.symbol,
    name: form.shipper.name,
    country: form.shipper.country,
    city: form.shipper.city,
    addressLine1: form.shipper.addressLine1,
    zipCode: form.shipper.zipCode,
    person: form.shipper.person,
    email: form.shipper.email,
    phone: form.shipper.phone,
  })

/** init po order */
watch(
  () => props.order,
  (o) => {
    if (!o) return

    // reset trybu + trackingów przy nowym zamówieniu
    shipmentMode.value = 'CREATE_LABEL'
    trackingRows.value = [{ number: '' }]

    form.reference = o.orderNumber ?? ''
    form.declaredValue = Number(o.orderPriceGross ?? 0) || null

    form.codEnabled = !!isCODByPayment.value
    form.codAmount = isCODByPayment.value ? Number(o.orderPriceGross ?? 0) : null

    const sa = o.shippingAddress ?? {}
    const ba = o.billingAddress ?? {}

    const consigneeName = (sa.companyName ?? `${sa.firstName ?? ''} ${sa.lastName ?? ''}`.trim() ?? '').toString()
    form.consignee.symbol = consigneeName || 'CONSIGNEE'
    form.consignee.name = consigneeName || 'CONSIGNEE'
    form.consignee.country = 'PL'
    form.consignee.city = (sa.city ?? ba.city ?? '').toString()
    form.consignee.zipCode = (sa.zipCode ?? ba.zipCode ?? '').toString()
    form.consignee.addressLine1 = (sa.addressLine1 ?? ba.addressLine1 ?? '').toString()
    form.consignee.person = (sa.companyName ?? `${sa.firstName ?? ''} ${sa.lastName ?? ''}`.trim() ?? '').toString()
    form.consignee.email = (sa.email ?? ba.email ?? '').toString()
    form.consignee.phone = (sa.phone ?? ba.phone ?? '').toString()

    const totalW = calcTotalWeightKg(o.orderProcessedItems ?? [])
    const w = totalW > 0 ? totalW : 1

    form.packages.splice(0, form.packages.length)
    form.packages.push({
      lengthCm: 50,
      widthCm: 50,
      heightCm: 60,
      weightKg: w,
      contents: o.orderNumber ?? '',
      reference: `${o.orderNumber ?? 'SHIP'}/1`,
    })
    form.packageCount = 1
  },
  { immediate: true }
)

/** Paczki */
const addPackage = () => {
  const idx = form.packages.length + 1
  const baseRef = props.order?.orderNumber ?? 'SHIP'
  form.packages.push({
    lengthCm: 50,
    widthCm: 50,
    heightCm: 60,
    weightKg: 1,
    contents: baseRef,
    reference: `${baseRef}/${idx}`,
  })
  form.packageCount = form.packages.length
}

const removePackage = (idx: number) => {
  if (form.packages.length <= 1) return
  form.packages.splice(idx, 1)
  form.packageCount = form.packages.length
}

/** Pobierz magazyny */
const fetchWarehouses = async () => {
  try {
    const res = await Api.brands.getAllWarehouseBrand(storeId)
    warehouses.value = res.data ?? res ?? []
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać magazynów producentów')
  }
}

watch(selectedWarehouseId, (id) => {
  if (!id) return
  const wh = warehouses.value.find((x) => (x.id ?? x.Id) === id)
  if (!wh) return

  const symbol = (wh.name ?? wh.Name ?? '').toString()
  const warehouseName = (wh.warehouseName ?? wh.WarehouseName ?? symbol).toString()

  form.shipper.symbol = symbol || 'SHIPPER'
  form.shipper.name = warehouseName || symbol || 'SHIPPER'
  form.shipper.country = 'PL'
  form.shipper.city = (wh.city ?? wh.City ?? '').toString()
  form.shipper.zipCode = (wh.postCode ?? wh.PostCode ?? '').toString()
  form.shipper.addressLine1 = `${(wh.street ?? wh.Street ?? '').toString()} ${(wh.number ?? wh.Number ?? '').toString()}`.trim()
  form.shipper.person = (wh.personContact ?? wh.PersonContact ?? '').toString()
  form.shipper.email = (wh.email ?? wh.Email ?? '').toString()
  form.shipper.phone = (wh.phone ?? wh.Phone ?? '').toString()

  shipperSnapshot.value = shipperSignature()
  isShipperOverridden.value = false
})

watch(
  () => form.shipper,
  () => {
    if (!shipperSnapshot.value) return
    isShipperOverridden.value = shipperSignature() !== shipperSnapshot.value
  },
  { deep: true }
)

onMounted(fetchWarehouses)

/** Items */
const buildShipmentItems = () => {
  return (props.order?.orderProcessedItems ?? []).map((i: any) => ({
    orderItemId: i.orderItemId,
    productId: i.productId ?? null,
    productName: i.name ?? null,
    productSku: i.productCode ?? null,
    quantityToShip: i.quantity ?? 1,
  }))
}

const toShipmentPartyDto = (p: typeof form.shipper) => ({
  symbol: p.symbol,
  name: p.name,
  address: {
    country: p.country || 'PL',
    city: p.city,
    addressLine1: p.addressLine1,
    zipCode: p.zipCode,
  },
  contact: {
    person: p.person,
    email: p.email || null,
    phone: p.phone || null,
  },
})

const validate = () => {
  if (!selectedWarehouseId.value) return 'Wybierz magazyn producenta (BrandWarehouseId).'
  if (!props.order?.orderId && !props.order?.id) return 'Brak OrderId w danych zamówienia.'
  if (providerEnum.value === ShipmentProvider.Unknown) return 'Brak providera przesyłki.'

  if (shipmentMode.value === 'ADD_TRACKING') {
    const numbers = trackingRows.value.map(r => (r.number ?? '').trim())

    if (!numbers.length) return 'Dodaj co najmniej 1 numer przesyłki.'
    if (numbers.some(n => !n)) return 'Uzupełnij wszystkie numery (puste wiersze usuń).'

    const dup = numbers.find((n, i) => numbers.indexOf(n) !== i)
    if (dup) return `Duplikat numeru przesyłki: ${dup}`

    return null
  }

  if (!form.shipper.addressLine1 || !form.shipper.city || !form.shipper.zipCode) return 'Uzupełnij dane NADAWCY.'
  if (!form.consignee.addressLine1 || !form.consignee.city || !form.consignee.zipCode) return 'Uzupełnij dane ODBIORCY.'

  if (form.codEnabled && (form.codAmount ?? 0) <= 0) return 'Podaj kwotę pobrania.'
  if (!form.packages.length) return 'Dodaj co najmniej 1 paczkę.'
  return null
}

const submit = async () => {
  try {
    const err = validate()
    if (err) return toast.error(err)

    const orderId = props.order?.orderId ?? props.order?.id
    const token = cookies.get('Authorization')
    const decoded: any = jwt_decode(token)

    // ✅ TRYB: dodaj numery przesyłek (bez generowania etykiety)
    if (shipmentMode.value === 'ADD_TRACKING') {
      const trackingNumbers = trackingRows.value.map((r) => (r.number ?? '').trim())

      const payloadObj = {
        userId: decoded.UserId,
        orderId,
        brandWarehouseId: selectedWarehouseId.value,
        provider: providerEnum.value,
        trackingNumbers, // ✅ List<string>
      }

      await Api.shipping.addLabelNumer({ body: JSON.stringify(payloadObj) })

      toast.success('Zapisano numery przesyłek')
      emit('created')
      close()
      return
    }

    // ✅ TRYB: generowanie etykiety (Twoja dotychczasowa logika)
    const payloadObj = {
      userId: decoded.UserId,
      orderId,
      brandWarehouseId: selectedWarehouseId.value,
      provider: providerEnum.value,

      pickupDate: form.pickupDate ? form.pickupDate : null,
      cashOnDeliveryAmount: form.codEnabled ? (form.codAmount ?? null) : null,
      declaredValue: form.declaredValue ?? null,
      currency: form.currency,

      additionalServiceCodes: [
        form.payerType === 'THIRD_PARTY' ? 'PAYER_THIRD_PARTY' : 'PAYER_SENDER',
        form.additionalInfo ? `INFO:${form.additionalInfo}` : null,
      ].filter(Boolean),

      shipper: isShipperOverridden.value ? toShipmentPartyDto(form.shipper) : null,
      consignee: toShipmentPartyDto(form.consignee),

      shipmentItems: buildShipmentItems(),

      packages: form.packages.map((p) => ({
        lengthCm: Number(p.lengthCm),
        widthCm: Number(p.widthCm),
        heightCm: Number(p.heightCm),
        weightKg: Number(p.weightKg),
        contents: p.contents || null,
        reference: p.reference || null,
      })),
    }

    await Api.shipping.addShipment({ body: JSON.stringify(payloadObj) })

    toast.success('Przesyłki utworzone (paczki)')
    emit('created')
    close()
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się utworzyć przesyłek')
  }
}
</script>

<template>
  <el-dialog v-model="visible" width="980px" :title="`Utwórz przesyłkę: ${providerLabel}`">
    <!-- TRYB -->
    <div class="mb-3 p-2 rounded-lg border border-[#d6dfe9] bg-[#f1f4f9]">
      <div class="text-sm font-bold mb-1">Tryb</div>

      <el-radio-group v-model="shipmentMode" size="small">
        <el-radio-button label="CREATE_LABEL">Utwórz etykietę</el-radio-button>
        <el-radio-button label="ADD_TRACKING">Dodaj numery przesyłek</el-radio-button>
      </el-radio-group>

      <!-- ADD_TRACKING -->
      <div v-if="shipmentMode === 'ADD_TRACKING'" class="mt-3">
        <div class="flex items-center mb-2">
          <div class="text-xs text-slate-600">
            W tym trybie nie generujemy etykiety — zapisujemy tylko numery przesyłek dla wybranego providera.
          </div>

          <el-button size="small" class="ml-auto" @click="addTrackingRow">
            + Dodaj numer
          </el-button>
        </div>

        <div
          v-for="(t, idx) in trackingRows"
          :key="idx"
          class="grid grid-cols-12 gap-2 mb-2 p-2 rounded-lg border border-[#d6dfe9] bg-white"
        >
          <div class="col-span-11">
            <div class="text-xs mb-1 font-bold">Numer #{{ idx + 1 }}</div>
            <el-input v-model="t.number" placeholder="np. 1234567890" />
          </div>

          <div class="col-span-1 flex items-end">
            <el-button
              size="small"
              type="danger"
              plain
              style="width: 100%"
              @click="removeTrackingRow(idx)"
              :disabled="trackingRows.length <= 1"
            >
              Usuń
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- PRODUCENT / MAGAZYN -->
    <div class="mb-3">
      <div class="text-sm font-bold mb-1">Producent / Magazyn nadawczy</div>
      <el-select v-model="selectedWarehouseId" filterable placeholder="Wybierz magazyn producenta" style="width: 100%">
        <el-option
          v-for="w in warehouses"
          :key="w.id ?? w.Id"
          :label="`${(w.name ?? w.Name) ?? ''} — ${(w.city ?? w.City) ?? ''}`"
          :value="(w.id ?? w.Id)"
        />
      </el-select>

      <div v-if="isShipperOverridden" class="text-xs mt-1 text-orange-600 font-semibold">
        Nadawca zmieniony ręcznie — do backendu pójdzie SHIPPER z formularza (BrandWarehouseId nadal zostaje).
      </div>
    </div>

    <!-- CREATE_LABEL -->
    <div v-if="shipmentMode === 'CREATE_LABEL'">
      <!-- OPCJE -->
      <div class="section">
        <div class="section__title">Opcje</div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <div class="text-xs mb-1 font-bold">Płatnik</div>
            <el-radio-group v-model="form.payerType">
              <el-radio label="SENDER">Nadawca</el-radio>
            </el-radio-group>
          </div>

          <div>
            <el-checkbox v-model="form.codEnabled">Płatność za pobraniem</el-checkbox>
            <el-input-number v-if="form.codEnabled" v-model="form.codAmount" :min="0" style="width: 100%" class="mt-1" />
          </div>

          <div>
            <div class="text-xs mb-1 font-bold">Data wysyłki / odbioru</div>
            <el-date-picker
              v-model="form.pickupDate"
              type="date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 100%"
            />
          </div>

          <div class="col-span-3">
            <div class="text-xs mb-1 font-bold">Dodatkowe informacje</div>
            <el-input v-model="form.additionalInfo" type="textarea" :rows="2" />
          </div>
        </div>
      </div>

      <!-- NADAWCA -->
      <div class="section">
        <div class="section__title">Nadawca</div>
        <div class="grid grid-cols-4 gap-3">
          <el-form-item label="Symbol"><el-input v-model="form.shipper.symbol" /></el-form-item>
          <el-form-item label="Nazwa"><el-input v-model="form.shipper.name" /></el-form-item>
          <el-form-item label="Adres"><el-input v-model="form.shipper.addressLine1" /></el-form-item>
          <el-form-item label="Kod pocztowy"><el-input v-model="form.shipper.zipCode" /></el-form-item>

          <el-form-item label="Miasto"><el-input v-model="form.shipper.city" /></el-form-item>
          <el-form-item label="Kraj"><el-input v-model="form.shipper.country" /></el-form-item>
          <el-form-item label="Osoba kontaktowa"><el-input v-model="form.shipper.person" /></el-form-item>
          <el-form-item label="Telefon"><el-input v-model="form.shipper.phone" /></el-form-item>

          <el-form-item label="Email"><el-input v-model="form.shipper.email" /></el-form-item>
          <el-form-item label="Referencja (globalna)"><el-input v-model="form.reference" /></el-form-item>
        </div>
      </div>

      <!-- ODBIORCA -->
      <div class="section">
        <div class="section__title">Odbiorca</div>
        <div class="grid grid-cols-4 gap-3">
          <el-form-item label="Symbol"><el-input v-model="form.consignee.symbol" /></el-form-item>
          <el-form-item label="Nazwa"><el-input v-model="form.consignee.name" /></el-form-item>
          <el-form-item label="Adres"><el-input v-model="form.consignee.addressLine1" /></el-form-item>
          <el-form-item label="Kod pocztowy"><el-input v-model="form.consignee.zipCode" /></el-form-item>

          <el-form-item label="Miasto"><el-input v-model="form.consignee.city" /></el-form-item>
          <el-form-item label="Kraj"><el-input v-model="form.consignee.country" /></el-form-item>
          <el-form-item label="Osoba kontaktowa"><el-input v-model="form.consignee.person" /></el-form-item>
          <el-form-item label="Telefon"><el-input v-model="form.consignee.phone" /></el-form-item>

          <el-form-item label="Email"><el-input v-model="form.consignee.email" /></el-form-item>
        </div>
      </div>

      <!-- PACZKI -->
      <div class="section">
        <div class="section__title flex items-center gap-3">
          <span>Paczki</span>
          <el-button size="small" @click="addPackage">Dodaj paczkę</el-button>

          <div class="ml-auto flex items-center gap-2">
            <span class="text-xs font-bold">Liczba:</span>
            <el-input-number v-model="form.packageCount" :min="1" style="width: 120px" />
          </div>
        </div>

        <div v-for="(p, idx) in form.packages" :key="idx" class="package-row">
          <div class="package-grid">
            <el-form-item :label="`Ref #${idx + 1}`" class="w-[140px]">
              <el-input v-model="p.reference" size="small" />
            </el-form-item>

            <el-form-item label="Waga (kg)" class="w-[140px]">
              <el-input-number v-model="p.weightKg" :min="1" :step="1" style="width: 100%" size="small" />
            </el-form-item>

            <el-form-item label="Dł (cm)" class="w-[140px]">
              <el-input-number v-model="p.lengthCm" :min="1" style="width: 100%" size="small" />
            </el-form-item>

            <el-form-item label="Sz (cm)" class="w-[140px]">
              <el-input-number v-model="p.widthCm" :min="1" style="width: 100%" size="small" />
            </el-form-item>

            <el-form-item label="Wys (cm)" class="w-[140px]">
              <el-input-number v-model="p.heightCm" :min="1" style="width: 100%" size="small" />
            </el-form-item>

            <div class="btncell m-auto">
              <el-button
                size="small"
                type="danger"
                plain
                @click="removePackage(idx)"
                style="width: 100%"
                :disabled="form.packages.length <= 1"
              >
                Usuń
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- PRODUKTY -->
      <div class="section">
        <div class="section__title">Produkty</div>
        <el-table :data="order?.orderProcessedItems ?? []" size="small" border>
          <el-table-column label="Nazwa" prop="name" />
          <el-table-column label="Symbol" prop="productCode" width="140" />
          <el-table-column label="Ilość" prop="quantity" width="90" />
        </el-table>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">Anuluj</el-button>
      <el-button type="primary" @click="submit" :disabled="!selectedWarehouseId">
        {{ shipmentMode === 'ADD_TRACKING' ? 'Zapisz numery' : 'Utwórz przesyłki' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.section {
  border: 1px solid #d6dfe9;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
  background: #f1f4f9;
}
.section__title {
  font-weight: 700;
  font-size: 12px;
  margin-bottom: 8px;
  color: #435368;
}
.package-row {
  padding: 8px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 8px;
}

/* ✅ Grid paczek: stałe kolumny + nic nie nachodzi */
.package-grid {
  display: grid;
  grid-template-columns: 140px 140px 140px 140px 140px 140px;
  gap: 8px;
  align-items: end;
}

.btncell {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 2px;
}

/* trochę ciaśniej */
:deep(.el-form-item) {
  margin-bottom: 0px;
}
:deep(.el-form-item__label) {
  line-height: 12px;
  padding-bottom: 2px;
  font-size: 11px;
}
</style>
