<template>
<div class="flex justify-between items-center mr-5 my-2 w-full px-10">
    <div class="flex items-center">
      <slot name="control"></slot>
    </div>
    <div class="flex items-center space-x-2">
      <slot name="filter"></slot>
      <slot name="topbar"></slot>
    </div>
</div>
  <ElTable
    :data="dataTable"
    :border="true"
    :highlight-current-row="true"
    @row-click="handleRowClick"
    class="w-full"
  >
    <ElTableColumn
      v-for="column in columns"
      :key="column.prop"
      :label="column.label"
      :prop="column.prop"
      :align="'center'"
      :width="column.prop === 'filePath' ? '120px' : 'auto'"

    >
    <template #default="{ row }">
    <img 
      v-if="column.prop === 'filePath'" 
      :src="row[column.prop]" 
      alt="Product image" 
      style="width: 75px; height: 75px; object-fit: contain; border-radius: 5px;"
    />
<span
  v-else-if="column.prop === 'priceMarkup'"
  :class="{
    'text-green-600': row[column.prop] > 14,
    'text-orange-400': row[column.prop] >= 10 && row[column.prop] <= 14,
    'text-red-500': row[column.prop] < 10
  }"
>
  {{ row[column.prop] }}%
</span>
    <span v-else>{{ row[column.prop] }}</span>
  </template>

    </ElTableColumn>
  </ElTable>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  dataTable: {
    type: Array,
    default: []
  },
  columns: {
    type: Array,
    default: []
  },
  link: {
    type: String,
    default: 'dsa'
  }
})

const router = useRouter()

const handleRowClick = (row: any) => {
  router.push({ path: props.link + '/' + row.id })
}
</script>
