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
    //ATTRIBUTE-GROUP
    {
      path: '/catalog/attribute-group',
      name: 'AttributeGroup',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/AttributeGroup/index.vue')
    },
    {
      path: '/catalog/attribute-group/detail/:id',
      name: 'DetailAttributeGroup',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/AttributeGroup/DetailAttributeGroup.vue')
    },
    {
      path: '/catalog/attribute-group/add',
      name: 'CreateAttributeGroup',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/AttributeGroup/CreateAttributeGroup.vue')
    },
    {
      path: '/catalog/attribute-group/edit/:id',
      name: 'EditAttributeGroup',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/AttributeGroup/EditAttributeGroup.vue')
    },
  ]
})

export default router
