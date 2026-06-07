<script lang="ts" setup>
import { ref, watch, computed, onMounted } from 'vue'
import { Delete, Plus, Search, Van, Box } from '@element-plus/icons-vue'
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
}>()

const props = defineProps<{
  items: OfferItemTable[],
  shippingNetto: number,
  shippingBrutto: number,
  totalNetto: string,
  totalBrutto: string,
  totalSumBrutto: string,
  transportIndividualPricing: boolean
}>()

const taxRate = 0.23
const shippingNetto = ref(props.shippingNetto)
const shippingBrutto = ref(props.shippingBrutto)
const totalNetto = ref(props.totalNetto)
const totalBrutto = ref(props.totalBrutto)
const totalSumBrutto = ref(props.totalSumBrutto)
const transportIndividualPricing = ref(props.transportIndividualPricing)
const activeRowIndex = ref<number | null>(null)
const itemsTable = ref<any[]>([])

const productTableSummary = computed(() => ({
  items: itemsTable.value,
  shippingNetto: shippingNetto.value,
  shippingBrutto: shippingBrutto.value,
  totalNetto: totalNetto.value,
  totalBrutto: totalBrutto.value,
  totalSumBrutto: totalSumBrutto.value,
  transportIndividualPricing: transportIndividualPricing.value
}))

const searchProduct = ref('')

const filterSearchProduct = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 30,
  SearchString: searchProduct.value
})

const formatMoney = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0)
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`
}

const shippingRuleSummary = (rule: any) => {
  if (!rule) return 'Brak reguły transportu'
  const parts: string[] = [rule.name || 'Reguła transportu']
  if (rule.shipmentPrice) parts.push(`karton ${formatMoney(rule.shipmentPrice)}`)
  if (rule.stackPallet && rule.shipmentPricePallet) parts.push(`paleta ${formatMoney(rule.shipmentPricePallet)}`)
  return parts.join(' · ')
}

const lineDiscountPercent = (item: any) => {
  const start = Number(item.startingPriceNetto)
  const price = Number(item.priceNetto)
  if (!start || start <= price) return null
  return Math.round((1 - price / start) * 100)
}

const itemShippingEstimate = (item: any) => {
  if (item.productId === null) {
    const gross = Number(item.shippingPriceGross || 0)
    return gross > 0 ? gross : null
  }
  if (!item.shippingRule) return null
  return calculatePalletsAndCardboards(item)
}

const isCustomItem = (item: any) => item.productId === null

const handleInputFocus = (index: number) => {
  activeRowIndex.value = index
}

const updateTotalSums = () => {
  totalNetto.value = itemsTable.value.reduce((sum, item) => sum + parseFloat(item.totalPriceNetto || 0), 0).toFixed(2)
  totalBrutto.value = itemsTable.value.reduce((sum, item) => sum + parseFloat(item.totalPriceGross || 0), 0).toFixed(2)
  totalSumBrutto.value = (parseFloat(totalBrutto.value) + parseFloat(String(shippingBrutto.value || 0))).toFixed(2)
}

const removeProductHandle = (rowIndex: number) => {
  itemsTable.value.splice(rowIndex, 1)
  if (activeRowIndex.value === rowIndex) activeRowIndex.value = null
}

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
  })
  activeRowIndex.value = itemsTable.value.length - 1
}

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
  })
  activeRowIndex.value = itemsTable.value.length - 1
}

const addProductToListHandle = async (item: any, index: number) => {
  activeRowIndex.value = null
  const currentItem = itemsTable.value[index]
  filterSearchProduct.value.SearchString = ''
  searchProduct.value = ''
  currentItem.productId = item.id
  currentItem.name = item.name
  currentItem.quantity = 1
  currentItem.priceNetto = item.priceNetto
  currentItem.startingPriceNetto = item.startingPriceNetto ?? item.priceNetto
  currentItem.totalPriceGross = 0
  currentItem.tax = item.taxPercent ?? taxRate * 100
  currentItem.producerPriceNetto = item.producerPrice
  currentItem.totalPriceNetto = 0
  currentItem.totalPriceGross = 0
  currentItem.shippingRule = item.shippingRule
  currentItem.shippingPriceGross = currentItem.shippingPriceGross ?? 0
  currentItem.productImage = item.filePath
  currentItem.identificationCode = item.identificationCode
  updateItemValues(currentItem, 'priceNetto')
}

const calculateShipping = () => {
  let totalShippingNetto = 0
  let totalShippingBrutto = 0

  itemsTable.value.forEach((item) => {
    if (!item.shippingRule) return
    const shippingCost = calculatePalletsAndCardboards(item)
    const shippingAmountNetto = shippingCost / (1 + taxRate)
    totalShippingNetto += shippingAmountNetto
    totalShippingBrutto += shippingCost
  })

  itemsTable.value.forEach((item) => {
    if (item.productId !== null) return
    const customGross = parseFloat(item.shippingPriceGross || 0)
    if (!isNaN(customGross) && customGross > 0) {
      totalShippingBrutto += customGross
      totalShippingNetto += customGross / (1 + taxRate)
    }
  })

  shippingNetto.value = totalShippingNetto.toFixed(2)
  shippingBrutto.value = totalShippingBrutto.toFixed(2)
}

const calculatePalletsAndCardboards = (product: any) => {
  let shippingPrice = 0
  let quantitySum = product.quantity
  const rule = product.shippingRule

  if (!rule) return 0

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

  if ((quantitySum > 0 && quantitySum < rule.conditionMinForQuantityPallet) || !rule.stackPallet) {
    const cardboardCount = Math.ceil(quantitySum / rule.conditionMaxQuantity)
    shippingPrice += cardboardCount * rule.shipmentPrice
  }

  return shippingPrice
}

const updateShippingValues = (changedField: string) => {
  if (changedField === 'netto') {
    shippingBrutto.value = parseFloat((Number(shippingNetto.value) * (1 + taxRate)).toFixed(2))
  } else if (changedField === 'brutto') {
    shippingNetto.value = parseFloat((Number(shippingBrutto.value) / (1 + taxRate)).toFixed(2))
  }
}

const brands = ref<{ value: string | null; label: string }[]>([])

const loadBrands = async () => {
  try {
    const result = await Api.brands.listByStoreId()
    brands.value = [
      { value: null, label: 'Producent' },
      ...result.items.map((x: any) => ({
        value: x.id,
        label: x.name
      }))
    ]
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  emit('updateProductTableSummary', productTableSummary.value)
  loadBrands()
})

const productsList = ref<any[]>([])

watch(filterSearchProduct, async (newFilterSearchProduct) => {
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
  } else {
    productsList.value = []
  }
}, { deep: true })

watch(searchProduct, (val) => {
  filterSearchProduct.value.SearchString = val
})

watch([itemsTable, shippingBrutto], updateTotalSums, { deep: true })

const updateItemValues = (item: any, changedField: string) => {
  if (changedField === 'priceNetto') {
    item.priceGross = (item.priceNetto * (1 + taxRate)).toFixed(2)
    item.totalPriceNetto = (item.quantity * item.priceNetto).toFixed(2)
    item.totalPriceGross = (item.totalPriceNetto * (1 + taxRate)).toFixed(2)
  } else if (changedField === 'totalPriceNetto') {
    item.priceNetto = (item.totalPriceNetto / item.quantity).toFixed(2)
    item.priceGross = (item.priceNetto * (1 + taxRate)).toFixed(2)
    item.totalPriceGross = (item.totalPriceNetto * (1 + taxRate)).toFixed(2)
  } else if (changedField === 'totalPriceGross') {
    item.totalPriceNetto = (item.totalPriceGross / (1 + taxRate)).toFixed(2)
    item.priceNetto = (item.totalPriceNetto / item.quantity).toFixed(2)
    item.priceGross = (item.priceNetto * (1 + taxRate)).toFixed(2)
  } else if (changedField === 'quantity') {
    item.totalPriceNetto = (item.quantity * item.priceNetto).toFixed(2)
    item.totalPriceGross = (item.totalPriceNetto * (1 + taxRate)).toFixed(2)
  }
}

const previousOfferItems = ref<OfferItemTable[]>([])

watch(
  () => props.items,
  (list) => {
    itemsTable.value = JSON.parse(JSON.stringify(list || []))
    previousOfferItems.value = JSON.parse(JSON.stringify(itemsTable.value))
    updateTotalSums()
    emit('updateProductTableSummary', productTableSummary.value)
  },
  { immediate: true, deep: true }
)

watch(
  itemsTable,
  (newItems) => {
    newItems.forEach((newItem, index) => {
      const oldItem = previousOfferItems.value[index]
      if (!oldItem) return

      if (newItem.priceNetto !== oldItem.priceNetto) {
        updateItemValues(newItem, 'priceNetto')
      } else if (newItem.totalPriceNetto !== oldItem.totalPriceNetto) {
        updateItemValues(newItem, 'totalPriceNetto')
      } else if (newItem.totalPriceGross !== oldItem.totalPriceGross) {
        updateItemValues(newItem, 'totalPriceGross')
      } else if (newItem.quantity !== oldItem.quantity) {
        updateItemValues(newItem, 'quantity')
      }
    })

    previousOfferItems.value = JSON.parse(JSON.stringify(newItems))
  },
  { deep: true }
)

watch(
  [itemsTable, shippingNetto, shippingBrutto, totalNetto, totalBrutto, totalSumBrutto, transportIndividualPricing],
  () => {
    emit('updateProductTableSummary', productTableSummary.value)
  },
  { deep: true }
)

const itemsWithShippingRules = computed(() =>
  itemsTable.value.filter((item) => item.shippingRule || isCustomItem(item)).length
)
</script>

<template>
  <section class="ptable">
    <div class="ptable__head">
      <div>
        <h2 class="ptable__title">Produkty w zamówieniu</h2>
        <p class="ptable__subtitle">Dodaj pozycje, sprawdź reguły transportu i podsumowanie kosztów</p>
      </div>
      <div class="ptable__head-actions">
        <el-button type="primary" :icon="Plus" @click="addNewItem">Produkt ze sklepu</el-button>
        <el-button :icon="Box" @click="addCustomItem">Pozycja własna</el-button>
      </div>
    </div>

    <div v-if="!itemsTable.length" class="ptable__empty">
      <div class="ptable__empty-icon">📦</div>
      <h3>Brak produktów</h3>
      <p>Dodaj produkt ze sklepu lub własną pozycję, aby zbudować zamówienie.</p>
      <div class="ptable__empty-actions">
        <el-button type="primary" :icon="Plus" @click="addNewItem">Dodaj produkt</el-button>
        <el-button @click="addCustomItem">Dodaj pozycję własną</el-button>
      </div>
    </div>

    <div v-else class="ptable__items">
      <article
        v-for="(item, index) in itemsTable"
        :key="index"
        class="ptable-item"
        :class="{ 'ptable-item--custom': isCustomItem(item) }"
      >
        <div class="ptable-item__top">
          <div class="ptable-item__identity">
            <div class="ptable-item__thumb">
              <img v-if="item.productImage" :src="item.productImage" alt="" />
              <span v-else>{{ isCustomItem(item) ? '✦' : '📦' }}</span>
            </div>
            <div class="ptable-item__meta">
              <div v-if="isCustomItem(item)" class="ptable-item__search">
                <el-input v-model="item.name" placeholder="Nazwa pozycji własnej" />
              </div>
              <div v-else-if="!item.name" class="ptable-item__search">
                <el-input
                  v-model="searchProduct"
                  placeholder="Szukaj po nazwie lub kodzie..."
                  :prefix-icon="Search"
                  @focus="handleInputFocus(index)"
                />
              </div>
              <div v-else class="ptable-item__name">{{ item.name }}</div>

              <div class="ptable-item__badges">
                <span v-if="item.identificationCode" class="ptable-badge ptable-badge--sku">
                  {{ item.identificationCode }}
                </span>
                <span
                  class="ptable-badge"
                  :class="item.shippingRule ? 'ptable-badge--rule' : 'ptable-badge--muted'"
                >
                  <el-icon><Van /></el-icon>
                  {{ shippingRuleSummary(item.shippingRule) }}
                </span>
                <span v-if="itemShippingEstimate(item)" class="ptable-badge ptable-badge--ship">
                  transport {{ formatMoney(itemShippingEstimate(item)) }}
                </span>
                <span v-if="lineDiscountPercent(item)" class="ptable-badge ptable-badge--discount">
                  rabat {{ lineDiscountPercent(item) }}%
                </span>
                <span v-if="isCustomItem(item)" class="ptable-badge ptable-badge--custom">pozycja własna</span>
              </div>
            </div>
          </div>

          <el-button
            type="danger"
            text
            circle
            :icon="Delete"
            @click="removeProductHandle(index)"
          />
        </div>

        <div v-if="isCustomItem(item)" class="ptable-item__custom-row">
          <el-input v-model="item.sku" placeholder="SKU" />
          <el-select v-model="item.brandId" filterable clearable placeholder="Producent" class="w-full">
            <el-option
              v-for="(b, idx) in brands"
              :key="b.value ?? `null-${idx}`"
              :label="b.label"
              :value="b.value"
            />
          </el-select>
          <el-input-number
            v-model="item.shippingPriceGross"
            :min="0"
            :step="0.01"
            :precision="2"
            controls-position="right"
            placeholder="Transport brutto"
          />
        </div>

        <div class="ptable-item__grid">
          <label class="ptable-field">
            <span>Ilość</span>
            <el-input-number v-model="item.quantity" :min="1" controls-position="right" />
          </label>
          <label class="ptable-field">
            <span>Cena netto</span>
            <el-input-number v-model="item.priceNetto" :min="0" :step="0.01" :precision="2" controls-position="right" />
          </label>
          <label class="ptable-field">
            <span>Cena producenta</span>
            <el-input-number v-model="item.producerPriceNetto" :min="0" :step="0.01" :precision="2" controls-position="right" />
          </label>
          <label class="ptable-field">
            <span>VAT</span>
            <el-input :model-value="`${item.tax || 23}%`" disabled />
          </label>
          <label class="ptable-field">
            <span>Wartość netto</span>
            <el-input-number v-model="item.totalPriceNetto" :min="0" :step="0.01" :precision="2" controls-position="right" />
          </label>
          <label class="ptable-field">
            <span>Wartość brutto</span>
            <el-input-number v-model="item.totalPriceGross" :min="0" :step="0.01" :precision="2" controls-position="right" />
          </label>
        </div>

        <div
          v-if="activeRowIndex === index && searchProduct.length > 0 && !item.name"
          class="ptable-search-results"
        >
          <button
            v-for="product in productsList"
            :key="product.id"
            type="button"
            class="ptable-search-result"
            @click="addProductToListHandle(product, index)"
          >
            <img v-if="product.filePath" :src="product.filePath" alt="" />
            <div class="ptable-search-result__text">
              <strong>{{ product.name }}</strong>
              <span>{{ product.identificationCode || '—' }} · {{ formatMoney(product.priceNetto) }} netto</span>
              <span v-if="product.shippingRule" class="ptable-search-result__rule">
                {{ product.shippingRule.name }}
              </span>
            </div>
          </button>
          <div v-if="!productsList.length" class="ptable-search-results__empty">Brak wyników wyszukiwania</div>
        </div>
      </article>
    </div>

    <div class="ptable__footer">
      <div class="ptable-shipping">
        <div class="ptable-shipping__head">
          <h3>Transport i wysyłka</h3>
          <p>{{ itemsWithShippingRules }} poz. z regułą / transportem</p>
        </div>
        <div class="ptable-shipping__actions">
          <el-checkbox v-model="transportIndividualPricing" label="Transport do indywidualnej wyceny" />
          <el-button type="primary" :icon="Van" @click="calculateShipping">Policz transport</el-button>
        </div>
        <div class="ptable-shipping__inputs">
          <label class="ptable-field">
            <span>Dostawa netto</span>
            <el-input-number
              v-model="shippingNetto"
              :min="0"
              :step="0.01"
              :precision="2"
              controls-position="right"
              @change="updateShippingValues('netto')"
            />
          </label>
          <label class="ptable-field">
            <span>Dostawa brutto</span>
            <el-input-number
              v-model="shippingBrutto"
              :min="0"
              :step="0.01"
              :precision="2"
              controls-position="right"
              @change="updateShippingValues('brutto')"
            />
          </label>
        </div>
      </div>

      <div class="ptable-summary">
        <div class="ptable-summary__row">
          <span>Koszt towaru (netto)</span>
          <strong>{{ formatMoney(totalNetto) }}</strong>
        </div>
        <div class="ptable-summary__row">
          <span>Koszt towaru (brutto)</span>
          <strong>{{ formatMoney(totalBrutto) }}</strong>
        </div>
        <div class="ptable-summary__row">
          <span>Wysyłka (netto)</span>
          <strong>{{ formatMoney(shippingNetto) }}</strong>
        </div>
        <div class="ptable-summary__row">
          <span>Wysyłka (brutto)</span>
          <strong>{{ formatMoney(shippingBrutto) }}</strong>
        </div>
        <div class="ptable-summary__row ptable-summary__row--total">
          <span>Suma brutto</span>
          <strong>{{ formatMoney(totalSumBrutto) }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ptable {
  margin-top: 20px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.ptable__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.9);
}

.ptable__title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.ptable__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.ptable__head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ptable__empty {
  padding: 48px 24px;
  text-align: center;
}

.ptable__empty-icon {
  font-size: 42px;
  margin-bottom: 8px;
}

.ptable__empty h3 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #0f172a;
}

.ptable__empty p {
  margin: 0 0 16px;
  color: #64748b;
}

.ptable__empty-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ptable__items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.ptable-item {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  padding: 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.ptable-item--custom {
  border-color: #fde68a;
  background: linear-gradient(180deg, #fff 0%, #fffbeb 100%);
}

.ptable-item__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ptable-item__identity {
  display: flex;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.ptable-item__thumb {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-size: 22px;
}

.ptable-item__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ptable-item__meta {
  min-width: 0;
  flex: 1;
}

.ptable-item__name {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
}

.ptable-item__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.ptable-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.ptable-badge--sku {
  background: #eff6ff;
  color: #1d4ed8;
}

.ptable-badge--rule {
  background: #ecfeff;
  color: #0e7490;
}

.ptable-badge--ship {
  background: #f0fdf4;
  color: #15803d;
}

.ptable-badge--discount {
  background: #fff7ed;
  color: #c2410c;
}

.ptable-badge--custom {
  background: #fef3c7;
  color: #b45309;
}

.ptable-badge--muted {
  background: #f8fafc;
  color: #94a3b8;
}

.ptable-item__custom-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: 10px;
  margin-top: 12px;
}

.ptable-item__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.ptable-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.ptable-field > span {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.ptable-search-results {
  margin-top: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  max-height: 260px;
  overflow-y: auto;
}

.ptable-search-result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid #e2e8f0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.ptable-search-result:hover {
  background: #eef2ff;
}

.ptable-search-result img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.ptable-search-result__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ptable-search-result__text strong {
  color: #0f172a;
  font-size: 13px;
}

.ptable-search-result__text span {
  color: #64748b;
  font-size: 11px;
}

.ptable-search-result__rule {
  color: #0e7490 !important;
}

.ptable-search-results__empty {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.ptable__footer {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 16px;
  padding: 16px 20px 20px;
  border-top: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.7);
}

.ptable-shipping,
.ptable-summary {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  padding: 16px;
}

.ptable-shipping__head h3,
.ptable-summary__row--total span {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.ptable-shipping__head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.ptable-shipping__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 14px 0;
}

.ptable-shipping__inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ptable-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ptable-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #475569;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}

.ptable-summary__row strong {
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.ptable-summary__row--total {
  border-bottom: none;
  padding: 10px 12px;
  margin-top: 4px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  font-size: 15px;
}

.ptable-summary__row--total strong {
  font-size: 20px;
  color: #1d4ed8;
}

@media (max-width: 1100px) {
  .ptable-item__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ptable__footer {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .ptable__head {
    flex-direction: column;
  }

  .ptable-item__custom-row,
  .ptable-item__grid,
  .ptable-shipping__inputs {
    grid-template-columns: 1fr;
  }
}
</style>
