<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CreateOrder from '/@/components/Page/Sale/Order/CreateOrder.vue'
import { Api } from '/@/services/api'


const route = useRoute()
const order = ref(null)

const getById = (slug: string) => {
  return Api.orders.getOrderById(slug)
}

onMounted(async () => {
  const slug = route.params.slug
  const result = await getById(slug)
  order.value = result.data
  console.log(order.value)
})
</script>

<template>
  <div v-if="order != null">
    <CreateOrder :order="order" :updated="true"/>
  </div>
</template>
