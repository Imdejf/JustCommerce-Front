<script lang="ts" setup>
import ProductTable from '/@/components/Page/Catalog/Product/ProductTable.vue'
import {ref} from 'vue'
const showModal = ref(false)

function openModal() {
  showModal.value = true
}
</script>

<template>
  <div>
    <ProductTable  @open-import="openModal"/>
    <ImportFile :visible="showModal" @close="showModal = false" />
  </div>
</template>
