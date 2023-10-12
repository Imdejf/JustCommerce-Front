<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import type { BrandDto } from '/@/types/brand/Brand'
import { computed, ref, reactive, watch, onMounted } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import DropZone from '../../../Form/File/DropZone.vue'
import { useLanguageStore } from '/@/stores/language'

const props = defineProps({
  brand: {
    type: Object as ObjectConstructor,
    default: () => ({} as BrandDto)
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

const currentBrand = ref(props.brand)

const slugGenerator = () => {
  if (!currentBrand.value.name) {
    toast.error('Błędna nazwa producenta', {
      timeout: 2000
    })
    return
  }

  const slug = currentBrand.value.name.trim().toLowerCase().replace(/\s+/g, '-')

  currentBrand.value.slug = slug
}

const handleSave = async () => {
  try {
    const payload = {
      body: JSON.stringify(currentBrand.value)
    }
    if (!props.updated) {
      await Api.brands.create(payload)
      toast.success('Dodano marke', {
        timeout: 2000
      })
    } else {
      await Api.brands.update(payload)
      toast.success('Edytowano marke', {
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
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <FormSection :title="'Producent'">

        <FormKit
          type="text"
          v-model="currentBrand.name"
          label="Nazwa producenta"
          validation="required"
          validation-visibility="live"
        />
        <FormKit
          type="text"
          v-model="currentBrand.slug"
          label="Slug"
          validation="required"
          validation-visibility="live"
          help=""
        />
        <div class="mt-7">
          <el-button @click="slugGenerator" color="#ea580c" round>Generuj slug</el-button>
        </div>
      </FormSection>
      <div v-if="!language.selectedLanguage">
        <FormSection title="Opis">
          <HtmlEditor v-model="currentBrand.description" />
        </FormSection>
      </div>
      <FormSection>
        <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.Id">
          <div v-if="language.selectedLanguage?.id === formLanguage.id">
            <FormSection title="Opis">
              <HtmlEditor v-model="currentBrand.brandLangs[index].description" />
            </FormSection>
          </div>
        </div>
      </FormSection>
      <FormSection>
        <FormKit
          type="checkbox"
          label="Widoczny"
          help=""
          v-model="currentBrand.isPublished"
          :value="false"
        />
      </FormSection>
      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
