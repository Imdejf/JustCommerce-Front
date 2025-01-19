<script setup lang="ts">
import CertyficationAndSafetyForm from '/@/components/Page/Safety/CertyficationAndSafety/CertyficationAndSafetyForm.vue'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { computed } from 'vue'

const language = useLanguageStore()
const store = useStoreStore()

const certyficationAndSafety = computed(() => {
    return {
        storeId: store.selectedStore.id,
        name: '',
        description: ''
    }
})
</script>

<template>
      <div v-if="store.selectedStore">
        <CertyficationAndSafetyForm :certyficationAndSafety="certyficationAndSafety" :updated="false"></CertyficationAndSafetyForm>
      </div>
</template>