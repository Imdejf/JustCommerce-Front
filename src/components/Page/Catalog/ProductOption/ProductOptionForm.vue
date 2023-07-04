<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import type { ProductOptionDTO } from '/@/types/ProductOption/ProductOption'
import { reactive, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import { useLanguageStore } from '/@/stores/language'

const props = defineProps({
  productOption: {
    type: Object as ObjectConstructor,
    default: () => ({} as ProductOptionDTO)
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const language = useLanguageStore()

const currentProductOption = reactive(props.productOption)

if (props.updated) {
  currentProductOption.attributeGroupId = route.params.id
}

const handleSave = async () => {
  try {
    const payload = {
      body: JSON.stringify(currentProductOption)
    }
    if (!props.updated) {
      await Api.productOptions.create(payload)
      toast.success('Dodano opcje produktu', {
        timeout: 2000
      })
    } else {
      await Api.productOptions.update(payload)
      toast.success('Edytowano opcje produktu', {
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
</script>

<template>
  <ContentContainer :showLanguage="true">
    {{ currentProductOption }}
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <div v-if="!language.selectedLanguage">
        <FormSection :title="'Grupa atrybutów'">
          <FormKit
            type="text"
            v-model="currentProductOption.name"
            label="Nazwa"
            validation="required"
            validation-visibility="live"
            help=""
          />
        </FormSection>
      </div>
      <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.Id">
        <div v-if="language.selectedLanguage?.id === formLanguage.id">
          <FormKit
            type="text"
            v-model="currentProductOption.productOptionLangs[index].name"
            label="Nazwa"
            validation="required"
            validation-visibility="live"
            help=""
          />
        </div>
      </div>
      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
