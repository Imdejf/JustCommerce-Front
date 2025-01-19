<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Api } from '/@/services/api'
import CertyficationAndSafetyNavbar from '/@/components/Page/Safety/CertyficationAndSafety/CertyficationAndSafetyNavbar.vue'

import type { CertyficationAndSafetyDTO } from '/@/types/certyficationAndSafety/CertyficationAndSafety.ts'
import ContentContainer from '/@/layouts/ContentContainer.vue'

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
  <ContentContainer>
    <template #navbar>
      <CertyficationAndSafetyNavbar :id="route.params.id" />
    </template>
    <div v-if="certyficationAndSafety" class="h-full">
      <InfoBox>
        <FormKit type="text" label="Nazwa" :placeholder="certyficationAndSafety.name" :disabled="true" />
        <FormKit
          type="textarea"
          label="Opis"
          :placeholder="certyficationAndSafety.description"
          :disabled="true"
        />
      </InfoBox>
    </div>
  </ContentContainer>
</template>