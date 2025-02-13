<script lang="ts" setup>
import Cookies from 'universal-cookie'
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useStoreStore } from './stores/store'
import { useLanguageStore } from './stores/language'
const cookies = new Cookies()

const useStore = useStoreStore()
const language = useLanguageStore()
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
