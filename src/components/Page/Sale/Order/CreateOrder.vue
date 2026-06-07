<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { computed, ref, watch, onMounted, reactive  } from 'vue'
import ProductTable from '/@/components/Form/ProductTable/ProductTable.vue'
import Cookies from 'universal-cookie'
import {
  Combobox,
  Switch,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot
} from '@headlessui/vue'
import { Api } from '/@/services/api'
import { ProductOrder } from './type/ProductOrder.ts'
import { CreateOrder, OrderItem } from './type/CreateOrder.ts'
import jwt_decode from 'jwt-decode'

const props = defineProps({
  order: {
    type: Object as ObjectConstructor,
    default: () => ({} as CreateOrder)
  },
  updated: {
    type: Boolean,
    default: false
  }
})

enum OrderSourceType {
  Cart = 0,
  RegularCustomer = 1,
  Offer = 2,
  Phone = 3,
  Chat = 4,
  Email = 5,
  Allegro = 6
}

enum DeliveryMethodType {
  Courier = 0,
  PickUpOwn = 1
}

enum PaymentTerm {
  SevenDays = 0,
  FourteenDays = 1,
  TweentyOneDays = 2,
  ThirtyDays = 3,
  SixtyDays = 4,
  NinetyDays = 5,
  None = 99,
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

enum PaymentProvider {
  Przelewy24 = 0,
  StandardTransfer = 1,
  CashOnDelivery = 2,
}

const router = useRouter()
const currentOrder = ref(props.order)
const toast = useToast()
const cookies = new Cookies()

const users = ref([])
const selectedUser = ref(null)
const stateOrProvinces = ref([] as IStateOrProvince[])
const summaryProductTable = ref({
  items: [] as any[],
  shippingNetto: 0,
  shippingBrutto: 0,
  totalNetto: 0,
  totalBrutto: 0,
  totalSumBrutto: 0,
  transportIndividualPricing: false
})

const selectedBillingProvince = ref(null);
const selectedShippingProvince = ref(null);

const isNipProcessing = ref(false)
const lastQueriedNip = ref('')

const filter = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 5,
  SmartTableParam: {
    Search: {
      PredicateObject: {
        Email: ''
      }
    }
  }
})

let query = ref('')

let filteredProvince = computed(() =>
  query.value === ''
    ? stateOrProvinces.value
    : stateOrProvinces.value.filter((stateOrProvince) =>
        stateOrProvince.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.value.toLowerCase().replace(/\s+/g, ''))
      )
)

const selectUser = (user) => {
  currentOrder.userId = user.id
  selectedUser.value = user
  users.value = []
}

const removeUser = () => {
  currentOrder.userId = null
  selectedUser.value = null
  filter.value.SmartTableParam.Search.PredicateObject.Email = ''
}

const searchByNip = async (nip: string) => {
  // jeżeli wciąż wysyłamy poprzednie zapytanie – wyjdź
  if (isNipProcessing.value || !nip) return

  try {
    isNipProcessing.value = true

    const result = await Api.gusbir.getByNip(nip)
    const d = result.data

    currentOrder.value.billingAddress.isCompany = true
    currentOrder.value.billingAddress.companyName  = d.nazwa  || ''
    currentOrder.value.billingAddress.zipCode      = d.kodPocztowy || ''
    currentOrder.value.billingAddress.city         = d.miejscowosc || ''

    const cleanStreet = (d.ulica || '').replace(/^ul\.?\s*/i, '')
    const lokal = d.nrLokalu ? `/${d.nrLokalu}` : ''
    currentOrder.value.billingAddress.addressLine1 =
      `${cleanStreet} ${d.nrNieruchomosci}${lokal}`.trim()

    const province = stateOrProvinces.value.find(
      (p) => p.name.toLowerCase() === d.wojewodztwo.toLowerCase()
    )
    if (province) selectedBillingProvince.value = province

    lastQueriedNip.value = nip
  } catch (err) {
    console.error('Błąd GUS/BIR:', err)
    toast.error('Nie udało się pobrać danych z GUS/BIR')
  } finally {
    isNipProcessing.value = false
  }
}

function translatePaymentProvider(key) {
  const translations = {
    Przelewy24: 'Przelewy24',
    StandardTransfer: 'Przelew Standardowy',
    CashOnDelivery: 'Płatność za pobraniem'
  }
  return translations[key] || key
}

function translate(key) {
  const translations = {
    Cart: 'Koszyk',
    RegularCustomer: 'Stały Klient',
    Offer: 'Oferta',
    Phone: 'Telefon',
    Chat: 'Czat',
    Email: 'Email'
  }
  return translations[key] || key
}

function translateDeliveryMethodType(key) {
  const translations = {
    Courier: 'Kurier',
    PickUpOwn: 'Odbiór własny'
  }
  return translations[key] || key
}

function translatePaymentTerm(key) {
  const translations = {
    SevenDays: '7 dni',
    FourteenDays: '14 dni',
    TweentyOneDays: '21 dni',
    ThirtyDays: '30 dni',
    SixtyDays: '60 dni',
    NinetyDays: '90 dni',
    None: 'Brak',
  }
  return translations[key] || key
}

function translateOrderStatus(key) {
  const translations = {
    New: 'Nowe',
    OnHold: 'Wstrzymane',
    InProgress: 'W realizacji',
    Shipped: 'Wysłane',
    Complete: 'Zakończone',
    Canceled: 'Anulowane',
    Refunded: 'Zwrócone',
    Closed: 'Zamknięte',
    OverduePayment: 'Zaległa płatność',
    WorkOrder: 'Zlecenie robocze',
  }
  return translations[key] || key
}

const handleProductUpdate = (summary) => {
  summaryProductTable.value = summary;
}

const pageTitle = computed(() => (props.updated ? 'Edycja zamówienia' : 'Nowe zamówienie'))

const formatOrderPrice = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0)
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`
}

const orderSourceOptions = computed(() => {
  return Object.entries(OrderSourceType)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({ label: translate(key), value }))
})

const orderStatusOptions = computed(() => {
  return Object.entries(OrderStatus)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({ label: translateOrderStatus(key), value }))
})

const deliveryMethodOptions = computed(() => {
  return Object.entries(DeliveryMethodType)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({ label: translateDeliveryMethodType(key), value }))
})

const paymentProviderOptions = computed(() => {
  return Object.entries(PaymentProvider)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({ label: translatePaymentProvider(key), value }))
})

const paymentPaymentTerm = computed(() => {
  return Object.entries(PaymentTerm)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({ label: translatePaymentTerm(key), value }))
})

const predefinedPayment = ref([
{ label: "Przelew standradowy", value: 1 },
{ label: "Przelewy24", value: 0 },
{ label: "Płantość za pobraniem (+10zł)", value: 2 },
]);

const predefinedShipemnt = ref([
{ label: "Dostawa kurier", value: 0 },
{ label: "Odbiór osobisty", value: 1 },
]);

const handleOrder = async () => {
  if(!selectedBillingProvince.value) {
    toast.error('Wybierz województwo', {
      timeout: 2000,
    });    return;
  }

  if(!selectedShippingProvince.value && currentOrder.value.useShippingAddressAsBillingAddress) {
    toast.error('Wybierz województwo 2', {
      timeout: 2000,
    });
    return;
  }
  
const itemsFromTable = Array.isArray(summaryProductTable.value?.items)
  ? summaryProductTable.value.items
  : [];

if (itemsFromTable.length === 0) {
  toast.error('Dodaj co najmniej jedną pozycję do zamówienia.', { timeout: 2000 });
  return;
}
  if(currentOrder.value.paymentTerm != 99){
    currentOrder.value.paymentProvider = 5
  }

  // Sprawdzenie poprawności kodu pocztowego
  const zipCodeRegex = /^\d{2}-\d{3}$/;
  if (!zipCodeRegex.test(currentOrder.value.billingAddress.zipCode)) {
    toast.error('Kod pocztowy jest niepoprawny. Użyj formatu xx-xxx.', {
      timeout: 2000,
    });
    return;
  }

  const createOrderPayload: CreateOrder = {
    Id: currentOrder.value.orderId,
    StoreId: currentOrder.value.storeId,
    CustomerId: currentOrder.value.customerId,
    LanguageId: currentOrder.value.languageId,
    CreatedById: currentOrder.value.createdById,
    UseShippingAddressAsBillingAddress: !currentOrder.value.useShippingAddressAsBillingAddress,
    BillingAddress: {
      IsCompany: currentOrder.value.billingAddress.isCompany,
      FirstName: currentOrder.value.billingAddress.firstName,
      LastName: currentOrder.value.billingAddress.lastName,
      Email: currentOrder.value.billingAddress.email || null,
      CompanyName: currentOrder.value.billingAddress.companyName || null,
      Nip: currentOrder.value.billingAddress.nip || null,
      Phone: currentOrder.value.billingAddress.phone || null,
      AddressLine1: currentOrder.value.billingAddress.addressLine1,
      City: currentOrder.value.billingAddress.city,
      ZipCode: currentOrder.value.billingAddress.zipCode,
      StateOrProvinceId: selectedBillingProvince.value.id,
      CountryId: currentOrder.value.billingAddress.countryId,
    },
    ShippingAddress: currentOrder.value.useShippingAddressAsBillingAddress === false
      ? null
      : {
          IsCompany: currentOrder.value.shippingAddress.isCompany,
          FirstName: currentOrder.value.shippingAddress.firstName,
          LastName: currentOrder.value.shippingAddress.lastName,
          Email: currentOrder.value.shippingAddress.email || null,
          CompanyName: currentOrder.value.shippingAddress.companyName || null,
          Nip: currentOrder.value.shippingAddress.nip || null,
          Phone: currentOrder.value.shippingAddress.phone || null,
          AddressLine1: currentOrder.value.shippingAddress.addressLine1,
          City: currentOrder.value.shippingAddress.city,
          ZipCode: currentOrder.value.shippingAddress.zipCode,
          StateOrProvinceId: selectedShippingProvince.value.id,
          CountryId: currentOrder.value.shippingAddress.countryId,
        },
    DeliveryMethod: currentOrder.value.deliveryMethod,
    OrderStatus: currentOrder.value.orderStatus,
    OrderSourceType: currentOrder.value.orderSourceType,
    PaymentStatus: 10,
    PaymentProvider: currentOrder.value.paymentProvider,
    PaymentTerm: currentOrder.value.paymentTerm || null,
    OrderNoteForClient: currentOrder.value.orderNoteForClient ?? '',
    OrderNoteForCustomer: currentOrder.value.orderNoteForCustomer ?? '',
    OrderNoteOnInvoice: currentOrder.value.orderNoteOnInvoice ?? '',
    ShippingFeeAmountNetto: Number(summaryProductTable.value.shippingNetto) || 0,
    ShippingFeeAmountGross: Number(summaryProductTable.value.shippingBrutto) || 0,
    SubTotal:              Number(summaryProductTable.value.totalNetto) || 0,
    SubTotalGross:         Number(summaryProductTable.value.totalBrutto) || 0,
    TotalGross:            Number(summaryProductTable.value.totalSumBrutto) || 0,
    TransportIndividualPricing: !!summaryProductTable.value.transportIndividualPricing,
    Products: itemsFromTable
  };

  try {
    const payload = {
      body: JSON.stringify(createOrderPayload),
    };
    if(!props.updated) {
      await Api.orders.createOrder(payload)
      toast.success('Zamówienie zostało stworzone pomyślnie', {
        timeout: 2000,
      });

      await router.push('/sale/order');
    } else {
      await Api.orders.updateOrder(payload)
      toast.success('Zamówienie zostało edytowane pomyślnie', {
        timeout: 2000,
      });
      await router.push('/sale/order');
    }
    // router.go(-1)
  } catch (error) {
    console.error('Błąd podczas tworzenia zamówienia:', error);
    toast.error('Nie udało się stworzyć zamówienia', {
      timeout: 2000,
    });
};

}

onMounted(async () => {
  const storeId = cookies.get('dsStore')
  const url = `${
    import.meta.env.VITE_API_URL
  }product/shoppingcart/GetAvilableAddresses?storeId=${storeId}`
  fetch(url, {
    method: 'GET',
    credentials: 'include'
  })
    .then(async function (response) {
      if (response.status != 200) {
      } else {
        const json = await response.json()
        json.stateOrProvinces.map((stateProvince) => {
          stateOrProvinces.value.push({
            id: stateProvince.value,
            name: stateProvince.text
          })
        })

        if(props.updated) {
          selectedBillingProvince.value = stateOrProvinces.value.find(
            (c) => c.id === currentOrder.value.shippingAddress.stateOrProvinceId
          );
        }
      }
    })
    .catch((error) => {
      console.log(error)
    })
})

watch(
  filter.value,
  async (newFilter, oldFilter) => {
    if (newFilter.SmartTableParam.Search.PredicateObject.Email) {
      try {
        const payload = {
          body: JSON.stringify(newFilter)
        }
        const result = await Api.users.smartTable(payload)
        users.value = result.data
      } catch (error) {
        console.error(error)
      }
    }
  },
  { deep: true }
)

watch(
  () => currentOrder.value.billingAddress.nip,
  (newVal) => {
    if (newVal !== lastQueriedNip.value) {
      isNipProcessing.value = false
    }
  }
)

</script>
<template>
  <div class="order-form-page offer_input">
    <FormKit ref="myForm" type="form" @submit="handleOrder" :actions="false">
      <header class="order-form-header">
        <div>
          <p class="order-form-header__eyebrow">{{ updated ? 'Sprzedaż' : 'Sprzedaż · tworzenie' }}</p>
          <h1 class="order-form-header__title">{{ pageTitle }}</h1>
          <p class="order-form-header__desc">Uzupełnij dane klienta, produkty i warunki płatności w jednym miejscu.</p>
        </div>
        <div class="order-form-header__actions">
          <el-button @click="router.push('/sale/order')">Anuluj</el-button>
          <FormKit
            v-if="!updated"
            type="submit"
            label="Utwórz zamówienie"
            :classes="{ input: 'order-form-submit', outer: 'order-form-submit-wrap' }"
          />
          <FormKit
            v-else
            type="submit"
            label="Zapisz zmiany"
            :classes="{ input: 'order-form-submit', outer: 'order-form-submit-wrap' }"
          />
        </div>
      </header>

      <div class="order-form-layout">
        <div class="order-form-main">
          <section class="order-section">
            <div class="order-section__head">
              <h2>Podstawowe ustawienia</h2>
              <p>Źródło, status, dostawa i płatność</p>
            </div>
            <div class="order-section__body order-grid-4">
            <div class="flex-1">
            <FormKit
              type="select"
              placeholder="Źródło*"
              v-model="currentOrder.orderSourceType"
              :options="orderSourceOptions"
              label="Źródło*"
              validation="required"
              validation-visibility="live"
            />
          </div>
          <div class="flex-1">
            <FormKit
              type="select"
              placeholder="Status*"
              v-model="currentOrder.orderStatus"
              :options="orderStatusOptions"
              label="Status*"
              validation="required"
              validation-visibility="live"
            />
          </div>
          <div class="flex-1">
            <FormKit
                label="Sposób dostawy"
                type="select"
                :options="predefinedShipemnt"
                v-model="currentOrder.deliveryMethod"
            />
          </div>
          <div class="flex-1">
            <FormKit
                label="Sposób płatności"
                type="select"
                :options="predefinedPayment"
                v-model="currentOrder.paymentProvider"
            />
          </div>
            </div>
          </section>

          <section class="order-section">
            <div class="order-section__head">
              <h2>Notatki</h2>
              <p>Informacje wewnętrzne i komunikaty dla klienta</p>
            </div>
            <div class="order-section__body order-grid-2 offer_textarea">
              <FormKit
                type="textarea"
                label="Informacje dodatkowe dla sprzedawcy"
                validation-visibility="live"
                v-model="currentOrder.orderNoteForCustomer"
              />
              <FormKit
                type="textarea"
                label="Uwagi dla kupującego"
                validation-visibility="live"
                v-model="currentOrder.orderNoteForClient"
              />
            </div>
          </section>

          <section class="order-section">
            <div class="order-section__head">
              <h2>Szczegóły faktury</h2>
              <p>Termin płatności i dodatkowe informacje na dokumencie</p>
            </div>
            <div class="order-section__body order-invoice-grid offer_textarea">
              <FormKit
                label="Termin na fakturze"
                type="select"
                :options="paymentPaymentTerm"
                v-model="currentOrder.paymentTerm"
              />
              <FormKit
                type="textarea"
                label="Dodatkowa informacja na fakturze"
                validation-visibility="live"
                v-model="currentOrder.orderNoteOnInvoice"
              />
            </div>
          </section>

          <section class="order-section">
            <div class="order-section__head">
              <h2>Dane klienta i dostawy</h2>
              <p>Adres rozliczeniowy oraz opcjonalnie inny adres wysyłki</p>
            </div>
            <div class="order-section__body order-address-grid">
              <div class="order-address-card">
                <div class="order-address-card__head">
                  <h3>Dane zamawiającego</h3>
                  <div class="order-address-card__switch">
                    <span>Firma</span>
                    <el-switch
                      v-model="currentOrder.billingAddress.isCompany"
                      style="--el-switch-on-color: #3b82f6; --el-switch-off-color: #cbd5e1"
                    />
                  </div>
                </div>
                  <FormKit
                  type="text"
                  outer-class="w-[100%] inline fomik_form_witdh hidden_name "
                  placeholder="Nazwa użytkownika"
                  v-model="filter.SmartTableParam.Search.PredicateObject.Email"
                />
                <div v-if="selectedUser?.email" class="order-selected-user">
                  Wybrany użytkownik: <strong>{{ selectedUser.email }}</strong>
                  <el-button size="small" type="danger" text @click="removeUser()">Usuń</el-button>
                </div>
                <ul v-if="users?.items?.length" class="order-user-list">
                  <li v-for="user in users.items" :key="user.id" class="order-user-list__item">
                    <span>{{ user.email }}</span>
                    <el-button size="small" type="primary" @click="selectUser(user)">Wybierz</el-button>
                  </li>
                </ul>
                    <div class="order-address-fields">
                      <FormKit
                        type="text"
                        outer-class="hidden_name fomik_form_witdh"
                        v-model="currentOrder.billingAddress.email"
                        label="Email"
                        placeholder="Email"
                        :validation="'required'"
                        validation-visibility="live"
                        help=""
                      />
                        <FormKit
                        v-show="currentOrder.billingAddress.isCompany"
                        outer-class="hidden_name fomik_form_witdh"
                        type="text"
                        v-model="currentOrder.billingAddress.companyName"
                        label="Nazwa firmy"
                        placeholder="Nazwa firmy"
                        :validation="currentOrder.billingAddress.isCompany ? 'required' : ''"
                        validation-visibility="live"
                        help=""
                        />
                        <div class="flex gap-3">
                          <!-- FormKit zajmuje całą dostępną szerokość (flex‑1) -->
                          <FormKit
                            v-show="currentOrder.billingAddress.isCompany"
                            outer-class="hidden_name fomik_form_witdh flex-1"
                            type="text"
                            v-model="currentOrder.billingAddress.nip"
                            label="Nip"
                            placeholder="Nip"
                            :validation="currentOrder.billingAddress.isCompany ? 'required' : ''"
                            validation-visibility="live"
                            help=""
                          />
                          <el-button
                            v-show="currentOrder.billingAddress.isCompany"
                            @click="searchByNip(currentOrder.billingAddress.nip)"
                            class="w-1/4 mt-5"
                            type="primary"
                            round
                            :disabled="isNipProcessing || currentOrder.billingAddress.nip === lastQueriedNip"
                          >
                            <template v-if="isNipProcessing">
                              <i class="el-icon-loading mr-1" /> Szukam...
                            </template>
                            <template v-else>
                              Uzupełnij
                            </template>
                          </el-button>
                        </div>
                        <FormKit
                        v-show="!currentOrder.billingAddress.isCompany"
                        type="text"
                        v-model="currentOrder.billingAddress.firstName"
                        outer-class="hidden_name fomik_form_witdh"
                        label="Imię"
                        placeholder="Imię"
                        :validation="!currentOrder.billingAddress.isCompany ? 'required' : ''"
                        />
                        <FormKit
                          v-show="!currentOrder.billingAddress.isCompany"
                          type="text"
                          v-model="currentOrder.billingAddress.lastName"
                          outer-class="hidden_name fomik_form_witdh"
                          label="Nazwisko"
                          placeholder="Nazwisko"
                          :validation="!currentOrder.billingAddress.isCompany ? 'required' : ''"
                          help=""
                        />
                        <FormKit
                          outer-class="hidden_name fomik_form_witdh"
                          type="text"
                          v-model="currentOrder.billingAddress.phone"
                          label="Telefon"
                          placeholder="Telefon"
                          :validation="'required'"
                          validation-visibility="live"
                          help=""
                        />
                        <FormKit
                          type="text"
                          outer-class="hidden_name fomik_form_witdh"
                          v-model="currentOrder.billingAddress.addressLine1"
                          label="Ulica i numer domu"
                          placeholder="Ulica i numer domu"
                          :validation="'required'"
                          validation-visibility="live"
                          help=""
                        />
                        <div class="flex gap-2 w-full">
                          <FormKit
                            type="text"
                            outer-class="hidden_name w-[50%]"
                            name="zipCode"
                            v-model="currentOrder.billingAddress.zipCode"
                            label="Kod pocztowy"
                            placeholder="Kod pocztowy"
                            :validation="'required'"
                            validation-visibility="live"
                          />
                          <FormKit
                          type="text"
                          outer-class="hidden_name w-[50%]"
                          v-model="currentOrder.billingAddress.city"
                          label="Miasto"
                          placeholder="Miasto"
                          :validation="'required'"
                          validation-visibility="live"
                          help=""
                          />
                        </div>
                    </div>
              <span>Województwo</span>
              <Combobox v-model="selectedBillingProvince" >
              <div class="relative mt-1">
                <div
                  class="relative w-[330px] cursor-default outline-none overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
                  style="border: 1px solid #e2e8f0"
                >
                  <ComboboxInput
                    class="w-full py-2 pl-3 pr-10 outline-none text-sm leading-5 text-gray-900"
                    :displayValue="(person) => person?.name"
                    @change="query = $event.target.value"
                  />
                  <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-gray-400"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4l-6 6Z"
                      />
                    </svg>
                  </ComboboxButton>
                </div>
                <TransitionRoot
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  @after-leave="query = ''"
                >
                  <ComboboxOptions
                    class="block mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  >
                    <div
                      v-if="filteredProvince.length === 0 && query !== ''"
                      class="relative cursor-default select-none py-2 px-4 text-gray-700"
                    >
                      Nie znaleziono.
                    </div>

                    <ComboboxOption
                      v-for="person in filteredProvince"
                      as="template"
                      :key="person.id"
                      :value="person"
                      v-slot="{ selected, active }"
                    >
                      <li
                        class="relative cursor-default select-none py-2 pl-10 pr-4"
                        :class="{
                          'bg-emerald-50 text-blue-900': active,
                          'text-gray-900': !active
                        }"
                      >
                        <span
                          class="block truncate"
                          :class="{
                            'font-medium': selected,
                            'font-normal': !selected
                          }"
                        >
                          {{ person.name }}
                        </span>
                        <span
                          v-if="selected"
                          class="absolute inset-y-0 left-0 flex items-center pl-3"
                          :class="{
                            'text-blue-900': active,
                            'text-blue-800': !active
                          }"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-5 h-5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="m10 16.4l-4-4L7.4 11l2.6 2.6L16.6 7L18 8.4l-8 8Z"
                            />
                          </svg>
                        </span>
                      </li>
                    </ComboboxOption>
                  </ComboboxOptions>
                </TransitionRoot>
              </div>
            </Combobox>
              </div>

              <div class="order-address-card">
                <div class="order-address-card__head">
                  <h3>Adres dostawy</h3>
                  <div class="order-address-card__switch">
                    <span>Inny adres dostawy</span>
                    <el-switch
                      v-model="currentOrder.useShippingAddressAsBillingAddress"
                      style="--el-switch-on-color: #3b82f6; --el-switch-off-color: #cbd5e1"
                    />
                  </div>
                </div>
                      <p v-if="!currentOrder.useShippingAddressAsBillingAddress" class="order-address-hint">
                        Wysyłka na ten sam adres co dane zamawiającego.
                      </p>
                      <div v-show="currentOrder.useShippingAddressAsBillingAddress">
                        <FormKit
                            outer-class="hidden_name fomik_form_witdh"
                            v-if="currentOrder.useShippingAddressAsBillingAddress && !currentOrder.billingAddress.isCompany"
                            type="text"
                            v-model="currentOrder.shippingAddress.firstName"
                            label="Imię"
                            placeholder="Imię"
                            :validation="currentOrder.billingAddress.isCompany ? '' : 'required'"
                            validation-visibility="live"
                        />
                        <FormKit
                          outer-class="hidden_name fomik_form_witdh"
                          v-if="currentOrder.useShippingAddressAsBillingAddress && !currentOrder.billingAddress.isCompany"
                          type="text"
                          v-model="currentOrder.shippingAddress.lastName"
                          label="Nazwisko"
                          placeholder="Nazwisko"
                          :validation="currentOrder.billingAddress.isCompany ? '' : 'required'"
                          validation-visibility="live"
                          help=""
                        />
                        <FormKit
                          outer-class="hidden_name fomik_form_witdh"
                          v-if="currentOrder.useShippingAddressAsBillingAddress && currentOrder.billingAddress.isCompany"
                          type="text"
                          v-model="currentOrder.shippingAddress.lastName"
                          label="Nazwa firmy"
                          placeholder="Nazwa firmy"
                          :validation="currentOrder.billingAddress.isCompany ? 'required' : ''"
                          validation-visibility="live"
                          help=""
                        />
                        <FormKit
                          outer-class="hidden_name fomik_form_witdh"
                          v-if="currentOrder.useShippingAddressAsBillingAddress"
                          type="text"
                          v-model="currentOrder.shippingAddress.phone"
                          label="Telefon"
                          placeholder="Telefon"
                          :validation="'required'"
                          validation-visibility="live"
                          help=""
                        />
                        <FormKit
                          outer-class="hidden_name fomik_form_witdh"
                          v-if="currentOrder.useShippingAddressAsBillingAddress"
                          type="text"
                          v-model="currentOrder.shippingAddress.addressLine1"
                          label="Ulica i numer domu"
                          placeholder="Ulica i numer domu"
                          :validation="currentOrder.useShippingAddressAsBillingAddress ? 'required' : ''"
                          validation-visibility="live"
                          help=""
                        />
                        <div class="flex gap-2 w-full">
                          <FormKit
                          v-if="currentOrder.useShippingAddressAsBillingAddress"
                          outer-class="hidden_name fomik_form_witdh"
                          type="text"
                          v-model="currentOrder.shippingAddress.city"
                          label="Miasto"
                          placeholder="Miasto"
                          :validation="currentOrder.useShippingAddressAsBillingAddress ? 'required' : ''"
                          validation-visibility="live"
                          help=""
                        />
                        <FormKit
                          outer-class="hidden_name fomik_form_witdh"
                          v-if="currentOrder.useShippingAddressAsBillingAddress"
                          type="text"
                          v-model="currentOrder.shippingAddress.zipCode"
                          label="Kod pocztowy"
                          placeholder="Kod pocztowy"
                          :validation="currentOrder.useShippingAddressAsBillingAddress ? 'required' : ''"
                          validation-visibility="live"
                          help=""
                        />
                        </div>
                        <span>Województwo</span>
                        <Combobox v-model="selectedShippingProvince" >
                        <div class="relative mt-1">
                          <div
                            class="relative w-[330px] cursor-default outline-none overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
                            style="border: 1px solid #e2e8f0"
                          >
                            <ComboboxInput
                              class="w-full py-2 pl-3 pr-10 outline-none text-sm leading-5 text-gray-900"
                              :displayValue="(person) => person?.name"
                              @change="query = $event.target.value"
                            />
                            <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5 text-gray-400"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4l-6 6Z"
                                />
                              </svg>
                            </ComboboxButton>
                          </div>
                          <TransitionRoot
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            @after-leave="query = ''"
                          >
                            <ComboboxOptions
                              class="block mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                            >
                              <div
                                v-if="filteredProvince.length === 0 && query !== ''"
                                class="relative cursor-default select-none py-2 px-4 text-gray-700"
                              >
                                Nie znaleziono.
                              </div>

                              <ComboboxOption
                                v-for="person in filteredProvince"
                                as="template"
                                :key="person.id"
                                :value="person"
                                v-slot="{ selected, active }"
                              >
                                <li
                                  class="relative cursor-default select-none py-2 pl-10 pr-4"
                                  :class="{
                                    'bg-emerald-50 text-blue-900': active,
                                    'text-gray-900': !active
                                  }"
                                >
                                  <span
                                    class="block truncate"
                                    :class="{
                                      'font-medium': selected,
                                      'font-normal': !selected
                                    }"
                                  >
                                    {{ person.name }}
                                  </span>
                                  <span
                                    v-if="selected"
                                    class="absolute inset-y-0 left-0 flex items-center pl-3"
                                    :class="{
                                      'text-blue-900': active,
                                      'text-blue-800': !active
                                    }"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      class="w-5 h-5"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        fill="currentColor"
                                        d="m10 16.4l-4-4L7.4 11l2.6 2.6L16.6 7L18 8.4l-8 8Z"
                                      />
                                    </svg>
                                  </span>
                                </li>
                              </ComboboxOption>
                            </ComboboxOptions>
                          </TransitionRoot>
                        </div>
                      </Combobox>
                      </div>
              </div>
            </div>
          </section>

          <ProductTable
            :shipping-netto="currentOrder.shippingPrice ?? currentOrder.shippingFeeAmountNetto ?? 0"
            :shipping-brutto="currentOrder.shippingPriceGross ?? currentOrder.shippingFeeAmountGross ?? 0"
            :total-netto="currentOrder.totalItemPrice ?? currentOrder.subTotal ?? 0"
            :total-brutto="currentOrder.totalItemPriceGross ?? currentOrder.subTotalGross ?? 0"
            :total-sum-brutto="currentOrder.totalPriceGross ?? currentOrder.totalGross ?? 0"
            :transport-individual-pricing="currentOrder.transportIndividualPricing ?? false"
            :items="currentOrder.products ?? []"
            @update-product-table-summary="handleProductUpdate"
          />
        </div>

        <aside class="order-form-aside">
          <div class="order-summary-card">
            <h3>Podsumowanie</h3>
            <div class="order-summary-card__row">
              <span>Pozycje</span>
              <strong>{{ summaryProductTable.items?.length ?? 0 }}</strong>
            </div>
            <div class="order-summary-card__row">
              <span>Towar brutto</span>
              <strong>{{ formatOrderPrice(summaryProductTable.totalBrutto) }}</strong>
            </div>
            <div class="order-summary-card__row">
              <span>Transport brutto</span>
              <strong>{{ formatOrderPrice(summaryProductTable.shippingBrutto) }}</strong>
            </div>
            <div class="order-summary-card__row order-summary-card__row--total">
              <span>Razem brutto</span>
              <strong>{{ formatOrderPrice(summaryProductTable.totalSumBrutto) }}</strong>
            </div>
            <div class="order-summary-card__meta">
              <span>Status: {{ orderStatusOptions.find((o) => o.value === currentOrder.orderStatus)?.label ?? '—' }}</span>
              <span>Płatność: {{ predefinedPayment.find((o) => o.value === currentOrder.paymentProvider)?.label ?? '—' }}</span>
            </div>
          </div>
        </aside>
      </div>
    </FormKit>
  </div>
</template>

<style scoped>
.order-form-page {
  min-height: calc(100vh - 72px);
  padding: 16px 20px 32px;
  background:
    radial-gradient(ellipse 80% 50% at 0% 0%, rgba(59, 130, 246, 0.08), transparent),
    linear-gradient(180deg, #eff6ff 0%, #f8fafc 40%, #f1f5f9 100%);
}

.order-form-header {
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

.order-form-header__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.order-form-header__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
}

.order-form-header__desc {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.order-form-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.order-form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
}

.order-form-main {
  min-width: 0;
}

.order-section {
  margin-bottom: 16px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.order-section__head {
  padding: 16px 18px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc, #fff);
}

.order-section__head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.order-section__head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.order-section__body {
  padding: 16px 18px 18px;
}

.order-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.order-grid-2,
.order-invoice-grid,
.order-address-grid {
  display: grid;
  gap: 14px;
}

.order-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.order-invoice-grid {
  grid-template-columns: 220px minmax(0, 1fr);
}

.order-address-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.order-address-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  background: #f8fafc;
}

.order-address-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.order-address-card__head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.order-address-card__switch {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.order-address-hint {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
}

.order-selected-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ecfdf5;
  color: #047857;
  font-size: 13px;
}

.order-user-list {
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}

.order-user-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}

.order-form-aside {
  position: sticky;
  top: 16px;
}

.order-summary-card {
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 18px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.order-summary-card h3 {
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.order-summary-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed #e2e8f0;
  font-size: 13px;
  color: #475569;
}

.order-summary-card__row strong {
  color: #0f172a;
}

.order-summary-card__row--total {
  border-bottom: none;
  margin-top: 8px;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  font-size: 15px;
}

.order-summary-card__row--total strong {
  font-size: 20px;
  color: #1d4ed8;
}

.order-summary-card__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 1200px) {
  .order-form-layout {
    grid-template-columns: 1fr;
  }

  .order-form-aside {
    position: static;
  }

  .order-grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .order-address-grid,
  .order-grid-2,
  .order-invoice-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .order-form-header {
    flex-direction: column;
  }

  .order-grid-4 {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
.offer_input .formkit-wrapper {
  min-width: 100% !important;
}

.offer_input .formkit-wrapper .formkit-inner {
  height: 38px;
}

.offer_textarea .formkit-inner {
  height: auto !important;
  min-height: 110px;
}

.order-form-submit-wrap {
  margin: 0 !important;
}

.order-form-submit {
  border: none !important;
  border-radius: 12px !important;
  padding: 10px 18px !important;
  background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
  color: #fff !important;
  font-weight: 700 !important;
  cursor: pointer;
}

.order-form-submit:hover {
  opacity: 0.92;
}
</style>