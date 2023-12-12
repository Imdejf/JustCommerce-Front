<script lang="ts" setup>
import { useToast } from 'vue-toastification'
import { computed, ref, watch, onMounted } from 'vue'
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
import jwt_decode from 'jwt-decode'

const toast = useToast()
const cookies = new Cookies()
const productsList = ref<ProductOrder[]>([])
const searchProduct = ref('')
const orderProducts = ref<ProductOrder[]>([])
const token = cookies.get('Authorization')
const decoded = jwt_decode(token)
const stateOrProvinces = ref([] as IStateOrProvince[])

let selectedBillingProvince = ref(null)
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

const filterSearchProduct = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 5,
  SearchString: searchProduct.value
})

export interface IStateOrProvince {
  id: number
  name: string
}

export interface ProductDTO {
  Id: string
  Quantity: number
  PriceNetto: number
  ProducerPrice?: number | null
  Tax?: number | null
  ShippingPrice: number
  DescriptionForProducer: string
}

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
  NinetyDays = 5
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
  CashOnDelivery = 2
}

const users = ref([])

const currentOrder = ref({
  storeId: cookies.get('dsStore'),
  languageId: '40beaea2-f6e4-4414-8a10-2570718f13aa',
  createdById: decoded.sub,
  customerId: decoded.sub,
  orderSourceType: null,
  orderStatus: null,
  deliveryMethod: null,
  paymentProvider: null,
  paymentTerm: null,
  shippingFeeAmountNetto: 0,
  isPaid: false,
  userId: null,
  useShippingAddressAsBillingAddress: true,
  billingAddress: {
    isCompany: false,
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    nip: '',
    phone: '',
    addressLine1: '',
    stateOrProvinceId: '',
    city: '',
    zipCode: '',
    stateProvinceId: '',
    countryId: '0b64292c-e249-4906-ab48-429441745899'
  },
  shippingAddress: {
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    nip: '',
    phone: '',
    addressLine1: '',
    stateOrProvinceId: '',
    city: '',
    zipCode: '',
    stateProvinceId: '',
    countryId: '0b64292c-e249-4906-ab48-429441745899'
  },
  products: [],
  applyRules: false,
  orderNote: ''
})

const totalShippingPrice = computed(() => {
  return orderProducts.value.reduce((total, product) => {
    currentOrder.value.shippingFeeAmountNetto = +total + +product.shippingPriceNetto
    return +total + +product.shippingPriceNetto
  }, 0)
})

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
    NinetyDays: '90 dni'
  }
  return translations[key] || key
}

function translateOrderStatus(key) {
  const translations = {
    New: 'Nowe',
    OnHold: 'Wstrzymane',
    InProgress: 'W toku',
    Shipped: 'Wysłane',
    Complete: 'Zakończone',
    Canceled: 'Anulowane',
    Refunded: 'Zwrócone',
    Closed: 'Zamknięte',
    OverduePayment: 'Zaległa płatność',
    WorkOrder: 'Zlecenie robocze'
  }
  return translations[key] || key
}

const calculatePalletsAndCardboards = (product) => {
  const TAX_RATE = 0.23
  let shippingPrice = 0
  let quantitySum = product.quantity
  const rule = product.shippingRule

  // Logika dla palet
  if (rule.stackPallet) {
    while (quantitySum >= rule.conditionMinForQuantityPallet) {
      if (
        quantitySum === rule.conditionMinForQuantityPallet ||
        quantitySum <= rule.conditionMaxForQuantityPallet
      ) {
        shippingPrice += rule.shipmentPricePallet
        break
      } else if (quantitySum > rule.conditionMaxForQuantityPallet) {
        const palletCount = Math.floor(quantitySum / rule.conditionMaxForQuantityPallet)
        quantitySum -= palletCount * rule.conditionMaxForQuantityPallet
        shippingPrice += palletCount * rule.shipmentPricePallet
      }
    }
  }

  if (
    (quantitySum > 0 && quantitySum < rule.conditionMinForQuantityPallet) ||
    (quantitySum > 0 && !rule.stackPallet)
  ) {
    const cardboardCount = Math.ceil(quantitySum / rule.conditionMaxQuantity)
    shippingPrice += cardboardCount * rule.shipmentPrice
    quantitySum -= cardboardCount * rule.conditionMaxQuantity
  }

  const shippingAmount = shippingPrice / (1 + TAX_RATE)

  return shippingAmount
}

const priceGross = (item) => {
  return item.price * 1.23
}

const addProductToOrderHandle = async (item) => {
  filterSearchProduct.value.SearchString = ''
  item.usingRule = false
  item.quantity = 1
  item.shippingPriceNetto = 0
  item.shippingPriceGross = 0
  orderProducts.value.push(item)
}

const handleAddOrder = async () => {
  if (selectedBillingProvince.value == null) {
    toast.error('Wybierz województwo', {
      timeout: 2000
    })
    return
  }

  currentOrder.value.billingAddress.stateOrProvinceId = selectedBillingProvince.value.id
  currentOrder.value.shippingAddress.stateOrProvinceId = selectedBillingProvince.value.id

  currentOrder.value.products = orderProducts.value.map((product) => ({
    Id: product.id,
    Quantity: product.quantity,
    PriceNetto: product.priceNetto,
    ProducerPrice: product.producerPrice ?? null,
    Tax: product.tax ?? 23,
    ShippingPrice: product.shippingPriceNetto,
    DescriptionForProducer: product.name
  }))

  const payload = {
    body: JSON.stringify(currentOrder.value)
  }

  await Api.orders.createOrder(payload)
  toast.success('Stworzono zamówienie', {
    timeout: 2000
  })
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

const selectedUser = ref(null)

const removeUser = () => {
  currentOrder.userId = null
  selectedUser.value = null
}

const selectUser = (user) => {
  currentOrder.userId = user.id
  selectedUser.value = user
}

watch(
  filter.value,
  async (newFilter, oldFilter) => {
    if (newFilter.SmartTableParam.Search.PredicateObject.Email) {
      try {
        const payload = {
          body: JSON.stringify(newFilter)
        }
        const result = await Api.users.smartTable(payload)
        console.log('test')
        users.value = result.data
      } catch (error) {
        console.error(error)
      }
    }
  },
  { deep: true }
)

watch(filterSearchProduct.value, async (newFilterSearchProduct, oldFilterSearchProduct) => {
  if (newFilterSearchProduct.SearchString) {
    try {
      const payload = {
        body: JSON.stringify(newFilterSearchProduct)
      }

      const result = await Api.products.getByNameOrCode(payload)
      productsList.value = result.data.items
    } catch (error) {
      console.error(error)
    }
  }
})

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
      }
    })
    .catch((error) => {
      console.log(error)
    })
  // fetch(`/product/shoppingcart/GetAvilableAddresses?storeId=${cookies.get('dsStore')}`, {
  //   method: 'GET'
  // }).then(async (response) => {
  //   console.log(response)
  //   const data = await response.data
  //   console.log(data)
  //   response.data.value.stateOrProvinces.map((stateProvince) => {
  //     stateOrProvinces.value.push({
  //       id: stateProvince.value,
  //       name: stateProvince.text
  //     })
  //   })
  // })
})
</script>
<template>
  {{ orderProducts }}
  <ContentContainer :showLanguage="false">
    <FormKit ref="myForm" type="form" @submit="handleAddOrder" :actions="false">
      <div class="">
        <el-collapse accordion>
          <el-collapse-item name="1">
            <template #title> Zamówienie </template>
            <FormKit
              type="select"
              placeholder="Źródło"
              v-model="currentOrder.orderSourceType"
              :options="orderSourceOptions"
              label="Źródło"
              validation="required"
              validation-visibility="live"
            />
            <FormKit
              type="select"
              placeholder="Status"
              v-model="currentOrder.orderStatus"
              :options="orderStatusOptions"
              label="Status"
              validation="required"
              validation-visibility="live"
            />
            <FormKit
              type="checkbox"
              v-model="currentOrder.isPaid"
              label="Opłacone"
              validation="required"
              validation-visibility="live"
            />
            <FormKit
              type="select"
              placeholder="Wysyłka"
              v-model="currentOrder.deliveryMethod"
              :options="deliveryMethodOptions"
              label="Wysyłka"
              validation="required"
              validation-visibility="live"
            />
            <FormKit
              type="select"
              placeholder="Sposób płatności"
              v-model="currentOrder.paymentProvider"
              :options="paymentProviderOptions"
              label="Sposób płatności"
              validation="required"
              validation-visibility="live"
            />
            <FormKit type="textarea" name="note" label="Informacje dodatkowe" placeholder="..." />

            <FormKit
              type="textarea"
              name="note"
              label="Dodatkowa informacja na fakturze"
              placeholder="..."
            />

            <FormKit
              type="select"
              name="status"
              placeholder="Termin na fakturze"
              v-model="currentOrder.paymentTerm"
              :options="paymentPaymentTerm"
              label="Termin na fakturze"
            />
          </el-collapse-item>
        </el-collapse>
        <el-collapse accordion>
          <el-collapse-item name="2">
            <template #title> Zarejestrowany użytkownik </template>
            <FormKit
              type="text"
              label="Szukaj użytkownika"
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
          </el-collapse-item>
        </el-collapse>
        <el-collapse accordion>
          <el-collapse-item name="3">
            <template #title> Dane klienta </template>
            Zamówienie dla firmy?
            <el-switch
              v-model="currentOrder.billingAddress.IsCompany"
              class="ml-2"
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
            />
            <FormKit
              v-show="currentOrder.billingAddress.IsCompany"
              type="text"
              v-model="currentOrder.billingAddress.companyName"
              label="Nazwa firmy"
              :validation="currentOrder.billingAddress.IsCompany ? 'required' : ''"
              validation-visibility="live"
              help=""
            />
            <FormKit
              v-show="currentOrder.billingAddress.IsCompany"
              type="text"
              v-model="currentOrder.billingAddress.nip"
              label="Nip"
              :validation="currentOrder.billingAddress.IsCompany ? 'required' : ''"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentOrder.billingAddress.firstName"
              label="Imię"
              :validation="'required'"
              validation-visibility="live"
            />
            <FormKit
              type="text"
              v-model="currentOrder.billingAddress.lastName"
              label="Nazwisko"
              :validation="'required'"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentOrder.billingAddress.phone"
              label="Telefon"
              :validation="'required'"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentOrder.billingAddress.email"
              label="Email"
              :validation="'required'"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentOrder.billingAddress.addressLine1"
              label="Ulica i numer domu"
              :validation="'required'"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentOrder.billingAddress.city"
              label="Miasto"
              :validation="'required'"
              validation-visibility="live"
              help=""
            />
            <Combobox v-model="selectedBillingProvince">
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
            <FormKit
              type="text"
              v-model="currentOrder.billingAddress.zipCode"
              label="Kod pocztowy"
              :validation="'required'"
              validation-visibility="live"
              help=""
            />
          </el-collapse-item>
        </el-collapse>
        <el-collapse accordion>
          <el-collapse-item name="4">
            <template #title> Dane odbiorcy towaru </template>
            <el-switch
              v-model="currentOrder.useShippingAddressAsBillingAddress"
              class="ml-2"
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
            />

            <FormKit
              v-if="!currentOrder.useShippingAddressAsBillingAddress"
              type="text"
              v-model="currentOrder.shippingAddress.firstName"
              label="Imię"
              :validation="currentOrder.useShippingAddressAsBillingAddress ? '' : 'required'"
              validation-visibility="live"
            />
            <FormKit
              v-if="!currentOrder.useShippingAddressAsBillingAddress"
              type="text"
              v-model="currentOrder.shippingAddress.lastName"
              label="Nazwisko"
              :validation="currentOrder.useShippingAddressAsBillingAddress ? '' : 'required'"
              validation-visibility="live"
              help=""
            />
            <FormKit
              v-if="!currentOrder.useShippingAddressAsBillingAddress"
              type="text"
              v-model="currentOrder.shippingAddress.lastName"
              label="Nazwa firmy"
              :validation="currentOrder.useShippingAddressAsBillingAddress ? '' : 'required'"
              validation-visibility="live"
              help=""
            />
            <FormKit
              v-if="!currentOrder.useShippingAddressAsBillingAddress"
              type="text"
              v-model="currentOrder.shippingAddress.addressLine1"
              label="Ulica i numer domu"
              :validation="currentOrder.useShippingAddressAsBillingAddress ? '' : 'required'"
              validation-visibility="live"
              help=""
            />
            <FormKit
              v-if="!currentOrder.useShippingAddressAsBillingAddress"
              type="text"
              v-model="currentOrder.shippingAddress.city"
              label="Miasto"
              :validation="currentOrder.useShippingAddressAsBillingAddress ? '' : 'required'"
              validation-visibility="live"
              help=""
            />
            <FormKit
              v-if="!currentOrder.useShippingAddressAsBillingAddress"
              type="text"
              v-model="currentOrder.shippingAddress.zipCode"
              label="Kod pocztowy"
              :validation="currentOrder.useShippingAddressAsBillingAddress ? '' : 'required'"
              validation-visibility="live"
              help=""
            />
          </el-collapse-item>
        </el-collapse>
        <el-collapse accordion>
          <el-collapse-item name="5">
            <template #title> Szczegóły zamówienia </template>
            <div>
              <ul>
                <li class="my-10 w-full" v-for="product in orderProducts">
                  <div class="flex">
                    <FormKit
                      :wrapper-class="'min-w-[30vw] input-padding'"
                      type="text"
                      label="Nazwa produktu"
                      disabled
                      v-model="product.name"
                    />
                    <FormKit
                      type="number"
                      :wrapper-class="'ml-4 font-[2px]'"
                      label="Ilość"
                      step="1"
                      validation="required"
                      validation-visibility="live"
                      v-model="product.quantity"
                    />
                    <FormKit
                      type="number"
                      :wrapper-class="'ml-4 font-[2px]'"
                      label="Cena netto"
                      step="0.01"
                      validation="required"
                      validation-visibility="live"
                      v-model="product.priceNetto"
                    />

                    <div
                      class="formkit-outer"
                      data-family="text"
                      data-type="number"
                      data-complete="true"
                    >
                      <div class="formkit-wrapper ml-4">
                        <label class="formkit-label" for="input_0">Cena (brutto)</label>
                        <div class="formkit-inner">
                          <input
                            step="0.01"
                            disabled
                            class="formkit-input"
                            type="number"
                            name="temperature"
                            id="input_0"
                            aria-describedby="help-input_0"
                            :value="(product.priceNetto * 1.23).toFixed(2)"
                          />
                        </div>
                      </div>
                    </div>
                    <FormKit
                      type="number"
                      :wrapper-class="'ml-4'"
                      label="VAT"
                      step="1"
                      disabled
                      validation="required"
                      validation-visibility="live"
                      v-model="product.tax"
                    />
                    <FormKit
                      type="number"
                      :wrapper-class="'ml-4'"
                      label="Cena producenta"
                      step="0.01"
                      validation="required"
                      v-model="product.producerPrice"
                      validation-visibility="live"
                    />
                    <FormKit
                      :classes="{ outer: ' font-[10px]' }"
                      :wrapper-class="'w-[14vw] ml-4'"
                      type="textarea"
                      label="Informacja dla producenta"
                    />
                    <el-button
                      @click="removeProductRelated(product.id)"
                      color="#dc2626"
                      class="m-auto ml-4"
                      round
                      >Usuń</el-button
                    >
                  </div>
                  <div class="flex">
                    <div class="formkit-wrapper">
                      <label class="formkit-label" for="input_0"
                        >Cena transportu z reguł (netto)</label
                      >
                      <div class="formkit-inner">
                        <input
                          step="0.01"
                          disabled
                          class="formkit-input"
                          type="number"
                          name="temperature"
                          id="input_0"
                          aria-describedby="help-input_0"
                          :value="calculatePalletsAndCardboards(product).toFixed(2)"
                        />
                      </div>
                    </div>
                    <FormKit
                      type="number"
                      :wrapper-class="'ml-4'"
                      label="Cena transportu (netto)"
                      step="0.01"
                      validation="required"
                      v-model="product.shippingPriceNetto"
                      validation-visibility="live"
                    />
                  </div>
                </li>
              </ul>
            </div>
            <div class="border-t border-1 b-gray-400">
              <span class="text-lg">Podsumowanie</span>
              <div class="flex">
                <div class="formkit-wrapper">
                  <label class="formkit-label" for="input_0"
                    >Koszt transportu za karton/palete (netto)</label
                  >
                  <div class="formkit-inner">
                    <input
                      step="0.01"
                      disabled
                      class="formkit-input"
                      type="number"
                      name="temperature"
                      id="input_0"
                      aria-describedby="help-input_0"
                      :value="totalShippingPrice"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="border-t border-1 b-gray-400">
              <FormKit
                :classes="{ outer: '!mt-7' }"
                type="text"
                label="Jakiego produktu szukasz?"
                v-model="filterSearchProduct.SearchString"
              />
              <div v-if="filterSearchProduct.SearchString.length > 0">
                <ul class="bg-gray-200 p-5">
                  <li
                    v-for="product in productsList"
                    :key="product.id"
                    @click="addProductToOrderHandle(product)"
                    class="mb-2 cursor-pointer hover:bg-gray-300 p-2"
                  >
                    {{ product.name }}
                  </li>
                </ul>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
      <div class="w-full my-10">
        <FormKit
          type="submit"
          label="Dodaj zamówienie"
          style="display: flex; justify-content: flex-end"
        />
      </div>
    </FormKit>
  </ContentContainer>
</template>

<style>
.el-collapse-item__header {
  padding: 20px !important;
}

.el-collapse-item__content {
  padding: 20px !important;
}

.input-padding .formkit-input {
  padding: 12px;
  font-size: 10px;
}
</style>
