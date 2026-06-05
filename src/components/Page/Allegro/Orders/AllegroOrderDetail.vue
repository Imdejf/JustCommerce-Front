<template>
  <div class="p-3">
    <div class="bg-[#f1f4f9] p-2 border-t-[3px] border-[#64748b] rounded-t-xl">
      <div class="flex justify-between items-center">
        <div class="flex">
          <span class="flex hover:bg-sky-100 p-1">
            <a @click="goBack" class="rounded-md p-1 text-xs font-semibold">
              Wróć
            </a>
          </span>

          <span class="ml-4 flex hover:bg-sky-100 p-1">
            <a @click="loadOrder" class="rounded-md p-1 text-xs font-semibold">
              Odśwież
            </a>
          </span>

          <span class="ml-4 flex hover:bg-sky-100 p-1">
            <a @click="createLocalOrder" class="rounded-md p-1 text-xs font-semibold">
              Utwórz zamówienie lokalne
            </a>
          </span>
        </div>

        <div class="text-xs font-semibold text-[#435368]">
          Checkout ID: {{ checkoutFormId }}
        </div>
      </div>
    </div>

    <div v-loading="loading" class="bg-white border border-[#d6dfe9] p-4">
      <el-empty v-if="!order" description="Brak danych zamówienia Allegro" />

      <div v-else class="grid grid-cols-1 gap-4">
        <FormSection title="Podstawowe dane">
          <div class="grid grid-cols-4 gap-4 text-xs">
            <div>
              <strong>Checkout ID:</strong>
              <p>{{ order.checkoutFormId || order.id || '-' }}</p>
            </div>

            <div>
              <strong>Status Allegro:</strong>
              <p>
                <el-tag>{{ order.status || '-' }}</el-tag>
              </p>
            </div>

            <div>
              <strong>Status realizacji:</strong>
              <p>
                <el-tag>{{ order.fulfillmentStatus || '-' }}</el-tag>
              </p>
            </div>

            <div>
              <strong>Data zakupu:</strong>
              <p>{{ formatDate(order.createdAt || order.boughtAt || order.createdOn) }}</p>
            </div>

            <div>
              <strong>Kwota:</strong>
              <p>{{ formatPrice(order.totalAmount || order.amount || order.orderTotal) }}</p>
            </div>

            <div>
              <strong>Sandbox:</strong>
              <p>{{ order.sandbox ? 'Tak' : 'Nie' }}</p>
            </div>

            <div>
              <strong>Zamówienie lokalne:</strong>
              <p>
                <el-tag :type="order.localOrderId ? 'success' : 'danger'">
                  {{ order.localOrderId ? 'Tak' : 'Nie' }}
                </el-tag>
              </p>
            </div>

            <div v-if="order.localOrderId">
              <strong>Zamówienie lokalne:</strong>
              <p>
                <router-link
                  :to="`/sale/order/${order.localOrderId}`"
                  class="text-[#4f6bed] hover:underline"
                >
                  Otwórz zamówienie lokalne
                </router-link>
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Kupujący">
          <div class="grid grid-cols-3 gap-4 text-xs">
            <div>
              <strong>Login:</strong>
              <p>{{ order.buyerLogin || '-' }}</p>
            </div>

            <div>
              <strong>Email:</strong>
              <p>{{ order.buyerEmail || '-' }}</p>
            </div>

            <div>
              <strong>Imię i nazwisko:</strong>
              <p>{{ order.buyerName || fullName(order.buyerFirstName, order.buyerLastName) }}</p>
            </div>

            <div>
              <strong>Telefon:</strong>
              <p>{{ order.phoneNumber || order.buyerPhoneNumber || '-' }}</p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Dostawa">
          <div class="grid grid-cols-3 gap-4 text-xs">
            <div>
              <strong>Metoda dostawy:</strong>
              <p>{{ order.deliveryMethod || '-' }}</p>
            </div>

            <div>
              <strong>Adres:</strong>
              <p>{{ order.deliveryAddress || order.shippingAddress || '-' }}</p>
            </div>

            <div>
              <strong>Miasto:</strong>
              <p>{{ order.deliveryCity || '-' }}</p>
            </div>

            <div>
              <strong>Kod pocztowy:</strong>
              <p>{{ order.deliveryZipCode || '-' }}</p>
            </div>

            <div>
              <strong>Kraj:</strong>
              <p>{{ order.deliveryCountry || '-' }}</p>
            </div>

            <div>
              <strong>Punkt odbioru:</strong>
              <p>{{ order.pickupPointName || order.pickupPointId || '-' }}</p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Płatność">
          <div class="grid grid-cols-3 gap-4 text-xs">
            <div>
              <strong>Status płatności:</strong>
              <p>{{ order.paymentStatus || '-' }}</p>
            </div>

            <div>
              <strong>Metoda płatności:</strong>
              <p>{{ order.paymentMethod || '-' }}</p>
            </div>

            <div>
              <strong>ID płatności:</strong>
              <p>{{ order.paymentId || '-' }}</p>
            </div>
          </div>
        </FormSection>

        <FormSection
          v-if="order.localOrderId"
          title="Obsługa w Allegro"
        >
          <div class="space-y-6 text-xs">
            <div class="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 text-[#475569]">
              Zamówienie lokalne jest powiązane. Możesz zsynchronizować status realizacji,
              numer przesyłki i fakturę bezpośrednio z Allegro.
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="border border-[#d6dfe9] rounded-lg p-4 space-y-4">
                <h3 class="text-sm font-bold text-[#111827]">Status realizacji</h3>

                <el-select
                  v-model="fulfillmentForm.status"
                  class="w-full"
                  placeholder="Wybierz status"
                >
                  <el-option
                    v-for="item in fulfillmentStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>

                <el-button
                  color="#4f6bed"
                  :loading="fulfillmentLoading"
                  @click="saveFulfillmentStatus"
                >
                  Zapisz status w Allegro
                </el-button>
              </div>

              <div class="border border-[#d6dfe9] rounded-lg p-4 space-y-4">
                <h3 class="text-sm font-bold text-[#111827]">Numer śledzenia</h3>

                <el-select
                  v-model="shipmentForm.carrierId"
                  class="w-full"
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

                <el-input
                  v-model="shipmentForm.waybill"
                  placeholder="Numer listu przewozowego"
                />

                <el-button
                  color="#00796b"
                  :loading="shipmentLoading"
                  :disabled="!shipmentForm.carrierId || !shipmentForm.waybill"
                  @click="addShipment"
                >
                  Dodaj numer śledzenia do Allegro
                </el-button>
              </div>
            </div>

            <div class="border border-[#d6dfe9] rounded-lg p-4 space-y-4">
              <div class="flex items-center justify-between gap-4">
                <h3 class="text-sm font-bold text-[#111827]">Faktura w Allegro</h3>

                <el-button
                  color="#ea580c"
                  :loading="invoiceLoading"
                  @click="uploadInvoiceToAllegro"
                >
                  Wyślij fakturę z zamówienia lokalnego
                </el-button>
              </div>

              <p class="text-[#64748b]">
                System wygeneruje fakturę lokalnie (jeśli jej nie ma), a następnie prześle PDF do Allegro.
              </p>

              <el-table
                v-if="invoices.length"
                :data="invoices"
                :border="true"
                class="!bg-[#d6dfe9]"
              >
                <el-table-column label="Numer faktury" prop="invoiceNumber" />
                <el-table-column label="Plik" prop="fileName" />
                <el-table-column label="Wgrano">
                  <template #default="scope">
                    {{ formatDate(scope.row.uploadedAt) }}
                  </template>
                </el-table-column>
              </el-table>

              <el-empty
                v-else
                description="Brak faktur w Allegro dla tego zamówienia"
              />
            </div>

            <div class="border border-[#d6dfe9] rounded-lg p-4 space-y-4">
              <h3 class="text-sm font-bold text-[#111827]">Przesyłki w Allegro</h3>

              <el-table
                v-if="shipments.length"
                :data="shipments"
                :border="true"
                class="!bg-[#d6dfe9]"
              >
                <el-table-column label="Przewoźnik" prop="carrierName" />
                <el-table-column label="ID przewoźnika" prop="carrierId" width="160" />
                <el-table-column label="Numer listu" prop="waybill" />
                <el-table-column label="Dodano" width="160">
                  <template #default="scope">
                    {{ formatDate(scope.row.createdAt) }}
                  </template>
                </el-table-column>
              </el-table>

              <el-empty
                v-else
                description="Brak numerów śledzenia w Allegro"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Produkty">
          <el-table :data="orderItems" :border="true" class="!bg-[#d6dfe9]">
            <el-table-column label="Nazwa produktu" prop="name">
              <template #default="scope">
                {{ scope.row.name || scope.row.productName || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Oferta Allegro" width="180">
              <template #default="scope">
                {{ scope.row.offerId || scope.row.offer?.id || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Ilość" width="80">
              <template #default="scope">
                {{ scope.row.quantity || 0 }}
              </template>
            </el-table-column>

            <el-table-column label="Cena" width="140">
              <template #default="scope">
                {{ formatPrice(scope.row.price || scope.row.amount) }}
              </template>
            </el-table-column>
          </el-table>
        </FormSection>

        <FormSection title="Surowe dane">
          <el-collapse>
            <el-collapse-item title="Pokaż JSON zamówienia" name="json">
              <pre class="json-preview">{{ JSON.stringify(order, null, 2) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </FormSection>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const order = ref<any>(null)
const carriers = ref<any[]>([])
const shipments = ref<any[]>([])
const invoices = ref<any[]>([])
const carriersLoading = ref(false)
const shipmentLoading = ref(false)
const fulfillmentLoading = ref(false)
const invoiceLoading = ref(false)

const fulfillmentForm = ref({
  status: 'PROCESSING'
})

const shipmentForm = ref({
  carrierId: '',
  waybill: ''
})

const fulfillmentStatusOptions = [
  { value: 'NEW', label: 'Nowe (NEW)' },
  { value: 'PROCESSING', label: 'W realizacji (PROCESSING)' },
  { value: 'READY_FOR_SHIPMENT', label: 'Gotowe do wysyłki (READY_FOR_SHIPMENT)' },
  { value: 'READY_FOR_PICKUP', label: 'Gotowe do odbioru (READY_FOR_PICKUP)' },
  { value: 'SENT', label: 'Wysłane (SENT)' },
  { value: 'PICKED_UP', label: 'Odebrane (PICKED_UP)' },
  { value: 'CANCELLED', label: 'Anulowane (CANCELLED)' }
]

const checkoutFormId = computed(() => String(route.params.checkoutFormId || ''))

const orderItems = computed(() => {
  return order.value?.items || order.value?.lineItems || order.value?.orderItems || []
})

const normalizeList = (result: any) => {
  const data = result?.data ?? result
  return Array.isArray(data) ? data : []
}

const loadCarriers = async () => {
  carriersLoading.value = true

  try {
    const result = await Api.allegro.getCarriers()
    carriers.value = normalizeList(result)
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać listy przewoźników Allegro')
  } finally {
    carriersLoading.value = false
  }
}

const loadShipments = async () => {
  if (!checkoutFormId.value) return

  try {
    const result = await Api.allegro.getOrderShipments(checkoutFormId.value)
    shipments.value = normalizeList(result)
  } catch (error) {
    console.error(error)
  }
}

const loadInvoices = async () => {
  if (!checkoutFormId.value) return

  try {
    const result = await Api.allegro.getOrderInvoices(checkoutFormId.value)
    invoices.value = normalizeList(result)
  } catch (error) {
    console.error(error)
  }
}

const loadAllegroOrderExtras = async () => {
  if (!order.value?.localOrderId) return

  fulfillmentForm.value.status = order.value.fulfillmentStatus || 'PROCESSING'

  await Promise.all([
    loadCarriers(),
    loadShipments(),
    loadInvoices()
  ])
}

const loadOrder = async () => {
  if (!checkoutFormId.value) {
    toast.error('Brak checkoutFormId')
    return
  }

  loading.value = true

  try {
    const result = await Api.allegro.getImportedOrder(checkoutFormId.value)
    order.value = result?.data || result
    await loadAllegroOrderExtras()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać szczegółów zamówienia Allegro')
  } finally {
    loading.value = false
  }
}

const saveFulfillmentStatus = async () => {
  if (!checkoutFormId.value || !fulfillmentForm.value.status) {
    toast.warning('Wybierz status realizacji')
    return
  }

  fulfillmentLoading.value = true

  try {
    await Api.allegro.updateOrderFulfillment(
      checkoutFormId.value,
      fulfillmentForm.value.status
    )

    toast.success('Zaktualizowano status realizacji w Allegro')
    await loadOrder()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zaktualizować statusu w Allegro')
  } finally {
    fulfillmentLoading.value = false
  }
}

const addShipment = async () => {
  if (!checkoutFormId.value || !shipmentForm.value.carrierId || !shipmentForm.value.waybill) {
    toast.warning('Uzupełnij przewoźnika i numer listu')
    return
  }

  shipmentLoading.value = true

  try {
    await Api.allegro.addOrderShipment(
      checkoutFormId.value,
      shipmentForm.value.carrierId,
      shipmentForm.value.waybill.trim()
    )

    toast.success('Dodano numer śledzenia w Allegro')
    shipmentForm.value.waybill = ''
    await loadOrder()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się dodać numeru śledzenia w Allegro')
  } finally {
    shipmentLoading.value = false
  }
}

const uploadInvoiceToAllegro = async () => {
  if (!checkoutFormId.value) return

  invoiceLoading.value = true

  try {
    const result = await Api.allegro.uploadOrderInvoiceFromLocalOrder(checkoutFormId.value)
    const data = result?.data || result

    toast.success(
      data?.createdNewInvoice
        ? `Wygenerowano i wysłano fakturę ${data.invoiceNumber || ''} do Allegro`
        : `Wysłano fakturę ${data?.invoiceNumber || ''} do Allegro`
    )

    await loadOrder()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się wysłać faktury do Allegro')
  } finally {
    invoiceLoading.value = false
  }
}

const createLocalOrder = async () => {
  if (!order.value) {
    toast.warning('Brak zamówienia Allegro')
    return
  }

  if (order.value.localOrderId) {
    toast.warning('To zamówienie ma już utworzone zamówienie lokalne')
    return
  }

  try {
    const settingsResult = await Api.allegro.getSettings()
    const settings = settingsResult?.data || settingsResult

    await Api.allegro.createLocalOrder(
      checkoutFormId.value,
      Api.allegro.buildCreateLocalOrderBody(settings)
    )

    toast.success('Utworzono zamówienie lokalne')
    await loadOrder()
    await loadAllegroOrderExtras()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się utworzyć zamówienia lokalnego')
  }
}

const goBack = () => {
  router.push('/allegro/orders')
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
    const amount = value.amount || value.value || 0
    const currency = value.currency || 'PLN'
    return `${amount} ${currency}`
  }

  return `${value} zł`
}

const fullName = (firstName?: string, lastName?: string) => {
  const result = `${firstName || ''} ${lastName || ''}`.trim()
  return result || '-'
}

onMounted(async () => {
  await loadOrder()
})
</script>

<style scoped>
.json-preview {
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  font-size: 11px;
  max-height: 500px;
  overflow: auto;
}

p {
  margin-top: 4px;
}
</style>