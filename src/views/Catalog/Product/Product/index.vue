<script lang="ts" setup>
import { ref } from 'vue'
import ProductTable from '/@/components/Page/Catalog/Product/ProductTable.vue'
import ImportFile from '/@/components/Form/Modal/ImportFile.vue'

const showModal = ref(false)
const tableRef = ref<InstanceType<typeof ProductTable> | null>(null)

function openModal() {
  showModal.value = true
}

function onImportClose(success?: boolean) {
  showModal.value = false
  if (success) tableRef.value?.refresh?.()
}
</script>

<template>
  <div>
    <ProductTable ref="tableRef" @open-import="openModal" />
    <ImportFile :visible="showModal" @close="onImportClose" />
  </div>
</template>
