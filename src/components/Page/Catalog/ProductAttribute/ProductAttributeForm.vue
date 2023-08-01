<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import type { ProductAttributeDTO } from '/@/types/ProductAttribute/ProductAttribute'
import { onMounted, reactive, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import { useLanguageStore } from '/@/stores/language'
import { useStoreStore } from '/@/stores/store'
import Cookies from 'universal-cookie'

const props = defineProps({
  productAttribute: {
    type: Object as ObjectConstructor,
    default: () => ({} as ProductAttributeDTO)
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const cookies = new Cookies()
const route = useRoute()
const toast = useToast()
const language = useLanguageStore()

const currentProductAttribute = reactive(props.productAttribute)

if (props.updated) {
  currentProductAttribute.id = route.params.id
}

const attributeGroups = ref([])

const handleSave = async () => {
  try {
    const payload = {
      body: JSON.stringify(currentProductAttribute)
    }
    if (!props.updated) {
      await Api.productAttributes.create(payload)
      toast.success('Dodano atrybut produktu', {
        timeout: 2000
      })
    } else {
      await Api.productAttributes.update(payload)
      toast.success('Edytowano atrybut produktu', {
        timeout: 2000
      })
    }

    router.go(-1)
  } catch (error) {
    toast.error('Wystąpił błąd', {
      timeout: 2000
    })
  }
}

const allGroups = async () => {
  const result = await Api.attributeGroups.filterList(cookies.get('dsStore'), '', 1, 1)
  attributeGroups.value = result.items.map((item) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}

onMounted(async () => {
  try {
    allGroups()
  } catch (error) {
    console.error(error)
  }
})
</script>

<template>
  <ContentContainer :showLanguage="true">
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <div v-if="!language.selectedLanguage">
        <FormSection :title="'Grupa atrybutów'">
          <FormKit
            type="text"
            v-model="currentProductAttribute.name"
            label="Nazwa"
            validation="required"
            validation-visibility="live"
            help=""
          />
        </FormSection>
        <FormSection
          ><DropDown
            label="Kategoria nadrzędna"
            v-model="currentProductAttribute.groupId"
            :value="currentProductAttribute.groupId"
            :options="attributeGroups"
          />
        </FormSection>
      </div>
      <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.id">
        <div v-if="language.selectedLanguage?.id === formLanguage.id">
          <FormSection :title="'Grupa atrybutów'">
            <FormKit
              type="text"
              v-model="currentProductAttribute.productAttributeLangs[index].name"
              label="Nazwa"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
        </div>
      </div>
      <FormSection :title="'Konfiguracja'">
        <FormKit type="number" v-model="currentProductAttribute.displayOrder" label="Kolejność" />
      </FormSection>
      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
