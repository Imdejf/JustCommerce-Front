import { defineStore } from 'pinia'
import type { LanguageDTO } from '../types/language/Language'
import { Api } from '../services/api'
import Cookies from 'universal-cookie'

interface StoreState {
  languages: LanguageDTO[] | [];
  selectedLanguage: LanguageDTO | null
}

export const useLanguageStore = defineStore({
  id: 'language',
  state: (): StoreState => ({
    languages: [],
    selectedLanguage: null
  }),
  actions: {
    setCurrentLanguage(language: LanguageDTO | null): void {
      this.selectedLanguage = language
    },
    async setLanguages(): Promise<void> {
      this.languages = await Api.languages.listByStoreId()
      },  
    }
})
