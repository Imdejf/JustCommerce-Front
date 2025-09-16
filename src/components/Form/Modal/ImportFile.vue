<script lang="ts" setup>
import { ref } from 'vue'

const emit = defineEmits(['close'])
const basePath = import.meta.env.VITE_API_URL

defineProps<{ visible: boolean }>()

const file = ref<File | null>(null)
const dropzoneActive = ref(false)
const isLoading = ref(false)

function handleDrop(event: DragEvent) {
  event.preventDefault()
  dropzoneActive.value = false

  const droppedFile = event.dataTransfer?.files?.[0]
  if (droppedFile) {
    file.value = droppedFile
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    file.value = input.files[0]
  }
}

async function submitFile() {
  if (!file.value) {
    alert('Najpierw wybierz plik.')
    return
  }

  isLoading.value = true

  try {
  const arrayBuffer = await file.value.arrayBuffer()
  const byteArray = Array.from(new Uint8Array(arrayBuffer))

  const payload = {
    fileBytes: byteArray
  }

  // 1️⃣ Wyślij do administration
  const adminResponse = await fetch(`${basePath}administration/product/ImportProductFromExcel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!adminResponse.ok) {
    const errorText = await adminResponse.text()
    throw new Error(`Błąd serwera (administration): ${errorText}`)
  }

  const adminResult = await adminResponse.json()
  console.log('Odpowiedź administration:', adminResult)

  // 2️⃣ Wyślij do product
  const productResponse = await fetch(`${basePath}product/ImportProductFromExcel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!productResponse.ok) {
    const errorText = await productResponse.text()
    throw new Error(`Błąd serwera (product): ${errorText}`)
  }

  const productResult = await productResponse.json()
  console.log('Odpowiedź product:', productResult)

  // Zamknij modal/okno
  file.value = null
  emit('close')
} catch (error) {
  file.value = null
  console.error('Błąd podczas wysyłania pliku:', error)
  alert('Wystąpił błąd podczas przesyłania pliku.')
} finally {
  isLoading.value = false
  file.value = null
}
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div
      class="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md"
      @dragover.prevent="dropzoneActive = true"
      @dragleave.prevent="dropzoneActive = false"
      @drop="handleDrop"
    >
      <!-- Spinner ładowania -->
      <div
        v-if="isLoading"
        class="absolute inset-0 z-60 bg-white bg-opacity-75 flex items-center justify-center rounded-lg"
      >
        <svg
          class="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      </div>

      <!-- Guzik zamknięcia -->
      <button
        class="absolute -top-1 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-lg font-bold"
        @click="emit('close')"
        :disabled="isLoading"
      >
        X
      </button>

      <!-- Dropzone -->
      <label
        for="dropzone-file"
        class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all"
        :class="[
          dropzoneActive
            ? 'border-blue-400 bg-blue-50 dark:bg-gray-600'
            : 'border-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
        ]"
      >
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span class="font-semibold">Kliknij aby przesłać</span> lub przeciągnij i upuść
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Plik Excel (.xls lub .xlsx)
          </p>
          <p v-if="file" class="mt-2 text-sm text-green-600">
            Wybrano: {{ file.name }}
          </p>
        </div>
        <input
          id="dropzone-file"
          type="file"
          accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          class="hidden"
          @change="handleFileChange"
        />
      </label>

      <!-- Przycisk wysyłania -->
      <div class="mt-6 flex justify-end">
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          @click="submitFile"
          :disabled="isLoading"
        >
          Wyślij
        </button>
      </div>
    </div>
  </div>
</template>
