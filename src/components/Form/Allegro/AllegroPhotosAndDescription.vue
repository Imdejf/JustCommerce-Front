<template>
  <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
    <h2 class="text-[26px] font-bold text-[#111827] mb-6">
      Zdjęcia i opis
    </h2>

    <AllegroPhotoUploader
      v-model="photosModel"
      class="mb-8"
    />

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
          class="relative min-h-[155px] border-b border-[#e5e7eb] last:border-b-0"
        >
          <button
            v-if="!row.active && !row.text && !row.imageUrl"
            type="button"
            class="w-full h-[155px] flex items-center justify-center text-sm italic text-[#6b7280] hover:bg-[#f9fafb]"
            @click="activateRow(row.id)"
          >
            Dodaj tekst / zdjęcie
          </button>

          <div v-else class="p-3">
            <div class="flex items-center justify-between border-b border-[#ef4444] pb-2 mb-3">
              <div class="flex items-center gap-3">
                <button type="button" class="text-xs text-[#ef4444]">
                  Sekcja opisu
                </button>

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

              <div class="flex items-center gap-3 text-[#6b7280] text-lg">
                <button type="button" @click="removeRow(row.id)">🗑</button>
                <button type="button" @click="duplicateRow(row)">▣</button>
                <button type="button" @click="moveRowUp(index)">↑</button>
                <button type="button" @click="moveRowDown(index)">↓</button>
              </div>
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

                <div class="h-[42px] border-t border-[#e5e7eb] flex items-center gap-4 px-4 text-xs text-[#111827]">
                  <button type="button">↶</button>
                  <button type="button">↷</button>

                  <select class="outline-none bg-white text-xs">
                    <option>Podstawowy tekst</option>
                    <option>Nagłówek</option>
                  </select>

                  <button type="button" class="font-bold">B</button>
                  <button type="button">• lista</button>
                  <button type="button">1. lista</button>
                </div>
              </div>

              <div
                v-if="row.layout === 'IMAGE_ONLY' || row.layout === 'TEXT_IMAGE_RIGHT' || row.layout === 'IMAGE_TEXT_RIGHT'"
                :class="{ 'order-1': row.layout === 'IMAGE_TEXT_RIGHT' }"
                class="border border-[#e5e7eb] rounded-md min-h-[220px] bg-[#f8fafc] flex items-center justify-center relative"
              >
                <img
                  v-if="row.imageUrl"
                  :src="row.imageUrl"
                  class="max-h-[260px] max-w-full object-contain"
                >

                <button
                  v-if="row.imageUrl"
                  type="button"
                  class="absolute right-2 top-2 bg-white border border-[#d1d5db] text-xs px-2 py-1 hover:bg-[#fee2e2]"
                  @click="clearRowImage(row)"
                >
                  Usuń zdjęcie
                </button>

                <button
                  v-else
                  type="button"
                  class="text-xs font-bold text-[#00796b] hover:underline"
                  @click="openImagePicker(row)"
                >
                  WYBIERZ ZDJĘCIE Z DODANYCH
                </button>
              </div>
            </div>
          </div>
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

    <el-dialog
      v-model="imagePickerVisible"
      title="Wybierz zdjęcie do sekcji opisu"
      width="700px"
    >
      <div v-if="photosModel.length" class="grid grid-cols-4 gap-4">
        <button
          v-for="photo in photosModel"
          :key="photo.id"
          type="button"
          class="border border-[#d1d5db] rounded-md p-2 hover:border-[#ea580c]"
          @click="chooseImageForRow(photo)"
        >
          <img
            :src="photo.url"
            class="w-full h-[120px] object-contain"
          >
        </button>
      </div>

      <el-empty
        v-else
        description="Najpierw dodaj zdjęcia w sekcji Zdjęcia"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AllegroPhotoUploader from './AllegroPhotoUploader.vue'
import {
  isValidAllegroImageUrl,
  type AllegroDescriptionRow,
  type AllegroPhoto,
} from './allegroOfferForm.ts'

export type { AllegroDescriptionRow }

const props = defineProps<{
  photos: AllegroPhoto[]
  descriptionRows: AllegroDescriptionRow[]
}>()

const emit = defineEmits<{
  'update:photos': [value: AllegroPhoto[]]
  'update:descriptionRows': [value: AllegroDescriptionRow[]]
}>()

const imagePickerVisible = ref(false)
const selectedImageRow = ref<AllegroDescriptionRow | null>(null)

const photosModel = computed({
  get: () => props.photos,
  set: value => emit('update:photos', value),
})

const descriptionRowsModel = computed({
  get: () => props.descriptionRows,
  set: value => emit('update:descriptionRows', value),
})

const createId = () => crypto.randomUUID()

const createEmptyRow = (): AllegroDescriptionRow => ({
  id: createId(),
  text: '',
  active: false,
  layout: 'TEXT_ONLY',
  imageUrl: null,
  imageFile: null,
})

const activateRow = (id: string) => {
  descriptionRowsModel.value = descriptionRowsModel.value.map(row => {
    if (row.id !== id) return row

    return {
      ...row,
      active: true,
      layout: row.layout || 'TEXT_ONLY',
      imageUrl: row.imageUrl || null,
      imageFile: row.imageFile || null,
    }
  })
}

const addRow = () => {
  descriptionRowsModel.value = [
    ...descriptionRowsModel.value,
    createEmptyRow(),
  ]
}

const removeRow = (id: string) => {
  if (descriptionRowsModel.value.length === 1) {
    descriptionRowsModel.value = [createEmptyRow()]
    return
  }

  descriptionRowsModel.value = descriptionRowsModel.value.filter(row => row.id !== id)
}

const duplicateRow = (row: AllegroDescriptionRow) => {
  const index = descriptionRowsModel.value.findIndex(item => item.id === row.id)
  const rows = [...descriptionRowsModel.value]

  rows.splice(index + 1, 0, {
    ...row,
    id: createId(),
  })

  descriptionRowsModel.value = rows
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

const openImagePicker = (row: AllegroDescriptionRow) => {
  if (!photosModel.value.length) {
    alert('Najpierw dodaj zdjęcie w sekcji zdjęć.')
    return
  }

  selectedImageRow.value = row
  imagePickerVisible.value = true
}

const chooseImageForRow = (photo: AllegroPhoto) => {
  if (!selectedImageRow.value) return

  selectedImageRow.value.imageUrl = photo.allegroUrl || photo.url
  selectedImageRow.value.imageFile = photo.file || null

  if (
    selectedImageRow.value.imageUrl &&
    !isValidAllegroImageUrl(selectedImageRow.value.imageUrl) &&
    !selectedImageRow.value.imageFile
  ) {
    alert('To zdjęcie zostanie przesłane do Allegro podczas publikacji oferty.')
  }

  imagePickerVisible.value = false
  selectedImageRow.value = null
}

const clearRowImage = (row: AllegroDescriptionRow) => {
  row.imageUrl = null
  row.imageFile = null
}
</script>

<style scoped>
:deep(.allegro-select .el-select__wrapper) {
  min-height: 36px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #9ca3af inset;
}
</style>