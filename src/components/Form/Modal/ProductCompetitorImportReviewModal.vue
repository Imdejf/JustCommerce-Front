<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

export interface CompetitorImportFaqItem {
  question: string
  answer: string
  displayOrder: number
  selected: boolean
}

export interface CompetitorImportAttributeItem {
  attributeId: string
  attributeName: string
  value: string
  selected: boolean
}

const props = defineProps<{
  loading?: boolean
  productName?: string
  requiresProductSave?: boolean
  showFaqSection?: boolean
  showAttributeSection?: boolean
  faqItems: CompetitorImportFaqItem[]
  attributeItems: CompetitorImportAttributeItem[]
}>()

const showFaq = computed(() => props.showFaqSection !== false)
const showAttributes = computed(() => props.showAttributeSection !== false)
const introText = computed(() => {
  if (!showFaq.value && showAttributes.value) {
    return 'AI wygenerowało propozycje atrybutów na podstawie opisu produktu.'
  }

  return 'AI wygenerowało dane na podstawie strony konkurencji'
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply', payload: {
    faqItems: CompetitorImportFaqItem[]
    attributeItems: CompetitorImportAttributeItem[]
  }): void
}>()

const localFaq = ref<CompetitorImportFaqItem[]>([])
const localAttributes = ref<CompetitorImportAttributeItem[]>([])

watch(
  () => [props.faqItems, props.attributeItems],
  () => {
    localFaq.value = props.faqItems.map((item) => ({ ...item }))
    localAttributes.value = props.attributeItems.map((item) => ({ ...item }))
  },
  { immediate: true, deep: true }
)

const selectedFaqCount = computed(() => localFaq.value.filter((x) => x.selected).length)
const selectedAttributeCount = computed(() => localAttributes.value.filter((x) => x.selected).length)
const hasAnySuggestion = computed(() => localFaq.value.length > 0 || localAttributes.value.length > 0)

const toggleAllFaq = (checked: boolean) => {
  localFaq.value.forEach((item) => {
    item.selected = checked
  })
}

const toggleAllAttributes = (checked: boolean) => {
  localAttributes.value.forEach((item) => {
    item.selected = checked
  })
}

const handleApply = () => {
  emit('apply', {
    faqItems: localFaq.value.filter((x) => x.selected),
    attributeItems: localAttributes.value.filter((x) => x.selected)
  })
}
</script>

<template>
  <el-dialog
    :model-value="true"
    title="Podgląd importu – wybierz co dodać"
    width="860px"
    @close="emit('close')"
  >
    <p class="text-sm text-gray-600 mb-4">
      {{ introText }}
      <span v-if="productName" class="font-medium">({{ productName }})</span>.
      <span v-if="showFaq && showAttributes">
        Zaznacz punkty FAQ i atrybuty, które chcesz dodać do produktu.
        Treści SEO zostały już uzupełnione w formularzu.
      </span>
      <span v-else-if="showAttributes">
        Zaznacz atrybuty, które chcesz dodać do produktu.
      </span>
    </p>

    <p
      v-if="requiresProductSave"
      class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4"
    >
      Produkt nie jest jeszcze zapisany. Po kliknięciu „Zapisz wybrane” FAQ i atrybuty zostaną zapamiętane
      i będą gotowe do dodania po zapisaniu produktu i ponownym otwarciu edycji.
    </p>

    <p
      v-if="!hasAnySuggestion"
      class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4"
    >
      AI nie zwróciło żadnych FAQ ani atrybutów do wyboru. Najczęściej oznacza to brak dostępnych
      atrybutów sklepu w zapytaniu albo brak parametrów możliwych do jednoznacznego odczytania ze strony.
    </p>

    <div v-if="showFaq && localFaq.length > 0" class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-base font-semibold text-gray-900">FAQ ({{ localFaq.length }})</h3>
        <div class="flex gap-2 text-xs">
          <el-button size="small" text @click="toggleAllFaq(true)">Zaznacz wszystkie</el-button>
          <el-button size="small" text @click="toggleAllFaq(false)">Odznacz wszystkie</el-button>
        </div>
      </div>

      <div class="space-y-3 max-h-[280px] overflow-y-auto pr-1">
        <div
          v-for="(item, index) in localFaq"
          :key="`faq-${index}`"
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
                rows="3"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Odpowiedź"
              />
            </div>
          </label>
        </div>
      </div>
    </div>

    <div
      v-else-if="showFaq"
      class="mb-6 text-sm text-gray-500 border border-dashed rounded-md px-4 py-3"
    >
      AI nie zwróciło propozycji FAQ.
    </div>

    <div v-if="showAttributes && localAttributes.length > 0">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-base font-semibold text-gray-900">Atrybuty ({{ localAttributes.length }})</h3>
        <div class="flex gap-2 text-xs">
          <el-button size="small" text @click="toggleAllAttributes(true)">Zaznacz wszystkie</el-button>
          <el-button size="small" text @click="toggleAllAttributes(false)">Odznacz wszystkie</el-button>
        </div>
      </div>

      <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        <div
          v-for="(item, index) in localAttributes"
          :key="`attr-${item.attributeId}-${index}`"
          class="border rounded-lg p-3 bg-white"
        >
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="item.selected" type="checkbox" class="h-4 w-4 shrink-0" />
            <span class="text-sm font-medium text-gray-800 w-40 shrink-0">{{ item.attributeName }}</span>
            <input
              v-model="item.value"
              type="text"
              class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>
    </div>

    <div
      v-else-if="showAttributes"
      class="text-sm text-gray-500 border border-dashed rounded-md px-4 py-3"
    >
      Brak dopasowanych atrybutów (upewnij się, że masz zdefiniowane atrybuty w sklepie).
    </div>

    <template #footer>
      <el-button @click="emit('close')">Zamknij</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="
          (showFaq ? selectedFaqCount : 0) === 0 &&
          (showAttributes ? selectedAttributeCount : 0) === 0
        "
        @click="handleApply"
      >
        {{
          requiresProductSave
            ? `Zapisz wybrane do dodania później (${showFaq ? `FAQ: ${selectedFaqCount}` : ''}${showFaq && showAttributes ? ', ' : ''}${showAttributes ? `atrybuty: ${selectedAttributeCount}` : ''})`
            : `Dodaj wybrane (${showFaq ? `FAQ: ${selectedFaqCount}` : ''}${showFaq && showAttributes ? ', ' : ''}${showAttributes ? `atrybuty: ${selectedAttributeCount}` : ''})`
        }}
      </el-button>
    </template>
  </el-dialog>
</template>
