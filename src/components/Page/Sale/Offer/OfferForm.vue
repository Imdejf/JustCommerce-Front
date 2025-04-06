<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, watch, computed } from 'vue';
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import { OfferDTO } from '/@/types/offer/offer'
import ProductTable from '/@/components/Form/ProductTable/ProductTable.vue'


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

const summaryProductTable = ref([])

const realizationTerm = ref(currentOffer.value.realizationTerm || "2-3 dni");
const isCustomTerm = ref(realizationTerm.value === 99);

const handleProductUpdate = (summary) => {
  summaryProductTable.value = summary;
}

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

// const validateOfferItems = () => {
//   let isValid = true;
//   offerItems.value.forEach((item, index) => {
//     if (!item.name || item.name.trim() === '') {
//       toast.error(`Produkt w wierszu ${index + 1} musi mieć nazwę.`);
//       isValid = false;
//     }
//     if (!item.quantity || item.quantity <= 0) {
//       toast.error(`Produkt "${item.name}" (wiersz ${index + 1}) musi mieć ilość większą od 0.`);
//       isValid = false;
//     }
//     if (!item.priceNetto || item.priceNetto <= 0) {
//       toast.error(`Produkt "${item.name}" (wiersz ${index + 1}) musi mieć cenę netto większą od 0.`);
//       isValid = false;
//     }
//   });
//   return isValid;
// };

const handleSave = async () => {
  // if (!validateOfferItems()) {
  //   return;
  // }
  const taxRate = 0.23;

  if (realizationTerm.value !== 99) {
    const selectedOption = predefinedTerms.value.find(term => term.label === realizationTerm.value);
    if (selectedOption) {
      currentOffer.value.realizationTerm = selectedOption.label;
      console.log(currentOffer.value.realizationTerm)

    }
  }

  currentOffer.value.useShippingAddressAsBillingAddress = !anotherAddressToShipment.value;
  currentOffer.value.billingAddress.isCompany = isCompany.value;
  currentOffer.value.realizationTerm = realizationTerm.value;
  currentOffer.value.totalItemPrice = parseFloat(summaryProductTable.value.totalNetto);
  currentOffer.value.totalItemPriceGross = parseFloat(summaryProductTable.value.totalBrutto);
  currentOffer.value.shippingPrice = parseFloat(summaryProductTable.value.shippingNetto || 0);
  currentOffer.value.shippingPriceGross = parseFloat(summaryProductTable.value.shippingBrutto || 0);

  currentOffer.value.totalPrice = (summaryProductTable.value.totalSumBrutto / (1 + taxRate)).toFixed(2);
  currentOffer.value.totalPriceGross = summaryProductTable.value.totalSumBrutto;

  // Mapowanie items na OfferItem
  currentOffer.value.offerItems = summaryProductTable.value.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    priceNetto: parseFloat(item.priceNetto),
    priceGross: parseFloat(item.priceGross),
    producerPriceNetto: parseFloat(item.producerPriceNetto),
    totalPriceNetto: parseFloat(item.totalPriceNetto),
    totalPriceGross: parseFloat(item.totalPriceGross),
    noteForProducer: null, // brak danych, ustawiamy domyślnie
  }));


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
                          :options="predefinedTerms.map(term => ({ label: term.label, value: term.label }))"
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
            <ProductTable
            :items="offer.products"
            @updateProductTableSummary="handleProductUpdate"/>
            <div class="save-button justify-self-end my-10 mx-[10rem]">
              <FormKit v-if="!updated" type="submit" label="Utwrzów ofertę" style="display: flex; justify-content: flex-end" />
              <FormKit v-if="updated" type="submit" label="Edytuj ofertę" style="display: flex; justify-content: flex-end" />
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