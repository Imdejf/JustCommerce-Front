<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, watch, computed } from 'vue';
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import { OfferDTO } from '/@/types/offer/offer'

const props = defineProps({
  offer: {
    type: Object as ObjectConstructor,
    default: () => ({} as OfferDTO)
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const toast = useToast()
const cookies = new Cookies()

const token = cookies.get('Authorization')

const currentOffer = ref(props.offer)

const expirationTime = ref(new Date());
expirationTime.value.setMonth(expirationTime.value.getMonth() + 1);

const isCompany = ref(true)
const isCompanyToAnotherAddress = ref(true)
const anotherAddressToShipment = ref(false)

const taxRate = 0.23;
const offerItems = ref<OfferItem[]>([...currentOffer.value.offerItems]);
const productsList = ref([])

const shippingNetto = ref(0);
const shippingBrutto = ref(0);
const totalNetto = ref(0);
const totalBrutto = ref(0);
const totalSumBrutto = ref(0);
const activeRowIndex = ref<number | null>(null)

const searchProduct = ref('')

const filterSearchProduct = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 5,
  SearchString: searchProduct.value
})

const realizationTerm = ref(currentOffer.value.realizationTerm || "");
const isCustomTerm = ref(realizationTerm.value === 99);

const handleTermSelection = () => {
  if (realizationTerm.value === 99) {
    isCustomTerm.value = true;
    realizationTerm.value = "";
  } else {
    isCustomTerm.value = false;
  }
};

const handleCustomTermBackspace = (event) => {
  if (realizationTerm.value.trim() === "" && event.key === 'Backspace') {
    isCustomTerm.value = false;
    realizationTerm.value = predefinedTerms.value[0].value;
  }
};

watch(realizationTerm, (newValue) => {
  currentOffer.value.realizationTerm = newValue;
});

const predefinedTerms = ref([
  { label: "2-3 dni", value: 0 },
  { label: "2-5 dni", value: 1 },
  { label: "7 dni", value: 2 },
  { label: "2-4 tyg.", value: 3 },
  { label: "3-4 tyg.", value: 5 },
  { label: "4-5 tyg.", value: 6 },
  { label: "Wpisz własną wartość", value: 99 }
]);

const predefinedPayment = ref([
{ label: "Przelew standradowy", value: 1 },
{ label: "Płantość za pobraniem (+10zł)", value: 2 },
]);

const predefinedShipemnt = ref([
{ label: "Dostawa kurier", value: 0 },
{ label: "Odbiór osobisty", value: 1 },
]);

const predefinedPaymnet = ref([
    {
        label: "7 dni",
        value: 0
    },
    {
        label: "14 dni",
        value: 1
    },
    {
        label: "21 dni",
        value: 2
    },
    {
        label: "30 dni",
        value: 3
    },
    {
        label: "60 dni",
        value: 4
    },
    {
        label: "90 dni",
        value: 5
    },
    {
        label: "Brak",
        value: 99
    }
]);

const updateItemValues = (item: OfferItem, changedField: string) => {
  if (changedField === 'priceNetto') {
    item.priceGross = (item.priceNetto * (1 + taxRate)).toFixed(2);
    item.totalPriceNetto = (item.quantity * item.priceNetto).toFixed(2);
    item.totalPriceGross = (item.totalPriceNetto * (1 + taxRate)).toFixed(2);
  } else if (changedField === 'totalPriceNetto') {
    item.priceNetto = (item.totalPriceNetto / item.quantity).toFixed(2);
    item.priceGross = (item.priceNetto * (1 + taxRate)).toFixed(2);
    item.totalPriceGross = (item.totalPriceNetto * (1 + taxRate)).toFixed(2);
  } else if (changedField === 'totalPriceGross') {
    item.totalPriceNetto = (item.totalPriceGross / (1 + taxRate)).toFixed(2);
    item.priceNetto = (item.totalPriceNetto / item.quantity).toFixed(2);
    item.priceGross = (item.priceNetto * (1 + taxRate)).toFixed(2);
  } else if (changedField === 'quantity') {
    item.totalPriceNetto = (item.quantity * item.priceNetto).toFixed(2);
    item.totalPriceGross = (item.totalPriceNetto * (1 + taxRate)).toFixed(2);
  }
};

const updateTotalSums = () => {
  totalNetto.value = offerItems.value.reduce((sum, item) => sum + parseFloat(item.totalPriceNetto || 0), 0).toFixed(2);
  totalBrutto.value = offerItems.value.reduce((sum, item) => sum + parseFloat(item.totalPriceGross || 0), 0).toFixed(2);
  totalSumBrutto.value = (parseFloat(totalBrutto.value) + parseFloat(shippingBrutto.value)).toFixed(2);
}


const calculatePalletsAndCardboards = (product) => {
  let shippingPrice = 0
  let quantitySum = product.quantity
  const rule = product.shippingRule

  if (!rule) return 0; // Jeśli brak reguły, zwracamy 0

  // Logika dla palet
  if (rule.stackPallet) {
    while (quantitySum >= rule.conditionMinForQuantityPallet) {
      if (quantitySum <= rule.conditionMaxForQuantityPallet) {
        shippingPrice += rule.shipmentPricePallet
        break
      } else {
        const palletCount = Math.floor(quantitySum / rule.conditionMaxForQuantityPallet)
        quantitySum -= palletCount * rule.conditionMaxForQuantityPallet
        shippingPrice += palletCount * rule.shipmentPricePallet
      }
    }
  }

  // Logika dla kartonów
  if ((quantitySum > 0 && quantitySum < rule.conditionMinForQuantityPallet) || !rule.stackPallet) {
    const cardboardCount = Math.ceil(quantitySum / rule.conditionMaxQuantity)
    shippingPrice += cardboardCount * rule.shipmentPrice
  }

  return shippingPrice;
}

watch([offerItems, shippingBrutto], updateTotalSums, { deep: true });


const calculateShipping = () => {
  let totalShippingNetto = 0;
  let totalShippingBrutto = 0;

  offerItems.value.forEach((item) => {
    if (!item.shippingRule) return;

    const shippingCost = calculatePalletsAndCardboards(item);
    const shippingAmountNetto = shippingCost / (1 + taxRate);

    item.realShippingFeeAmountNetto = shippingAmountNetto.toFixed(2);
    item.realShippingFeeAmountGross = shippingCost.toFixed(2);

    totalShippingNetto += shippingAmountNetto;
    totalShippingBrutto += shippingCost;
  });

  shippingNetto.value = totalShippingNetto.toFixed(2);
  shippingBrutto.value = totalShippingBrutto.toFixed(2);
}


const updateShippingValues = (changedField: string) => {
  if (changedField === 'netto') {
    shippingBrutto.value = parseFloat((shippingNetto.value * (1 + taxRate)).toFixed(2));
  } else if (changedField === 'brutto') {
    shippingNetto.value = parseFloat((shippingBrutto.value / (1 + taxRate)).toFixed(2));
  }
}


// Obserwowanie zmian w pozycjach oferty
const previousOfferItems = ref<OfferItem[]>(JSON.parse(JSON.stringify(currentOffer.value.offerItems)));
watch(
  offerItems,
  (newItems, oldItems) => {
    newItems.forEach((newItem, index) => {
      const oldItem = previousOfferItems.value[index];

      if (!oldItem) return;

      if (newItem.priceNetto !== oldItem.priceNetto) {
        updateItemValues(newItem, 'priceNetto');
      } else if (newItem.totalPriceNetto !== oldItem.totalPriceNetto) {
        updateItemValues(newItem, 'totalPriceNetto');
      } else if (newItem.totalPriceGross !== oldItem.totalPriceGross) {
        updateItemValues(newItem, 'totalPriceGross');
      } else if (newItem.quantity !== oldItem.quantity) {
        updateItemValues(newItem, 'quantity');
      }
    });

    // Aktualizacja previousOfferItems po każdej zmianie
    previousOfferItems.value = JSON.parse(JSON.stringify(newItems));
  },
  { deep: true }
);

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

const addProductToOfferHandle = async (item, index) => {
  activeRowIndex.value = null
  const currentItem = offerItems.value[index]
  filterSearchProduct.value.SearchString = ''
  currentItem.productId = item.id;
  currentItem.name = item.name;
  currentItem.quantity = 1;
  currentItem.priceNetto = item.priceNetto;
  currentItem.totalPriceGross = 0;
  currentItem.tax = 0;
  currentItem.producerPriceNetto = item.producerPrice;
  currentItem.totalPriceNetto = 0;
  currentItem.totalPriceGross = 0;
  currentItem.shippingRule = item.shippingRule;
}


const addNewItem = () => {
  offerItems.value.push({
    productId: '',
    name: '',
    quantity: 1,
    priceNetto: 0,
    priceGross: 0,
    tax: taxRate * 100,
    producerPriceNetto: 0,
    totalPriceNetto: 0,
    totalPriceGross: 0,
    shippingRule: null
  });
};

const handleInputFocus = (index) => {
  activeRowIndex.value = index;
}

const validateOfferItems = () => {
  let isValid = true;
  offerItems.value.forEach((item, index) => {
    if (!item.name || item.name.trim() === '') {
      toast.error(`Produkt w wierszu ${index + 1} musi mieć nazwę.`);
      isValid = false;
    }
    if (!item.quantity || item.quantity <= 0) {
      toast.error(`Produkt "${item.name}" (wiersz ${index + 1}) musi mieć ilość większą od 0.`);
      isValid = false;
    }
    if (!item.priceNetto || item.priceNetto <= 0) {
      toast.error(`Produkt "${item.name}" (wiersz ${index + 1}) musi mieć cenę netto większą od 0.`);
      isValid = false;
    }
  });
  return isValid;
};

const handleSave = async () => {
  if (!validateOfferItems()) {
    return;
  }
  
  if (realizationTerm.value !== 99) {
    const selectedOption = predefinedTerms.value.find(term => term.value === realizationTerm.value);
    if (selectedOption) {
      currentOffer.value.realizationTerm = selectedOption.label;
    }
  }
  currentOffer.value.useShippingAddressAsBillingAddress = !anotherAddressToShipment.value;
  currentOffer.value.totalItemPrice = totalNetto.value;
  currentOffer.value.totalItemPriceGross = totalBrutto.value;
  currentOffer.value.shippingPrice = shippingNetto.value;
  currentOffer.value.shippingPriceGross = shippingBrutto.value;
  currentOffer.value.totalPrice = (parseFloat(totalSumBrutto.value) / (1 + taxRate)).toFixed(2);
  currentOffer.value.totalPriceGross = totalSumBrutto.value;
  currentOffer.value.offerItems = previousOfferItems.value;

  const payload = {
      body: JSON.stringify(currentOffer.value),
    };
    console.log(payload)
  try {
    const response = await Api.offers.createOffer(payload);
    toast.success('Oferta została zapisana!');
  } catch (error) {
    toast.error('Wystąpił błąd podczas zapisu oferty.');
    console.error(error);
  }
};

</script>
<template>
  <ContentContainer :showLanguage="false" class="offer_input">
    <div class="mx-[10rem] realtive">
        <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
            <div class="border-gray-300 border-b pb-5 mb-4">
              <div class="flex gap-5">
                  <div class="w-1/5">
                      <FormKit
                          v-if="!isCustomTerm"
                          label="Termin realizacji"
                          type="select"
                          v-model="realizationTerm"
                          :options="predefinedTerms.map(term => ({ label: term.label, value: term.value }))"
                          @change="handleTermSelection"
                      />

                      <!-- Pole tekstowe dla własnej wartości -->
                      <FormKit
                          v-else
                          label="Wpisz własny termin"
                          type="text"
                          v-model="realizationTerm"
                          @keydown="handleCustomTermBackspace"
                      />
                  </div>
                  <div class="w-1/5">
                      <FormKit
                          label="Sposób płatności"
                          type="select"
                          :options="predefinedPayment"
                          v-model="currentOffer.payment"
                      />
                  </div>
                  <div class="w-1/5">
                      <FormKit
                          label="Sposób dostawy"
                          type="select"
                          :options="predefinedShipemnt"
                          v-model="currentOffer.deliveryMethod"
                      />
                  </div>
                  <div class="w-1/5">
                      <FormKit
                          label="Termin na fakturze"
                          type="select"
                          :options="predefinedPaymnet"
                          v-model="currentOffer.paymentTerm"
                      />
                  </div>
                  <div class="w-1/5">
                      <span class="block font-bold text-sm mb-[2px]">Ważna do</span>
                      <el-date-picker
                        v-model="expirationTime"
                        type="date"
                        placeholder="Wybierz datę"
                        format="DD-MM-YYYY"
                        style="width: 150px !important;"
                      />
                  </div>
              </div>
              <div class="flex gap-10 offer_textarea">
                <FormSection>
                <FormKit
                  type="textarea"
                  label="Informacje dodatkowe dla sprzedawcy"
                  validation-visibility="live"
                  v-model="currentOffer.offerNote"
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
                  v-model="currentOffer.comment"
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
            </div>
            <div>
            </div>
            <div class="flex justify-between offer_input">
               <div class="w-[400px]">
                    <div class="flex gap-5">
                    <h1 class="text-xl font-bold mb-5">Nabywca</h1>
                    <el-switch
                        v-model="isCompany"
                        class="ml-2"
                        inline-prompt
                        width="140"
                        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                        active-text="Firma"
                        inactive-text="Osoba prywatna"
                    />
                </div>
                <div v-show="isCompany">
                    <FormKit
                        type="text"
                        label="Nabywca*"
                        :validation="isCompany ? 'required' : ''"
                        v-model="currentOffer.billingAddress.companyName"
                        validation-visibility="live"
                        help=""
                    />
                </div>
                <div v-show="!isCompany" class="flex gap-3">
                    <FormKit
                        type="text"
                        label="Imię"
                        v-model="currentOffer.billingAddress.firstName"
                        :validation="!isCompany ? 'required' : ''"
                        validation-visibility="live"
                        help=""
                    />
                    <FormKit
                        type="text"
                        label="Nazwisko"
                        v-model="currentOffer.billingAddress.lastName"
                        :validation="!isCompany ? 'required' : ''"
                        validation-visibility="live"
                        help=""
                    />
                </div>
                    <FormKit
                        type="text"
                        label="NIP"
                        v-model="currentOffer.billingAddress.nip"
                        help=""
                    />
                    <FormKit
                        type="text"
                        label="Ulica i nr"
                        v-model="currentOffer.billingAddress.addressLine1"
                        help=""
                    />
                    <div class="flex gap-5">
                    <FormKit
                        type="text"
                        label="Kod pocztowy"
                        v-model="currentOffer.billingAddress.zipCode"
                        help=""
                    />
                    <FormKit
                        type="text"
                        label="Miejscowość"
                        v-model="currentOffer.billingAddress.city"
                        help=""
                    />
                    </div>
                </div>
                <div class="w-[400px] ">
                    <h1 class="text-xl font-bold mb-5">Dane zamawiającego</h1>
                    <FormKit
                        type="text"
                        label="Nazwa"
                        v-model="currentOffer.customerName"
                        help=""
                    />
                    <FormKit
                        type="text"
                        label="Email"
                        v-model="currentOffer.customerEmail"
                        help=""
                    />
                    <FormKit
                        type="text"
                        v-model="currentOffer.customerPhone"
                        label="Telefon"
                        help=""
                    />
                </div>
            </div>
            <h3 class="text-lg font-semibold">Inny adres wysyłki?</h3>
              <el-switch
                v-model="anotherAddressToShipment"
                style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              />
            <div v-if="anotherAddressToShipment" class="w-[400px] offer_input">
            <el-switch
                v-model="isCompanyToAnotherAddress"
                class="w-full justify-center"
                inline-prompt
                width="140"
                style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                active-text="Firma"
                inactive-text="Osoba prywatna"
            />
                <div v-show="isCompanyToAnotherAddress">
                    <FormKit
                        type="text"
                        label="Nabywca*"
                        :validation="isCompanyToAnotherAddress ? 'required' : ''"
                        validation-visibility="live"
                        help=""
                    />
                </div>
                <div v-show="!isCompanyToAnotherAddress" class="flex gap-3">
                    <FormKit
                        type="text"
                        label="Imię"
                        validation-visibility="live"
                        :validation="!isCompanyToAnotherAddress ? 'required' : ''"
                        help=""
                    />
                    <FormKit
                        type="text"
                        label="Nazwisko"
                        :validation="!isCompanyToAnotherAddress ? 'required' : ''"
                        validation-visibility="live"
                        help=""
                    />
                </div>
                    <FormKit
                        type="text"
                        label="NIP"
                        help=""
                    />
                    <FormKit
                        type="text"
                        label="Ulica i nr"
                        help=""
                    />
                    <div class="flex gap-5">
                    <FormKit
                        type="text"
                        label="Kod pocztowy"
                        help=""
                    />
                    <FormKit
                        type="text"
                        label="Miejscowość"
                        help=""
                    />
                    </div>
            </div>
            <div>
                <div class="mt-4 realtive">
                    <h2 class="text-xl font-bold bg-gray-100 border-b-[1px] border-[#d6dfe9] shadow-lg p-2">Pozycje na ofercie</h2>
                    <div class="bg-white p-2">
                        <div class="grid grid-cols-11 gap-2 items-center font-semibold border-b pb-2 text-xs">
                            <span class="col-span-5">Nazwa</span>
                            <span class="col-span-1">Ilość</span>
                            <span class="col-span-1">Jednostka</span>
                            <span class="col-span-1">Cena netto</span>
                            <span class="col-span-1">VAT %</span>
                            <span class="col-span-1">Wartość netto</span>
                            <span class="col-span-1">Wartość brutto</span>
                        </div>
                        <div v-for="(item, index) in offerItems" :key="index" class="grid grid-cols-11 gap-2 items-center py-2 border-b">
                            <span v-if="item.name == '' || item.name == null" class="col-span-5">
                                <FormKit
                                  :classes="{ outer: '!mt-7 offer_input' }"
                                  type="text"
                                  v-model="filterSearchProduct.SearchString"
                                  @focus="handleInputFocus(index)"
                                />
                            </span>
                            <span v-else class="col-span-5">
                                <FormKit
                                  :classes="{ outer: '!mt-7 offer_input' }"
                                  type="text"
                                  v-model="item.name"
                                />
                            </span>
                            <span class="col-span-1">
                                <FormKit
                                  :classes="{ outer: '!mt-7 offer_input' }"
                                  v-model="item.quantity"
                                  type="number"
                                />
                            </span>
                            <span class="col-span-1">
                                <FormKit
                                  :classes="{ outer: '!mt-7 offer_input' }"
                                  type="text"
                                  disabled
                                  placeholder="szt."
                                />
                            </span>
                            <span class="col-span-1">
                                <FormKit
                                  :classes="{ outer: '!mt-7 offer_input' }"
                                  v-model="item.priceNetto"
                                  type="number"
                                  step="0.01"
                                />
                            </span>
                            <span class="col-span-1">
                                <FormKit
                                  :classes="{ outer: '!mt-7 offer_input' }"
                                  type="text"
                                  disabled
                                  placeholder="23"
                                />
                            </span>
                            <span class="col-span-1">
                                <FormKit
                                  :classes="{ outer: '!mt-7 offer_input' }"
                                  v-model="item.totalPriceNetto"
                                  type="number"
                                  step="0.01"                                
                                />
                            </span>
                            <span class="col-span-1">
                                <FormKit
                                  :classes="{ outer: '!mt-7 offer_input' }"
                                  v-model="item.totalPriceGross"
                                  type="number"
                                  step="0.01"                                
                                />
                            </span>
                            <div class="h-[auto] col-span-11" v-if="activeRowIndex === index && filterSearchProduct.SearchString.length > 0">
                            <ul class="bg-gray-200 w-full max-h-[300px] p-5 overflow-auto">
                            <li
                                v-for="product in productsList"
                                :key="product.id"
                                @click="addProductToOfferHandle(product, index)"
                                class="cursor-pointer hover:bg-gray-300 p-2"
                            >
                            <div class="flex">
                                <img :src="product.filePath" class="w-[35px] h-[35px]"/>
                                <span class="my-auto text-[13px] ml-2">
                                {{ product.name}}
                                </span>
                            </div>
                            </li>
                            </ul>
                        </div>
                        </div>
                        <div class="flex gap-4 justify-end w-[1/1]">
                          
                          <div class="mt-12 check_box_offer">
                            <FormKit
                              type="checkbox"
                              label="Tranport do indywidualnej wyceny"
                              help=""
                              v-model="currentOffer.transportIndividualPricing"
                              :value="false"
                            />
                          </div>
                            <el-button class="mt-12" type="primary" round @click="calculateShipping">Policz transport</el-button>
                            <FormKit
                              label="Dostawa (netto)"
                              :classes="{ outer: '!mt-7 offer_input' }"
                              type="number"
                              step="0.01"
                              v-model="shippingNetto"
                              @blur="updateShippingValues('netto')"
                            />
                            <FormKit
                              label="Dostawa (brutto)"
                              :classes="{ outer: '!mt-7 offer_input' }"
                              type="number"
                              step="0.01"
                              v-model="shippingBrutto"
                              @blur="updateShippingValues('brutto')"
                            />
                        </div>
                        <div class="block gap-4 w-full text-[12.5px] border-t border-gray-300 mt-3 text-end">
                            <div class="mb-2 mt-4 ">
                                <div class="flex justify-end ">
                                <div class="w-[400px] flex justify-between mb-2 pb-1">
                                    <span class="font-bold text-left w-[50%]">Koszt towaru (netto):</span>
                                    <span class="font-semibold">{{totalNetto}}</span>
                                    <span class="font-semibold w-1/3">PLN</span>
                                </div>
                            </div>
                            <div class="flex justify-end">
                                <div class="w-[400px] flex justify-between mb-2 border-b pb-3">
                                    <span class="font-bold text-left w-[50%]">Koszt towaru (brutto):</span>
                                    <span class="font-semibold">{{totalBrutto}}</span>
                                    <span class="font-semibold w-1/3">PLN</span>
                                </div>
                            </div>
                            </div>
                            <div class="flex justify-end ">
                                <div class="w-[400px] flex justify-between mb-2 pb-1">
                                    <span class="font-bold text-left w-[50%]">Wysyłka (netto):</span>
                                    <span class="font-semibold">{{shippingNetto}}</span>
                                    <span class="font-semibold w-1/3">PLN</span>
                                </div>
                            </div>
                            <div class="flex justify-end ">
                                <div class="w-[400px] flex justify-between mb-2 border-b pb-3">
                                    <span class="font-bold text-left w-[50%]">Wysyłka (brutto):</span>
                                    <span class="font-semibold">{{shippingBrutto}}</span>
                                    <span class="font-semibold w-1/3">PLN</span>
                                </div>
                            </div>
                            <div class="flex justify-end ">
                                <div class="w-[400px] flex justify-between mb-2 border-b pb-3">
                                    <span class="font-bold text-left w-[50%]">Suma (brutto):</span>
                                    <span class="font-semibold">{{totalSumBrutto}}</span>
                                    <span class="font-semibold w-1/3">PLN</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="save-button justify-self-end my-10 mx-[10rem]">
              <FormKit v-if="!updated" type="submit" label="Utwrzów ofertę" style="display: flex; justify-content: flex-end" />
              <FormKit v-if="updated" type="submit" label="Edytuj ofertę" style="display: flex; justify-content: flex-end" />
            </div>
        </FormKit>
        <button @click="addNewItem" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Dodaj pozycję</button>
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