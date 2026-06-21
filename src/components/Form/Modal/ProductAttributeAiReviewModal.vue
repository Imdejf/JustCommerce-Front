<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

export interface ProductAttributeAiReviewItem {
  attributeId: string
  attributeName: string
  value: string
  selected: boolean
}

const props = defineProps<{
  loading?: boolean
  productName?: string
  attributeItems: ProductAttributeAiReviewItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply', payload: { attributeItems: ProductAttributeAiReviewItem[] }): void
}>()

const localAttributes = ref<ProductAttributeAiReviewItem[]>([])

watch(
  () => props.attributeItems,
  () => {
    localAttributes.value = props.attributeItems.map((item) => ({ ...item }))
  },
  { immediate: true, deep: true }
)

const selectedAttributeCount = computed(() => localAttributes.value.filter((x) => x.selected).length)

const toggleAllAttributes = (checked: boolean) => {
  localAttributes.value.forEach((item) => {
    item.selected = checked
  })
}

const handleApply = () => {
  emit('apply', {
    attributeItems: localAttributes.value.filter((x) => x.selected)
  })
}
</script>

<template>
  <el-dialog
    :model-value="true"
    title="Podgląd atrybutów z opisu"
    width="860px"
    @close="emit('close')"
  >
    <p class="text-sm text-gray-600 mb-4">
      AI dopasowało atrybuty na podstawie opisu produktu
      <span v-if="productName" class="font-medium">({{ productName }})</span>.
      Sprawdź wartości i zaznacz, które chcesz zapisać.
    </p>

    <div v-if="localAttributes.length > 0">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-base font-semibold text-gray-900">
          Atrybuty ({{ localAttributes.length }})
        </h3>
        <div class="flex gap-2 text-xs">
          <el-button size="small" text @click="toggleAllAttributes(true)">Zaznacz wszystkie</el-button>
          <el-button size="small" text @click="toggleAllAttributes(false)">Odznacz wszystkie</el-button>
        </div>
      </div>

      <div class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        <div
          v-for="(item, index) in localAttributes"
          :key="`attr-ai-${item.attributeId}-${index}`"
          class="border rounded-lg p-3 bg-white"
        >
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="item.selected" type="checkbox" class="h-4 w-4 shrink-0" />
            <span class="text-sm font-medium text-gray-800 w-56 shrink-0">
              {{ item.attributeName }}
            </span>
            <input
              v-model="item.value"
              type="text"
              class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>
    </div>

    <div v-else class="text-sm text-gray-500 border border-dashed rounded-md px-4 py-3">
      Brak dopasowanych atrybutów.
    </div>

    <template #footer>
      <el-button @click="emit('close')">Zamknij</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="selectedAttributeCount === 0"
        @click="handleApply"
      >
        Dodaj wybrane ({{ selectedAttributeCount }})
      </el-button>
    </template>
  </el-dialog>
</template>
