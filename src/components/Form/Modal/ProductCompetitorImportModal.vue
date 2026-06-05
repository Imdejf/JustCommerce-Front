<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const COMPETITOR_IMPORT_URL_KEY = 'productCompetitorImportUrl'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'import', competitorUrl: string): void
}>()

defineProps<{
  loading?: boolean
}>()

const competitorUrl = ref('')

onMounted(() => {
  try {
    const saved = localStorage.getItem(COMPETITOR_IMPORT_URL_KEY)
    if (saved) competitorUrl.value = saved
  } catch {
    // ignore
  }
})

const handleImport = () => {
  const url = competitorUrl.value?.trim()
  if (!url) return
  localStorage.setItem(COMPETITOR_IMPORT_URL_KEY, url)
  emit('import', url)
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <el-dialog
    :model-value="true"
    title="Import produktu ze strony konkurencji"
    width="640px"
    @close="handleClose"
  >
    <p class="text-sm text-gray-600 mb-4">
      Wklej link do produktu u konkurencji. AI uzupełni dane potrzebne do wystawienia produktu
      <strong>bez generowania opisu</strong> (pełny opis tworzysz osobno w builderze).
      Treści są generowane własnymi słowami — bez kopiowania 1:1 i bez nazw firmowych konkurentów.
    </p>

    <div class="border rounded-md p-3 bg-slate-50 mb-4 text-sm text-slate-700 space-y-1">
      <p class="font-semibold">Co zostanie uzupełnione:</p>
      <ul class="list-disc list-inside space-y-0.5 text-slate-600">
        <li>Nazwa produktu</li>
        <li>Slug (bez polskich znaków, z myślnikami)</li>
        <li>Nazwa SEO zdjęcia, alt atrybut, tytuł atrybutu</li>
        <li>Meta tytuł, meta opis, słowa kluczowe</li>
        <li>Specyfikacja techniczna (jeśli jest na stronie)</li>
        <li>Propozycje FAQ (wybierzesz checkboxami)</li>
        <li>Wartości atrybutów produktu (wybierzesz checkboxami)</li>
      </ul>
    </div>

    <FormKit
      type="text"
      v-model="competitorUrl"
      label="Link do produktu u konkurencji"
      placeholder="https://sklep-konkurencji.pl/produkt/..."
      validation="required"
      validation-visibility="live"
    />

    <template #footer>
      <el-button @click="handleClose">Anuluj</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!competitorUrl?.trim()"
        @click="handleImport"
      >
        Importuj dane produktu
      </el-button>
    </template>
  </el-dialog>
</template>
