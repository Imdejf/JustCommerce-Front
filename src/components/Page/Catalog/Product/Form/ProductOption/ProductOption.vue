<script lang="ts" setup>
import { nextTick, computed, ref, reactive, watch, watchEffect, onMounted } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import { ProductOptionDTO, ProductOptionValueDTO } from '/@/types/product/ProductOption'
import { ElInput } from 'element-plus'
import { useLanguageStore } from '/@/stores/language'
import { OptionProps } from 'element-plus/es/components/select-v2/src/defaults'
import ProductOptionConfiguration from './ProductOptionConfiguration.vue'
import { useRoute } from 'vue-router'
import { ProductDTO } from '/@/types/product/Product'
import { useStoreStore } from '/@/stores/store'

interface ProductOptionInterface {
  productId: string
  storeId: string
  option: ProductOptionDTO
}

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => []
  },
  productOptions: {
    type: Array as () => ProductOptionDTO[],
    default: () => []
  }
})

const emits = defineEmits(['updateOptions'])
const route = useRoute()

const existProductOptionValue = ref([])
const toast = useToast()
const store = useStoreStore()
const language = useLanguageStore()
const configurationOption = ref<ProductOptionDTO | null>(null)
const showConfigurationModal = ref(false)

const handleConfigurationOption = (id: string) => {
  const selectOption = addedOptions.value.find((c) => c.optionId === id)
  configurationOption.value = selectOption
  showConfigurationModal.value = true
}

const handleCloseConfigurationModal = (productOption: ProductOptionDTO) => {
  addedOptions.value.forEach((obj, index) => {
    if (obj.optionId === productOption.optionId) {
      addedOptions[index] = productOption
    }
  })
  configurationOption.value = null
  showConfigurationModal.value = false
}

const handleSaveProductOption = async (productOption: ProductOptionDTO) => {
  const index = addedOptions.value.findIndex((obj) => obj.optionId === productOption.value.optionId)
  if (index !== -1) {
    addedOptions.value.splice(index, 1, productOption.value)
  }

  const updateProductOption: ProductOptionInterface = {
    productId: props.product.id,
    storeId: store.selectedStore.id,
    option: productOption.value
  }

  updateProductOption.option.displayType = +updateProductOption.option.displayType

  const payload = {
    body: JSON.stringify(updateProductOption)
  }

  const existOptionValue = existProductOptionValue.value.find(
    (c) => c === productOption.value.optionId
  )
  if (existOptionValue) {
    existProductOptionValue.value = existProductOptionValue.value.filter(
      (id) => id !== productOption.value.optionId
    )

    await Api.products.addOption(payload)
  } else {
    await Api.products.updateOption(payload)
  }

  configurationOption.value = null
  showConfigurationModal.value = false
}

//tags
const tagValue = ref('')
const tagVisible = ref(null)
const dynamicTags = ref([])
const TagRef = ref<InstanceType<typeof ElInput>>()

const handleSelect = (id: string) => {
}

const handleClose = (id: string, tag: string) => {
  dynamicTags.value[id].splice(dynamicTags.value.indexOf(tag), 1)
  const index = addedOptions.value.findIndex((option) => option.optionId === id)
  if (index !== -1) {
    addedOptions.value[index].values = addedOptions.value[index].values.filter(
      (value) => value.key !== tag
    )
  }
}

const showInput = (id: string) => {
  tagVisible.value = id
}

const handleInputConfirm = (id: string) => {
  const option = addedOptions.value.find((c) => c.optionId === id)
  if (option?.values.includes(tagValue.value)) {
    toast.error('Zduplikowana nazwa', {
      timeout: 2000
    })
    return
  }

  if (tagValue.value) {
    const newOptionValue: ProductOptionValueDTO = {
      key: tagValue.value,
      display: option.display,
      productOptionValueLangs: language.languages.map((lang) => ({
        languageId: lang.id,
        key: '',
        display: ''
      }))
    }

    dynamicTags.value[id].push(tagValue.value)

    option.values.push(newOptionValue)
  }
  tagVisible.value = false
  tagValue.value = ''
}

const addedOptions = ref<Array<ProductOptionDTO>>(props.productOptions)
const productOptionsList = ref<Array<ProductOptionDTO>>([])
const currentOption = ref(null)

const addOption = async () => {
  const result = productOptionsList.value.find((c) => c.id === currentOption.value && c.id !== '')

  if (!Array.isArray(dynamicTags.value[result.id])) {
    dynamicTags.value[result.id] = []
  }

  const newOption: ProductOptionDTO = {
    optionId: result.id,
    name: result.name,
    displayType: 0,
    values: []
  }

  addedOptions.value.push(newOption)

  const addOption = {
    productId: route.params.id,
    optionId: result.id,
    sortIndex: findNextUniqueIndex(addedOptions)
  }

  const payload = {
    body: JSON.stringify(addOption)
  }

  await Api.products.addOptionCombination(payload)
}

const removeOption = async (optionId: string) => {
  const payload = {
    body: JSON.stringify({
      productId: props.product.id,
      productOptionId: optionId
    })
  }

  await Api.products.removeOptionCombination(payload)
}

function findNextUniqueIndex(addedOptions: ProductOptionDTO[]) {
  let uniqueIndex = 0
  const usedIndexes = addedOptions.value.map((option) => option.sortIndex)

  while (usedIndexes.includes(uniqueIndex)) {
    uniqueIndex++
  }

  return uniqueIndex
}

const allProductOption = async () => {
  const result = await Api.productOptions.listByStoreId()

  productOptionsList.value = result.items
    .map((item) => {
      const existsInCombinations = props.product.productOptionCombinations.some(
        (combination) => combination.optionId === item.id
      )

      if (!existsInCombinations) {
        return {
          id: item.id,
          name: item.name
        }
      }
    })
    .filter(Boolean) // Filtrujemy wartości niezdefiniowane z pętli map
}

const addExistTags = () => {
  addedOptions.value.forEach((option) => {
    if (!Array.isArray(dynamicTags.value[option.optionId])) {
      dynamicTags.value[option.optionId] = []
    }
    option.values.forEach((value) => {
      dynamicTags.value[option.optionId].push(value.key)
    })
  })
}

onMounted(() => {
  allProductOption()
  addExistTags()

  addedOptions.value.forEach((option) => {
    if (option.values.length === 0) {
      existProductOptionValue.value.push(option.optionId)
    }
  })
})

watch(
  addedOptions.value,
  (newOptions, oldOptions) => {
    emits('updateOptions', newOptions)
  },
  { deep: true }
)
</script>
<template>
  <div>
    <FormSection :title="'Dostępne opcje'"
      ><DropDown label="Opcje" v-model="currentOption" :options="productOptionsList" />
      <div class="mt-7">
        <el-button @click="addOption" color="#ea580c" round>Dodaj opcje</el-button>
      </div>
    </FormSection>
    <FormSection :title="'Wartość opcji'">
      <div>
        <ul>
          <li v-for="(option, index) in addedOptions" :key="option.optionId" class="flex mt-5">
            {{ option.name }}
            <div class="flex">
              <el-tag
                v-for="tag in dynamicTags[option.optionId]"
                :key="tag"
                class="mx-1 text-black cursor-pointer"
                closable
                :disable-transitions="false"
                effect="light"
                :type="'warning'"
                @close="handleClose(option.optionId, tag)"
                @click="handleSelect(option.optionId)"
                round
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="tagVisible === option.optionId"
                ref="TagRef"
                v-model="tagValue"
                class="ml-1 w-20"
                size="small"
                @keyup.enter="handleInputConfirm(option.optionId)"
                @blur="handleInputConfirm"
              />
              <el-button
                v-else
                class="button-new-tag ml-1"
                size="small"
                @click="showInput(option.optionId)"
              >
                + New Tag
              </el-button>
              <div class="ml-5">
                <el-button @click="handleConfigurationOption(option.optionId)" color="#ea580c" round
                  >Konfiguruj</el-button
                >
              </div>

              <div class="ml-5">
                <el-button @click="removeOption(option.optionId)" color="#dc2626" round
                  >Usuń</el-button
                >
              </div>
            </div>
          </li>
        </ul>
      </div>
    </FormSection>
  </div>
  <ProductOptionConfiguration
    v-if="showConfigurationModal"
    @close="handleCloseConfigurationModal"
    @save="handleSaveProductOption"
    :option="configurationOption"
  />
</template>

<style></style>
