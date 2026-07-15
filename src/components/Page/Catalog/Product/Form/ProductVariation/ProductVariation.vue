<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Api } from '/@/services/api'
import { DisplayType, ProductOptionDTO } from '/@/types/product/ProductOption'
import type { ProductDTO } from '/@/types/product/Product.ts'
import { useLanguageStore } from '/@/stores/language'
import {
  ProductVariationDTO,
  ProductOptionCombinationDTO,
  MediaDTO
} from '/@/types/product/ProductVariation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Close,
  CopyDocument,
  Edit,
  Plus,
  Picture,
  Setting
} from '@element-plus/icons-vue'
import ProductVariationThumbnail from './ProductVariationThumbnail.vue'
import { useToast } from 'vue-toastification'
import { useStoreStore } from '/@/stores/store'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'
import {
  applyVariantNaming,
  buildVariantName,
  buildVariantOptionSuffix
} from '/@/composables/useProductVariationNaming'
import { buildOptionCombination } from '/@/composables/useProductOptionLangSync'

interface ProductVariationInterface {
  userId: string
  storeId: string
  productId: string
  variation: ProductVariationDTO
}

interface OptionValueState {
  key: string
  display?: string
  available: boolean
  selected: boolean
}

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  },
  productOptions: {
    type: Array as () => ProductOptionDTO[],
    default: () => []
  }
})

const emit = defineEmits(['refresh'])

const toast = useToast()
const cookies = new Cookies()
const store = useStoreStore()
const language = useLanguageStore()

const selectedOptionValues = ref<Record<string, string>>({})
const saving = ref(false)
const bulkAdding = ref(false)
const createStep = ref(1)
const createDrawerOpen = ref(false)

const activeProductOptions = ref<ProductOptionDTO[]>([...props.productOptions])
const currentProductVariation = ref<ProductVariationDTO | null>(null)
const productVariationList = ref<ProductVariationDTO[]>([])
const editDrawerOpen = ref(false)
const editProductVariation = ref<ProductVariationDTO | null>(null)

const createSteps = [
  { id: 1, title: 'Kolor / opcje', hint: 'Wybierz kombinację' },
  { id: 2, title: 'Dane i ceny', hint: 'SKU, identyfikator' },
  { id: 3, title: 'Zdjęcie', hint: 'Miniatura i SEO' }
]

const syncVariationList = () => {
  productVariationList.value = [...(props.product?.variations ?? [])]
}

watch(
  () => props.product?.variations,
  () => syncVariationList(),
  { deep: true, immediate: true }
)

watch(
  () => props.productOptions,
  (options) => {
    activeProductOptions.value = [...options]
  },
  { deep: true }
)

const previewVariantName = computed(() => {
  if (!currentProductVariation.value) {
    return ''
  }
  return buildVariantName(props.product.name, currentProductVariation.value.optionCombinations)
})

const editPreviewVariantName = computed(() => {
  if (!editProductVariation.value) {
    return ''
  }
  return buildVariantName(props.product.name, editProductVariation.value.optionCombinations)
})

const selectedOptionsCount = computed(() =>
  activeProductOptions.value.filter((option) => !!selectedOptionValues.value[option.optionId]).length
)

const allOptionsSelected = computed(
  () =>
    activeProductOptions.value.length > 0 &&
    selectedOptionsCount.value === activeProductOptions.value.length
)

const canGoToStep2 = computed(() => allOptionsSelected.value)
const canSave = computed(() => {
  if (!currentProductVariation.value) {
    return false
  }
  return validateCombinations(currentProductVariation.value) === null
})

const createPreviewThumbnail = computed(
  () =>
    currentProductVariation.value?.thumbnailImage?.filePath ||
    props.product.thumbnailImage?.filePath
)

const primaryColorOption = computed(() =>
  activeProductOptions.value.find((option) => Number(option.displayType) === DisplayType.Color)
)

const isColorOnlyMode = computed(
  () => activeProductOptions.value.length === 1 && !!primaryColorOption.value
)

const getDecodedUserId = () => {
  const token = cookies.get('Authorization')
  const decoded = jwt_decode(token) as { UserId: string }
  return decoded.UserId
}

const createEmptyVariation = (): ProductVariationDTO => ({
  id: '',
  name: '',
  sku: '',
  gtin: '',
  price: props.product.price ?? 0,
  oldPrice: props.product.oldPrice ?? null,
  producerPrice: props.product.producerPrice ?? null,
  identificationCode: props.product.identificationCode ?? null,
  thumbnailImage: null,
  images: null,
  optionCombinations: [],
  productVariationLangs: language.languages.map((lang) => ({
    languageId: lang.id,
    name: ''
  }))
})

const buildCombination = (optionId: string, key: string): ProductOptionCombinationDTO | null => {
  const option = activeProductOptions.value.find((item) => item.optionId === optionId)
  if (!option) {
    return null
  }

  return buildOptionCombination(
    option,
    key,
    activeProductOptions.value.findIndex((item) => item.optionId === optionId)
  )
}

const getAvailableOptionValues = (
  optionId: string,
  variation: ProductVariationDTO | null,
  excludeVariationId?: string
) => {
  const option = activeProductOptions.value.find((item) => item.optionId === optionId)
  if (!option || !variation) {
    return option?.values ?? []
  }

  const otherCombinations =
    variation.optionCombinations?.filter((item) => item.optionId !== optionId) ?? []

  return option.values.filter((optionValue) => {
    const testCombination = buildCombination(optionId, optionValue.key)
    if (!testCombination) {
      return false
    }

    const testCombinations = [...otherCombinations, testCombination]
    const testSuffix = buildVariantOptionSuffix(testCombinations)
    if (!testSuffix) {
      return true
    }

    const duplicate = productVariationList.value.some((existing) => {
      if (excludeVariationId && existing.id === excludeVariationId) {
        return false
      }
      return buildVariantOptionSuffix(existing.optionCombinations) === testSuffix
    })

    return !duplicate
  })
}

const pendingColorValues = computed(() => {
  if (!primaryColorOption.value) {
    return []
  }
  return getAvailableOptionValues(primaryColorOption.value.optionId, createEmptyVariation())
})

const getAvailableValuesForNew = (optionId: string) =>
  getAvailableOptionValues(optionId, currentProductVariation.value)

const getOptionValueStates = (option: ProductOptionDTO): OptionValueState[] => {
  const availableKeys = new Set(getAvailableValuesForNew(option.optionId).map((item) => item.key))

  return option.values.map((optionValue) => ({
    key: optionValue.key,
    display: optionValue.display,
    available: availableKeys.has(optionValue.key),
    selected: selectedOptionValues.value[option.optionId] === optionValue.key
  }))
}

const handleOptionChange = (optionId: string, key: string | null | undefined) => {
  if (!currentProductVariation.value) {
    return
  }

  if (!key) {
    delete selectedOptionValues.value[optionId]
    currentProductVariation.value.optionCombinations =
      currentProductVariation.value.optionCombinations?.filter(
        (item) => item.optionId !== optionId
      ) ?? []
    applyVariantNaming(props.product, currentProductVariation.value, language.languages)
    return
  }

  selectedOptionValues.value[optionId] = key
  const combination = buildCombination(optionId, key)
  if (!combination) {
    return
  }

  const combinationIndex = currentProductVariation.value.optionCombinations.findIndex(
    (item) => item.optionId === optionId
  )

  if (combinationIndex !== -1) {
    currentProductVariation.value.optionCombinations[combinationIndex] = combination
  } else {
    currentProductVariation.value.optionCombinations.push(combination)
  }

  applyVariantNaming(props.product, currentProductVariation.value, language.languages)
}

const handleOptionSelect = (optionId: string, key: string, available: boolean) => {
  if (!available) {
    return
  }
  if (selectedOptionValues.value[optionId] === key) {
    handleOptionChange(optionId, null)
    return
  }
  handleOptionChange(optionId, key)
}

const buildColorVariation = (colorKey: string): ProductVariationDTO | null => {
  const colorOption = primaryColorOption.value
  if (!colorOption) {
    return null
  }

  const variation = createEmptyVariation()
  const combination = buildCombination(colorOption.optionId, colorKey)
  if (!combination) {
    return null
  }

  variation.optionCombinations = [combination]
  applyVariantNaming(props.product, variation, language.languages)
  return variation
}

const persistVariation = async (variation: ProductVariationDTO) => {
  const payload: ProductVariationInterface = {
    storeId: store.selectedStore.id,
    userId: getDecodedUserId(),
    productId: props.product.id,
    variation: {
      ...variation,
      oldPrice: variation.oldPrice || null
    }
  }
  await Api.products.addVariation({ body: JSON.stringify(payload) })
}

const handleQuickAddColor = async (colorKey: string) => {
  const variation = buildColorVariation(colorKey)
  if (!variation || validateCombinations(variation)) {
    toast.error('Nie można dodać tego wariantu')
    return
  }

  saving.value = true
  try {
    await persistVariation(variation)
    toast.success(
      `Dodano: ${buildVariantName(props.product.name, variation.optionCombinations)}`
    )
    await refreshProduct()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się dodać wariantu')
  } finally {
    saving.value = false
  }
}

const handleQuickAddAllColors = async () => {
  const colors = [...pendingColorValues.value]
  if (!colors.length) {
    return
  }

  bulkAdding.value = true
  let added = 0

  try {
    for (const color of colors) {
      const variation = buildColorVariation(color.key)
      if (!variation || validateCombinations(variation)) {
        continue
      }
      await persistVariation(variation)
      added += 1
      syncVariationList()
    }
    await refreshProduct()
    toast.success(added > 0 ? `Dodano ${added} wariantów` : 'Brak nowych wariantów do dodania')
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się dodać wariantów')
  } finally {
    bulkAdding.value = false
  }
}

const openCreateDrawerWithColor = async (colorKey: string) => {
  resetCreateForm()
  createDrawerOpen.value = true
  await nextTick()
  handleOptionSelect(primaryColorOption.value!.optionId, colorKey, true)
  createStep.value = 2
}

const resetCreateForm = () => {
  currentProductVariation.value = createEmptyVariation()
  selectedOptionValues.value = {}
  createStep.value = 1
}

const handleNewVariation = async () => {
  resetCreateForm()
  createDrawerOpen.value = true
  await nextTick()
}

const closeCreateDrawer = () => {
  createDrawerOpen.value = false
  currentProductVariation.value = null
  selectedOptionValues.value = {}
  createStep.value = 1
}

const goToNextStep = () => {
  if (createStep.value === 1 && !canGoToStep2.value) {
    toast.info('Wybierz wszystkie opcje wariantu')
    return
  }
  if (createStep.value < 3) {
    createStep.value += 1
  }
}

const goToPreviousStep = () => {
  if (createStep.value > 1) {
    createStep.value -= 1
  }
}

const copyPricesFromParent = () => {
  if (!currentProductVariation.value) {
    return
  }
  currentProductVariation.value.price = props.product.price ?? 0
  currentProductVariation.value.producerPrice = props.product.producerPrice ?? null
  currentProductVariation.value.oldPrice = props.product.oldPrice ?? null
  toast.success('Skopiowano ceny z produktu głównego')
}

const openEditDrawer = (variation: ProductVariationDTO) => {
  editProductVariation.value = JSON.parse(JSON.stringify(variation))
  editDrawerOpen.value = true
}

const closeEditDrawer = () => {
  editDrawerOpen.value = false
  editProductVariation.value = null
}

const handleNewThumbnailImage = (media: MediaDTO) => {
  if (!currentProductVariation.value) {
    return
  }
  currentProductVariation.value.thumbnailImage = media
  applyVariantNaming(props.product, currentProductVariation.value, language.languages)
}

const handleEditThumbnailImage = (media: MediaDTO) => {
  if (!editProductVariation.value) {
    return
  }
  editProductVariation.value.thumbnailImage = media
  applyVariantNaming(props.product, editProductVariation.value, language.languages)
}

const validateCombinations = (variation: ProductVariationDTO) => {
  if (activeProductOptions.value.length === 0) {
    return 'Dodaj najpierw opcje produktu.'
  }
  if ((variation.optionCombinations?.length ?? 0) < activeProductOptions.value.length) {
    return 'Wybierz wszystkie opcje wariantu.'
  }
  const duplicate = productVariationList.value.some((existing) => {
    if (existing.id && variation.id && existing.id === variation.id) {
      return false
    }
    const existingSuffix = buildVariantOptionSuffix(existing.optionCombinations)
    const newSuffix = buildVariantOptionSuffix(variation.optionCombinations)
    return existingSuffix === newSuffix && newSuffix.length > 0
  })
  if (duplicate) {
    return 'Wariant o takiej kombinacji opcji już istnieje.'
  }
  return null
}

const refreshProduct = async () => {
  const response = await Api.products.get(props.product.id)
  emit('refresh', response.data)
  syncVariationList()
}

const handleSaveVariation = async () => {
  if (!currentProductVariation.value) {
    return
  }
  const validationError = validateCombinations(currentProductVariation.value)
  if (validationError) {
    toast.error(validationError)
    return
  }
  applyVariantNaming(props.product, currentProductVariation.value, language.languages)
  saving.value = true
  try {
    await persistVariation(currentProductVariation.value)
    toast.success('Dodano wariant')
    closeCreateDrawer()
    await refreshProduct()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się dodać wariantu')
  } finally {
    saving.value = false
  }
}

const handleSaveEdit = async () => {
  if (!editProductVariation.value) {
    return
  }
  saving.value = true
  try {
    applyVariantNaming(props.product, editProductVariation.value, language.languages)
    const payload: ProductVariationInterface = {
      storeId: store.selectedStore.id,
      userId: getDecodedUserId(),
      productId: editProductVariation.value.id,
      variation: {
        ...editProductVariation.value,
        oldPrice: editProductVariation.value.oldPrice || null
      }
    }
    await Api.products.updateVariation({ body: JSON.stringify(payload) })
    toast.success('Zapisano wariant')
    closeEditDrawer()
    await refreshProduct()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zapisać wariantu')
  } finally {
    saving.value = false
  }
}

const formatCombination = (variation: ProductVariationDTO) =>
  variation.name || buildVariantName(props.product.name, variation.optionCombinations)

const formatMoney = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return '—'
  }
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2
  }).format(value)
}

const isColorOption = (option: ProductOptionDTO) =>
  Number(option.displayType) === DisplayType.Color

const getCombinationColor = (variation: ProductVariationDTO, optionId: string) => {
  const option = activeProductOptions.value.find((item) => item.optionId === optionId)
  if (!option || !isColorOption(option)) {
    return null
  }
  const value = variation.optionCombinations?.find((item) => item.optionId === optionId)?.value
  return option.values.find((item) => item.key === value)?.display || null
}
</script>

<template>
  <div class="product-variation-root w-full max-w-none">
    <div class="variant-header">
      <div>
        <h2 class="variant-header__title">Warianty produktu</h2>
        <p class="variant-header__subtitle">
          Nazwy we wszystkich językach bazują na języku domyślnym — tłumaczysz tylko nazwę produktu
          głównego.
        </p>
      </div>
      <el-button type="primary" size="large" :icon="Plus" @click="handleNewVariation">
        Dodaj wariant
      </el-button>
    </div>

    <section v-if="isColorOnlyMode && pendingColorValues.length" class="color-quick-add">
      <div class="color-quick-add__head">
        <div>
          <h3>Szybkie dodawanie kolorów</h3>
          <p>
            Jeden klik = wariant z nazwą, cenami i identyfikatorem jak produkt główny.
            Zdjęcie dodasz później przez „Dostosuj”.
          </p>
        </div>
        <el-button
          v-if="pendingColorValues.length > 1"
          type="success"
          size="large"
          :loading="bulkAdding"
          @click="handleQuickAddAllColors"
        >
          Dodaj wszystkie ({{ pendingColorValues.length }})
        </el-button>
      </div>

      <div class="color-quick-add__grid">
        <div
          v-for="color in pendingColorValues"
          :key="color.key"
          class="color-quick-card"
        >
          <button
            type="button"
            class="color-quick-card__main"
            :disabled="saving || bulkAdding"
            @click="handleQuickAddColor(color.key)"
          >
            <span
              class="color-quick-card__swatch"
              :style="{ backgroundColor: color.display || '#cbd5e1' }"
            />
            <span class="color-quick-card__name">{{ color.key }}</span>
            <span class="color-quick-card__action">+ Dodaj</span>
          </button>
          <el-button
            text
            type="primary"
            :icon="Setting"
            title="Dostosuj przed zapisem"
            @click="openCreateDrawerWithColor(color.key)"
          />
        </div>
      </div>
    </section>

    <div v-if="!productVariationList.length" class="variant-empty">
      <div class="variant-empty__icon">🎨</div>
      <h3>Brak wariantów</h3>
      <p>
        Dodaj pierwszy wariant dla
        <strong>{{ product.name }}</strong>
        — użyj szybkiego dodawania kolorów powyżej lub pełnego kreatora.
      </p>
    </div>

    <el-table v-else :data="productVariationList" stripe class="w-full variant-table">
      <el-table-column label="Wariant" min-width="260">
        <template #default="{ row }">
          <div class="variant-row">
            <img
              v-if="row.thumbnailImage?.filePath"
              class="variant-row__thumb"
              :src="row.thumbnailImage.filePath"
              :alt="row.thumbnailImage.altAttribute || formatCombination(row)"
            />
            <div v-else class="variant-row__thumb variant-row__thumb--empty">
              <el-icon><Picture /></el-icon>
            </div>
            <div class="min-w-0">
              <div class="variant-row__name">{{ formatCombination(row) }}</div>
              <div class="variant-row__chips">
                <span
                  v-for="option in activeProductOptions"
                  :key="option.optionId"
                  class="variant-chip"
                >
                  <span
                    v-if="getCombinationColor(row, option.optionId)"
                    class="variant-chip__dot"
                    :style="{
                      backgroundColor: getCombinationColor(row, option.optionId) || '#ccc'
                    }"
                  />
                  {{
                    row.optionCombinations?.find((c) => c.optionId === option.optionId)?.value ||
                    '—'
                  }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="sku" label="SKU" min-width="120" />
      <el-table-column label="Cena" min-width="100">
        <template #default="{ row }">{{ formatMoney(row.price) }}</template>
      </el-table-column>
      <el-table-column label="" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" :icon="Edit" circle @click="openEditDrawer(row)" />
        </template>
      </el-table-column>
    </el-table>

    <el-drawer
      v-model="createDrawerOpen"
      :show-close="false"
      size="860px"
      :destroy-on-close="true"
      @closed="closeCreateDrawer"
    >
      <template #header>
        <div class="create-drawer-header">
          <div>
            <p class="create-drawer-header__eyebrow">Nowy wariant</p>
            <h3 class="create-drawer-header__title">{{ previewVariantName || product.name }}</h3>
          </div>
          <el-button text :icon="Close" @click="closeCreateDrawer" />
        </div>
      </template>

      <template v-if="currentProductVariation">
        <aside class="create-preview">
          <img
            v-if="createPreviewThumbnail"
            :src="createPreviewThumbnail"
            :alt="previewVariantName"
            class="create-preview__image"
          />
          <div v-else class="create-preview__image create-preview__image--empty">
            <el-icon :size="32"><Picture /></el-icon>
          </div>
          <div>
            <p class="create-preview__label">Nazwa (domyślny + opcje we wszystkich językach)</p>
            <p class="create-preview__name">{{ previewVariantName || 'Wybierz opcje…' }}</p>
            <p class="create-preview__meta">
              {{ selectedOptionsCount }}/{{ activeProductOptions.length }} opcji ·
              {{ formatMoney(currentProductVariation.price) }}
            </p>
          </div>
        </aside>

        <nav class="create-steps">
          <button
            v-for="step in createSteps"
            :key="step.id"
            type="button"
            class="create-step"
            :class="{
              'create-step--active': createStep === step.id,
              'create-step--done': createStep > step.id || (step.id === 1 && allOptionsSelected)
            }"
            @click="createStep = step.id"
          >
            <span class="create-step__number">{{ step.id }}</span>
            <span class="create-step__text">
              <strong>{{ step.title }}</strong>
              <small>{{ step.hint }}</small>
            </span>
          </button>
        </nav>

        <div v-show="createStep === 1" class="create-panel">
          <p class="create-panel__lead">
            Kliknij kolor lub wartość. Wyszarzone = już istnieje jako wariant.
          </p>
          <div v-for="option in activeProductOptions" :key="option.optionId" class="option-group">
            <div class="option-group__head">
              <h4>{{ option.name }}</h4>
              <span>{{ getAvailableValuesForNew(option.optionId).length }} dostępnych</span>
            </div>
            <div class="option-values" :class="{ 'option-values--color': isColorOption(option) }">
              <button
                v-for="valueState in getOptionValueStates(option)"
                :key="valueState.key"
                type="button"
                class="option-value"
                :class="{
                  'option-value--selected': valueState.selected,
                  'option-value--disabled': !valueState.available,
                  'option-value--color': isColorOption(option)
                }"
                :disabled="!valueState.available"
                @click="handleOptionSelect(option.optionId, valueState.key, valueState.available)"
              >
                <span
                  v-if="isColorOption(option)"
                  class="option-value__swatch"
                  :style="{ backgroundColor: valueState.display || '#cbd5e1' }"
                />
                <span class="option-value__label">{{ valueState.key }}</span>
                <el-icon v-if="valueState.selected" class="option-value__check"><Check /></el-icon>
              </button>
            </div>
          </div>
        </div>

        <div v-show="createStep === 2" class="create-panel">
          <div class="create-panel__toolbar">
            <p class="create-panel__lead">Dane wariantu — domyślnie skopiowane z produktu głównego.</p>
            <el-button :icon="CopyDocument" @click="copyPricesFromParent">Kopiuj ceny</el-button>
          </div>
          <div class="create-fields">
            <FormKit type="text" v-model="currentProductVariation.sku" label="SKU" outer-class="variant-field-lg" />
            <FormKit type="text" v-model="currentProductVariation.gtin" label="GTIN" outer-class="variant-field-lg" />
            <FormKit
              type="text"
              v-model="currentProductVariation.identificationCode"
              label="Identyfikator"
              outer-class="variant-field-lg"
            />
            <FormKit
              type="number"
              step="0.01"
              v-model="currentProductVariation.price"
              label="Cena netto"
              outer-class="variant-field-lg"
            />
            <FormKit
              type="number"
              step="0.01"
              v-model="currentProductVariation.producerPrice"
              label="Cena producenta"
              outer-class="variant-field-lg"
            />
          </div>
        </div>

        <div v-show="createStep === 3" class="create-panel">
          <ProductVariationThumbnail
            embedded
            :thumbnailImage="currentProductVariation.thumbnailImage"
            :parent-product="product"
            :variant-name="previewVariantName"
            @save="handleNewThumbnailImage"
          />
        </div>
      </template>

      <template #footer>
        <div class="create-footer">
          <el-button v-if="createStep > 1" size="large" :icon="ArrowLeft" @click="goToPreviousStep">
            Wstecz
          </el-button>
          <div class="create-footer__spacer" />
          <el-button size="large" @click="closeCreateDrawer">Anuluj</el-button>
          <el-button
            v-if="createStep < 3"
            type="primary"
            size="large"
            :icon="ArrowRight"
            :disabled="createStep === 1 && !canGoToStep2"
            @click="goToNextStep"
          >
            Dalej
          </el-button>
          <el-button
            v-else
            type="success"
            size="large"
            :icon="Check"
            :loading="saving"
            :disabled="!canSave"
            @click="handleSaveVariation"
          >
            Zapisz wariant
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="editDrawerOpen" title="Edycja wariantu" size="720px">
      <template v-if="editProductVariation">
        <div class="mb-5 rounded-xl bg-slate-100 px-4 py-3">
          <div class="font-semibold">{{ formatCombination(editProductVariation) }}</div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormKit type="text" v-model="editProductVariation.sku" label="SKU" outer-class="variant-field-lg" />
          <FormKit type="text" v-model="editProductVariation.gtin" label="GTIN" outer-class="variant-field-lg" />
          <FormKit
            type="text"
            v-model="editProductVariation.identificationCode"
            label="Identyfikator"
            outer-class="variant-field-lg"
          />
          <FormKit type="number" step="0.01" v-model="editProductVariation.price" label="Cena" outer-class="variant-field-lg" />
          <FormKit
            type="number"
            step="0.01"
            v-model="editProductVariation.producerPrice"
            label="Cena producenta"
            outer-class="variant-field-lg"
          />
        </div>
        <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <ProductVariationThumbnail
            embedded
            :thumbnailImage="editProductVariation.thumbnailImage"
            :parent-product="product"
            :variant-name="editPreviewVariantName"
            @save="handleEditThumbnailImage"
          />
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <el-button size="large" @click="closeEditDrawer">Anuluj</el-button>
          <el-button type="primary" size="large" :loading="saving" @click="handleSaveEdit">
            Zapisz
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.product-variation-root :deep(.formkit-outer) {
  width: 100% !important;
  max-width: none !important;
}

.variant-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.variant-header__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.variant-header__subtitle {
  margin: 6px 0 0;
  color: #64748b;
  max-width: 560px;
  line-height: 1.5;
}

.color-quick-add {
  margin-bottom: 24px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid #fed7aa;
  background: linear-gradient(135deg, #fff7ed 0%, #fff 100%);
}

.color-quick-add__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.color-quick-add__head h3 {
  margin: 0 0 6px;
  font-size: 1.1rem;
}

.color-quick-add__head p {
  margin: 0;
  color: #78716c;
  max-width: 520px;
  line-height: 1.5;
}

.color-quick-add__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.color-quick-card {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.color-quick-card__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s;
}

.color-quick-card__main:hover:not(:disabled) {
  background: #fff7ed;
}

.color-quick-card__main:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-quick-card__swatch {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.color-quick-card__name {
  font-weight: 600;
  color: #0f172a;
}

.color-quick-card__action {
  font-size: 12px;
  color: #ea580c;
  font-weight: 600;
}

.variant-empty {
  text-align: center;
  padding: 40px 20px;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
}

.variant-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.variant-row__thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.variant-row__thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #94a3b8;
}

.variant-row__name {
  font-weight: 600;
}

.variant-row__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.variant-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  font-size: 12px;
}

.variant-chip__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.create-drawer-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.create-drawer-header__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
}

.create-drawer-header__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.create-preview {
  display: flex;
  gap: 16px;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 14px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.create-preview__image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: contain;
  background: #fff;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.create-preview__image--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.create-preview__label {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #9a3412;
}

.create-preview__name {
  margin: 0;
  font-weight: 700;
  color: #9a3412;
  line-height: 1.4;
}

.create-preview__meta {
  margin: 8px 0 0;
  font-size: 13px;
  color: #78716c;
}

.create-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.create-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.create-step--active {
  border-color: #ea580c;
  background: #fff7ed;
}

.create-step--done .create-step__number {
  background: #16a34a;
}

.create-step__number {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #64748b;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.create-step--active .create-step__number {
  background: #ea580c;
}

.create-step__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.create-step__text strong {
  font-size: 13px;
}

.create-step__text small {
  font-size: 11px;
  color: #64748b;
}

.create-panel__lead {
  margin: 0 0 16px;
  color: #64748b;
}

.create-panel__toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.option-group {
  margin-bottom: 20px;
}

.option-group__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.option-group__head h4 {
  margin: 0;
  font-weight: 700;
}

.option-group__head span {
  font-size: 12px;
  color: #64748b;
}

.option-values {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.option-value {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  font-weight: 500;
}

.option-value--color {
  flex-direction: column;
  min-width: 88px;
  padding: 12px 10px;
}

.option-value--selected {
  border-color: #ea580c;
  background: #fff7ed;
}

.option-value--disabled {
  opacity: 0.35;
  cursor: not-allowed;
  text-decoration: line-through;
}

.option-value__swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.option-value__check {
  position: absolute;
  top: 4px;
  right: 4px;
  color: #ea580c;
}

.create-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.create-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.create-footer__spacer {
  flex: 1;
}

:deep(.variant-field-lg .formkit-input) {
  min-height: 46px;
  font-size: 15px;
}

@media (max-width: 768px) {
  .create-steps,
  .create-fields {
    grid-template-columns: 1fr;
  }
}
</style>
