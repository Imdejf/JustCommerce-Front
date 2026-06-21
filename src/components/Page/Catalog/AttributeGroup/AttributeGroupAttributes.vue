<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Cookies from 'universal-cookie'
import { Delete, Edit } from '@element-plus/icons-vue'
import { Api } from '/@/services/api'
import { useLanguageStore } from '/@/stores/language'
import { useToast } from 'vue-toastification'
import type {
  ProductAttributeDTO,
  ProductAttributeLangDTO
} from '/@/types/productAttribute/ProductAttribute'
import type { AttributeGroupDTO } from '/@/types/attributeGroup/AttributeGroup'

interface AttributeForm {
  id: string
  storeId: string
  name: string
  groupId: string
  displayOrder: number
  productAttributeLangs: ProductAttributeLangDTO[]
}

const props = defineProps({
  attributeGroup: {
    type: Object as () => AttributeGroupDTO,
    required: true
  }
})

const cookies = new Cookies()
const language = useLanguageStore()
const toast = useToast()

const loading = ref(false)
const attributes = ref<ProductAttributeDTO[]>([])
const dialogVisible = ref(false)
const removeModalVisible = ref(false)
const attributeToRemove = ref<ProductAttributeDTO | null>(null)

const emptyForm = (): AttributeForm => ({
  id: '',
  storeId: props.attributeGroup.storeId || cookies.get('dsStore') || '',
  name: '',
  groupId: props.attributeGroup.id,
  displayOrder: 0,
  productAttributeLangs: language.languages.map((lang) => ({
    productAttributeId: '',
    languageId: lang.id,
    name: ''
  }))
})

const form = reactive<AttributeForm>(emptyForm())

const isEdit = computed(() => Boolean(form.id))
const dialogTitle = computed(() => (isEdit.value ? 'Edytuj atrybut' : 'Dodaj atrybut'))

const loadAttributes = async () => {
  loading.value = true

  try {
    const result = await Api.productAttributes.listByStoreId()
    attributes.value = (result.items ?? []).filter(
      (attribute: ProductAttributeDTO) => attribute.groupId === props.attributeGroup.id
    )
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać atrybutów grupy.')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, emptyForm())
}

const ensureLanguageRows = (attribute?: ProductAttributeDTO) => {
  return language.languages.map((lang) => {
    const existingLang = attribute?.productAttributeLangs?.find(
      (attributeLang) => attributeLang.languageId === lang.id
    )

    return {
      productAttributeId: existingLang?.productAttributeId ?? attribute?.id ?? '',
      languageId: lang.id,
      name: existingLang?.name ?? attribute?.name ?? ''
    }
  })
}

const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (attribute: ProductAttributeDTO) => {
  Object.assign(form, {
    id: attribute.id,
    storeId: attribute.storeId,
    name: attribute.name,
    groupId: props.attributeGroup.id,
    displayOrder: attribute.displayOrder ?? 0,
    productAttributeLangs: ensureLanguageRows(attribute)
  })
  dialogVisible.value = true
}

const saveAttribute = async () => {
  const payload = {
    body: JSON.stringify({
      ...form,
      groupId: props.attributeGroup.id,
      productAttributeLangs: form.productAttributeLangs.map((lang) => ({
        languageId: lang.languageId,
        name: lang.name || form.name
      }))
    })
  }

  try {
    if (isEdit.value) {
      await Api.productAttributes.update(payload)
      toast.success('Edytowano atrybut.')
    } else {
      await Api.productAttributes.create(payload)
      toast.success('Dodano atrybut.')
    }

    dialogVisible.value = false
    await loadAttributes()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zapisać atrybutu.')
  }
}

const askRemoveAttribute = (attribute: ProductAttributeDTO) => {
  attributeToRemove.value = attribute
  removeModalVisible.value = true
}

const cancelRemoveAttribute = () => {
  attributeToRemove.value = null
  removeModalVisible.value = false
}

const confirmRemoveAttribute = async () => {
  if (!attributeToRemove.value) {
    cancelRemoveAttribute()
    return
  }

  try {
    await Api.productAttributes.remove(attributeToRemove.value.id)
    toast.success('Usunięto atrybut.')
    await loadAttributes()
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się usunąć atrybutu.')
  } finally {
    cancelRemoveAttribute()
  }
}

onMounted(loadAttributes)
</script>

<template>
  <FormSection title="Atrybuty w grupie">
    <div class="mb-4 flex justify-end">
      <el-button type="primary" round @click="openCreateDialog">Dodaj atrybut</el-button>
    </div>

    <div v-loading="loading" class="relative overflow-x-auto shadow-md sm:rounded-lg w-full">
      <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead
          class="text-center text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
        >
          <tr>
            <th scope="col" class="px-6 py-3">Nazwa</th>
            <th scope="col" class="px-6 py-3">Kolejność</th>
            <th scope="col" class="px-6 py-3">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attribute in attributes" :key="attribute.id" class="text-center">
            <td class="px-6 py-4">{{ attribute.name }}</td>
            <td class="px-6 py-4">{{ attribute.displayOrder ?? 0 }}</td>
            <td class="px-6 py-4">
              <el-button
                type="warning"
                :icon="Edit"
                circle
                @click="openEditDialog(attribute)"
              />
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="askRemoveAttribute(attribute)"
              />
            </td>
          </tr>
          <tr v-if="!loading && attributes.length === 0">
            <td colspan="3" class="px-6 py-8 text-center text-gray-500">
              Brak atrybutów w tej grupie.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </FormSection>

  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
    <FormKit type="form" :actions="false" @submit="saveAttribute">
      <FormSection title="Atrybut">
        <FormKit
          type="text"
          v-model="form.name"
          label="Nazwa"
          validation="required"
          validation-visibility="live"
        />
        <FormKit type="number" v-model="form.displayOrder" label="Kolejność" />
      </FormSection>

      <FormSection title="Tłumaczenia">
        <div
          v-for="(formLanguage, index) in language.languages"
          :key="formLanguage.id"
          class="mb-3"
        >
          <FormKit
            type="text"
            v-model="form.productAttributeLangs[index].name"
            :label="`Nazwa (${formLanguage.isoCode})`"
          />
        </div>
      </FormSection>

      <div class="mt-6 flex justify-end gap-3">
        <el-button round @click="dialogVisible = false">Anuluj</el-button>
        <FormKit type="submit" label="Zapisz" />
      </div>
    </FormKit>
  </el-dialog>

  <ConfirmModal
    v-if="removeModalVisible"
    :text="`Czy na pewno usunąć atrybut „${attributeToRemove?.name ?? ''}”?`"
    @confirmed="confirmRemoveAttribute"
    @canceled="cancelRemoveAttribute"
  />
</template>
