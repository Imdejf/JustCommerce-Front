<script lang="ts" setup>
import { Api } from '/@/services/api'
import { onMounted, ref, watch } from 'vue'
import Cookies from 'universal-cookie'
import { useRouter } from 'vue-router'
import type { ProductDTO } from '/@/types/product/Product'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  }
})

const cookies = new Cookies()
const router = useRouter()

const products = ref([])

const filter = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 30,
  SmartTableParam: {
    Search: {
      PredicateObject: {
        Name: null,
        HasOptions: null,
        IsVisibleIndividually: true,
        IsPublished: true,
        CreatedOn: null
      }
    }
  }
})

const searchProductList = () => {}

const addProductRelated = (relatedId: string, product) => {
  const newRelated = {
    id: product.id,
    filePath: product.filePath,
    isPublished: product.isPublished,
    name: product.name
  }

  const payload = {
    body: JSON.stringify({
      productId: props.product.id,
      relatedProductId: relatedId
    })
  }

  Api.productRelateds.create(payload)
}

const removeProductRelated = (relatedId: string) => {
  props.product.relatedProducts = props.product.relatedProducts.filter(
    (item) => item.id !== relatedId
  )

  const payload = {
    body: JSON.stringify({
      productId: props.product.id,
      relatedProductId: relatedId
    })
  }

  Api.productRelateds.removeRelated(payload)
}

console.log(props.product)

watch(
  filter.value,
  async (newFilter, oldFilter) => {
    console.log(newFilter)
    try {
      const payload = {
        body: JSON.stringify(newFilter)
      }

      const result = await Api.products.smartTable(payload)
      products.value = result.data
    } catch (error) {
      console.error(error)
    }
  },
  { deep: true }
)
</script>
<template>
  <div class="flex mx-10 mt-10">
    <div class="w-1/2 font-bold">
      <span>Relacje</span>
      <div>
        <ul>
          <li v-for="product in product.relatedProducts" :key="product.id" class="flex gap-2 mt-5">
            <img :src="product.filePath" class="w-[15%] object-contain" />
            <div class="w-[60%] overflow-hidden whitespace-no-wrap overflow-auto">
              {{ product.name }}
            </div>
            <div class="w-[25%] m-auto text-center">
              <el-button @click="removeProductRelated(product.id)" color="#dc2626" round
                >Usuń</el-button
              >
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="w-1/2">
      <div>
        <div class="inputs_area">
          <FormKit
            type="text"
            label="Szukaj produktu"
            v-model="filter.SmartTableParam.Search.PredicateObject.Name"
          />
        </div>
        <div>
          <span>List produktów</span>
          <div>
            <ul>
              <li v-for="product in products?.items" :key="product.id" class="flex gap-2 mt-5">
                <img :src="product.filePath" class="w-[15%] object-contain" />
                <div class="w-[60%] overflow-hidden whitespace-no-wrap overflow-auto">
                  {{ product.name }}
                </div>
                <div class="w-[25%] m-auto text-center">
                  <el-button @click="addProductRelated(product.id, product)" color="#60a5fa" round
                    >Relacja</el-button
                  >
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="float-right">
        <el-button @click="slugGenerator" color="#60a5fa" round>Dodaj</el-button>
      </div>
    </div>
  </div>
</template>
