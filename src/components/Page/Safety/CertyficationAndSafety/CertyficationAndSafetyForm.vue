<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import type { CertyficationAndSafetyDTO } from '/@/types/certyficationAndSafety/CertyficationAndSafety.ts'
import Button from '../../../Form/Button/Button.vue'
import { reactive, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const props = defineProps({
  certyficationAndSafety: {
    type: Object as ObjectConstructor,
    default: () => ({} as CertyficationAndSafetyDTO)
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const route = useRoute()
const toast = useToast()

const currentCertyficationAndSafety = reactive(props.certyficationAndSafety)

if (props.updated) {
    currentCertyficationAndSafety.id = route.params.id
}

const handleSave = async () => {
  try {
    const payload = {
      body: JSON.stringify(currentCertyficationAndSafety)
    }
    if (!props.updated) {
      await Api.certyficationAndSafeties.create(payload)
      toast.success('Dodano kategorie', {
        timeout: 2000
      })
    } else {
      await Api.certyficationAndSafeties.update(payload)
      toast.success('Edytowano kategorie', {
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
      <ContentContainer :showLanguage="false">
        <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
            <FormSection :title="'Certyfikaty i Bezpieczeństwo'">
                <FormKit
                type="text"
                v-model="certyficationAndSafety.name"
                label="Nazwa"
                validation="required"
                validation-visibility="live"
                help="Nazwa widoczna w systemie"
                />
            </FormSection>
            <FormSection>
            <FormKit
              type="textarea"
              label="Opis certyfikatu"
              v-model="certyficationAndSafety.description"
              rows="10"
              placeholder="Podaj opis certyfikatu"
              validation="required"
              validation-visibility="live"
              :sections-schema="{
                outer: {
                  $el: 'div',
                  attrs: {
                    style: { width: '100%' }
                  }
                }
              }"
            />
          </FormSection>
          <div class="save-button w-full my-10">
            <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
          </div>
        </FormKit>
    </ContentContainer>
</template>