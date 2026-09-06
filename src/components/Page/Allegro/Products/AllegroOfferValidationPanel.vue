<script lang="ts" setup>
import type { AllegroValidationResult } from '/@/composables/useAllegroOfferWizard'

defineProps<{
  loading: boolean
  validation: AllegroValidationResult | null
  offerPreview?: unknown
}>()
</script>

<template>
  <div class="space-y-5">
    <div
      v-if="loading"
      class="rounded-xl border border-[#d6dfe9] bg-white p-8 text-center text-sm text-[#64748b]"
    >
      Sprawdzam ofertę przed publikacją...
    </div>

    <template v-else-if="validation">
      <div
        class="rounded-xl border p-5"
        :class="validation.isValid
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-red-300 bg-red-50'"
      >
        <p
          class="text-sm font-bold"
          :class="validation.isValid ? 'text-emerald-800' : 'text-red-800'"
        >
          {{ validation.isValid
            ? 'Oferta gotowa do publikacji.'
            : 'Oferta wymaga poprawek przed publikacją.' }}
        </p>
      </div>

      <div
        v-if="validation.errors.length"
        class="rounded-xl border border-red-200 bg-white p-5"
      >
        <p class="mb-3 text-sm font-bold text-red-700">
          Błędy ({{ validation.errors.length }})
        </p>
        <ul class="space-y-2 text-sm text-red-800">
          <li
            v-for="(error, index) in validation.errors"
            :key="`error-${index}`"
            class="flex gap-2"
          >
            <span class="font-bold">•</span>
            <span>{{ error }}</span>
          </li>
        </ul>
      </div>

      <div
        v-if="validation.warnings.length"
        class="rounded-xl border border-amber-200 bg-amber-50 p-5"
      >
        <p class="mb-3 text-sm font-bold text-amber-800">
          Ostrzeżenia ({{ validation.warnings.length }})
        </p>
        <ul class="space-y-2 text-sm text-amber-900">
          <li
            v-for="(warning, index) in validation.warnings"
            :key="`warning-${index}`"
            class="flex gap-2"
          >
            <span class="font-bold">•</span>
            <span>{{ warning }}</span>
          </li>
        </ul>
      </div>
    </template>

    <div
      v-else
      class="rounded-xl border border-dashed border-[#cbd5e1] bg-white p-8 text-center text-sm text-[#64748b]"
    >
      Kliknij „Sprawdź ofertę”, aby uruchomić walidację Allegro.
    </div>

    <div
      v-if="offerPreview"
      class="rounded-xl border border-[#d6dfe9] bg-white p-5"
    >
      <p class="mb-3 text-sm font-bold text-[#111827]">
        Podgląd oferty
      </p>
      <pre class="max-h-[420px] overflow-auto rounded-lg bg-[#f8fafc] p-4 text-xs text-[#334155]">{{ offerPreview }}</pre>
    </div>
  </div>
</template>
