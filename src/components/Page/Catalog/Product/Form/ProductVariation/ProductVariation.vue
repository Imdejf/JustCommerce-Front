<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Api } from '/@/services/api'
import { ProductOptionDTO, ProductOptionValueDTO } from '/@/types/product/ProductOption'
import type { ProductDTO } from '/@/types/product/Product.ts'
import { useLanguageStore } from '/@/stores/language'
import {
  ProductVariationDTO,
  ProductOptionCombinationDTO,
  MediaDTO
} from '/@/types/product/ProductVariation'
import { ArrowDown, Check, Delete } from '@element-plus/icons-vue'
import ProductVariationImages from './ProductVariationImages.vue'
import ProductVariationThumbnail from './ProductVariationThumbnail.vue'
import { useToast } from 'vue-toastification'
import { useStoreStore } from '/@/stores/store'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'

interface User {
  date: string
  name: string
  address: string
}

interface ProductVariationInterface {
  userId: string
  storeId: string
  productId: string
  variation: ProductVariationDTO
}

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  },
  productOptions: {
    type: Array as () => ProductOptionDTO[],
    default: () => []
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const toast = useToast()
const cookies = new Cookies()

const selectedItems = ref([])
const showThumbnail = ref(false)
const showMediaArea = ref(false)

const store = useStoreStore()
const language = useLanguageStore()
const currentLanguage = ref(null)
const currentProductVariation = ref<ProductVariationDTO | null>(null)
const productVariationList = ref<ProductVariationDTO[]>([])
const activeProductOptions = ref<ProductOptionDTO[]>(props.productOptions)

const editProductVariation = ref<ProductVariationDTO | null>(null)

const handleSelectToEdit = (id: string) => {
  const selectVariation = productVariationList.value.find((c) => c.id == id)
  editProductVariation.value = selectVariation
}

const handleLanguage = (id: string) => {
  currentLanguage.value = id
}

const handleNewVariation = () => {
  const productVariation: ProductVariationDTO = {
    id: '',
    name: '',
    sku: '',
    gtin: '',
    price: 0,
    oldPrice: null,
    thumbnailImage: null,
    images: null,
    optionCombinations: [],
    productVariationLangs: language.languages.map((lang) => {
      return {
        languageId: lang.id,
        name: ''
      }
    })
  }

  currentProductVariation.value = productVariation
}

const handleOptionChange = (optionId: string, key: string) => {
  const option = activeProductOptions.value.find((c) => c.optionId == optionId)

  if (option) {
    const combinationIndex = currentProductVariation.value.optionCombinations.findIndex(
      (combination) => combination.optionId === optionId
    )

    const productOptionValue = option.values.find((v) => v.key === key)

    const combination: ProductOptionCombinationDTO = {
      optionId: optionId,
      optionName: option.name,
      sortIndex: activeProductOptions.value.findIndex((option) => option.optionId === optionId),
      value: key,
      productOptionCombinationLangs: productOptionValue.productOptionValueLangs.map((lang) => ({
        productOptionCombinationId: null,
        languageId: lang.languageId,
        value: lang.key
      }))
    }

    if (combinationIndex !== -1) {
      currentProductVariation.value.optionCombinations[combinationIndex] = combination
    } else {
      currentProductVariation.value?.optionCombinations?.push(combination)
    }

    const selectedItem = {
      optionId: optionId,
      value: key
    }

    const indexSelectItem = selectedItems.value.findIndex((c) => c.optionId == optionId)
    if (indexSelectItem !== -1) {
      selectedItems.value[indexSelectItem] = selectedItem
    } else {
      selectedItems.value.push(selectedItem)
    }
  }
}

const handleThumbnailImage = (media: MediaDTO) => {
  if (editProductVariation.value != null) {
    editProductVariation.value.thumbnailImage = media
  } else {
    currentProductVariation.value.thumbnailImage = media
  }
  showThumbnail.value = false
}

const handleCancelEditVariation = () => {
  editProductVariation.value = null
}

const handleSaveVariation = async () => {
  const token = cookies.get('Authorization')
  const decoded = jwt_decode(token)
  try {
    const productVariation: ProductVariationInterface = {
      storeId: store.selectedStore.id,
      userId: decoded.UserId,
      productId: props.product.id,
      variation: currentProductVariation.value
    }
    productVariation.variation.oldPrice = productVariation.variation.oldPrice = ''
      ? null
      : productVariation.variation.oldPrice

    const payload = {
      body: JSON.stringify(productVariation)
    }

    if (!props.updated) {
      await Api.products.addVariation(payload)
      toast.success('Dodano wariant', {
        timeout: 2000
      })
    } else {
      toast.success('Edytowano wariant', {
        timeout: 2000
      })
    }
  } catch (error) {
    toast.error('Wystąpił błąd', {
      timeout: 2000
    })
  }
}

const handleSaveEdit = async () => {
  const token = cookies.get('Authorization')
  const decoded = jwt_decode(token)
  try {
    const productVariation: ProductVariationInterface = {
      storeId: store.selectedStore.id,
      userId: decoded.UserId,
      productId: editProductVariation.value.id,
      variation: editProductVariation.value
    }
    const payload = {
      body: JSON.stringify(productVariation)
    }
    await Api.products.updateVariation(payload)
    toast.success('Edytowano wariant', {
      timeout: 2000
    })
  } catch (error) {
    toast.error('Wystąpił błąd', {
      timeout: 2000
    })
  }
}

const handleRemoveCurrentVariation = () => {
  currentProductVariation.value = null
}

const handleShowThumbnail = (value: boolean) => {
  showThumbnail.value = value
}

const handleShowMediaArea = (value: boolean) => {
  showMediaArea.value = value
}

const existProductVariation = () => {
  productVariationList.value = props.product.variations
}

onMounted(() => {
  existProductVariation()
  console.log(productVariationList)
})
</script>

<template>
  <div v-if="!showThumbnail && !showMediaArea">
    <FormSection :title="'Warianty'">
      <div class="relative overflow-x-auto shadow-md sm:rounded-lg w-full">
        <div class="w-full bg-slate-800">
          <ul class="flex gap-5 justify-center bg-slate-800 text-orange-500 p-3">
            <li>
              <el-button @click="handleLanguage(null)" type="primary" round>Domyślny</el-button>
            </li>

            <li v-for="lang in language.languages" :key="lang.id">
              <el-button @click="handleLanguage(lang.id)" color="#ea580c" round>{{
                lang.isoCode
              }}</el-button>
            </li>
          </ul>
        </div>
        <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead
            class="text-center text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
          >
            <tr>
              <th scope="col" class="px-6 py-3">Kombinacja</th>
              <th scope="col" class="px-6 py-3">SKU</th>
              <th scope="col" class="px-6 py-3">GTIN</th>
              <th scope="col" class="px-6 py-3">Identyfikator produktu</th>
              <th scope="col" class="px-6 py-3">Cena</th>
              <th scope="col" class="px-6 py-3">Stara cena</th>
              <th scope="col" class="px-6 py-3">Cena producenta</th>
              <th scope="col" class="px-6 py-3">Miniatura</th>
              <th scope="col" class="px-6 py-3">Zdjęcia</th>
              <th scope="col px-6 py-3">
                <el-button type="primary" @click="handleNewVariation">Dodaj</el-button>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="currentProductVariation !== null">
              <td>
                <el-select
                  v-for="(option, index) in activeProductOptions"
                  :key="option.optionId"
                  v-model="selectedItems[index]"
                  class="m-2"
                  placeholder="Wybierz opcje"
                  size="large"
                >
                  <el-option
                    v-for="optionValue in option.values"
                    :key="optionValue.key"
                    :label="optionValue.key"
                    :value="optionValue.key"
                    @click="handleOptionChange(option.optionId, optionValue.key)"
                  />
                </el-select>
              </td>
              <td class="section__variation">
                <FormKit type="text" v-model="currentProductVariation.sku" help="" />
              </td>
              <td class="section__variation">
                <FormKit type="text" v-model="currentProductVariation.gtin" help="" />
              </td>
              <td class="section__variation">
                <FormKit type="text" v-model="currentProductVariation.identificationCode" help="" />
              </td>
              <td class="section__variation">
                <FormKit type="number" v-model="currentProductVariation.price" help="" />
              </td>
              <td class="section__variation">
                <FormKit type="number" v-model="currentProductVariation.oldPrice" help="" />
              </td>
              <td class="section__variation">
                <FormKit type="number" v-model="currentProductVariation.producerPrice" help="" />
              </td>
              <td class="section__variation">
                <el-button @click="handleShowThumbnail(true)" color="#ea580c" round
                  >Miniatura</el-button
                >
              </td>
              <td class="section__variation">
                <el-button @click="handleShowMediaArea(true)" color="#ea580c" round
                  >Zdjęcia</el-button
                >
              </td>
              <td>
                <div class="flex">
                  <el-button type="success" :icon="Check" circle @click="handleSaveVariation" />
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    @click="handleRemoveCurrentVariation"
                  />
                </div>
              </td>
            </tr>
            <tr class="text-center" v-for="variation in productVariationList" :key="variation.id">
              <td>
                {{ variation.name }}
              </td>
              <td v-if="editProductVariation?.id !== variation.id">
                {{ variation.sku }}
              </td>
              <td v-if="editProductVariation?.id === variation.id" class="area_input">
                <FormKit type="text" v-model="editProductVariation.sku" help="" />
              </td>
              <td v-if="editProductVariation?.id !== variation.id">
                {{ variation.gtin }}
              </td>
              <td v-if="editProductVariation?.id === variation.id" class="area_input">
                <FormKit type="text" v-model="editProductVariation.gtin" help="" />
              </td>
              <td v-if="editProductVariation?.id !== variation.id">
                {{ variation.identificationCode }}
              </td>
              <td v-if="editProductVariation?.id === variation.id" class="area_input">
                <FormKit type="text" v-model="editProductVariation.identificationCode" help="" />
              </td>
              <td v-if="editProductVariation?.id !== variation.id">
                {{ variation.price }}
              </td>
              <td v-if="editProductVariation?.id === variation.id" class="area_input">
                <FormKit type="number" step="0.01" v-model="editProductVariation.price" help="" />
              </td>
              <td v-if="editProductVariation?.id !== variation.id">
                {{ variation.oldPrice }}
              </td>
              <td v-if="editProductVariation?.id === variation.id" class="area_input">
                <FormKit
                  type="number"
                  step="0.01"
                  v-model="editProductVariation.oldPrice"
                  help=""
                />
              </td>
              <td v-if="editProductVariation?.id !== variation.id">
                {{ variation.producerPrice }}
              </td>
              <td v-if="editProductVariation?.id === variation.id" class="area_input">
                <FormKit
                  type="number"
                  step="0.01"
                  v-model="editProductVariation.producerPrice"
                  help=""
                />
              </td>
              <td v-if="editProductVariation?.id !== variation.id">
                <img class="w-10 mx-auto" :src="variation.thumbnailImage.filePath" />
              </td>
              <td v-if="editProductVariation?.id === variation.id" class="section__variation">
                <el-button @click="handleShowThumbnail(true)" color="#ea580c" round
                  >Miniatura</el-button
                >
              </td>
              <td>Zdjęcia</td>
              <td class="px-6 py-4">
                <a
                  @click="handleSelectToEdit(variation.id)"
                  v-if="editProductVariation === null"
                  class="mr-3 font-medium text-blue-600 dark:text-blue-500 hover:underline"
                  >Edytuj</a
                >
                <a
                  v-if="editProductVariation !== null"
                  @click="handleSaveEdit"
                  class="mr-3 font-medium text-blue-600 dark:text-blue-500 hover:underline"
                  >Zapisz</a
                >
                <a
                  href="#"
                  v-if="editProductVariation === null"
                  class="ml-3 font-medium text-red-500 dark:text-blue-500 hover:underline"
                  @click="handleSelectFile(variation.id)"
                  >Usuń</a
                >
                <a
                  v-if="editProductVariation !== null"
                  class="ml-3 font-medium text-red-500 dark:text-blue-500 hover:underline"
                  @click="handleCancelEditVariation"
                  >Anuluj</a
                >
                <ConfirmModal
                  v-if="removeModal"
                  @confirmed="handleRemove()"
                  @canceled="removeModal = false"
                  text="Czy chcesz usunąć zdjęcie?"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </FormSection>
  </div>
  <div>
    <ProductVariationThumbnail
      v-if="showThumbnail"
      @save="handleThumbnailImage"
      @close="handleShowThumbnail"
      :thumbnailImage="editProductVariation?.thumbnailImage"
    />
    <ProductVariationImages v-if="showMediaArea" @close="handleShowMediaArea" />
  </div>
</template>

<style>
.section__variation .formkit-outer {
  width: 100%;
}

.section__variation .formkit-outer .formkit-wrapper {
  margin: auto;
}
</style>
