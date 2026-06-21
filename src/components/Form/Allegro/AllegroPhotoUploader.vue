<template>
  <div>
    <h3 class="text-sm font-bold text-[#111827]">
      Zdjęcia
    </h3>

    <p class="text-[11px] text-[#64748b] mb-2">
      Pierwsze zdjęcie jest miniaturką.
    </p>

    <div
      class="border border-[#d1d5db] min-h-[114px] p-3 flex flex-wrap gap-3 bg-white transition"
      :class="isDragging ? 'border-[#ea580c] bg-[#fff7ed]' : ''"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <button
        v-if="photosModel.length < maxPhotos"
        type="button"
        class="w-[90px] h-[90px] border border-[#d1d5db] bg-white flex items-center justify-center text-[32px] text-[#6b7280] hover:border-[#ea580c]"
        @click="openFilePicker"
      >
        +
      </button>

      <div
        v-for="(photo, index) in photosModel"
        :key="photo.id"
        class="relative w-[90px] h-[90px] border border-[#d1d5db] bg-[#f8fafc]"
      >
        <img
          :src="photo.allegroUrl || photo.url"
          class="w-full h-full object-cover"
          alt=""
        >

        <span
          v-if="index === 0"
          class="absolute left-1 top-1 bg-[#ea580c] text-white text-[9px] px-1"
        >
          miniatura
        </span>

        <button
          type="button"
          class="absolute right-1 top-1 bg-white border border-[#d1d5db] text-[#111827] w-5 h-5 text-xs hover:bg-[#fee2e2]"
          @click="removePhoto(photo.id)"
        >
          ×
        </button>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/*"
        class="hidden"
        @change="handleFiles"
      >
    </div>

    <p class="mt-2 text-[11px] text-[#64748b]">
      Możesz dodać <strong>{{ maxPhotos }} zdjęć</strong>. Zdjęcia możesz też przeciągnąć z pulpitu.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { fileToBase64 } from './allegroOfferForm.ts'

export type AllegroPhoto = {
  id: string
  file?: File
  url: string
  allegroUrl?: string
}

const props = withDefaults(defineProps<{
  modelValue: AllegroPhoto[]
  maxPhotos?: number
}>(), {
  maxPhotos: 16,
})

const emit = defineEmits<{
  'update:modelValue': [value: AllegroPhoto[]]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const photosModel = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const createId = () => crypto.randomUUID()

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const isImageFile = (file: File) =>
  file.type.startsWith('image/') ||
  /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif|tiff?)$/i.test(file.name)

const addFiles = async (files: File[]) => {
  const imageFiles = files.filter(isImageFile)

  if (!imageFiles.length) return

  const freeSlots = props.maxPhotos - photosModel.value.length
  const filesToAdd = imageFiles.slice(0, freeSlots)

  const newPhotos: AllegroPhoto[] = await Promise.all(
    filesToAdd.map(async file => ({
      id: createId(),
      file,
      url: await fileToBase64(file),
    })),
  )

  photosModel.value = [
    ...photosModel.value,
    ...newPhotos,
  ]
}

const handleFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement
  await addFiles(Array.from(input.files || []))
  input.value = ''
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  await addFiles(Array.from(event.dataTransfer?.files || []))
}

const removePhoto = (id: string) => {
  photosModel.value = photosModel.value.filter(photo => photo.id !== id)
}
</script>