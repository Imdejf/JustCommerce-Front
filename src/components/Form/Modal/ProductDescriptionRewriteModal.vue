<script lang="ts" setup>
import { computed, reactive } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'generate', config: { productPageUrl: string }): void
}>()

const props = defineProps<{
  loading?: boolean
  sectionsCount?: number
  defaultProductPageUrl?: string
}>()

const form = reactive({
  productPageUrl: props.defaultProductPageUrl || ''
})

const hasSourceSections = computed(() => (props.sectionsCount || 0) > 0)

const submit = () => {
  emit('generate', {
    productPageUrl: form.productPageUrl.trim()
  })
}
</script>

<template>
  <div class="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-[640px] rounded-xl bg-white p-6 shadow-xl">
      <h3 class="text-lg font-bold text-[#111827] mb-2">
        Generuj unikalne sekcje opisu
      </h3>

      <p class="text-sm text-[#64748b] leading-6 mb-4">
        AI zachowa układ i tematykę sekcji
        <template v-if="hasSourceSections">
          ({{ sectionsCount }} sekcji z oferty)
        </template>
        , ale przepisze treść własnymi słowami, aby uniknąć kanibalizacji SEO
        między Allegro a Twoją stroną sklepu.
      </p>

      <div class="rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-3 text-xs text-[#1e40af] leading-5 mb-4">
        Zasady anty-kanibalizacji: bez kopiowania 1:1 zdań, inna składnia i sformułowania,
        zachowane parametry techniczne i liczby.
      </div>

      <label class="block text-xs font-semibold text-[#374151] mb-1">
        URL produktu na stronie sklepu (opcjonalnie)
      </label>
      <input
        v-model="form.productPageUrl"
        type="url"
        class="w-full border border-[#d1d5db] rounded-md px-3 py-2 text-sm mb-1"
        placeholder="https://twojsklep.pl/produkt/..."
      >
      <p class="text-[11px] text-[#64748b] mb-5">
        Jeśli formularz nie ma jeszcze sekcji, podaj URL – system pobierze układ opisu ze strony.
      </p>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-sm border border-[#d1d5db] rounded-md"
          :disabled="loading"
          @click="emit('close')"
        >
          Anuluj
        </button>

        <button
          type="button"
          class="px-4 py-2 text-sm font-semibold text-white bg-[#00796b] rounded-md disabled:opacity-60"
          :disabled="loading || (!hasSourceSections && !form.productPageUrl.trim())"
          @click="submit"
        >
          {{ loading ? 'Generuję...' : 'Generuj unikalne sekcje' }}
        </button>
      </div>
    </div>
  </div>
</template>
