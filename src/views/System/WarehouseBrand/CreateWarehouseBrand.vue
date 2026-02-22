<script lang="ts" setup>
import WarehouseBrandForm from '/@/components/Page/System/WarehouseBrand/WarehouseBrandForm.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Cookies from 'universal-cookie'
import type { WarehouseBrandDto } from '/@/types/brand/WarehouseBrand'

const route = useRoute()
const cookies = new Cookies()

const storeId = computed(() => cookies.get('dsStore') as string)

const warehouse = computed((): WarehouseBrandDto => {
  return {
    storeId: storeId.value,

    name: '',
    warehouseName: '',

    street: '',
    number: '',
    postCode: '',
    city: '',

    phone: '',
    email: '',
    personContact: '',

    isPublished: true
  }
})
</script>

<template>
  <div v-if="storeId">
    <WarehouseBrandForm :warehouse="warehouse" />
  </div>
</template>
