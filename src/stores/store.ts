import { defineStore } from 'pinia'
import type { StoreDTO } from '../types/store/Store'
import { Api } from '../services/api'
import Cookies from 'universal-cookie'

interface StoreState {
  stores: StoreDTO[] | [];
  selectedStore: StoreDTO | null
}

export const useStoreStore = defineStore({
  id: 'store',
  state: (): StoreState => ({
    stores: [],
    selectedStore: null
  }),
  actions: {
    async setStores(): Promise<void> {
      const storesList = await Api.stores.list()
      this.stores = storesList.data
    },
    setCurrentStore(id: string): void {
      const cookies = new Cookies()
      
      this.selectedStore = this.stores.find(store => store.id === id) || null;

      cookies.set("dsStore", this.selectedStore?.id.toString())
    }
  }
})
