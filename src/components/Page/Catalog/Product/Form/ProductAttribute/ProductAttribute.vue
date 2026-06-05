<script lang="ts" setup>
import type { ProductDTO, ProductAttributeDTO } from '/@/types/product/Product'
import { computed, onMounted, ref, watch } from 'vue'
import { useStoreStore } from '/@/stores/store'
import { Api } from '/@/services/api'
import { useLanguageStore } from '/@/stores/language'
import { useToast } from 'vue-toastification'
import { Check, Edit, Delete, Close } from '@element-plus/icons-vue'

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
const toast = useToast()

const normalizeProductAttribute = (attr: any): ProductAttributeDTO => ({
  id: String(attr?.id ?? attr?.Id ?? ''),
  attributeValueId: String(attr?.attributeValueId ?? attr?.AttributeValueId ?? ''),
  name: String(attr?.name ?? attr?.Name ?? ''),
  value: String(attr?.value ?? attr?.Value ?? ''),
  groupName: String(attr?.groupName ?? attr?.GroupName ?? ''),
  groupId: String(attr?.groupId ?? attr?.GroupId ?? ''),
  productAttributeLangs: (attr?.productAttributeLangs ?? attr?.ProductAttributeLangs ?? []).map(
    (lang: any) => ({
      productAttributeValueId: String(
        lang?.productAttributeValueId ?? lang?.ProductAttributeValueId ?? ''
      ),
      languageId: String(lang?.languageId ?? lang?.LanguageId ?? ''),
      value: String(lang?.value ?? lang?.Value ?? '')
    })
  )
})

const syncLanguagesFromDefault = (attribute: ProductAttributeDTO | null) => {
  if (!attribute || language.selectedLanguage) return

  const defaultValue = attribute.value ?? ''
  attribute.productAttributeLangs?.forEach((lang) => {
    lang.value = defaultValue
  })
}

const ensureAttributeLanguages = (attribute: ProductAttributeDTO) => {
  if (!attribute.productAttributeLangs?.length) {
    attribute.productAttributeLangs = language.languages.map((lang) => ({
      languageId: lang.id,
      productAttributeValueId: attribute.attributeValueId ?? '',
      value: attribute.value ?? ''
    }))
  }
}

const syncProductAttributesRef = () => {
  const product = props.product as any
  const target = product?.value ?? product
  if (target && Array.isArray(target.attributes)) {
    target.attributes = [...addedAttributeList.value]
  }
}

const resolvedProduct = computed<ProductDTO | null>(() => {
  const product = props.product as any
  return product?.value ?? product ?? null
})

const productId = computed(() => resolvedProduct.value?.id ?? '')

const currentToEdit = ref<ProductAttributeDTO | null>(null)
const currentAttribute = ref<ProductAttributeDTO[]>([])
const attributeTemplateList = ref([])
const availableAttributeList = ref([])
const addedAttributeList = ref<Array<ProductAttributeDTO>>(
  resolvedProduct.value?.attributes ? [...resolvedProduct.value.attributes] : []
)
const currentTemplate = ref(null)
const removeModalVisible = ref(false)
const attributeToRemove = ref<ProductAttributeDTO | null>(null)

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

const handleRemoveAddedAttribute = (attribute: ProductAttributeDTO) => {
  if (!productId.value) {
    toast.error('Brak identyfikatora produktu.')
    return
  }

  if (!attribute.attributeValueId) {
    toast.error('Brak identyfikatora wartości atrybutu.')
    return
  }

  attributeToRemove.value = attribute
  removeModalVisible.value = true
}

const cancelRemoveAttribute = () => {
  removeModalVisible.value = false
  attributeToRemove.value = null
}

const confirmRemoveAttribute = async () => {
  const attribute = attributeToRemove.value
  if (!attribute || !productId.value || !attribute.attributeValueId) {
    cancelRemoveAttribute()
    return
  }

  const backup = [...addedAttributeList.value]
  addedAttributeList.value = addedAttributeList.value.filter((a) => a.id !== attribute.id)

  if (currentToEdit.value?.id === attribute.id) {
    currentToEdit.value = null
  }

  try {
    await Api.products.removeAttributeValue({
      body: JSON.stringify({
        productId: productId.value,
        productAttributeValueId: attribute.attributeValueId
      })
    })

    syncProductAttributesRef()
    toast.success('Atrybut został usunięty.')
  } catch (err) {
    addedAttributeList.value = backup
    console.error('Nie udało się usunąć atrybutu:', err)
    toast.error('Nie udało się usunąć atrybutu.')
  } finally {
    cancelRemoveAttribute()
  }
}

const handleSaveAttribute = async (attribute: ProductAttributeDTO) => {
  if (!productId.value) {
    toast.error('Brak identyfikatora produktu.')
    return
  }

  ensureAttributeLanguages(attribute)
  syncLanguagesFromDefault(attribute)

  const newAttribute: ProductAttribute = {
    productId: productId.value,
    productAttributeValues: {
      value: attribute.value,
      attributeId: attribute.id,
      productAttributeValueLangs: attribute.productAttributeLangs.map((lang) => ({
        languageId: lang.languageId,
        value: lang.value
      }))
    }
  }

  try {
    const result = await Api.products.addAttributeValue({
      body: JSON.stringify(newAttribute)
    })

    const newAttributeValue = normalizeProductAttribute(result?.data ?? result)

    currentAttribute.value = currentAttribute.value.filter((c) => c.id !== attribute.id)
    addedAttributeList.value.push(newAttributeValue)
    syncProductAttributesRef()
    toast.success('Atrybut został dodany.')
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się zapisać atrybutu.')
  }
}

const handleUpdateAttribute = async () => {
  const attribute = currentToEdit.value
  if (!attribute || !productId.value) return

  ensureAttributeLanguages(attribute)
  syncLanguagesFromDefault(attribute)

  const newAttribute: ProductAttribute = {
    productId: productId.value,
    productAttributeValues: {
      value: attribute.value,
      attributeId: attribute.id,
      productAttributeValueId: attribute.attributeValueId,
      productAttributeValueLangs: attribute.productAttributeLangs.map((lang) => ({
        languageId: lang.languageId,
        value: lang.value
      }))
    }
  }

  try {
    await Api.products.updateAttributeValue({
      body: JSON.stringify(newAttribute)
    })

    const index = addedAttributeList.value.findIndex((c) => c.id === attribute.id)

    if (index !== -1) {
      addedAttributeList.value[index].value = attribute.value
      addedAttributeList.value[index].productAttributeLangs = attribute.productAttributeLangs.map(
        (lang) => ({ ...lang })
      )
    }

    syncProductAttributesRef()
    currentToEdit.value = null
    toast.success('Atrybut został zaktualizowany.')
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się zaktualizować atrybutu.')
  }
}

const handleRemoveCurrentAttribute = (id: string) => {
  currentAttribute.value = currentAttribute.value.filter((c) => c.id !== id)
}

const handleLanguage = (currentLanguage: LanguageDTO | null) => {
  language.setCurrentLanguage(currentLanguage)
}

const handleEditAttribute = (attribute: ProductAttributeDTO) => {
  ensureAttributeLanguages(attribute)
  currentToEdit.value = attribute
}

const onDefaultValueChange = (attribute: ProductAttributeDTO | null) => {
  syncLanguagesFromDefault(attribute)
}

const handleCancel = () => {
  currentToEdit.value = null
}

watch(
  () => resolvedProduct.value?.attributes,
  (attributes) => {
    if (Array.isArray(attributes)) {
      addedAttributeList.value = attributes.map(normalizeProductAttribute)
    }
  },
  { immediate: true, deep: true }
)

onMounted(async () => {
  await getAllProductTemplate()
  await getAllAvailableAttributes()
})
</script>

<template>
  <div>
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
                  <FormKit
                    type="text"
                    v-model="currentAttribute[index].value"
                    @update:model-value="onDefaultValueChange(currentAttribute[index])"
                  />
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
              <td v-if="currentToEdit?.id !== attribute.id">
                {{ attribute.value }}
              </td>
              <td v-else>
                <div v-if="!language.selectedLanguage" class="section__variation flex">
                  <FormKit
                    type="text"
                    v-model="currentToEdit!.value"
                    @update:model-value="onDefaultValueChange(currentToEdit)"
                  />
                </div>
                <div v-for="(formLanguage, indexLang) in language.languages" :key="formLanguage.id">
                  <div
                    v-if="language.selectedLanguage === formLanguage.id"
                    class="section__variation flex"
                  >
                    <FormKit
                      type="text"
                      v-model="currentToEdit!.productAttributeLangs[indexLang].value"
                    />
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
                  @click="handleUpdateAttribute()"
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
                  @click="handleRemoveAddedAttribute(attribute)"
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

  <ConfirmModal
    v-if="removeModalVisible"
    :text="`Czy na pewno usunąć atrybut „${attributeToRemove?.name ?? ''}”?`"
    @confirmed="confirmRemoveAttribute"
    @canceled="cancelRemoveAttribute"
  />
</template>
