<script lang="ts" setup>
import Cookies from 'universal-cookie'
import { onMounted, computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useStoreStore } from './stores/store'
import { useLanguageStore } from './stores/language'
import { useOfferStore } from '/@/stores/offer'
import { useOrderStore } from '/@/stores/order'
import { useInvoiceStore } from '/@/stores/invoice'


import OfferModal from './components/Form/Modal/OfferModal.vue'
import OrderModal from './components/Form/Modal/OrderModal.vue'
import InvoicePickerModal from './components/Form/Modal/InvoicePickerModal.vue'

const cookies = new Cookies()

const useOffer = useOfferStore()
const useStore = useStoreStore()
const language = useLanguageStore()
const useOrder = useOrderStore()

const closeOfferHandle = () => {
  useOffer.closeOffer();
}

const closeOrderHandle = () => {
  useOrder.closeOrder();
}

const invoiceStore = useInvoiceStore()

const closeInvoiceHandle = () => {
  invoiceStore.close()
}

const currentOffer = computed(() => {
  return useOffer.currentOffer.data;
})

const currentOrder = computed(() => {
  return useOrder.currentOrder.data;
})

onMounted(async () => {
  const selectedStore = cookies.get('dsStore')
  if (selectedStore) {
    await language.setLanguages()
  }
  await useStore.setStores()

  useStore.setCurrentStore(selectedStore)
})
</script>

<template>
  <header></header>
  <main class="text-[#e0e8f0] bg-[#e0e8f0] h-[100vh]">
    <!-- Sidebar Container -->
      <!-- Transparent Background -->
    <div v-if="useOffer.currentOffer !== null" class="absolute inset-0 bg-gray-300 opacity-60 w-full z-50"></div>
     <div
      v-if="useOffer.currentOffer !== null"
      class="fixed p-4 top-0 right-0 w-2/5 h-full shadow-lg transform transition-transform duration-300 z-50 bg-white text-black "
      >      
      <!-- Sidebar Content -->
      <div 
        class="relative w-full h-auto transform transition-transform duration-300"
      >
        <OfferModal :offer="currentOffer" @closeOffer="closeOfferHandle"/>
      </div>
      </div>
      <div v-if="useOrder.currentOrder !== null" class="absolute inset-0 bg-gray-300 opacity-60 w-full z-50"></div>
      <div
        v-if="useOrder.currentOrder !== null"
        class="fixed p-4 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 shadow-lg transition-transform overflow-y-auto duration-300 z-50 bg-white text-black"
      >      
        <!-- Modal Content -->
        <div 
          class="relative w-auto h-[70vh] transition-transform duration-300"
        >
          <OrderModal :order="currentOrder" @closeOrder="closeOrderHandle" />
        </div>
      </div>
      <div v-if="invoiceStore.isOpen" class="absolute inset-0 bg-gray-300 opacity-60 w-full z-50"></div>
      <div
        v-if="invoiceStore.isOpen"
        class="fixed p-4 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/5 shadow-lg transition-transform overflow-y-auto duration-300 z-50 bg-white text-black"
      >
        <div class="relative w-auto h-[70vh] transition-transform duration-300">
          <InvoicePickerModal
            @close="closeInvoiceHandle"
          />
        </div>
      </div>
    <component :is="$route.meta.layout || 'div'">
      <router-view></router-view>
    </component>
  </main>
</template>

<style>
.el-table {
  --el-table-border-color:2px solid #fafbfd !important ; /* Ustaw kolor obramowania */
  --el-table-border: 2px solid #fafbfd !important;
  --el-border-width: 1px; /* Ustaw grubość obramowania */
  --el-table-row-hover-bg-color: #e0e8f0 !important;
  --el-fill-color-lighter: #f1f4f9
}


.el-table td.el-table__cell, .el-table th.el-table__cell.is-leaf {
  border-bottom:0px !important;
  border-right: 1px solid #d6dfe9 !important;
  border-top: 1px solid #d6dfe9 !important;
} 
.order_label {
  padding: 0 !important;
}
.order_label .cell {
  padding: 0 !important;
  height: 100% !important;
}

.el-table_1_column_5 order_label is-leaf el-table__cell {
  display: inline !important;
}

/* body{
  overflow:hidden;
  height: 100%;
  margin: 0;
  padding: 0;
} */

</style>
