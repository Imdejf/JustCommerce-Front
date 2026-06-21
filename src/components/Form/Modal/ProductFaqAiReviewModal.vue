<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

export interface ProductFaqAiReviewItem {
  question: string
  answer: string
  displayOrder: number
  selected: boolean
}

const props = defineProps<{
  loading?: boolean
  productName?: string
  faqItems: ProductFaqAiReviewItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply', payload: { faqItems: ProductFaqAiReviewItem[] }): void
}>()

const localFaq = ref<ProductFaqAiReviewItem[]>([])

watch(
  () => props.faqItems,
  () => {
    localFaq.value = props.faqItems.map((item) => ({ ...item }))
  },
  { immediate: true, deep: true }
)

const selectedFaqCount = computed(() => localFaq.value.filter((x) => x.selected).length)

const toggleAllFaq = (checked: boolean) => {
  localFaq.value.forEach((item) => {
    item.selected = checked
  })
}

const handleApply = () => {
  emit('apply', {
    faqItems: localFaq.value.filter((x) => x.selected)
  })
}
</script>

<template>
  <el-dialog
    :model-value="true"
    title="Podgląd FAQ z AI"
    width="860px"
    @close="emit('close')"
  >
    <p class="text-sm text-gray-600 mb-4">
      AI wygenerowało propozycje FAQ
      <span v-if="productName" class="font-medium">({{ productName }})</span>.
      Sprawdź treści i zaznacz pytania, które chcesz zapisać.
    </p>

    <div v-if="localFaq.length > 0">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-base font-semibold text-gray-900">FAQ ({{ localFaq.length }})</h3>
        <div class="flex gap-2 text-xs">
          <el-button size="small" text @click="toggleAllFaq(true)">Zaznacz wszystkie</el-button>
          <el-button size="small" text @click="toggleAllFaq(false)">Odznacz wszystkie</el-button>
        </div>
      </div>

      <div class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        <div
          v-for="(item, index) in localFaq"
          :key="`faq-ai-${index}`"
          class="border rounded-lg p-3 bg-white"
        >
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="item.selected" type="checkbox" class="mt-1 h-4 w-4" />
            <div class="min-w-0 flex-1 space-y-2">
              <input
                v-model="item.question"
                type="text"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium"
                placeholder="Pytanie"
              />
              <textarea
                v-model="item.answer"
                rows="4"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Odpowiedź"
              />
              <input
                v-model.number="item.displayOrder"
                type="number"
                min="0"
                class="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Kolejność"
              />
            </div>
          </label>
        </div>
      </div>
    </div>

    <div v-else class="text-sm text-gray-500 border border-dashed rounded-md px-4 py-3">
      Brak propozycji FAQ.
    </div>

    <template #footer>
      <el-button @click="emit('close')">Zamknij</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="selectedFaqCount === 0"
        @click="handleApply"
      >
        Dodaj wybrane ({{ selectedFaqCount }})
      </el-button>
    </template>
  </el-dialog>
</template>
