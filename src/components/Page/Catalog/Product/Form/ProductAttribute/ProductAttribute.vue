<script lang="ts" setup>
import type { ProductDTO, ProductAttributeDTO } from '/@/types/product/Product'
import { onMounted } from 'vue'
import { useStoreStore } from '/@/stores/store'
import { ref } from 'vue'
import { Api } from '/@/services/api'
import { useLanguageStore } from '/@/stores/language'
import { ArrowDown, Check, Edit, Delete, Close } from '@element-plus/icons-vue'

interface ProductAttribute {
  productId: string
  productAttributeValues: ProductAttributeValue
}

interface ProductAttributeValue {
  attributeId: string
  value: string
  productAttributeValueId: string
  productAttributeValueLangs: ProductAttributeValueLang[]
}

interface ProductAttributeValueLang {
  languageId: string
  value: string
}

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  }
})

const store = useStoreStore()
const language = useLanguageStore()

const currentToEdit = ref<ProductAttributeDTO | null>(null)
const currentAttribute = ref<ProductAttributeDTO[]>([])
const attributeTemplateList = ref([])
const availableAttributeList = ref([])
const addedAttributeList = ref<Array<ProductAttributeDTO>>(
  props.product?.attributes ? props.product.attributes : []
)
const currentTemplate = ref(null)

const getAllProductTemplate = async () => {
  const result = await Api.attributeGroups.listByStoreId()
  attributeTemplateList.value = result.items.map((item) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}

const addGroupAttributes = (groupId: string) => {
  // Znajdź grupę o podanym groupId
  const selectedGroup = availableAttributeList.value.find(
    (group) => group.group.id === currentTemplate.value
  )
  if (selectedGroup) {
    // Pobierz wszystkie items z wybranej grupy
    const itemsInGroup = selectedGroup.items

    itemsInGroup.forEach((item) => {
      const newAttribute: ProductAttributeDTO = {
        id: item.id,
        name: item.name,
        value: '',
        productAttributeLangs: language.languages.map((lang) => {
          return {
            languageId: lang.id,
            value: ''
          }
        })
      }
      currentAttribute.value.push(newAttribute)
    })
    // Tutaj możesz wykorzystać znalezione elementy z grupy w dalszej części kodu
  } else {
    console.log('Nie znaleziono grupy o podanym groupId.')
  }
}

const getAllAvailableAttributes = async () => {
  const result = await Api.productAttributes.listByStoreId()

  result.items.forEach((item) => {
    const groupId = item.attributeGroup.id

    const groupIndex = availableAttributeList.value.findIndex((g) => g.group?.id === groupId)

    if (groupIndex === -1) {
      availableAttributeList.value.push({
        group: {
          id: groupId,
          name: item.attributeGroup.name
        },
        items: []
      })
    }
  })

  result.items.forEach((item) => {
    const groupId = item.attributeGroup.id

    const groupIndex = availableAttributeList.value.findIndex(
      (group) => group.group?.id === groupId
    )

    availableAttributeList.value[groupIndex].items.push({
      id: item.id,
      name: item.name
    })
  })
}
const handleSelectTemplate = (id: string) => {}

const selectAttribute = ref(null)
const handleAddProductAttribute = () => {
  const attribute = findItemsById(selectAttribute.value)
  const newAttribute: ProductAttributeDTO = {
    id: attribute.id,
    name: attribute.name,
    value: '',
    productAttributeLangs: language.languages.map((lang) => {
      return {
        languageId: lang.id,
        value: ''
      }
    })
  }
  currentAttribute.value.push(newAttribute)
}

function findItemsById(idToFind: string) {
  for (const item of availableAttributeList.value) {
    const foundItem = item.items.find((item) => item.id === idToFind)
    if (foundItem) {
      return foundItem
    }
  }
  return undefined // Nie znaleziono pasującego elementu
}

const handleSaveAttribute = async (attribute: ProductAttributeDTO) => {
  const newAttribute: ProductAttribute = {
    productId: props.product.id,
    productAttributeValues: {
      value: attribute.value,
      attributeId: attribute.id,
      productAttributeValueLangs: attribute.productAttributeLangs.map((lang) => {
        return {
          languageId: lang.languageId,
          value: lang.value
        }
      })
    }
  }

  const payload = {
    body: JSON.stringify(newAttribute)
  }

  const result = await Api.products.addAttributeValue(payload)

  const newAttributeValue: ProductAttributeDTO = result.data

  currentAttribute.value = currentAttribute.value.filter((c) => c.id !== attribute.id)

  addedAttributeList.value.push(newAttributeValue)
}

const handleUpdateAttribute = async (attribute: ProductAttributeDTO) => {
  const newAttribute: ProductAttribute = {
    productId: props.product.id,
    productAttributeValues: {
      value: attribute.value,
      attributeId: attribute.id,
      productAttributeValueId: attribute.attributeValueId,
      productAttributeValueLangs: attribute.productAttributeLangs.map((lang) => {
        return {
          languageId: lang.languageId,
          value: lang.value
        }
      })
    }
  }

  const payload = {
    body: JSON.stringify(newAttribute)
  }

  await Api.products.updateAttributeValue(payload)

  const index = addedAttributeList.value.findIndex(
    (c) => c.id === newAttribute.productAttributeValues.attributeId
  )

  if (index !== -1) {
    addedAttributeList.value[index].value = newAttribute.productAttributeValues.value
  }

  currentToEdit.value = null
}

const handleRemoveCurrentAttribute = (id: string) => {
  currentAttribute.value = currentAttribute.value.filter((c) => c.id !== id)
}

const handleLanguage = (currentLanguage: LanguageDTO | null) => {
  language.setCurrentLanguage(currentLanguage)
}

const handleEditAttribute = (attribute: ProductAttributeDTO) => {
  currentToEdit.value = attribute
}

const handleCancel = () => {
  currentToEdit.value = null
}

onMounted(async () => {
  await getAllProductTemplate()
  await getAllAvailableAttributes()
})
</script>

<template>
  <div>
    {{ currentTemplate }}
    <FormSection :title="'Wzór produktów'"
      ><DropDown label="Opcje" v-model="currentTemplate" :options="attributeTemplateList" />
      <div class="mt-7">
        <el-button @click="addGroupAttributes" color="#ea580c" round>Zastosuj</el-button>
      </div>
    </FormSection>
    <FormSection :title="'Dostępne atrybuty'">
      <DropDownGroup label="Atrybuty" v-model="selectAttribute" :options="availableAttributeList" />
      <div class="mt-7">
        <el-button @click="handleAddProductAttribute" color="#ea580c" round>Zastosuj</el-button>
      </div>
    </FormSection>
  </div>
  <div>
    <FormSection :title="'Konfiguracja atrybutów'">
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
              <th scope="col" class="px-6 py-3">Nazwa atrybutu</th>
              <th scope="col" class="px-6 py-3">Wartość</th>
              <th scope="col" class="px-6 py-3">Akcje</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(attribute, index) in currentAttribute"
              :key="attribute.id"
              class="text-center"
            >
              <td class="section__variation">
                {{ attribute.name }}
              </td>
              <div v-if="!language.selectedLanguage">
                <td class="section__variation flex">
                  <FormKit type="text" v-model="currentAttribute[index].value" />
                </td>
              </div>
              <div v-for="(formLanguage, indexLang) in language.languages" :key="formLanguage.id">
                <div v-if="language.selectedLanguage === formLanguage.id">
                  <td class="section__variation flex">
                    <FormKit
                      type="text"
                      v-model="currentAttribute[index].productAttributeLangs[indexLang].value"
                    />
                  </td>
                </div>
              </div>
              <td class="section__variation">
                <el-button
                  type="success"
                  :icon="Check"
                  circle
                  @click="handleSaveAttribute(attribute)"
                />
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  @click="handleRemoveCurrentAttribute(attribute.id)"
                />
              </td>
            </tr>
            <tr class="text-center" v-for="attribute in addedAttributeList" :key="attribute.id">
              <td>
                {{ attribute.name }}
              </td>
              <td v-if="!currentToEdit">
                {{ attribute.value }}
              </td>
              <td v-if="currentToEdit">
                <div v-if="!language.selectedLanguage">
                  <td class="section__variation flex">
                    <FormKit type="text" v-model="currentToEdit.value" />
                  </td>
                </div>
                <div v-for="(formLanguage, indexLang) in language.languages" :key="formLanguage.id">
                  <div v-if="language.selectedLanguage === formLanguage.id">
                    <td class="section__variation flex">
                      <FormKit
                        type="text"
                        v-model="currentToEdit.productAttributeLangs[indexLang].value"
                      />
                    </td>
                  </div>
                </div>
              </td>
              <td>
                <el-button
                  v-if="currentToEdit && currentToEdit?.id !== attribute.id"
                  type="success"
                  :icon="Check"
                  circle
                  @click="handleSaveAttribute(attribute)"
                />
                <el-button
                  v-if="currentToEdit?.id === attribute.id"
                  type="success"
                  :icon="Check"
                  circle
                  @click="handleUpdateAttribute(attribute)"
                />
                <el-button
                  v-if="currentToEdit?.id !== attribute.id"
                  type="warning"
                  :icon="Edit"
                  circle
                  @click="handleEditAttribute(attribute)"
                />
                <el-button
                  v-if="currentToEdit?.id !== attribute.id"
                  type="danger"
                  :icon="Delete"
                  circle
                  @click="handleRemoveCurrentAttribute(attribute.id)"
                />
                <el-button
                  v-if="currentToEdit?.id === attribute.id"
                  type="danger"
                  :icon="Close"
                  circle
                  @click="handleCancel(attribute.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </FormSection>
  </div>
</template>
