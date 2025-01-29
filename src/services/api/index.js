import { stores } from './store'
import { categories } from './product/category'
import { languages } from './language/language'
import { attributeGroups } from './product/attributeGroup'
import { productOptions } from './product/productOption'
import { products } from './product/product'
import { productAttributes } from './product/productAttribute'
import { productRelateds } from './product/productRelated'
import { categoryBlogs } from './managerContent/categoryBlog'
import { postBlogs } from './managerContent/postBlog'
import { brands } from './product/brands'
import { rules } from './system/rule'
import { orders } from './sale/order'
import { shipping } from './sale/shipping'
import { users } from './user/user'
import { certyficationAndSafeties } from './certyficationAndSafety/certyficationAndSafeties'

export const Api = {
  stores,
  categories,
  languages,
  attributeGroups,
  productOptions,
  products,
  productAttributes,
  productRelateds,
  categoryBlogs,
  postBlogs,
  rules,
  brands,
  orders,
  shipping,
  users,
  certyficationAndSafeties
}
