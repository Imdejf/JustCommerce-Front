import { defineStore } from 'pinia'
import { Api } from '../services/api'
import Cookies from 'universal-cookie'

export const useOfferStore = defineStore({
    id: 'offer',
    state: (): StoreState => ({
      currentOffer: null
    }),
    actions: {
      closeOffer(): Promise<void> {
        this.currentOffer = null
      },  
      async showOffer(offerId: string): Promise<void> {
        this.currentOffer = await Api.offers.get(offerId)
        },  
      }
  })