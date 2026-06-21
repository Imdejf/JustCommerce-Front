<script lang="ts" setup>
import type { ProductDTO, ProductAttributeDTO } from '/@/types/product/Product'
import type { CategoryDTO } from '/@/types/category/Category'
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

interface AttributeOption {
  id: string
  name: string
}

interface AttributeGroupOption {
  id: string
  name: string
}

interface AvailableAttributeGroup {
  group: AttributeGroupOption
  items: AttributeOption[]
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
const productCategoryIds = computed(() => resolvedProduct.value?.categoryIds ?? [])

const currentToEdit = ref<ProductAttributeDTO | null>(null)
const currentAttribute = ref<ProductAttributeDTO[]>([])
const attributeTemplateList = ref<AttributeGroupOption[]>([])
const availableAttributeList = ref<AvailableAttributeGroup[]>([])
const categoriesList = ref<CategoryDTO[]>([])
const addedAttributeList = ref<Array<ProductAttributeDTO>>(
  resolvedProduct.value?.attributes ? [...resolvedProduct.value.attributes] : []
)
const currentTemplate = ref<string | null>(null)
const currentCategoryTemplate = ref<string | null>(null)
const removeModalVisible = ref(false)
const attributeToRemove = ref<ProductAttributeDTO | null>(null)

const categoryAttributeGroupIds = computed(() => {
  const groupIds = categoriesList.value
    .filter((category) => productCategoryIds.value.includes(category.id))
    .flatMap((category) => category.attributeGroupIds ?? [])

  return [...new Set(groupIds)]
})

const categoryAttributeTemplateList = computed(() => {
  return attributeTemplateList.value.filter((attributeGroup) =>
    categoryAttributeGroupIds.value.includes(attributeGroup.id)
  )
})

const getAllProductTemplate = async () => {
  const result = await Api.attributeGroups.listByStoreId()
  attributeTemplateList.value = result.items.map((item) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}

const createPendingAttribute = (
  item: AttributeOption,
  group: AttributeGroupOption
): ProductAttributeDTO => ({
  id: item.id,
  attributeValueId: '',
  name: item.name,
  value: '',
  groupName: group.name,
  groupId: group.id,
  productAttributeLangs: language.languages.map((lang) => {
    return {
      productAttributeValueId: '',
      languageId: lang.id,
      value: ''
    }
  })
})

const addAttributesFromGroupIds = (groupIds: string[]) => {
  const existingAttributeIds = new Set([
    ...addedAttributeList.value.map((attribute) => attribute.id),
    ...currentAttribute.value.map((attribute) => attribute.id)
  ])

  availableAttributeList.value
    .filter((group) => groupIds.includes(group.group.id))
    .forEach((group) => {
      group.items.forEach((item) => {
        if (existingAttributeIds.has(item.id)) {
          return
        }

        currentAttribute.value.push(createPendingAttribute(item, group.group))
        existingAttributeIds.add(item.id)
      })
    })
}

const addGroupAttributes = () => {
  if (!currentTemplate.value) {
    toast.error('Wybierz grupę atrybutów.')
    return
  }

  addAttributesFromGroupIds([currentTemplate.value])
}

const addAllCategoryGroupAttributes = () => {
  if (!categoryAttributeGroupIds.value.length) {
    toast.error('Produkt nie ma grup atrybutów przypisanych do kategorii.')
    return
  }

  addAttributesFromGroupIds(categoryAttributeGroupIds.value)
}

const addCategoryGroupAttributes = () => {
  if (!currentCategoryTemplate.value) {
    toast.error('Wybierz grupę atrybutów z kategorii.')
    return
  }

  addAttributesFromGroupIds([currentCategoryTemplate.value])
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

const getAllCategories = async () => {
  const result = await Api.categories.listByStoreId()
  categoriesList.value = result.items
}

const selectAttribute = ref<string | null>(null)
const handleAddProductAttribute = () => {
  if (!selectAttribute.value) {
    toast.error('Wybierz atrybut.')
    return
  }

  const attribute = findItemsById(selectAttribute.value)

  if (!attribute) {
    toast.error('Nie znaleziono wybranego atrybutu.')
    return
  }

  const alreadySelected = [...addedAttributeList.value, ...currentAttribute.value].some(
    (item) => item.id === attribute.id
  )

  if (alreadySelected) {
    toast.error('Ten atrybut jest już dodany.')
    return
  }

  currentAttribute.value.push(createPendingAttribute(attribute, {
    id: attribute.groupId,
    name: attribute.groupName
  }))
}

function findItemsById(idToFind: string) {
  for (const item of availableAttributeList.value) {
    const foundItem = item.items.find((item) => item.id === idToFind)
    if (foundItem) {
      return {
        ...foundItem,
        groupId: item.group.id,
        groupName: item.group.name
      }
    }
  }
  return undefined
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
  await getAllCategories()
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
    <FormSection :title="'Atrybuty z kategorii'">
      <div v-if="categoryAttributeTemplateList.length">
        <div class="mb-3 text-sm text-gray-600">
          Grupy przypisane do kategorii produktu:
          {{ categoryAttributeTemplateList.map((group) => group.name).join(', ') }}
        </div>
        <DropDown label="Grupa z kategorii" v-model="currentCategoryTemplate" :options="categoryAttributeTemplateList" />
        <div class="mt-7 flex gap-3">
          <el-button @click="addCategoryGroupAttributes" color="#ea580c" round>
            Zastosuj grupę
          </el-button>
          <el-button @click="addAllCategoryGroupAttributes" color="#ea580c" round>
            Zastosuj wszystkie grupy z kategorii
          </el-button>
        </div>
      </div>
      <div v-else class="text-sm text-gray-500">
        Brak grup atrybutów przypisanych do wybranych kategorii.
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
