<script lang="ts" setup>
import {
  ProductOptionDTO,
  ProductOptionValueDTO,
  DisplayType
} from '/@/types/product/ProductOption'
import { computed, ref } from 'vue'
import { productOptions } from '/@/services/api/product/productOption'

const props = defineProps({
  option: {
    type: Object as () => ProductOptionDTO,
    default: () => []
  }
})

const activeOption = ref<ProductOptionDTO>(props.option)
const emits = defineEmits(['close', 'save'])

const displayTypeSelected = ref('0')

const handleChangeDisplayType = (value: number) => {
  displayTypeSelected.value = value

  activeOption.value.displayType = value
  activeOption.value.values.forEach((c) => {
    c.display = ''
  })
}

const handleClose = () => {
  emits('close', props.option)
}

const handleSave = () => {
  emits('save', activeOption)
}
</script>

<template>
  <div class="absolute w-full h-full bg-gray-500 bg-opacity-50 z-10 top-0 left-0">
    <div class="relative w-full max-w-2xl max-h-full mx-auto top-[20%]">
      <div class="relative bg-white rounded-lg shadow">
        <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Konfiguracja:</h3>
          <button
            @click="handleClose"
            type="button"
            class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
            data-modal-hide="staticModal"
          >
            <svg
              class="w-3 h-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
        <div class="p-6 space-y-6">
          <div class="mb-2 flex items-center text-sm w-full">
            <el-radio-group
              v-model="displayTypeSelected"
              @change="handleChangeDisplayType"
              class="ml-4 mx-auto w-full justify-center"
            >
              <el-radio label="0" size="large">Tekst</el-radio>
              <el-radio label="1" size="large">Kolor</el-radio>
            </el-radio-group>
          </div>
          <div class="inputs_area" v-if="activeOption.displayType == 0">
            <div v-for="(value, index) in activeOption.values" :key="value.key" class="flex">
              <span class="w-1/5">
                {{ value.key }}
              </span>
              <FormKit type="text" v-model="value.display" help="" />
            </div>
          </div>
          <div class="inputs_area" v-if="activeOption.displayType == 1">
            <div v-for="(value, index) in activeOption.values" :key="value.key" class="flex">
              <span class="w-1/5">
                {{ value.key }}
              </span>
              <FormKit type="color" :value="value.display" v-model="value.display" />
            </div>
          </div>
        </div>
        <div
          class="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600"
        >
          <button
            @click="handleSave"
            data-modal-hide="staticModal"
            type="button"
            class="text-white bg-orange-400 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Zapisz
          </button>
          <button
            @click="handleClose"
            data-modal-hide="staticModal"
            type="button"
            class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.inputs_area .formkit-inner {
  height: 30px;
  min-width: 70px;
}
</style>
