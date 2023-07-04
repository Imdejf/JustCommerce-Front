import { createRouter, createWebHistory } from 'vue-router'
import PageLayout from '../layouts/Page.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Dashboard.vue')
    },
  ]
})

export default router
