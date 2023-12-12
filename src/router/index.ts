import { createRouter, createWebHistory } from 'vue-router'
import PageLayout from '../layouts/Page.vue'
import Cookies from 'universal-cookie'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',

      component: () => import('../views/Login.vue')
    },
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
    //PRODUCT-OPTION
    {
      path: '/catalog/product-option',
      name: 'ProductOption',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/ProductOption/index.vue')
    },
    {
      path: '/catalog/product-option/detail/:id',
      name: 'DetailProductOption',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/ProductOption/DetailProductOption.vue')
    },
    {
      path: '/catalog/product-option/add',
      name: 'CreateProductOption',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/ProductOption/CreateProductOption.vue')
    },
    {
      path: '/catalog/product-option/edit/:id',
      name: 'EditProductOption',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/ProductOption/EditProductOption.vue')
    },

    //PRODUCT-ATTRIBUTE
    {
      path: '/catalog/product-attribute',
      name: 'ProductAttribute',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/ProductAttribute/index.vue')
    },
    {
      path: '/catalog/product-attribute/detail/:id',
      name: 'DetailProductAttribute',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/ProductAttribute/DetailProductAttribute.vue')
    },
    {
      path: '/catalog/product-attribute/add',
      name: 'CreateProductAttribute',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/ProductAttribute/CreateProductAttribute.vue')
    },
    {
      path: '/catalog/product-attribute/edit/:id',
      name: 'EditProductAttribute',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/ProductAttribute/EditProductAttribute.vue')
    },
    //CATEGORY BLOGS
    {
      path: '/manager-content/category-blogs',
      name: 'CategoryBlog',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/ManagerContent/CategoryBlog/index.vue')
    },
    {
      path: '/manager-content/category-blogs/add',
      name: 'CreateCategoryBlog',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/ManagerContent/CategoryBlog/CreateCategoryBlog.vue')
    },
    {
      path: '/manager-content/category-blogs/edit/:id',
      name: 'EditCategoryBlog',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/ManagerContent/CategoryBlog/EditCategoryBlog.vue')
    },
    {
      path: '/manager-content/category-blogs/detail/:id',
      name: 'DetailCategoryBlog',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/ManagerContent/CategoryBlog/DetailCategoryBlog.vue')
    },
    //POST BLOGS
    {
      path: '/manager-content/post-blogs',
      name: 'PostBlog',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/ManagerContent/PostBlog/index.vue')
    },
    {
      path: '/manager-content/post-blogs/add',
      name: 'CreatePostBlog',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/ManagerContent/PostBlog/CreatePostBlog.vue')
    },
    {
      path: '/manager-content/post-blogs/edit/:id',
      name: 'EditPostBlog',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/ManagerContent/PostBlog/EditPostBlog.vue')
    },
    {
      path: '/manager-content/post-blogs/detail/:id',
      name: 'DetailPostBlog',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/ManagerContent/PostBlog/DetailPostBlog.vue')
    },
    //PRODUCT
    {
      path: '/catalog/product',
      name: 'Product',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/Product/Product/index.vue')
    }, 
    {
      path: '/catalog/product/add',
      name: 'CreateProduct',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/Product/Product/CreateProduct.vue')
    },
    {
      path: '/catalog/product/edit/:id',
      name: 'EditProduct',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/Product/Product/EditProduct.vue')
    }, 
    {
      path: '/catalog/product/detail/:id',
      name: 'DetailProduct',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Catalog/Product/Product/ProductDetail.vue')
    }, 
    //SHIPPING RULE
    {
      path: '/system/rule',
      name: 'ShippingRule',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/System/ShippingRule/index.vue')
    }, 
    {
      path: '/system/rule/add',
      name: 'CreateShippingRule',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/System/ShippingRule/CreateShippingRule.vue')
    },   
    {
      path: '/system/rule/edit/:id',
      name: 'UpdateShippingRule',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/System/ShippingRule/UpdateShippingRule.vue')
    },     
    {
      path: '/system/rule/detail/:id',
      name: 'DetailShippingRule',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/System/ShippingRule/DetailShippingRule.vue')
    },  
    // BRAND
    {
      path: '/system/brand',
      name: 'Brand',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/System/Brand/index.vue')
    }, 
    {
      path: '/system/brand/add',
      name: 'CreateBrand',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/System/Brand/CreateBrand.vue')
    }, 
    {
      path: '/system/brand/edit/:id',
      name: 'UpdateBrand',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/System/Brand/UpdateBrand.vue')
    }, 
    {
      path: '/system/brand/detail/:id',
      name: 'DetailBrand',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/System/Brand/DetailBrand.vue')
    },  
    //ORDER
    {
      path: '/sale/order',
      name: 'Order',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Sale/Order/index.vue')
    }, 
    {
      path: '/sale/order/createorder',
      name: 'CreateOrder',
      meta: {
        layout: PageLayout
      },
      component: () => import('../views/Sale/Order/CreateOrder.vue')
    },
    {
      path: '/sale/order/:slug',
      name: 'OrderDetail',
      meta: {
        layout: PageLayout
      },
      component: route => import(`../views/Sale/Order/[slug].vue`)
    }
  ]
})

router.beforeEach((to, from, next) => {
  const cookies = new Cookies()
  if(cookies.get('dsStore') === 'undefined') {
    cookies.remove('dsStore')
    window.location.reload()
  }
  if (cookies.get('Authorization') || to.path === '/login') {
    next()
  } else {
    next('/login')
  }
})
export default router
