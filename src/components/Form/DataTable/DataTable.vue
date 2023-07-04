<template>
  <div class="float-right mr-5 my-2">
    <slot name="topbar"></slot>
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
    >
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
