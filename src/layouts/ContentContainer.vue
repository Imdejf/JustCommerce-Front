<script lang="ts" setup>
import { useRouter } from 'vue-router'
import Language from '../Page/LanguageNavbar.vue'
import { useLanguageStore } from '../stores/language'
import { onBeforeMount, onMounted, onUnmounted } from 'vue'
import { LanguageDTO } from '../types/language/Language'
const router = useRouter()

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    default: ''
  },
  showLanguage: {
    type: Boolean,
    default: false
  }
})

const language = useLanguageStore()

const back = () => {
  router.go(-1)
}

const handleLanguage = (currentLanguage: LanguageDTO | null) => {
  language.setCurrentLanguage(currentLanguage)
}
</script>

<template>
  <div>
    <div class="flex justify-between bg-slate-200 bg-opacity-50 p-3">
      <button
        @click="back"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24">
          <path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6l6 6l1.41-1.41z" />
        </svg>
        Wróć
      </button>

      <slot name="navbar" />
    </div>
    <div v-if="showLanguage" class="sticky w-full top-0 z-50">
      <ul class="flex gap-5 justify-center bg-slate-800 text-orange-500 p-3">
        <li><el-button @click="handleLanguage(null)" type="primary" round>Domyślny</el-button></li>

        <li v-for="lang in language.languages" :key="lang.id">
          <el-button @click="handleLanguage(lang)" color="#ea580c" round>{{
            lang.isoCode
          }}</el-button>
        </li>
      </ul>
    </div>
    <div class="p-5 relative top-[60px]">
      <slot />
    </div>
  </div>
</template>
