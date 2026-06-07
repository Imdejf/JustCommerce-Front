<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ref, watch, computed, onMounted } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import ProductTable from '/@/components/Form/ProductTable/ProductTable.vue'

const props = defineProps({
  offer: {
    type: Object as ObjectConstructor,
    default: () => ({})
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const toast = useToast()
const router = useRouter()
const currentOffer = ref(props.offer)

const initExpiration = () => {
  if (props.offer?.expirationTime) return new Date(props.offer.expirationTime)
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d
}

const expirationTime = ref(initExpiration())
const isCompany = ref(props.offer?.billingAddress?.isCompany ?? true)
const isCompanyToAnotherAddress = ref(props.offer?.shippingAddress?.isCompany ?? false)
const anotherAddressToShipment = ref(props.offer?.useShippingAddressAsBillingAddress === false)

const summaryProductTable = ref<any>({
  items: [],
  shippingNetto: 0,
  shippingBrutto: 0,
  totalNetto: 0,
  totalBrutto: 0,
  totalSumBrutto: 0,
  transportIndividualPricing: false
})

const realizationTerm = ref(currentOffer.value.realizationTerm || '2-3 dni')
const isCustomTerm = ref(false)
const isNipProcessing = ref(false)
const lastQueriedNip = ref('')

const pageTitle = computed(() =>
  props.updated
    ? `Edycja oferty${currentOffer.value.offerNumber ? ` #${currentOffer.value.offerNumber}` : ''}`
    : 'Nowa oferta handlowa'
)

const predefinedTerms = [
  { label: '2-3 dni', value: 0 },
  { label: '2-5 dni', value: 1 },
  { label: '7 dni', value: 2 },
  { label: '2-4 tyg.', value: 3 },
  { label: '3-4 tyg.', value: 5 },
  { label: '4-5 tyg.', value: 6 },
  { label: 'Wpisz własną wartość', value: 99 }
]

const predefinedPayment = [
  { label: 'Przelew standardowy', value: 1 },
  { label: 'Płatność za pobraniem (+10zł)', value: 2 }
]

const predefinedShipment = [
  { label: 'Dostawa kurier', value: 0 },
  { label: 'Odbiór osobisty', value: 1 }
]

const predefinedPaymentTerm = [
  { label: '7 dni', value: 0 },
  { label: '14 dni', value: 1 },
  { label: '21 dni', value: 2 },
  { label: '30 dni', value: 3 },
  { label: '60 dni', value: 4 },
  { label: '90 dni', value: 5 },
  { label: 'Brak', value: 99 }
]

const paymentLabel = computed(() =>
  predefinedPayment.find((o) => o.value === currentOffer.value.payment)?.label ?? '—'
)

const deliveryLabel = computed(() =>
  predefinedShipment.find((o) => o.value === currentOffer.value.deliveryMethod)?.label ?? '—'
)

const profitSummary = computed(() => {
  const items = summaryProductTable.value?.items ?? []
  const profit = items.reduce((sum: number, item: any) => {
    const net = Number(item.priceNetto) || 0
    const cost = Number(item.producerPriceNetto) || 0
    const qty = Number(item.quantity) || 0
    return sum + (net - cost) * qty
  }, 0)
  const revenue = items.reduce((sum: number, item: any) => {
    return sum + (Number(item.totalPriceNetto) || (Number(item.priceNetto) || 0) * (Number(item.quantity) || 0))
  }, 0)
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  return { profit, margin, revenue }
})

const marginTone = computed(() => {
  const m = profitSummary.value.margin
  if (m >= 25) return 'good'
  if (m >= 12) return 'ok'
  if (m > 0) return 'low'
  return 'none'
})

const formatPrice = (v?: number | null) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v ?? 0)

const handleProductUpdate = (summary: any) => {
  summaryProductTable.value = summary
}

const handleTermSelection = () => {
  if (realizationTerm.value === 'Wpisz własną wartość') {
    isCustomTerm.value = true
    realizationTerm.value = ''
  } else {
    isCustomTerm.value = false
  }
}

const handleCustomTermBackspace = (event: KeyboardEvent) => {
  if (realizationTerm.value.trim() === '' && event.key === 'Backspace') {
    isCustomTerm.value = false
    realizationTerm.value = predefinedTerms[0].label
  }
}

watch(realizationTerm, (v) => {
  currentOffer.value.realizationTerm = v
})

watch(
  () => currentOffer.value.billingAddress?.nip,
  (nip) => {
    if (nip !== lastQueriedNip.value) isNipProcessing.value = false
  }
)

watch(isCompany, (v) => {
  if (currentOffer.value.billingAddress) currentOffer.value.billingAddress.isCompany = v
})

watch(isCompanyToAnotherAddress, (v) => {
  if (currentOffer.value.shippingAddress) currentOffer.value.shippingAddress.isCompany = v
})

watch(anotherAddressToShipment, (v) => {
  currentOffer.value.useShippingAddressAsBillingAddress = !v
})

const ensureShippingAddress = () => {
  if (!currentOffer.value.shippingAddress) {
    currentOffer.value.shippingAddress = {
      isCompany: false,
      firstName: '',
      lastName: '',
      email: '',
      companyName: '',
      nip: '',
      phone: '',
      addressLine1: '',
      city: '',
      zipCode: '',
      stateOrProvinceId: '',
      countryId: currentOffer.value.billingAddress?.countryId ?? ''
    }
  }
}

const searchByNip = async (nip: string) => {
  if (!nip || isNipProcessing.value || nip === lastQueriedNip.value) return
  try {
    isNipProcessing.value = true
    const { data: d } = await Api.gusbir.getByNip(nip)
    isCompany.value = true
    currentOffer.value.billingAddress.companyName = d.nazwa || ''
    currentOffer.value.billingAddress.zipCode = d.kodPocztowy || ''
    currentOffer.value.billingAddress.city = d.miejscowosc || ''
    const street = (d.ulica || '').replace(/^ul\.?\s*/i, '')
    const lokal = d.nrLokalu ? `/${d.nrLokalu}` : ''
    currentOffer.value.billingAddress.addressLine1 = `${street} ${d.nrNieruchomosci}${lokal}`.trim()
    lastQueriedNip.value = nip
    toast.success('Dane firmy uzupełnione z GUS/BIR')
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się pobrać danych z GUS/BIR')
  } finally {
    isNipProcessing.value = false
  }
}

const handleSave = async () => {
  const taxRate = 0.23
  const toNumber = (v: any, def = 0) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : def
  }
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

  if (realizationTerm.value !== '99' && !isCustomTerm.value) {
    const selected = predefinedTerms.find((t) => t.label === realizationTerm.value)
    if (selected) currentOffer.value.realizationTerm = selected.label
  }

  currentOffer.value.useShippingAddressAsBillingAddress = !anotherAddressToShipment.value
  currentOffer.value.billingAddress.isCompany = isCompany.value
  if (anotherAddressToShipment.value && currentOffer.value.shippingAddress) {
    currentOffer.value.shippingAddress.isCompany = isCompanyToAnotherAddress.value
  }
  currentOffer.value.realizationTerm = realizationTerm.value

  currentOffer.value.totalItemPrice = round2(toNumber(summaryProductTable.value.totalNetto))
  currentOffer.value.totalItemPriceGross = round2(toNumber(summaryProductTable.value.totalBrutto))
  currentOffer.value.shippingPrice = round2(toNumber(summaryProductTable.value.shippingNetto || 0))
  currentOffer.value.shippingPriceGross = round2(toNumber(summaryProductTable.value.shippingBrutto || 0))
  currentOffer.value.transportIndividualPricing = !!summaryProductTable.value.transportIndividualPricing

  const totalSumBrutto = round2(toNumber(summaryProductTable.value.totalSumBrutto))
  currentOffer.value.totalPriceGross = totalSumBrutto
  currentOffer.value.totalPrice = round2(totalSumBrutto / (1 + taxRate))
  currentOffer.value.expirationTime = expirationTime.value?.toISOString?.() ?? new Date().toISOString()

  currentOffer.value.offerItems = (summaryProductTable.value.items ?? [])
    .filter((item: any) => {
      const hasProduct = !!item.productId && String(item.productId).length > 0
      const hasCustom =
        (item.productId === null || item.productId === '' || item.productId === undefined) &&
        !!(item.name && String(item.name).trim())
      return hasProduct || hasCustom
    })
    .map((item: any) => {
      const isCustom = item.productId === null || item.productId === '' || item.productId === undefined
      const quantity = toNumber(item.quantity, 1)
      const priceNetto = round2(toNumber(item.priceNetto))
      const priceGross = round2(toNumber(item.priceGross) || priceNetto * (1 + taxRate))
      const totalPriceNetto = round2(toNumber(item.totalPriceNetto) || quantity * priceNetto)
      const totalPriceGross = round2(toNumber(item.totalPriceGross) || totalPriceNetto * (1 + taxRate))
      const taxPercent = toNumber(item.tax, 23) || 23

      const mapped: any = {
        productId: isCustom ? null : item.productId,
        brandId: isCustom ? (item.brandId ?? null) : null,
        customName: isCustom ? String(item.name || '').trim() : null,
        customSku: isCustom ? (item.sku ? String(item.sku).trim() : null) : null,
        quantity,
        priceNetto,
        priceGross,
        taxPercent,
        producerPriceNetto: round2(toNumber(item.producerPriceNetto)),
        totalPriceNetto,
        totalPriceGross,
        noteForProducer: item.noteForProducer ?? null
      }
      if (props.updated && item.id) mapped.id = item.id
      return mapped
    })

  const payload = { body: JSON.stringify(currentOffer.value) }
  try {
    if (!props.updated) {
      await Api.offers.createOffer(payload)
      toast.success('Oferta została zapisana!')
    } else {
      await Api.offers.updateOffer(payload)
      toast.success('Oferta została zaktualizowana!')
    }
    await router.push('/sale/offer')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.message || 'Wystąpił błąd podczas zapisu oferty.')
  }
}

onMounted(() => {
  ensureShippingAddress()
  if (props.offer?.realizationTerm) {
    const match = predefinedTerms.find((t) => t.label === props.offer.realizationTerm)
    if (match) {
      realizationTerm.value = match.label
      isCustomTerm.value = false
    } else {
      realizationTerm.value = props.offer.realizationTerm
      isCustomTerm.value = true
    }
  }
})
</script>

<template>
  <div class="offer-form-page offer_input">
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <header class="offer-form-header">
        <div>
          <p class="offer-form-header__eyebrow">{{ updated ? 'Oferty · edycja' : 'Oferty · tworzenie' }}</p>
          <h1 class="offer-form-header__title">{{ pageTitle }}</h1>
          <p class="offer-form-header__desc">
            Ustaw warunki, dane klienta i produkty — podsumowanie z marżą po prawej.
          </p>
        </div>
        <div class="offer-form-header__actions">
          <el-button @click="router.push('/sale/offer')">Anuluj</el-button>
          <FormKit
            type="submit"
            :label="updated ? 'Zapisz ofertę' : 'Utwórz ofertę'"
            :classes="{ input: 'offer-form-submit', outer: 'offer-form-submit-wrap' }"
          />
        </div>
      </header>

      <div class="offer-form-layout">
        <div class="offer-form-main">
          <section class="offer-section">
            <div class="offer-section__head">
              <h2>Warunki oferty</h2>
              <p>Realizacja, płatność, dostawa i ważność dokumentu</p>
            </div>
            <div class="offer-section__body offer-grid-5">
              <FormKit
                v-if="!isCustomTerm"
                label="Termin realizacji"
                type="select"
                v-model="realizationTerm"
                :options="predefinedTerms.map((t) => ({ label: t.label, value: t.label }))"
                @change="handleTermSelection"
              />
              <FormKit
                v-else
                label="Własny termin realizacji"
                type="text"
                v-model="realizationTerm"
                @keydown="handleCustomTermBackspace"
              />
              <FormKit label="Sposób płatności" type="select" :options="predefinedPayment" v-model="currentOffer.payment" />
              <FormKit label="Sposób dostawy" type="select" :options="predefinedShipment" v-model="currentOffer.deliveryMethod" />
              <FormKit label="Termin na fakturze" type="select" :options="predefinedPaymentTerm" v-model="currentOffer.paymentTerm" />
              <div class="offer-date-field">
                <span class="offer-date-field__label">Ważna do</span>
                <el-date-picker
                  v-model="expirationTime"
                  type="date"
                  placeholder="Wybierz datę"
                  format="DD-MM-YYYY"
                  class="!w-full"
                />
              </div>
            </div>
          </section>

          <section class="offer-section">
            <div class="offer-section__head">
              <h2>Notatki</h2>
              <p>Informacje wewnętrzne i komunikat widoczny dla klienta</p>
            </div>
            <div class="offer-section__body offer-grid-2 offer_textarea">
              <FormKit type="textarea" label="Informacje dla sprzedawcy" v-model="currentOffer.offerNote" />
              <FormKit type="textarea" label="Uwagi dla kupującego" v-model="currentOffer.comment" />
            </div>
          </section>

          <section class="offer-section">
            <div class="offer-section__head">
              <h2>Nabywca i kontakt</h2>
              <p>Dane rozliczeniowe oraz osoba kontaktowa przy ofercie</p>
            </div>
            <div class="offer-section__body offer-address-grid">
              <div class="offer-address-card">
                <div class="offer-address-card__head">
                  <h3>Nabywca</h3>
                  <div class="offer-address-card__switch">
                    <span>Firma</span>
                    <el-switch v-model="isCompany" style="--el-switch-on-color: #3b82f6; --el-switch-off-color: #cbd5e1" />
                  </div>
                </div>
                <div v-show="isCompany">
                  <FormKit type="text" label="Nazwa firmy*" :validation="isCompany ? 'required' : ''" v-model="currentOffer.billingAddress.companyName" validation-visibility="live" />
                </div>
                <div v-show="!isCompany" class="offer-inline-2">
                  <FormKit type="text" label="Imię*" :validation="!isCompany ? 'required' : ''" v-model="currentOffer.billingAddress.firstName" validation-visibility="live" />
                  <FormKit type="text" label="Nazwisko*" :validation="!isCompany ? 'required' : ''" v-model="currentOffer.billingAddress.lastName" validation-visibility="live" />
                </div>
                <div class="offer-nip-row">
                  <FormKit type="text" label="NIP" v-model="currentOffer.billingAddress.nip" />
                  <el-button
                    type="primary"
                    :loading="isNipProcessing"
                    :disabled="!currentOffer.billingAddress?.nip || currentOffer.billingAddress.nip === lastQueriedNip"
                    @click="searchByNip(currentOffer.billingAddress.nip)"
                  >
                    GUS/BIR
                  </el-button>
                </div>
                <FormKit type="text" label="Ulica i nr" v-model="currentOffer.billingAddress.addressLine1" />
                <div class="offer-inline-2">
                  <FormKit type="text" label="Kod pocztowy" v-model="currentOffer.billingAddress.zipCode" />
                  <FormKit type="text" label="Miejscowość" v-model="currentOffer.billingAddress.city" />
                </div>
              </div>

              <div class="offer-address-card">
                <h3>Dane zamawiającego</h3>
                <FormKit type="text" label="Imię i nazwisko / nazwa" v-model="currentOffer.customerName" />
                <FormKit type="text" label="Email" v-model="currentOffer.customerEmail" />
                <FormKit type="text" label="Telefon" v-model="currentOffer.customerPhone" />
              </div>
            </div>
          </section>

          <section class="offer-section">
            <div class="offer-section__head offer-section__head--row">
              <div>
                <h2>Adres wysyłki</h2>
                <p>Opcjonalnie inny niż adres nabywcy</p>
              </div>
              <div class="offer-address-card__switch">
                <span>Inny adres wysyłki</span>
                <el-switch v-model="anotherAddressToShipment" style="--el-switch-on-color: #3b82f6; --el-switch-off-color: #cbd5e1" />
              </div>
            </div>
            <div v-if="anotherAddressToShipment" class="offer-section__body">
              <div class="offer-address-card">
                <div class="offer-address-card__head">
                  <h3>Wysyłka</h3>
                  <div class="offer-address-card__switch">
                    <span>Firma</span>
                    <el-switch v-model="isCompanyToAnotherAddress" style="--el-switch-on-color: #3b82f6; --el-switch-off-color: #cbd5e1" />
                  </div>
                </div>
                <div v-show="isCompanyToAnotherAddress">
                  <FormKit type="text" label="Nazwa firmy*" v-model="currentOffer.shippingAddress.companyName" :validation="isCompanyToAnotherAddress ? 'required' : ''" validation-visibility="live" />
                </div>
                <div v-show="!isCompanyToAnotherAddress" class="offer-inline-2">
                  <FormKit type="text" label="Imię*" v-model="currentOffer.shippingAddress.firstName" :validation="!isCompanyToAnotherAddress ? 'required' : ''" validation-visibility="live" />
                  <FormKit type="text" label="Nazwisko*" v-model="currentOffer.shippingAddress.lastName" :validation="!isCompanyToAnotherAddress ? 'required' : ''" validation-visibility="live" />
                </div>
                <FormKit type="text" label="NIP" v-model="currentOffer.shippingAddress.nip" />
                <FormKit type="text" label="Ulica i nr" v-model="currentOffer.shippingAddress.addressLine1" />
                <div class="offer-inline-2">
                  <FormKit type="text" label="Kod pocztowy" v-model="currentOffer.shippingAddress.zipCode" />
                  <FormKit type="text" label="Miejscowość" v-model="currentOffer.shippingAddress.city" />
                </div>
                <FormKit type="text" label="Telefon" v-model="currentOffer.shippingAddress.phone" />
              </div>
            </div>
            <div v-else class="offer-section__hint">Wysyłka na adres nabywcy (rozliczeniowy).</div>
          </section>

          <section class="offer-section offer-section--products">
            <div class="offer-section__head">
              <h2>Produkty i wycena</h2>
              <p>Pozycje oferty, transport i podsumowanie kwot</p>
            </div>
            <div class="offer-section__body offer-section__body--flush">
              <ProductTable
                :items="currentOffer.products"
                :shipping-netto="currentOffer.shippingPrice"
                :shipping-brutto="currentOffer.shippingPriceGross"
                :total-netto="currentOffer.totalItemPrice"
                :total-brutto="currentOffer.totalItemPriceGross"
                :total-sum-brutto="currentOffer.totalPriceGross"
                :transport-individual-pricing="currentOffer.transportIndividualPricing"
                @update-product-table-summary="handleProductUpdate"
              />
            </div>
          </section>
        </div>

        <aside class="offer-form-aside">
          <div class="offer-summary-card offer-summary-card--cosmic">
            <div class="offer-summary-card__glow" />
            <h3>Podsumowanie oferty</h3>
            <div class="offer-summary-card__row">
              <span>Pozycje</span>
              <strong>{{ summaryProductTable.items?.length ?? 0 }}</strong>
            </div>
            <div class="offer-summary-card__row">
              <span>Towar brutto</span>
              <strong>{{ formatPrice(summaryProductTable.totalBrutto) }}</strong>
            </div>
            <div class="offer-summary-card__row">
              <span>Transport brutto</span>
              <strong>{{ formatPrice(summaryProductTable.shippingBrutto) }}</strong>
            </div>
            <div class="offer-summary-card__row offer-summary-card__row--total">
              <span>Razem brutto</span>
              <strong>{{ formatPrice(summaryProductTable.totalSumBrutto) }}</strong>
            </div>
            <div class="offer-summary-card__divider" />
            <div class="offer-summary-card__row">
              <span>Zysk netto (szac.)</span>
              <strong class="profit-value">{{ formatPrice(profitSummary.profit) }}</strong>
            </div>
            <div class="offer-summary-card__row">
              <span>Marża netto</span>
              <strong class="margin-chip" :class="`margin-chip--${marginTone}`">
                {{ profitSummary.margin.toFixed(1) }}%
              </strong>
            </div>
            <div class="offer-summary-card__meta">
              <span>{{ paymentLabel }}</span>
              <span>{{ deliveryLabel }}</span>
              <span v-if="realizationTerm">Realizacja: {{ realizationTerm }}</span>
            </div>
          </div>
        </aside>
      </div>
    </FormKit>
  </div>
</template>

<style scoped>
.offer-form-page {
  min-height: calc(100vh - 72px);
  padding: 16px 20px 32px;
  background:
    radial-gradient(ellipse 80% 50% at 0% 0%, rgba(249, 115, 22, 0.1), transparent),
    linear-gradient(180deg, #eff6ff 0%, #f8fafc 40%, #f1f5f9 100%);
}

.offer-form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.offer-form-header__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ea580c;
}

.offer-form-header__title { margin: 0; font-size: 28px; font-weight: 900; color: #0f172a; }
.offer-form-header__desc { margin: 6px 0 0; color: #64748b; font-size: 14px; }
.offer-form-header__actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.offer-form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
}

.offer-form-main { min-width: 0; }

.offer-section {
  margin-bottom: 16px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.offer-section__head {
  padding: 16px 18px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc, #fff);
}

.offer-section__head--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.offer-section__head h2 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
.offer-section__head p { margin: 4px 0 0; font-size: 13px; color: #64748b; }
.offer-section__body { padding: 16px 18px 18px; }
.offer-section__body--flush { padding: 0; }
.offer-section__hint { padding: 14px 18px 18px; font-size: 13px; color: #64748b; font-style: italic; }

.offer-grid-5 {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.offer-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.offer-address-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }

.offer-address-card {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.offer-address-card h3 { margin: 0 0 12px; font-size: 15px; font-weight: 800; color: #334155; }
.offer-address-card__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.offer-address-card__head h3 { margin: 0; }
.offer-address-card__switch { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }

.offer-inline-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.offer-nip-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; margin-bottom: 8px; }

.offer-date-field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.offer-form-aside { position: sticky; top: 72px; }

.offer-summary-card {
  position: relative;
  overflow: hidden;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
}

.offer-summary-card--cosmic {
  background: linear-gradient(135deg, #431407 0%, #9a3412 45%, #c2410c 100%);
  box-shadow: 0 16px 40px rgba(194, 65, 12, 0.28);
}

.offer-summary-card__glow {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 70% 20%, rgba(255, 255, 255, 0.7), transparent);
  pointer-events: none;
}

.offer-summary-card h3 {
  position: relative;
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.9);
}

.offer-summary-card__row {
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
}

.offer-summary-card__row strong { color: #fff; font-weight: 800; }
.offer-summary-card__row--total {
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 15px;
}

.offer-summary-card__divider {
  height: 1px;
  margin: 8px 0;
  background: rgba(255, 255, 255, 0.1);
}

.profit-value { color: #6ee7b7 !important; }

.margin-chip { font-size: 14px; }
.margin-chip--good { color: #6ee7b7 !important; }
.margin-chip--ok { color: #fdba74 !important; }
.margin-chip--low { color: #fcd34d !important; }
.margin-chip--none { color: #94a3b8 !important; }

.offer-summary-card__meta {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 11px;
  color: rgba(226, 232, 240, 0.75);
}

:deep(.offer-form-submit-wrap) { margin: 0; }
:deep(.offer-form-submit) {
  padding: 10px 20px !important;
  border-radius: 10px !important;
  background: linear-gradient(135deg, #ea580c, #f97316) !important;
  color: #fff !important;
  font-weight: 700 !important;
  border: none !important;
}

@media (max-width: 1200px) {
  .offer-form-layout { grid-template-columns: 1fr; }
  .offer-form-aside { position: static; }
  .offer-grid-5 { grid-template-columns: repeat(2, 1fr); }
  .offer-address-grid { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  .offer-form-header { flex-direction: column; }
  .offer-grid-5, .offer-grid-2, .offer-inline-2 { grid-template-columns: 1fr; }
}
</style>

<style>
.offer_input .formkit-wrapper { min-width: 100% !important; }
.offer_textarea .formkit-inner { height: auto !important; min-height: 100px; }
.offer_input .formkit-wrapper .formkit-inner { min-height: 36px; height: auto; }
</style>
