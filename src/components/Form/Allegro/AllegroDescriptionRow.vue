<template>
  <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
    <h2 class="text-[26px] font-bold text-[#111827] mb-6">
      Zdjęcia i opis
    </h2>

    <!-- ZDJĘCIA -->
    <div class="mb-7">
      <h3 class="text-sm font-bold text-[#111827]">
        Zdjęcia
      </h3>

      <p class="text-[11px] text-[#64748b] mb-2">
        Pierwsze zdjęcie jest miniaturką.
      </p>

      <div class="border border-[#d1d5db] min-h-[114px] p-3 flex flex-wrap gap-3">
        <button
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
            :src="photo.url"
            class="w-full h-full object-cover"
          >

          <span
            v-if="index === 0"
            class="absolute left-1 top-1 bg-[#ea580c] text-white text-[9px] px-1"
          >
            miniatura
          </span>

          <button
            type="button"
            class="absolute right-1 top-1 bg-white border border-[#d1d5db] text-[#111827] w-5 h-5 text-xs"
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
        Możesz dodać <strong>16 zdjęć</strong>. Pamiętaj, że dobra jakość zdjęć pozytywnie wpływa na podjęcie decyzji o zakupie przedmiotu.
      </p>
    </div>

    <!-- OPIS -->
    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-1">
        Opis przedmiotu
      </h3>

      <p class="text-[11px] text-[#64748b] leading-5 mb-2">
        Automatycznie przetłumaczymy ofertę na dodatkowe języki, jeśli spełni
        <button type="button" class="text-[#00796b] underline">
          określone warunki
        </button>.
        Tłumaczenie automatyczne możesz później sprawdzić i edytować w zakładce Mój Asortyment.
      </p>

      <p class="text-xs text-[#111827] mb-3">
        Język uzupełniania oferty: <strong>polski</strong>
      </p>

      <div class="border border-[#d1d5db] bg-white">
        <div
          v-for="(row, index) in descriptionRowsModel"
          :key="row.id"
          class="relative min-h-[150px] border-b border-[#e5e7eb] last:border-b-0"
        >
          <div
            v-if="!row.active && !row.text"
            class="h-[150px] flex items-center justify-center text-sm italic text-[#6b7280]"
          >
            Dodaj tekst
          </div>

          <div
            v-if="row.active || row.text"
            class="p-3"
          >
            <div class="flex items-center justify-between border-b border-[#ef4444] pb-2 mb-3">
              <button
                type="button"
                class="text-xs text-[#ef4444]"
              >
                Dodaj tekst
              </button>

              <div class="flex items-center gap-3 text-[#6b7280]">
                <button type="button" @click="removeRow(row.id)">🗑</button>
                <button type="button" @click="duplicateRow(row)">▣</button>
                <button type="button" @click="moveRowUp(index)">↑</button>
                <button type="button" @click="moveRowDown(index)">↓</button>
              </div>
            </div>
            <div class="mb-3">
              <el-select
                v-model="row.layout"
                class="!w-[300px] allegro-select"
                placeholder="Układ opisu"
              >
                <el-option label="Sam tekst" value="TEXT_ONLY" />
                <el-option label="Tekst z lewej, zdjęcie z prawej" value="TEXT_IMAGE_RIGHT" />
                <el-option label="Zdjęcie z lewej, tekst z prawej" value="IMAGE_TEXT_RIGHT" />
                <el-option label="Samo zdjęcie" value="IMAGE_ONLY" />
              </el-select>
            </div>

            <div
              class="grid gap-4"
              :class="{
                'grid-cols-1': row.layout === 'TEXT_ONLY' || row.layout === 'IMAGE_ONLY',
                'grid-cols-2': row.layout === 'TEXT_IMAGE_RIGHT' || row.layout === 'IMAGE_TEXT_RIGHT'
              }"
            >
              <div
                v-if="row.layout === 'TEXT_ONLY' || row.layout === 'TEXT_IMAGE_RIGHT' || row.layout === 'IMAGE_TEXT_RIGHT'"
                :class="{ 'order-2': row.layout === 'IMAGE_TEXT_RIGHT' }"
                class="border border-[#e5e7eb] rounded-md overflow-hidden"
              >
                <textarea
                  v-model="row.text"
                  class="w-full min-h-[160px] p-4 outline-none resize-none text-sm"
                  placeholder="Wpisz opis produktu"
                />
              </div>

              <div
                v-if="row.layout === 'IMAGE_ONLY' || row.layout === 'TEXT_IMAGE_RIGHT' || row.layout === 'IMAGE_TEXT_RIGHT'"
                :class="{ 'order-1': row.layout === 'IMAGE_TEXT_RIGHT' }"
                class="border border-[#e5e7eb] rounded-md min-h-[160px] flex items-center justify-center bg-[#f8fafc]"
              >
                <img
                  v-if="row.imageUrl"
                  :src="row.imageUrl"
                  class="max-h-[220px] max-w-full object-contain"
                >

                <button
                  v-else
                  type="button"
                  class="text-xs font-bold text-[#00796b] hover:underline"
                  @click="selectRowImage(row)"
                >
                  DODAJ ZDJĘCIE
                </button>
              </div>
            </div>
          </div>

          <button
            v-if="!row.active && !row.text"
            type="button"
            class="absolute inset-0"
            @click="activateRow(row)"
          />
        </div>

        <div class="h-[90px] flex items-center justify-center">
          <button
            type="button"
            class="text-xs font-bold tracking-[0.22em] text-[#00796b] hover:underline"
            @click="addRow"
          >
            DODAJ KOLEJNY WIERSZ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type AllegroPhoto = {
  id: string
  file?: File
  url: string
}

type DescriptionRow = {
  id: string
  text: string
  active: boolean
  layout: 'TEXT_ONLY' | 'TEXT_IMAGE_RIGHT' | 'IMAGE_TEXT_RIGHT' | 'IMAGE_ONLY'
  imageUrl?: string | null
  imageFile?: File | null
}

const props = defineProps<{
  photos: AllegroPhoto[]
  descriptionRows: DescriptionRow[]
}>()

const emit = defineEmits<{
  'update:photos': [value: AllegroPhoto[]]
  'update:descriptionRows': [value: DescriptionRow[]]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const photosModel = computed({
  get: () => props.photos,
  set: value => emit('update:photos', value),
})

const descriptionRowsModel = computed({
  get: () => props.descriptionRows,
  set: value => emit('update:descriptionRows', value),
})

const createId = () => {
  return crypto.randomUUID()
}

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const handleFiles = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])

  if (!files.length) return

  const freeSlots = 16 - photosModel.value.length
  const filesToAdd = files.slice(0, freeSlots)

  const newPhotos = filesToAdd.map(file => ({
    id: createId(),
    file,
    url: URL.createObjectURL(file),
  }))

  photosModel.value = [
    ...photosModel.value,
    ...newPhotos,
  ]

  input.value = ''
}

const removePhoto = (id: string) => {
  photosModel.value = photosModel.value.filter(photo => photo.id !== id)
}

const activateRow = (row: DescriptionRow) => {
  descriptionRowsModel.value = descriptionRowsModel.value.map(item => {
    if (item.id !== row.id) return item

    return {
      ...item,
      active: true,
      layout: item.layout || 'TEXT_ONLY',
      imageUrl: item.imageUrl || null,
      imageFile: item.imageFile || null,
    }
  })
}

const addRow = () => {
  descriptionRowsModel.value = [
    ...descriptionRowsModel.value,
    {
      id: createId(),
      text: '',
      active: false,
      layout: 'TEXT_ONLY',
      imageUrl: null,
      imageFile: null,
    },
  ]
}

const selectRowImage = (row: DescriptionRow) => {
  const firstPhoto = photosModel.value[0]

  if (!firstPhoto?.url) {
    alert('Najpierw dodaj zdjęcie w sekcji zdjęć.')
    return
  }

  row.imageUrl = firstPhoto.url
}

const removeRow = (id: string) => {
  if (descriptionRowsModel.value.length === 1) {
    descriptionRowsModel.value = [
      {
        id: createId(),
        text: '',
        active: false,
        layout: 'TEXT_ONLY',
        imageUrl: null,
        imageFile: null,
      },
    ]

    return
  }

  descriptionRowsModel.value = descriptionRowsModel.value.filter(row => row.id !== id)
}

const duplicateRow = (row: DescriptionRow) => {
  descriptionRowsModel.value = [
    ...descriptionRowsModel.value,
    {
      ...row,
      id: createId(),
    },
  ]
}

const moveRowUp = (index: number) => {
  if (index === 0) return

  const rows = [...descriptionRowsModel.value]
  const current = rows[index]

  rows[index] = rows[index - 1]
  rows[index - 1] = current

  descriptionRowsModel.value = rows
}

const moveRowDown = (index: number) => {
  const rows = [...descriptionRowsModel.value]

  if (index >= rows.length - 1) return

  const current = rows[index]

  rows[index] = rows[index + 1]
  rows[index + 1] = current

  descriptionRowsModel.value = rows
}
</script>