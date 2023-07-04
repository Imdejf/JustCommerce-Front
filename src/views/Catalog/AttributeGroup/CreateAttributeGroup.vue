<script lang="ts" setup>
import AttributeGroupForm from '/@/components/Page/Catalog/AttributeGroup/AttributeGroupForm.vue'
import type { AttributeGroupDTO } from '/@/types/attributeGroup/AttributeGroup'
import { useStoreStore } from '/@/stores/store'
import { computed } from 'vue'
const store = useStoreStore()
const attributeGroup = computed(() => {
  return {
    storeId: store.selectedStore.id,
    name: ''
  }
})
</script>

<template>
  <AttributeGroupForm :attributeGroup="attributeGroup" />
</template>
