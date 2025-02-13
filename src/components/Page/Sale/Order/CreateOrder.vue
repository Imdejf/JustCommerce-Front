<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { computed, ref, watch, onMounted, reactive  } from 'vue'
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

const router = useRouter()
const currentOrder = ref(props.order)
const toast = useToast()
const cookies = new Cookies()
const productsList = ref<ProductOrder[]>([])
const searchProduct = ref('')
const orderProducts = ref<OrderItem[]>([])
const token = cookies.get('Authorization')
const decoded = jwt_decode(token)
const stateOrProvinces = ref([] as IStateOrProvince[])
const isSelectedDeliveryOptionInvalid = ref(false);
const isSelectedPaymentOptionInvalid = ref(null);
const selectedBillingProvince = ref(null);
const selectedShippingProvince = ref(null);

const paymentOptions = [
  { label: 'Przelew standardowy (proforma)', value: '1' },
  { label: 'Płatność za pobraniem', value: '2' },
  { label: 'Przelew online (P24)', value: '0' },
  { label: 'Termin', value: '5' },
];

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
  ProducerPriceNetto?: number | null
  Tax?: number | null
  ShippingPrice: number
  NoteForProducer: string
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
  CashOnDelivery = 2
}

const users = ref([])


function updateGrossAndNet(product) {
  const TAX_RATE = 0.23;

  // Aktualizuj cenę brutto na podstawie netto
  // if (product.priceNetto !== undefined) {
  //   product.priceGross = (product.priceNetto * (1 + TAX_RATE)).toFixed(2);
  // }

  // Aktualizuj cenę netto na podstawie brutto
  // if (product.priceGross !== undefined) {
  //   product.priceNetto = (product.priceGross / (1 + TAX_RATE)).toFixed(2);
  // }

  // Aktualizuj transport brutto na podstawie netto
  if (product.shippingPriceNetto !== undefined) {
    product.shippingPriceGross = (product.shippingPriceNetto * (1 + TAX_RATE)).toFixed(2);
  }

  // Aktualizuj transport netto na podstawie brutto
  if (product.shippingPriceGross !== undefined) {
    product.shippingPriceNetto = (product.shippingPriceGross / (1 + TAX_RATE)).toFixed(2);
  }
  // if(product.realShippingFeeAmountNetto !== undefined) {
  //   product.realShippingFeeAmountGross = product.shippingRule.shipmentPrice;
  // }

  // if(product.realShippingFeeAmountGross !== undefined) {
  //   product.realShippingFeeAmountNetto = (product.shippingRule.shipmentPrice / (1 + TAX_RATE)).toFixed(2);
  // }
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

  product.realShippingFeeAmountNetto = (shippingPrice / (1 + TAX_RATE)).toFixed(2)
  product.realShippingFeeAmountGross = shippingPrice.toFixed(2)

  return shippingAmount
}

const priceGross = (item) => {
  return item.price * 1.23
}

const handleOrder = async () => {
  if (currentOrder.value.deliveryMethod == null) {
    isSelectedDeliveryOptionInvalid.value = true;
    toast.error('Proszę wybrać opcję dostawy.', {
      timeout: 2000,
    });
    return;
  }

  if(currentOrder.value.paymentProvider == null) {
    isSelectedPaymentOptionInvalid.value = true;
    toast.error('Proszę wybrać metodę płatności', {
      timeout: 2000,
    });
    return;
  }
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

  if (!currentOrder.value.billingAddress?.zipCode) {
    toast.error('Kod pocztowy jest wymagany.', {
      timeout: 2000,
    });
    return;
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
    Id: currentOrder.value.id,
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
    ShippingFeeAmountNetto: currentOrder.value.shippingFeeAmountNetto,
    RealShippingFeeAmountNetto: currentOrder.value.realShippingFeeAmountNetto,
    ShippingFeeAmountGross: currentOrder.value.shippingFeeAmountGross,
    RealShippingFeeAmountGross: currentOrder.value.realShippingFeeAmountGross,
    SubTotal: currentOrder.value.subTotal,
    TotalGross: currentOrder.value.totalGross,
    SubTotalGross: currentOrder.value.subTotalGross,
    UseShippingAddressAsBillingAddress: !currentOrder.value.useShippingAddressAsBillingAddress,
    IsPaid: currentOrder.value.isPaid,
    Products: currentOrder.value.products
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

const addProductToOrderHandle = async (item) => {
  filterSearchProduct.value.SearchString = ''
  item.usingRule = false
  item.quantity = 1
  item.shippingPriceNetto = 0
  item.shippingPriceGross = 0
  item.realShippingFeeAmountNetto = 0
  item.realShippingFeeAmountGross = 0
  item. noteForProducer = ""
  currentOrder.value.products.push(item)
}

const orderSourceOptions = computed(() => {
  return Object.entries(OrderSourceType)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({ label: translate(key), value }))
})

const filteredPaymentOptions = computed(() => {
  if (currentOrder.value.paymentTerm === 99) {
    return paymentOptions.filter(option => option.value !== '5');
  }
  return paymentOptions.filter(option => option.value === '5');
});

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

const removeProductRelated = (productId: string) => {
  currentOrder.value.products = currentOrder.value.products.filter(product => product.id !== productId);
};

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
      console.log(productsList.value)
    } catch (error) {
      console.error(error)
    }
  }
})

watch(
  currentOrder.value.products,
  (newProducts) => {
    // Oblicz wartości na podstawie nowych produktów
    let subTotal = 0;
    let subTotalGross = 0;
    let shippingFeeNetto = 0;
    let shippingFeeGross = 0;
    let realShippingFeeNetto = 0;
    let realShippingFeeGross = 0;

    newProducts.forEach((product) => {
      updateGrossAndNet(product);

      subTotalGross += parseFloat((product.priceNetto * product.quantity * 1.23).toFixed(2));
      subTotal += parseFloat((product.priceNetto * product.quantity).toFixed(2));

      shippingFeeNetto += parseFloat(product.shippingPriceNetto);
      shippingFeeGross += parseFloat(product.shippingPriceGross);

      realShippingFeeNetto += parseFloat(product.realShippingFeeAmountNetto).toFixed(2);
      realShippingFeeGross += parseFloat(product.realShippingFeeAmountGross).toFixed(2);
    });

    currentOrder.value.shippingFeeAmountNetto = shippingFeeNetto.toFixed(2);
    currentOrder.value.shippingFeeAmountGross = shippingFeeGross.toFixed(2);
    currentOrder.value.realShippingFeeAmountNetto = parseFloat(realShippingFeeNetto).toFixed(2);
    currentOrder.value.realShippingFeeAmountGross = parseFloat(realShippingFeeGross).toFixed(2);
    currentOrder.value.subTotal = parseFloat(subTotal).toFixed(2);
    currentOrder.value.subTotalGross = parseFloat(subTotalGross).toFixed(2);
    currentOrder.value.totalNetto = parseFloat(subTotal + shippingFeeNetto).toFixed(2);
    currentOrder.value.totalGross = parseFloat(subTotalGross + shippingFeeGross).toFixed(2);
  },
  { deep: true } // Śledzenie głębokich zmian w tablicy produktów
);

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

</script>
<template>
  <ContentContainer :showLanguage="false" class="!overflow-auto w-full !h-[90vh]">
    <FormKit ref="myForm" type="form"  @submit="handleOrder" :actions="false">
    <div>
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
          type="textarea"
          name="noteForOrder"
          v-model="currentOrder.orderNoteForClient"
          label="Dodatkowa informacja do zamówienia"
          placeholder="..."
        />
      </div>
      <div class="flex-1">
        <FormKit
          type="textarea"
          name="noteForCustomer"
          v-model="currentOrder.orderNoteForCustomer"
          label="Dodatkowa informacja dla sprzedawcy"
          placeholder="..."
        />
      </div>
  </div>
  <div>
    <FormKit type="checkbox" label="Uwzględnij odbiorcę na fakturze:" />
  </div>
  <div class="mt-2">
    <div class="inline-flex justify-center items-center w-full">
      <hr class="mt-2 w-full bg-gray-200 border-0.5 border-gray-300">
      <h1 class="absolute px-2 font-semibold text-2xl text-orange-400 bg-blue-50"> Szczegóły faktury </h1>
    </div>
    <div class="flex gap-4 w-full mt-4">
      <div class="flex-1">
        <FormKit
          type="select"
          name="status"
          placeholder="Termin na fakturze"
          v-model="currentOrder.paymentTerm"
          :options="paymentPaymentTerm"
          label="Termin na fakturze"
        />
      </div>
      <div class="flex-1">
        <FormKit
          type="textarea"
          name="note"
          v-model="currentOrder.orderNoteOnInvoice"
          label="Dodatkowa informacja na fakturze"
          placeholder="..."
        />
      </div>
      <div class="flex-1"></div>
      <div class="flex-1"></div>
      </div>
  </div>
  <div class="mt-2">
    <div class="inline-flex justify-center items-center w-full mb-4">
      <hr class="mt-2 w-full bg-gray-200 border-0.5 border-gray-300">
      <h1 class="absolute px-2 font-semibold text-2xl text-orange-400 bg-blue-50"> Szczegóły zamówienia </h1>
    </div>  
    <div class="grid grid-cols-3 gap-4 mt-3 flex" style="grid-template-columns: 400px 400px 50%;">
      <div class="w-[400px]">
        <div class="bg-white rounded-md shadow-md p-4">
          <h2 class="text-xl font-bold my-2">1. Dane odbiorcy</h2>
          <div>
            <FormKit
              type="text"
              label="Szukaj użytkownika"
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
                v-model="currentOrder.billingAddress.IsCompany"
                class="ml-2"
                style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              />
            </div>
            <div class="formkit_form_order">
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
              v-show="currentOrder.billingAddress.IsCompany"
              outer-class="hidden_name fomik_form_witdh"
              type="text"
              v-model="currentOrder.billingAddress.companyName"
              label="Nazwa firmy"
              placeholder="Nazwa firmy"
              :validation="currentOrder.billingAddress.IsCompany ? 'required' : ''"
              validation-visibility="live"
              help=""
            />
            <FormKit
              v-show="currentOrder.billingAddress.IsCompany"
              outer-class="hidden_name fomik_form_witdh"
              type="text"
              v-model="currentOrder.billingAddress.nip"
              label="Nip"
              placeholder="Nip"
              :validation="currentOrder.billingAddress.IsCompany ? 'required' : ''"
              validation-visibility="live"
              help=""
            />
            <FormKit
              v-show="!currentOrder.billingAddress.IsCompany"
              type="text"
              v-model="currentOrder.billingAddress.firstName"
              outer-class="hidden_name fomik_form_witdh"
              label="Imię"
              placeholder="Imię"
              :validation="'required'"
              validation-visibility="live"
            />
            <FormKit
              v-show="!currentOrder.billingAddress.IsCompany"
              type="text"
              v-model="currentOrder.billingAddress.lastName"
              outer-class="hidden_name fomik_form_witdh"
              label="Nazwisko"
              placeholder="Nazwisko"
              :validation="'required'"
              validation-visibility="live"
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
            <div>
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
                v-if="currentOrder.useShippingAddressAsBillingAddress && !currentOrder.billingAddress.IsCompany"
                type="text"
                v-model="currentOrder.shippingAddress.firstName"
                label="Imię"
                placeholder="Imię"
                :validation="currentOrder.billingAddress.IsCompany ? '' : 'required'"
                validation-visibility="live"
            />
            <FormKit
              outer-class="hidden_name fomik_form_witdh"
              v-if="currentOrder.useShippingAddressAsBillingAddress && !currentOrder.billingAddress.IsCompany"
              type="text"
              v-model="currentOrder.shippingAddress.lastName"
              label="Nazwisko"
              placeholder="Nazwisko"
              :validation="currentOrder.billingAddress.IsCompany ? '' : 'required'"
              validation-visibility="live"
              help=""
            />
            <FormKit
              outer-class="hidden_name fomik_form_witdh"
              v-if="currentOrder.useShippingAddressAsBillingAddress && currentOrder.billingAddress.IsCompany"
              type="text"
              v-model="currentOrder.shippingAddress.lastName"
              label="Nazwa firmy"
              placeholder="Nazwa firmy"
              :validation="currentOrder.billingAddress.IsCompany ? 'required' : ''"
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

        </div>
      </div>
      <div class="w-[300px] mx-auto ">
        <div
          class="bg-white rounded-md shadow-md p-4"
          :class="{ '!border-red-500 !border-2': isSelectedDeliveryOptionInvalid }"
        >         
        <h2 class="text-xl font-bold my-2">2. Metoda dostawy</h2>
          <div class="flex items-center">
          <FormKit
            type="radio"
            :options="[
            { label: 'Kurier', value: '0' },
            { label: 'Odbiór własny', value: '1' },
            ]"         
            v-model="currentOrder.deliveryMethod" 
            outer-class="!text-xl hidden_border_formik !my-auto"
          />
          </div>
        </div>
        <div class="bg-white rounded-md shadow-md p-4 mt-5"
        :class="{ '!border-red-500 !border-2': isSelectedDeliveryOptionInvalid }"
        >
          <h2 class="text-xl font-bold my-2">3. Metoda płatności</h2>
          <div>
            <FormKit
              type="radio"
              :options="filteredPaymentOptions"
              v-model="currentOrder.paymentProvider"
              outer-class="!text-xl hidden_border_formik !my-auto"
            />
          </div>
        </div>
      </div>
      <div class="flex-1">
        <div class="bg-white rounded-md shadow-md p-4">
          <h2 class="text-xl font-bold my-2">Dodaj produkt</h2>
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
                    class="mb-2 cursor-pointer hover:bg-gray-300 p-2 w-1/2"
                  >
                  <div class="flex">
                    <img :src="product.filePath" class="w-[75px] h-[75px]"/>
                    <span class="my-auto ml-2">
                      {{ product.name }}
                    </span>
                  </div>
                  </li>
                </ul>
              </div>
            </div>
        </div>
        <div class="bg-white rounded-md shadow-md p-4">
          <h2 class="text-xl font-bold my-2">5. Podsumowanie</h2>
          <div>
              <ul>
                <li class="my-10 border-t border-1 b-gray-400" v-for="product in currentOrder.products">
                  <div class="flex w-1/2">
                    <img
                      class="flex-shrink-0 object-contain w-24 h-24 rounded outline-none"
                      :src="product.filePath"
                      :alt="product.name"
                    />
                    <div class="w-full pb-4 m-auto">
                      <div class="flex w-full pb-2 space-x-2">
                        <div class="space-y-1 ">
                          <div
                            class="text-md font-semibold leading-snug sm:pr-8"
                          >
                            {{ product.name }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex">
                    <FormKit
                      type="number"
                      :wrapper-class="'ml-4 font-[2px] w-[75px]'"
                      label="Ilość"
                      step="1"
                      validation="required"
                      validation-visibility="live"
                      v-model="product.quantity"
                    />
                    <FormKit
                      type="number"
                      :wrapper-class="'ml-4 font-[2px] w-[130px]'"
                      label="Cena netto"
                      step="0.01"
                      :format="false"
                      validation="required"
                      validation-visibility="live"
                      v-model="product.priceNetto"
                    />
                    <FormKit
                      type="number"
                      :wrapper-class="'ml-4 w-20'"
                      label="VAT"
                      step="1"
                      disabled
                      validation="required"
                      validation-visibility="live"
                      v-model="product.tax"
                    />
                    <div class="formkit-wrapper ml-4 w-[130px]">
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
                      <div class="formkit-wrapper ml-4 w-[130px]">
                        <label class="formkit-label" for="input_0">Wartość (brutto)</label>
                        <div class="formkit-inner">
                          <input
                            step="0.01"
                            disabled
                            class="formkit-input"
                            type="number"
                            name="temperature"
                            id="input_0"
                            aria-describedby="help-input_0"
                            :value="((product.priceNetto * 1.23) * product.quantity).toFixed(2)"
                          />
                        </div>
                      </div>
                      <FormKit
                      type="number"
                      :wrapper-class="'ml-4 w-[130px]'"
                      label="Cena producenta"
                      step="0.01"
                      validation="required"
                      v-model="product.producerPriceNetto"
                      validation-visibility="live"
                    />
                  </div>
                  <div class="flex ml-4">
                    <div class="flex">
                    <div>
                    <div class="formkit-wrapper w-[220px]">
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
                      :wrapper-class="'mt-4'"
                      label="Cena transportu (netto)"
                      step="0.01"
                      validation="required"
                      v-model="product.shippingPriceNetto"
                      validation-visibility="live"
                    />
                  </div>
                  </div>
                  <div class="block ml-4">
                    <div class="formkit-wrapper w-[220px]">
                      <label class="formkit-label" for="input_0"
                        >Cena transportu z reguł (brutto)</label
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
                          :value="(calculatePalletsAndCardboards(product).toFixed(2) * 1.23).toFixed(2)"
                        />
                      </div>
                    </div>
                    <FormKit
                      type="number"
                      :wrapper-class="'mt-4'"
                      label="Cena transportu (brutto)"
                      step="0.01"
                      validation="required"
                      v-model="product.shippingPriceGross"
                      validation-visibility="live"
                    />
                </div>
                <div>
                  <FormKit
                    :classes="{ outer: ' font-[10px]' }"
                    :wrapper-class="'ml-4 w-[340px]'"
                    type="textarea"
                    v-model="product.producerNote"
                    label="Informacja dla producenta"
                  />
                </div>
              </div>
                  <el-button
                      @click="removeProductRelated(product.id)"
                      color="#dc2626"
                      class="m-auto"
                      round
                      >Usuń</el-button
                    >
                </li>
              </ul>
              <div class="text-[16px]">
                  <div class="flex">
                    <span>Wartość produktów (netto):</span><span class="font-bold text-[18px]">{{ currentOrder.subTotal }} zł</span>
                  </div>
                  <div class="flex mb-3">
                    <span>Wartość produktów (brutto):</span><span class="font-bold text-[18px]">{{ currentOrder.subTotalGross }} zł</span>
                  </div>
                  <div class="flex">
                    <span>Koszt transportu (netto):</span>
                    <span class="font-bold text-[18px]">{{currentOrder.shippingFeeAmountNetto}} zł</span>
                  </div>
                  <div class="flex mb-3">
                    <span>Koszt transportu (brutto):</span>
                    <span class="font-bold text-[18px]">{{currentOrder.shippingFeeAmountGross}} zł</span>
                  </div>
                  <div class="flex">
                    <span>Koszt zakupu (netto):</span>
                    <span class="font-bold text-[18px]">{{currentOrder.totalNetto}} zł</span>
                  </div>
                  <div class="flex">
                    <span>Koszt zakupu (brutto):</span>
                    <span class="font-bold text-[18px]">{{currentOrder.totalGross}} zł</span>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
  <div class="save-button w-full my-10">
          <FormKit v-if="!updated" @click="Creat" type="submit" label="Dodaj zamówienie" style="display: flex; justify-content: flex-end" />
          <FormKit v-if="updated" @click="Creat" type="submit" label="Edytuj zamówienie" style="display: flex; justify-content: flex-end" />
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
.checkbox_center_formik {
  margin:auto;
}

.fomik_form_witdh .formkit-wrapper {
  display:inline;
}

.hidden_name .formkit-wrapper .formkit-label {
  display:none;
}

.hidden_border_formik .formkit-fieldset {
  border: none !important;  
}
</style>
