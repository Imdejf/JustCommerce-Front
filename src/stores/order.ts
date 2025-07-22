import { defineStore } from 'pinia'
import { Api } from '../services/api'
import Cookies from 'universal-cookie'

export const useOrderStore = defineStore({
    id: 'order',
    state: (): StoreState => ({
      currentOrder: null
    }),
    actions: {
      closeOrder(): Promise<void> {
        this.currentOrder = null
      },  
      async showOrder(orderId: string): Promise<void> {
        this.currentOrder = await Api.orders.get(orderId)
        },  
      }
  })