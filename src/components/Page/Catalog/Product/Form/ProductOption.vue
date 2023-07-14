<script lang="ts" setup>
import { nextTick, computed, ref, reactive, watch, watchEffect, onMounted } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import { ProductOptionDTO, ProductOptionValueDTO } from '/@/types/product/ProductOption'
import { ElInput } from 'element-plus'
import { useLanguageStore } from '/@/stores/language'
import { OptionProps } from 'element-plus/es/components/select-v2/src/defaults'
import ProductOptionConfiguration from './ProductOptionConfiguration.vue'

const props = defineProps({
  productOptions: {
    type: Array as () => ProductOptionDTO[],
    default: () => []
  }
})

const toast = useToast()
const language = useLanguageStore()
const configurationOption = ref<ProductOptionDTO | null>(null)
const showConfigurationModal = ref(false)

const handleConfigurationOption = (id: string) => {
  const selectOption = addedOptions.value.find((c) => c.optionId === id)
  configurationOption.value = selectOption
  showConfigurationModal.value = true
}

const handleCloseConfigurationModal = (productOption: ProductOptionDTO) => {
  console.log(productOption)
  addedOptions.value.forEach((obj, index) => {
    if (obj.optionId === productOption.optionId) {
      addedOptions[index] = productOption
    }
  })
  console.log(addedOptions)
  configurationOption.value = null
  showConfigurationModal.value = false
}

const handleSaveProductOption = (productOption: ProductOptionDTO) => {
  addedOptions.value.forEach((obj, index) => {
    if (obj.optionId === productOption.optionId) {
      addedOptions[index] = productOption
    }
  })
}

//tags
const tagValue = ref('')
const tagVisible = ref(null)
const dynamicTags = ref([])
const TagRef = ref<InstanceType<typeof ElInput>>()

const handleSelect = (id: string) => {
  console.log(id)
}

const handleClose = (id: string, tag: string) => {
  dynamicTags.value[id].splice(dynamicTags.value.indexOf(tag), 1)
  const index = addedOptions.value.findIndex((option) => option.optionId === id)
  if (index !== -1) {
    addedOptions.value[index].values = addedOptions.value[index].values.filter(
      (value) => value !== tag
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

const addOption = () => {
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
}

const allProductOption = async () => {
  const result = await Api.productOptions.listByStoreId()
  productOptionsList.value = result.items.map((item) => {
    return {
      id: item.id,
      name: item.name
    }
  })
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
})

watch(addedOptions.value, (newOptions, oldOptions) => {}, { deep: true })
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
          {{
            addedOptions
          }}
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
                <el-button @click="addOption" color="#dc2626" round>Usuń</el-button>
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
