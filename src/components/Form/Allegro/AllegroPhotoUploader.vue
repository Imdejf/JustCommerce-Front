<template>
  <div>
    <h3 class="text-sm font-bold text-[#111827]">
      Zdjęcia
    </h3>

    <p class="text-[11px] text-[#64748b] mb-2">
      Pierwsze zdjęcie jest miniaturką. Przeciągnij miniatury, aby zmienić kolejność.
    </p>

    <div
      class="border border-[#d1d5db] min-h-[114px] p-3 flex flex-wrap gap-3 bg-white transition"
      :class="isFileDragging ? 'border-[#ea580c] bg-[#fff7ed]' : ''"
      @dragover.prevent="onContainerDragOver"
      @dragleave.prevent="onContainerDragLeave"
      @drop.prevent="onContainerDrop"
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
        class="relative w-[90px] h-[90px] border bg-[#f8fafc] cursor-grab active:cursor-grabbing select-none"
        :class="dragPhotoId === photo.id
          ? 'border-[#ea580c] opacity-60'
          : dropTargetIndex === index
            ? 'border-[#00796b] border-2'
            : 'border-[#d1d5db]'"
        draggable="true"
        @dragstart="onPhotoDragStart($event, photo.id, index)"
        @dragover.prevent="onPhotoDragOver($event, index)"
        @drop.prevent="onPhotoDrop($event, index)"
        @dragend="onPhotoDragEnd"
      >
        <img
          :src="photo.allegroUrl || photo.url"
          class="w-full h-full object-cover pointer-events-none"
          alt=""
        >

        <span
          class="absolute left-1 bottom-1 bg-black/60 text-white text-[9px] px-1 rounded"
        >
          {{ index + 1 }}
        </span>

        <span
          v-if="index === 0"
          class="absolute left-1 top-1 bg-[#ea580c] text-white text-[9px] px-1"
        >
          miniatura
        </span>

        <button
          type="button"
          class="absolute right-1 top-1 bg-white border border-[#d1d5db] text-[#111827] w-5 h-5 text-xs hover:bg-[#fee2e2]"
          @click.stop="removePhoto(photo.id)"
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
      Możesz dodać <strong>{{ maxPhotos }} zdjęć</strong>. Przeciągnij z pulpitu lub zmień kolejność myszką.
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
const isFileDragging = ref(false)
const dragPhotoId = ref<string | null>(null)
const dragFromIndex = ref<number | null>(null)
const dropTargetIndex = ref<number | null>(null)

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

const onContainerDragOver = (event: DragEvent) => {
  if (dragPhotoId.value) return
  if (event.dataTransfer?.types?.includes('Files')) {
    isFileDragging.value = true
  }
}

const onContainerDragLeave = () => {
  isFileDragging.value = false
}

const onContainerDrop = async (event: DragEvent) => {
  isFileDragging.value = false
  if (dragPhotoId.value) return
  await addFiles(Array.from(event.dataTransfer?.files || []))
}

const onPhotoDragStart = (event: DragEvent, photoId: string, index: number) => {
  dragPhotoId.value = photoId
  dragFromIndex.value = index
  event.dataTransfer?.setData('text/plain', photoId)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const onPhotoDragOver = (event: DragEvent, index: number) => {
  if (dragFromIndex.value === null) return
  event.dataTransfer!.dropEffect = 'move'
  dropTargetIndex.value = index
}

const onPhotoDrop = (_event: DragEvent, toIndex: number) => {
  const fromIndex = dragFromIndex.value
  if (fromIndex === null || fromIndex === toIndex) {
    onPhotoDragEnd()
    return
  }

  const next = [...photosModel.value]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  photosModel.value = next
  onPhotoDragEnd()
}

const onPhotoDragEnd = () => {
  dragPhotoId.value = null
  dragFromIndex.value = null
  dropTargetIndex.value = null
}

const removePhoto = (id: string) => {
  photosModel.value = photosModel.value.filter(photo => photo.id !== id)
}
</script>
