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
  Email = 5
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
const summaryProductTable = ref([])

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
  console.log(summaryProductTable.value)
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
  
  if(currentOrder.value.products.length == 0 || currentOrder.value.products == null)
  {
    toast.error('Musisz utworzyć koszyk', {
      timeout: 2000,
    });
    return
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

  console.log(currentOrder.value.billingAddress)

  const createOrderPayload: CreateOrder = {
    Id: currentOrder.value.orderId,
    StoreId: currentOrder.value.storeId,
    CustomerId: currentOrder.value.customerId,
    LanguageId: currentOrder.value.languageId,
    CreatedById: currentOrder.value.createdById,
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
    OrderNoteForClient: currentOrder.value.orderNoteForClient,
    OrderNoteForCustomer: currentOrder.value.orderNoteForCustomer,
    OrderNoteOnInvoice: currentOrder.value.orderNoteOnInvoice,
    ShippingFeeAmountNetto: summaryProductTable.value.shippingNetto,
    ShippingFeeAmountGross: summaryProductTable.value.shippingBrutto,
    SubTotal: summaryProductTable.value.totalNetto,
    TotalGross: summaryProductTable.value.totalSumBrutto,
    SubTotalGross: summaryProductTable.value.totalBrutto,
    UseShippingAddressAsBillingAddress: !currentOrder.value.useShippingAddressAsBillingAddress,
    IsPaid: currentOrder.value.isPaid,
    TransportIndividualPricing: summaryProductTable.value.transportIndividualPricing,
    Products: summaryProductTable.value.items
  };
  console.log(createOrderPayload)

  try {
    const payload = {
      body: JSON.stringify(createOrderPayload),
    };
    if(!props.updated) {
      await Api.orders.createOrder(payload)
      toast.success('Zamówienie zostało stworzone pomyślnie', {
        timeout: 2000,
      });
    } else {
      await Api.orders.updateOrder(payload)
      toast.success('Zamówienie zostało edytowane pomyślnie', {
        timeout: 2000,
      });
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
        console.log(response.status)
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
    <ContentContainer :showLanguage="false" class="offer_input !overflow-auto w-full !h-[90vh]">
    <div class="mx-[10rem]">
        <FormKit ref="myForm" type="form" @submit="handleOrder" :actions="false">
          <div class="inline-flex justify-center items-center w-full">
            <hr class="mt-2 w-full bg-gray-200 border-0.5 border-gray-300">
            <h1 class="absolute px-2 font-semibold text-2xl text-orange-400 bg-blue-50"> Zamówienie </h1>
          </div>  
          <div class="flex gap-4 w-full mt-4">
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
      <div class="flex gap-10 offer_textarea">
                <FormSection>
                <FormKit
                  type="textarea"
                  label="Informacje dodatkowe dla sprzedawcy"
                  validation-visibility="live"
                  v-model="currentOrder.orderNoteForCustomer"
                  :sections-schema="{
                    outer: {
                      $el: 'div',
                      attrs: {
                        style: { width: '500px' }
                      }
                    }
                  }"
                />
              </FormSection>
              <FormSection>
                <FormKit
                  type="textarea"
                  label="Uwagi dla kupującego"
                  validation-visibility="live"
                  v-model="currentOrder.orderNoteForClient"
                  :sections-schema="{
                    outer: {
                      $el: 'div',
                      attrs: {
                        style: { width: '500px' }
                      }
                    }
                  }"
                />
              </FormSection>
          </div>
          <div class="inline-flex justify-center items-center w-full">
            <hr class="mt-2 w-full bg-gray-200 border-0.5 border-gray-300">
            <h1 class="absolute px-2 font-semibold text-2xl text-orange-400 bg-blue-50"> Szczegóły faktury </h1>
          </div>
          <div class="flex gap-4 w-2/3 mt-5">
            <div class="">
                  <FormKit
                    label="Termin na fakturze"
                    type="select"
                    :options="paymentPaymentTerm"
                    v-model="currentOrder.paymentTerm"
                    :sections-schema="{
                    outer: {
                      $el: 'div',
                      attrs: {
                        style: { width: '200px' }
                      }
                    }
                  }"
                />
            </div>
            <div>
              <div class="flex gap-10 offer_textarea">
              <FormKit
                  type="textarea"
                  label="Dodatkowa informacja na fakturze"
                  validation-visibility="live"
                  v-model="currentOrder.orderNoteOnInvoice"
                  :sections-schema="{
                    outer: {
                      $el: 'div',
                      attrs: {
                        style: { width: '400px' }
                      }
                    }
                  }"
                />
                </div>
            </div>
          </div>
          <div class="inline-flex justify-center items-center w-full">
            <hr class="mt-2 w-full bg-gray-200 border-0.5 border-gray-300">
            <h1 class="absolute px-2 font-semibold text-2xl text-orange-400 bg-blue-50"> Szczegóły zamówienia </h1>
          </div>
          <div class="grid grid-cols-2 justify-between mt-3 flex" style="grid-template-columns: 400px 400px;">
            <div class="w-full">
              <div class="bg-white rounded-md shadow-md p-4">
                <h2 class="text-xl font-bold my-2">Dane zamawiającego</h2>
                  <FormKit
                  type="text"
                  outer-class="w-[100%] inline fomik_form_witdh hidden_name "
                  placeholder="Nazwa użytkownika"
                  v-model="filter.SmartTableParam.Search.PredicateObject.Email"
                />
                Wybrano: {{ selectedUser?.email }}
                <div>
                  <ul>
                    <li v-for="user in users.items" :key="user.id" class="flex gap-2 mt-5">
                      <div class="w-[60%] overflow-hidden whitespace-no-wrap overflow-auto"></div>
                      {{ user.email }}
                      <div class="w-[25%] m-auto text-center">
                        <el-button @click="selectUser(user)" color="#60a5fa" round>Wybierz</el-button>
                      </div>
                    </li>
                    <el-button @click="removeUser()" color="#ef4444" round>Usuń użytkownika</el-button>
                  </ul>
                  </div>
                  <div class="mt-3 text-center">
                    <h3>Zamówienie na firmę?</h3>
                    <el-switch
                      v-model="currentOrder.billingAddress.isCompany"
                      class="ml-2"
                      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                    />
                  </div>
                    <div>
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
                </div>
                <div class="w-full">
                  <div class="bg-white rounded-md shadow-md p-4">                  
                    <div class="mt-3 text-center">
                      <h3>Dostawa pod inny adres?
                      </h3>
                    </div>
                      <el-switch
                        v-model="currentOrder.useShippingAddressAsBillingAddress"
                        class="ml-2"
                        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                      />
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
          </div>
          <ProductTable
          :shippingNetto="order.shippingPrice"
          :shippingBrutto="order.shippingPriceGross"
          :totalNetto="order.totalItemPrice"
          :totalBrutto="order.totalItemPriceGross"
          :totalSumBrutto="order.totalPriceGross"
          :transportIndividualPricing="order.transportIndividualPricing"
          :items="order.products"
          @updateProductTableSummary="handleProductUpdate"/>
          <div class="save-button w-full my-10">
            <FormKit v-if="!updated" type="submit" label="Dodaj zamówienie" style="display: flex; justify-content: flex-end" />
            <FormKit v-if="updated" type="submit" label="Edytuj zamówienie" style="display: flex; justify-content: flex-end" />
        </div>
        </FormKit>
        </div>
    </ContentContainer>
</template>

<style>
.offer_input .formkit-wrapper {
    min-width: 100% !important;
}

.check_box_offer .formkit-inner {
  height:auto !important;
}

.offer_textarea .formkit-inner {
  height:auto !important;
}
.offer_input .formkit-wrapper .formkit-inner {
    height:30px;
}
</style>