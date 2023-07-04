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
  <main>
    <component :is="$route.meta.layout || 'div'">
      <router-view></router-view>
    </component>
  </main>
</template>
