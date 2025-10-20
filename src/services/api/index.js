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
import { offers } from './sale/offer'
import { users } from './user/user'
import { invoices } from './invoice/invoice.js'
import { certyficationAndSafeties } from './certyficationAndSafety/certyficationAndSafeties'
import { gusbir } from './gusbir/gusbir'
import { chatGpt } from './chatgpt/chatgpt'
import { productValuePrice } from './product/productValuePrice'


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
  invoices,
  offers,
  certyficationAndSafeties,
  gusbir,
  chatGpt,
  productValuePrice
}
