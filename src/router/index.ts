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
     //CATEGORY
     {
      path: '/catalog/category',
      name: 'category',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/Category/index.vue')   
    },
    {
      path: '/catalog/category/detail/:id',
      name: 'CategoryDetail',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/Category/Detail.vue')
    },
    {
      path: '/catalog/category/add',
      name: 'CreateCategory',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/Category/CreateCategory.vue')
    },
    {
      path: '/catalog/category/edit/:id',
      name: 'EditCategory',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/Category/EditCategory.vue')
    },
  ]
})

export default router
