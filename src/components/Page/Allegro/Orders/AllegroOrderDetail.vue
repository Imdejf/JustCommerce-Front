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
              <strong>ID zamówienia lokalnego:</strong>
              <p>{{ order.localOrderId }}</p>
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

const checkoutFormId = computed(() => String(route.params.checkoutFormId || ''))

const orderItems = computed(() => {
  return order.value?.items || order.value?.lineItems || order.value?.orderItems || []
})

const loadOrder = async () => {
  if (!checkoutFormId.value) {
    toast.error('Brak checkoutFormId')
    return
  }

  loading.value = true

  try {
    const result = await Api.allegro.getImportedOrder(checkoutFormId.value)
    order.value = result?.data || result
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać szczegółów zamówienia Allegro')
  } finally {
    loading.value = false
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
    await Api.allegro.createLocalOrder(checkoutFormId.value, {
      storeId: null,
      createdById: null,
      defaultCustomerId: null,
      defaultLanguageId: null,
      defaultCountryId: null,
      defaultStateProvinceId: null,
      deliveryMethod: null,
      orderStatus: 1,
      paidPaymentStatus: 30,
      unpaidPaymentStatus: 10
    })

    toast.success('Utworzono zamówienie lokalne')
    await loadOrder()
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