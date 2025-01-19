<script lang="ts" setup>
import { Api } from '/@/services/api'
import type { CertyficationAndSafetyDTO } from '/@/types/certyficationAndSafety/CertyficationAndSafety.ts'
import { onMounted, ref } from 'vue'
import CertyficationAndSafetyForm from '/@/components/Page/Safety/CertyficationAndSafety/CertyficationAndSafetyForm.vue'
import { useRoute } from 'vue-router'
import { useLanguageStore } from '/@/stores/language'

const language = useLanguageStore()
const route = useRoute()
const certyficationAndSafety = ref<CertyficationAndSafetyDTO | null>(null)

const getById = (id: string) => {
  return Api.certyficationAndSafeties.get(id)
}

onMounted(async () => {
  const id = route.params.id
  const result = await getById(id.toString())
  certyficationAndSafety.value = result.data
})
</script>
<template>
  <div v-if="certyficationAndSafety">
    <CertyficationAndSafetyForm :certyficationAndSafety="certyficationAndSafety" :updated="true" />
  </div>
</template>
