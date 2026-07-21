<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    endpoints: string[]
    extraPayload?: Record<string, unknown>
  }>(),
  {
    title: 'Import z Excela',
    endpoints: () => [],
    extraPayload: () => ({})
  }
)

const emit = defineEmits<{
  close: [success?: boolean]
}>()

const basePath = import.meta.env.VITE_API_URL
const file = ref<File | null>(null)
const dropzoneActive = ref(false)
const isLoading = ref(false)
const errors = ref<string[]>([])
const summary = ref('')
const inputId = `dropzone-file-${Math.random().toString(36).slice(2, 9)}`

function handleDrop(event: DragEvent) {
  event.preventDefault()
  dropzoneActive.value = false
  const droppedFile = event.dataTransfer?.files?.[0]
  if (droppedFile) {
    file.value = droppedFile
    errors.value = []
    summary.value = ''
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    file.value = input.files[0]
    errors.value = []
    summary.value = ''
  }
}

function extractResult(payload: any) {
  return payload?.result ?? payload?.data ?? payload ?? {}
}

async function submitFile() {
  if (!file.value) {
    ElMessage.warning('Najpierw wybierz plik.')
    return
  }
  if (!props.endpoints.length) {
    ElMessage.error('Brak skonfigurowanego endpointu importu.')
    return
  }

  isLoading.value = true
  errors.value = []
  summary.value = ''

  try {
    const arrayBuffer = await file.value.arrayBuffer()
    const byteArray = Array.from(new Uint8Array(arrayBuffer))
    const payload = {
      fileBytes: byteArray,
      ...props.extraPayload
    }

    let lastResult: any = null

    for (const endpoint of props.endpoints) {
      const response = await fetch(`${basePath}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Błąd serwera (${endpoint}): ${errorText}`)
      }

      lastResult = extractResult(await response.json())
    }

    const updated = Number(lastResult?.updatedCount ?? lastResult?.UpdatedCount ?? 0)
    const created = Number(lastResult?.createdCount ?? lastResult?.CreatedCount ?? 0)
    const skipped = Number(lastResult?.skippedCount ?? lastResult?.SkippedCount ?? 0)
    const resultErrors = lastResult?.errors ?? lastResult?.Errors ?? []

    summary.value = `Zaktualizowano: ${updated}, utworzono: ${created}, pominięto: ${skipped}`
    errors.value = Array.isArray(resultErrors) ? resultErrors.map(String) : []

    if (errors.value.length) {
      ElMessage.warning('Import zakończony z błędami')
      return
    }

    ElMessage.success('Import zakończony pomyślnie')
    file.value = null
    emit('close', true)
  } catch (error: any) {
    const message = error?.message || 'Wystąpił błąd podczas importu'
    errors.value = [message]
    ElMessage.error(message)
  } finally {
    isLoading.value = false
  }
}

function closeModal() {
  if (isLoading.value) return
  emit('close', false)
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div
      class="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg"
      @dragover.prevent="dropzoneActive = true"
      @dragleave.prevent="dropzoneActive = false"
      @drop="handleDrop"
    >
      <div
        v-if="isLoading"
        class="absolute inset-0 z-60 bg-white/90 dark:bg-gray-800/90 flex flex-col items-center justify-center rounded-lg gap-3"
      >
        <svg class="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">Importuję plik Excel…</p>
      </div>

      <button
        class="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white text-lg font-bold"
        :disabled="isLoading"
        @click="closeModal"
      >
        ×
      </button>

      <h3 class="text-lg font-semibold mb-4 pr-6">{{ title }}</h3>

      <label
        :for="inputId"
        class="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-lg cursor-pointer transition-all"
        :class="[
          dropzoneActive
            ? 'border-blue-400 bg-blue-50 dark:bg-gray-600'
            : 'border-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
        ]"
      >
        <div class="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
          <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span class="font-semibold">Kliknij aby przesłać</span> lub przeciągnij i upuść
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Plik Excel (.xls / .xlsx)</p>
          <p v-if="file" class="mt-2 text-sm text-green-600">Wybrano: {{ file.name }}</p>
        </div>
        <input
          :id="inputId"
          type="file"
          accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          class="hidden"
          @change="handleFileChange"
        />
      </label>

      <p v-if="summary" class="mt-3 text-sm text-gray-700 dark:text-gray-200">{{ summary }}</p>

      <div
        v-if="errors.length"
        class="mt-3 max-h-40 overflow-auto rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        <p class="font-semibold mb-1">Błędy importu:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
        </ul>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button
          class="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          :disabled="isLoading"
          @click="closeModal"
        >
          Zamknij
        </button>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          :disabled="isLoading"
          @click="submitFile"
        >
          Wyślij
        </button>
      </div>
    </div>
  </div>
</template>
