<script lang="ts" setup>
import { ref, watch, computed, onMounted } from 'vue'
import { OfferItemTable } from '/@/types/productTable/ProductTable.ts'
import { Api } from '/@/services/api'
import Cookies from 'universal-cookie'
const cookies = new Cookies()

const emit = defineEmits<{
  (e: 'updateProductTableSummary', value: {
    items: OfferItemTable[],
    shippingNetto: number,
    shippingBrutto: number,
    totalNetto: string,
    totalBrutto: string,
    totalSumBrutto: string,
    transportIndividualPricing: boolean
  }): void
}>();

const props = defineProps<{
  items: OfferItemTable[],
  shippingNetto: number,
  shippingBrutto: number,
  totalNetto: string,
  totalBrutto: string,
  totalSumBrutto: string,
  filterSearchProduct: any,
  transportIndividualPricing: boolean
}>()

const taxRate = 0.23;
const shippingNetto = ref(props.shippingNetto);
const shippingBrutto = ref(props.shippingBrutto);
const totalNetto = ref(props.totalNetto);
const totalBrutto = ref(props.totalBrutto);
const totalSumBrutto = ref(props.totalSumBrutto);
const transportIndividualPricing = ref(props.transportIndividualPricing);
const activeRowIndex = ref<number | null>(null)
const itemsTable = ref([])
const productTableSummary = computed(() => ({
  items: itemsTable.value,
  shippingNetto: shippingNetto.value,
  shippingBrutto: shippingBrutto.value,
  totalNetto: totalNetto.value,
  totalBrutto: totalBrutto.value,
  totalSumBrutto: totalSumBrutto.value,
  transportIndividualPricing: transportIndividualPricing.value
}));

const searchProduct = ref('')

const filterSearchProduct = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 30,
  SearchString: searchProduct.value
})

const handleInputFocus = (index) => {
  activeRowIndex.value = index;
}

const handleSearchUpdate = (val: string) => {
  props.filterSearchProduct.SearchString = val
}

const updateTotalSums = () => {
  totalNetto.value = itemsTable.value.reduce((sum, item) => sum + parseFloat(item.totalPriceNetto || 0), 0).toFixed(2);
  totalBrutto.value = itemsTable.value.reduce((sum, item) => sum + parseFloat(item.totalPriceGross || 0), 0).toFixed(2);
  totalSumBrutto.value = (parseFloat(totalBrutto.value) + parseFloat(shippingBrutto.value)).toFixed(2);
}

const removeProductHandle = (rowIndex: number) => {
  itemsTable.value.splice(rowIndex, 1);
};


const addNewItem = () => {
  itemsTable.value.push({
    productId: '',
    name: '',
    quantity: 1,
    priceNetto: 0,
    priceGross: 0,
    tax: taxRate * 100,
    producerPriceNetto: 0,
    totalPriceNetto: 0,
    shippingPriceGross: 0,
    totalPriceGross: 0,
    shippingRule: null
  });
};

const addCustomItem = () => {
  itemsTable.value.push({
    productId: null,
    name: '',
    sku: '',
    brandId: null,
    quantity: 1,
    priceNetto: 0,
    priceGross: 0,
    tax: taxRate * 100,
    producerPriceNetto: 0,
    totalPriceNetto: 0,
    totalPriceGross: 0,
    shippingPriceGross: 0,
    noteForProducer: '',
    shippingRule: null
  });
  activeRowIndex.value = itemsTable.value.length - 1;
};

const addProductToListHandle = async (item, index) => {
  activeRowIndex.value = null
  const currentItem = itemsTable.value[index]
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
  currentItem.shippingPriceGross = currentItem.shippingPriceGross ?? 0
}

const calculateShipping = () => {
  let totalShippingNetto = 0;
  let totalShippingBrutto = 0;

  // 1) reguły wysyłki dla produktów sklepowych
  itemsTable.value.forEach((item) => {
    if (!item.shippingRule) return;
    const shippingCost = calculatePalletsAndCardboards(item);
    const shippingAmountNetto = shippingCost / (1 + taxRate);
    totalShippingNetto += shippingAmountNetto;
    totalShippingBrutto += shippingCost;
  });

  // 2) koszty wpisane ręcznie dla pozycji customowych
  itemsTable.value.forEach((item) => {
    if (item.productId !== null) return; // nie custom
    const customGross = parseFloat(item.shippingPriceGross || 0);
    if (!isNaN(customGross) && customGross > 0) {
      totalShippingBrutto += customGross;
      totalShippingNetto += customGross / (1 + taxRate);
    }
  });

  shippingNetto.value = totalShippingNetto.toFixed(2);
  shippingBrutto.value = totalShippingBrutto.toFixed(2);
};

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


const updateShippingValues = (changedField: string) => {
  if (changedField === 'netto') {
    shippingBrutto.value = parseFloat((shippingNetto.value * (1 + taxRate)).toFixed(2));
  } else if (changedField === 'brutto') {
    shippingNetto.value = parseFloat((shippingBrutto.value / (1 + taxRate)).toFixed(2));
  }
}

const brands = ref<{ value: string | null; label: string }[]>([]);

const loadBrands = async () => {
  try {
    const result = await Api.brands.listByStoreId();
    brands.value = [
      { value: null, label: 'Producent' },
      ...result.items.map((x: any) => ({
        value: x.id,
        label: x.name
      }))
    ];
  } catch (e) {
    console.error(e);
  }
};


onMounted(() => {
  emit('updateProductTableSummary', productTableSummary.value);
  loadBrands();
});


const productsList = ref([])


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

watch([itemsTable, shippingBrutto], updateTotalSums, { deep: true });

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

const previousOfferItems = ref<OfferItemTable[]>(JSON.parse(JSON.stringify(itemsTable.value)));
watch(
  () => props.items,
  (list) => {
    itemsTable.value = JSON.parse(JSON.stringify(list || []))
    // jeśli używasz previousOfferItems do porównań – uzupełnij też je:
    previousOfferItems.value = JSON.parse(JSON.stringify(itemsTable.value))
    // przelicz sumy i wyemituj podsumowanie
    updateTotalSums()
    emit('updateProductTableSummary', productTableSummary.value)
  },
  { immediate: true, deep: true }
)


watch(
  itemsTable,
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

watch(
  [itemsTable, shippingNetto, shippingBrutto, totalNetto, totalBrutto, totalSumBrutto, transportIndividualPricing],
  () => {
    emit('updateProductTableSummary', productTableSummary.value);
  },
  { deep: true }
);
</script>

<template>
  <div class="relative px-0">
    <h2 class="text-xl mt-4 font-bold bg-gray-100 border-b-[1px] border-[#d6dfe9] shadow-lg p-2">Dodane produkty</h2>
    <div class="bg-white p-2">
      <div class="grid grid-cols-11 gap-2 items-center font-semibold border-b pb-2 text-xs">
        <span class="col-span-4">Nazwa</span>
        <span class="col-span-1">Ilość</span>
        <span class="col-span-1">Jedn.</span>
        <span class="col-span-1">Cena netto</span>
        <span class="col-span-1">Cena producenta</span>
        <span class="col-span-1">VAT %</span>
        <span class="col-span-1">Wartość netto</span>
        <span class="col-span-1">Wartość brutto</span>
      </div>
      <div v-for="(item, index) in itemsTable" :key="index" class="grid grid-cols-11 gap-2 items-center py-2 border-b !items-start">
        <span class="col-span-4">
          <!-- CUSTOM: nazwa + wiersz pomocniczy -->
          <div v-if="item.productId === null" class="space-y-2">
            <FormKit
              :classes="{ outer: 'offer_input' }"
              type="text"
              v-model="item.name"
              placeholder="Nazwa pozycji (własna)"
            />

            <!-- wiersz pomocniczy pod nazwą -->
            <div class="grid grid-cols-3 gap-2">
              <!-- SKU -->
              <FormKit
                type="text"
                v-model="item.sku"
                placeholder="SKU"
                :classes="{ outer: 'offer_input !mt-0' }"
              />

              <!-- PRODUCENT (szerzej: 2/3) -->
              <div class="col-span-2">
              <el-select v-model="item.brandId" filterable clearable placeholder="Wybierz producenta" class="w-full">
                <el-option
                  v-for="(b, idx) in brands"
                  :key="b.value ?? `null-${idx}`"
                  :label="b.label"
                  :value="b.value"
                />
              </el-select>
              </div>
            </div>
          </div>

          <!-- Wyszukiwarka gdy produkt nie wybrany -->
          <FormKit
            v-else-if="!item.name"
            :classes="{ outer: 'offer_input' }"
            type="text"
            v-model="filterSearchProduct.SearchString"
            @focus="handleInputFocus(index)"
            placeholder="Szukaj produktu..."
          />

          <!-- Produkt wybrany (sklepowy) -->
          <FormKit
            v-else
            :classes="{ outer: 'offer_input' }"
            type="text"
            v-model="item.name"
          />
        </span>
        <span class="col-span-1">
          <FormKit v-model="item.quantity" type="number" />
        </span>
        <span class="col-span-1">
          <FormKit type="text" disabled placeholder="szt." />
        </span>
        <span class="col-span-1">
          <FormKit v-model="item.priceNetto" type="number" step="0.01" />
        </span>
        <span class="col-span-1">
          <FormKit v-model="item.producerPriceNetto" type="number" step="0.01" />
        </span>
        <span class="col-span-1">
          <FormKit type="text" disabled placeholder="23" />
        </span>
        <span class="col-span-1">
          <FormKit v-model="item.totalPriceNetto" type="number" step="0.01" />
        </span>
        <span class="col-span-1">
          <FormKit v-model="item.totalPriceGross" type="number" step="0.01" />
        </span>
        <div v-if="item.name" @click="removeProductHandle(index)" class="absolute cursor-pointer right-[-18px] mb-[12px]  bg-red-600 rounded-md h-7 w-7 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          class="text-white"
        >
          <path
            fill="currentColor"
            d="m12 13.4l-2.917 2.925q-.277.275-.704.275t-.704-.275q-.275-.275-.275-.7t.275-.7L10.6 12L7.675 9.108Q7.4 8.831 7.4 8.404t.275-.704q.275-.275.7-.275t.7.275L12 10.625L14.892 7.7q.277-.275.704-.275t.704.275q.3.3.3.713t-.3.687L13.375 12l2.925 2.917q.275.277.275.704t-.275.704q-.3.3-.712.3t-.688-.3z"
          />
        </svg>
      </div>
        <div
          class="h-[auto] col-span-11"
          v-if="activeRowIndex === index && filterSearchProduct.SearchString.length > 0"
        >
          <ul class="bg-gray-200 w-full max-h-[300px] p-5 overflow-auto">
            <li
              v-for="product in productsList"
              :key="product.id"
              @click="addProductToListHandle(product, index)"
              class="cursor-pointer hover:bg-gray-300 p-2"
            >
              <div class="flex">
                <img :src="product.filePath" class="w-[35px] h-[35px]" />
                <span class="my-auto text-[13px] ml-2">{{ product.name }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <el-button @click="addNewItem" type="primary" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Dodaj pozycję</el-button>
      <el-button @click="addCustomItem" type="success" class="mt-4 px-4">Dodaj pozycję własną</el-button>
      <div class="flex gap-4 justify-end w-[1/1]">
        <div class="mt-12 check_box_offer">
          <FormKit
            type="checkbox"
            label="Tranport do indywidualnej wyceny"
            help=""
            v-model="transportIndividualPricing"
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
        <div class="mb-2 mt-4">
          <div class="flex justify-end">
            <div class="w-[400px] flex justify-between mb-2 pb-1">
              <span class="font-bold text-left w-[50%]">Koszt towaru (netto):</span>
              <span class="font-semibold">{{ totalNetto }}</span>
              <span class="font-semibold w-1/3">PLN</span>
            </div>
          </div>
          <div class="flex justify-end">
            <div class="w-[400px] flex justify-between mb-2 border-b pb-3">
              <span class="font-bold text-left w-[50%]">Koszt towaru (brutto):</span>
              <span class="font-semibold">{{ totalBrutto }}</span>
              <span class="font-semibold w-1/3">PLN</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end">
          <div class="w-[400px] flex justify-between mb-2 pb-1">
            <span class="font-bold text-left w-[50%]">Wysyłka (netto):</span>
            <span class="font-semibold">{{ shippingNetto }}</span>
            <span class="font-semibold w-1/3">PLN</span>
          </div>
        </div>
        <div class="flex justify-end">
          <div class="w-[400px] flex justify-between mb-2 border-b pb-3">
            <span class="font-bold text-left w-[50%]">Wysyłka (brutto):</span>
            <span class="font-semibold">{{ shippingBrutto }}</span>
            <span class="font-semibold w-1/3">PLN</span>
          </div>
        </div>
        <div class="flex justify-end">
          <div class="w-[400px] flex justify-between mb-2 border-b pb-3">
            <span class="font-bold text-left w-[50%]">Suma (brutto):</span>
            <span class="font-semibold">{{ totalSumBrutto }}</span>
            <span class="font-semibold w-1/3">PLN</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
