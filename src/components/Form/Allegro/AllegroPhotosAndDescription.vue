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
          class="border-b border-[#e5e7eb] last:border-b-0"
        >
          <div class="flex items-center justify-between px-3 pt-3 pb-2 border-b-2 border-[#ef4444]">
            <div class="flex items-center gap-1">
              <button
                v-for="layout in layoutOptions"
                :key="layout.value"
                type="button"
                class="layout-btn"
                :class="{ 'layout-btn--active': row.layout === layout.value }"
                :title="layout.title"
                @click="setRowLayout(row, layout.value)"
              >
                <component :is="layout.icon" />
              </button>
            </div>

            <div class="flex items-center gap-4 text-[#6b7280]">
              <button
                type="button"
                class="section-action-btn"
                title="Usuń sekcję"
                @click="removeRow(row.id)"
              >
                <IconTrash />
              </button>

              <button
                type="button"
                class="section-action-btn"
                title="Duplikuj sekcję"
                @click="duplicateRow(row)"
              >
                <IconDuplicate />
              </button>

              <button
                type="button"
                class="section-action-btn"
                title="Przenieś wyżej"
                :disabled="index === 0"
                @click="moveRowUp(index)"
              >
                <IconArrowUp />
              </button>

              <button
                type="button"
                class="section-action-btn"
                title="Przenieś niżej"
                :disabled="index === descriptionRowsModel.length - 1"
                @click="moveRowDown(index)"
              >
                <IconArrowDown />
              </button>
            </div>
          </div>

          <div
            class="grid gap-0 min-h-[280px]"
            :class="{
              'grid-cols-1': row.layout === 'TEXT_ONLY' || row.layout === 'IMAGE_ONLY',
              'grid-cols-2': row.layout === 'TEXT_IMAGE_RIGHT' || row.layout === 'IMAGE_TEXT_RIGHT'
            }"
          >
            <div
              v-if="showImageColumn(row.layout)"
              :class="{
                'order-1': row.layout === 'IMAGE_TEXT_RIGHT',
                'order-2': row.layout === 'TEXT_IMAGE_RIGHT',
                'border-r': row.layout === 'IMAGE_TEXT_RIGHT',
              }"
              class="border-[#e5e7eb] min-h-[280px] bg-[#f8fafc] flex items-center justify-center relative p-4"
            >
              <img
                v-if="row.imageUrl"
                :src="row.imageUrl"
                class="max-h-[320px] max-w-full object-contain"
                alt=""
              >

              <button
                v-if="row.imageUrl"
                type="button"
                class="absolute right-3 top-3 bg-white border border-[#d1d5db] text-[11px] px-2 py-1 hover:bg-[#fee2e2]"
                @click="clearRowImage(row)"
              >
                Usuń zdjęcie
              </button>

              <button
                v-else
                type="button"
                class="text-xs font-bold tracking-[0.18em] text-[#00796b] hover:underline"
                @click="openImagePicker(row)"
              >
                WYBIERZ ZDJĘCIE Z DODANYCH
              </button>
            </div>

            <div
              v-if="showTextColumn(row.layout)"
              :class="{
                'order-1': row.layout === 'TEXT_IMAGE_RIGHT',
                'order-2': row.layout === 'IMAGE_TEXT_RIGHT',
                'border-r': row.layout === 'TEXT_IMAGE_RIGHT',
              }"
              class="border-[#e5e7eb] min-h-[280px]"
            >
              <AllegroDescriptionEditor v-model="row.text" />
            </div>
          </div>
        </div>

        <div class="min-h-[90px] flex flex-col items-center justify-center gap-3 py-4 px-4">
          <button
            type="button"
            class="rewrite-btn"
            @click="emit('generate-rewrite-ai')"
          >
            GENERUJ UNIKALNE SEKCJE JAK NA STRONIE
          </button>

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
            alt=""
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
import { computed, defineComponent, h, ref } from 'vue'
import AllegroPhotoUploader from './AllegroPhotoUploader.vue'
import AllegroDescriptionEditor from './AllegroDescriptionEditor.vue'
import {
  isValidAllegroImageUrl,
  type AllegroDescriptionRow,
  type AllegroPhoto,
} from './allegroOfferForm.ts'

export type { AllegroDescriptionRow }

type DescriptionLayout = AllegroDescriptionRow['layout']

const props = defineProps<{
  photos: AllegroPhoto[]
  descriptionRows: AllegroDescriptionRow[]
}>()

const emit = defineEmits<{
  'update:photos': [value: AllegroPhoto[]]
  'update:descriptionRows': [value: AllegroDescriptionRow[]]
  'generate-rewrite-ai': []
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

const iconProps = {
  width: 28,
  height: 22,
  viewBox: '0 0 28 22',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
}

const IconImageOnly = defineComponent({
  render: () => h('svg', iconProps, [
    h('rect', { x: 4, y: 3, width: 20, height: 16, rx: 1, stroke: 'currentColor', 'stroke-width': 1.5 }),
    h('path', { d: 'M8 14l3-3 3 3 5-5 3 3', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    h('circle', { cx: 10, cy: 8, r: 1.5, fill: 'currentColor' }),
  ]),
})

const IconTextOnly = defineComponent({
  render: () => h('svg', iconProps, [
    h('rect', { x: 4, y: 3, width: 20, height: 16, rx: 1, stroke: 'currentColor', 'stroke-width': 1.5 }),
    h('path', { d: 'M8 8h12M8 12h12M8 16h8', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round' }),
  ]),
})

const IconImageTextRight = defineComponent({
  render: () => h('svg', iconProps, [
    h('rect', { x: 3, y: 3, width: 10, height: 16, rx: 1, stroke: 'currentColor', 'stroke-width': 1.5 }),
    h('rect', { x: 15, y: 3, width: 10, height: 16, rx: 1, stroke: 'currentColor', 'stroke-width': 1.5 }),
    h('path', { d: 'M5 14l2-2 2 2 3-3', stroke: 'currentColor', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
    h('path', { d: 'M17 8h6M17 12h6M17 16h4', stroke: 'currentColor', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
  ]),
})

const IconTextImageRight = defineComponent({
  render: () => h('svg', iconProps, [
    h('rect', { x: 3, y: 3, width: 10, height: 16, rx: 1, stroke: 'currentColor', 'stroke-width': 1.5 }),
    h('rect', { x: 15, y: 3, width: 10, height: 16, rx: 1, stroke: 'currentColor', 'stroke-width': 1.5 }),
    h('path', { d: 'M5 8h6M5 12h6M5 16h4', stroke: 'currentColor', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
    h('path', { d: 'M17 14l2-2 2 2 3-3', stroke: 'currentColor', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
  ]),
})

const IconTrash = defineComponent({
  render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
    h('path', { d: 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round' }),
  ]),
})

const IconDuplicate = defineComponent({
  render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
    h('rect', { x: 8, y: 8, width: 11, height: 11, rx: 1.5, stroke: 'currentColor', 'stroke-width': 1.5 }),
    h('rect', { x: 5, y: 5, width: 11, height: 11, rx: 1.5, stroke: 'currentColor', 'stroke-width': 1.5 }),
  ]),
})

const IconArrowUp = defineComponent({
  render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
    h('path', { d: 'M12 19V5M6 11l6-6 6 6', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ]),
})

const IconArrowDown = defineComponent({
  render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
    h('path', { d: 'M12 5v14M6 13l6 6 6-6', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ]),
})

const layoutOptions = [
  { value: 'IMAGE_ONLY' as DescriptionLayout, title: 'Samo zdjęcie', icon: IconImageOnly },
  { value: 'TEXT_ONLY' as DescriptionLayout, title: 'Sam tekst', icon: IconTextOnly },
  { value: 'IMAGE_TEXT_RIGHT' as DescriptionLayout, title: 'Zdjęcie z lewej, tekst z prawej', icon: IconImageTextRight },
  { value: 'TEXT_IMAGE_RIGHT' as DescriptionLayout, title: 'Tekst z lewej, zdjęcie z prawej', icon: IconTextImageRight },
]

const createId = () => crypto.randomUUID()

const createEmptyRow = (): AllegroDescriptionRow => ({
  id: createId(),
  text: '',
  active: true,
  layout: 'IMAGE_TEXT_RIGHT',
  imageUrl: null,
  imageFile: null,
})

const showImageColumn = (layout: DescriptionLayout) =>
  layout === 'IMAGE_ONLY' || layout === 'TEXT_IMAGE_RIGHT' || layout === 'IMAGE_TEXT_RIGHT'

const showTextColumn = (layout: DescriptionLayout) =>
  layout === 'TEXT_ONLY' || layout === 'TEXT_IMAGE_RIGHT' || layout === 'IMAGE_TEXT_RIGHT'

const setRowLayout = (row: AllegroDescriptionRow, layout: DescriptionLayout) => {
  descriptionRowsModel.value = descriptionRowsModel.value.map(item =>
    item.id === row.id
      ? { ...item, layout, active: true }
      : item
  )
}

const addRow = () => {
  descriptionRowsModel.value = [
    ...descriptionRowsModel.value,
    createEmptyRow(),
  ]
}

const removeRow = (id: string) => {
  const nextRows = descriptionRowsModel.value.filter(row => row.id !== id)
  descriptionRowsModel.value = nextRows.length ? nextRows : []
}

const duplicateRow = (row: AllegroDescriptionRow) => {
  const index = descriptionRowsModel.value.findIndex(item => item.id === row.id)
  const rows = [...descriptionRowsModel.value]

  rows.splice(index + 1, 0, {
    ...row,
    id: createId(),
    active: true,
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
  selectedImageRow.value.active = true

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
.layout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 30px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.layout-btn:hover {
  color: #111827;
  background: #f9fafb;
}

.layout-btn--active {
  color: #ea580c;
  background: #fff7ed;
}

.section-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 2px;
}

.section-action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.rewrite-btn {
  border: 0;
  border-radius: 6px;
  background: #00796b;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  padding: 10px 16px;
  cursor: pointer;
}

.rewrite-btn:hover {
  background: #00695c;
}
</style>
