<script lang="ts" setup>
import { computed, watch, reactive, ref, nextTick } from 'vue'
import { Check, Delete, MagicStick } from '@element-plus/icons-vue'
import DropZone from '/@/components/Form/File/DropZone'
import type { MediaFileDTO } from '/@/types/file/File'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import { v4 as uuidv4 } from 'uuid'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

interface FileModel {
  id: string
  file: MediaFileDTO | null
  orderValue: number
  aiInstruction: string
}

const props = defineProps({
  filesValue: { type: Array as () => MediaFileDTO[], default: () => [] },
  folder: { type: Number, required: true },
  watermark: { type: Boolean, required: true },
  baseSeo: { type: String, default: '' },
  baseAlt: { type: String, default: '' },
  baseTitle: { type: String, default: '' },
  productName: { type: String, default: '' }
})

const emit = defineEmits(['handleRemove', 'handleEdit', 'handleAdd'])

const store = useStoreStore()
const language = useLanguageStore()
const toast = useToast()

const resolvePath = (p?: string) => {
  if (!p) return ''
  if (/^(blob:|data:|https?:)?\/\//.test(p)) return p
  const base = (Api as any)?.baseUrl || ''
  return `${base}${p}`
}

const sanitize = (s: string) =>
  (s || '')
    .toString()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase()

const currentLanguage = ref<string | null>(null)
const handleLanguage = (id: string | null) => {
  currentLanguage.value = id
}

const files = computed(() => props.filesValue)

const pendingFiles = ref<FileModel[]>([])
const uploadedFiles = reactive<Record<string, any>>({})
const pendingDropzones = reactive(new Map<string, any>())

const setPendingDropzoneRef = (el: any, id: string) => {
  if (el) pendingDropzones.set(id, el)
  else pendingDropzones.delete(id)
}

const seoCounter = ref<number>(1)

const resetSeoCounter = () => {
  seoCounter.value = (files.value?.length || 0) + (pendingFiles.value?.length || 0) + 1
}

resetSeoCounter()

const productPhotoAiDefaults = {
  quality: 'high',
  size: '1024x1024',
  outputFormat: 'png'
}

const buildDefaultAiInstruction = () => `
Wygeneruj profesjonalne zdjęcie produktowe do sklepu internetowego.

Cechy stylu:
- produkt na jasnym lub białym tle
- miękkie, studyjne oświetlenie
- lustrzane odbicie na dole jak na błyszczącej powierzchni
- produkt centralnie ustawiony
- bardzo czysty katalogowy / e-commerce look
- lekka perspektywa 3D pod kątem

Dodatkowe wymagania:
- zachowaj dokładnie ten sam produkt z obrazu wejściowego
- nie zmieniaj konstrukcji, proporcji ani najważniejszych cech produktu
- nie dodawaj nowych elementów
- wynik ma wyglądać jak profesjonalny packshot ecommerce
`

const buildMergedInstruction = (customInstruction?: string) => {
  if (!customInstruction || !customInstruction.trim()) {
    return buildDefaultAiInstruction()
  }

  return `${buildDefaultAiInstruction()}

Dodatkowa instrukcja użytkownika:
${customInstruction}`
}

const addFile = (): FileModel => {
  const base = sanitize(props.baseSeo || 'image')
  const suffix = seoCounter.value++
  const seoWithSuffix = base ? `${base}-${suffix}` : `${suffix}`

  const guid = uuidv4()
  const newModel: FileModel = {
    id: guid,
    orderValue: 0,
    aiInstruction: '',
    file: {
      id: guid,
      storeId: store.selectedStore?.id,
      blobFolder: props.folder,
      watermark: props.watermark,
      thumbnail: false,
      media: {
        id: guid,
        filePath: '',
        seoFileName: seoWithSuffix,
        altAttribute: props.baseAlt || '',
        titleAttribute: props.baseTitle || '',
        displayOrder: 0,
        mediaLangs: language.languages.map((lang) => ({
          languageId: lang.id,
          seoFileName: seoWithSuffix,
          altAttribute: props.baseAlt || '',
          titleAttribute: props.baseTitle || '',
          filePath: ''
        }))
      }
    }
  }

  pendingFiles.value.unshift(newModel)
  return newModel
}

const removePendingRow = (rowId: string) => {
  pendingFiles.value = pendingFiles.value.filter((x) => x.id !== rowId)
  delete uploadedFiles[rowId]
  pendingDropzones.delete(rowId)
  resetSeoCounter()
}

const handleAddFile = async (row: FileModel) => {
  const dz = pendingDropzones.get(row.id)
  if (dz?.sendFileToServer) {
    await dz.sendFileToServer()
  }

  const up = uploadedFiles[row.id]
  const mainPath = up?.path || row.file?.media.filePath || ''

  const file = {
    media: {
      id: row.file?.media.id,
      filePath: mainPath,
      seoFileName: row.file?.media.seoFileName,
      altAttribute: row.file?.media.altAttribute,
      titleAttribute: row.file?.media.titleAttribute,
      displayOrder: row.file?.media.displayOrder ?? 0,
      mediaLangs:
        row.file?.media.mediaLangs.map((lang) => ({
          languageId: lang.languageId,
          seoFileName: lang.seoFileName,
          altAttribute: lang.altAttribute,
          titleAttribute: lang.titleAttribute,
          filePath:
            up?.pathLang?.find((i: any) => i.languageId === lang.languageId)?.path ??
            lang.filePath ??
            ''
        })) ?? []
    }
  }

  emit('handleAdd', file)
  removePendingRow(row.id)
}

const bulkInputRef = ref<HTMLInputElement | null>(null)

const openBulkPicker = () => {
  bulkInputRef.value?.click()
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })

async function makeLocalPreview(file: File) {
  const url = URL.createObjectURL(file)
  const base64String = await fileToBase64(file)

  return {
    path: url,
    pathLang: language.languages.map((l) => ({ languageId: l.id, path: url })),
    originalName: file.name,
    base64String,
    mimeType: file.type || 'image/png'
  }
}

const applySeoDefaults = (row: FileModel, originalName?: string) => {
  if (!row.file) return

  const baseSeo = sanitize(props.baseSeo || originalName?.replace(/\.[^/.]+$/, '') || '')
  const suffix = seoCounter.value++
  const seoWithSuffix = baseSeo ? `${baseSeo}-${suffix}` : `${suffix}`

  row.file.media.seoFileName = seoWithSuffix
  row.file.media.altAttribute = props.baseAlt || ''
  row.file.media.titleAttribute = props.baseTitle || ''

  row.file.media.mediaLangs = row.file.media.mediaLangs.map((ml) => ({
    ...ml,
    seoFileName: seoWithSuffix,
    altAttribute: props.baseAlt || '',
    titleAttribute: props.baseTitle || ''
  }))
}

const processFilesBatch = async (fileList: File[]) => {
  resetSeoCounter()

  for (const f of fileList) {
    const row = addFile()
    const meta = await makeLocalPreview(f)
    uploadedFiles[row.id] = meta

    if (row.file) {
      row.file.media.filePath = meta.path
      applySeoDefaults(row, meta.originalName)
    }

    await nextTick()
  }
}

const onBulkFilesSelected = async (e: Event) => {
  const arr = Array.from((e.target as HTMLInputElement).files || [])
  if (!arr.length) return

  await processFilesBatch(arr)

  if (bulkInputRef.value) {
    bulkInputRef.value.value = ''
  }
}

const onBulkDrop = async (e: DragEvent) => {
  e.preventDefault()
  const dropped = Array.from(e.dataTransfer?.files || []).filter((f) =>
    f.type.startsWith('image/')
  )

  if (!dropped.length) return

  await processFilesBatch(dropped)
}

const onDragOver = (e: DragEvent) => e.preventDefault()

const editId = ref<string | null>(null)
const changeFile = ref(false)
const removeModal = ref(false)
const selectedFile = ref('')
const editBuffer = ref<FileModel | null>(null)
const editDropzone = ref<any>(null)
const uploadedEdit = ref<any>(null)
const editAiInstruction = ref('')

const setEditDropzoneRef = (el: any) => {
  editDropzone.value = el
}

const handleSelectToEdit = (id: string) => {
  editId.value = id

  const selectFile = (files.value as any[]).find((c) => c.mediaId === id)

  const buf: FileModel = {
    id,
    orderValue: selectFile?.displayOrder ?? 0,
    aiInstruction: '',
    file: {
      storeId: store.selectedStore?.id,
      blobFolder: props.folder,
      watermark: props.watermark,
      thumbnail: false,
      media: {
        id: selectFile?.mediaId,
        filePath: selectFile?.filePath || '',
        altAttribute: selectFile?.altAttribute || '',
        seoFileName: selectFile?.seoFileName || '',
        titleAttribute: selectFile?.titleAttribute || '',
        displayOrder: selectFile?.displayOrder || 0,
        mediaLangs: language.languages.map((lang) => {
          const ml = selectFile?.mediaLangs.find((x: any) => x.languageId === lang.id)
          return {
            languageId: lang.id,
            seoFileName: ml?.seoFileName || '',
            altAttribute: ml?.altAttribute || '',
            titleAttribute: ml?.titleAttribute || '',
            filePath: ml?.filePath || ''
          }
        })
      }
    }
  }

  editBuffer.value = buf
  uploadedEdit.value = null
  changeFile.value = false
  editAiInstruction.value = ''
}

const handleChangeFile = (value: boolean) => {
  changeFile.value = value
}

const onPendingBase64Changed = (rowId: string, val: string) => {
  uploadedFiles[rowId] = {
    ...(uploadedFiles[rowId] || {}),
    base64String: val
  }
}

const onEditBase64Changed = (val: string) => {
  uploadedEdit.value = {
    ...(uploadedEdit.value || {}),
    base64String: val
  }
  changeFile.value = true
}

const handleSaveEdit = async () => {
  if (!editBuffer.value?.file) return

  if (changeFile.value && editDropzone.value?.sendFileToServer) {
    await editDropzone.value.sendFileToServer()
  }

  const up = uploadedEdit.value

  const edited = {
    media: {
      id: editBuffer.value.file.media.id,
      filePath: changeFile.value ? up?.path : editBuffer.value.file.media.filePath,
      seoFileName: editBuffer.value.file.media.seoFileName,
      altAttribute: editBuffer.value.file.media.altAttribute,
      titleAttribute: editBuffer.value.file.media.titleAttribute,
      displayOrder: editBuffer.value.file.media.displayOrder,
      mediaLangs: editBuffer.value.file.media.mediaLangs.map((lang) => ({
        languageId: lang.languageId,
        seoFileName: lang.seoFileName,
        altAttribute: lang.altAttribute,
        titleAttribute: lang.titleAttribute,
        filePath: changeFile.value
          ? up?.pathLang?.find((i: any) => i.languageId === lang.languageId)?.path
          : lang.filePath
      }))
    }
  }

  emit('handleEdit', edited.media)
  changeFile.value = false
  editBuffer.value = null
  editId.value = null
  uploadedEdit.value = null
  editAiInstruction.value = ''
}

const handleCancelFile = () => {
  changeFile.value = false
  editBuffer.value = null
  editId.value = null
  uploadedEdit.value = null
  editAiInstruction.value = ''
}

const handleSelectFile = (id: string) => {
  removeModal.value = true
  selectedFile.value = id
}

const handleRemove = () => {
  removeModal.value = false
  emit('handleRemove', selectedFile.value)
}

const generateAiForPendingRow = async (row: FileModel) => {
  try {
    const meta = uploadedFiles[row.id]
    const base64Image = meta?.base64String || ''

    if (!base64Image) {
      toast.error('Najpierw dodaj zdjęcie bazowe do tego wiersza.', { timeout: 2000 })
      return
    }

    uploadedFiles[row.id] = {
      ...(uploadedFiles[row.id] || {}),
      aiLoading: true
    }

    const body = {
      productPhotoBriefDTO: {
        productName: props.productName || '',
        base64Image,
        mimeType: meta?.mimeType || 'image/png',
        userInstruction: buildMergedInstruction(row.aiInstruction),
        quality: productPhotoAiDefaults.quality,
        size: productPhotoAiDefaults.size,
        outputFormat: productPhotoAiDefaults.outputFormat,
        count: 1
      }
    }

    const res = await Api.chatGpt.generateProductPhoto({
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      throw new Error('Błąd odpowiedzi serwera')
    }

    const json = await res.json()
    const d = json?.data ?? json

    const firstImage =
      d?.images?.[0]?.base64Image ??
      d?.Images?.[0]?.Base64Image ??
      ''

    if (!firstImage) {
      toast.error('AI nie zwróciło obrazu.', { timeout: 2000 })
      return
    }

    uploadedFiles[row.id] = {
      ...(uploadedFiles[row.id] || {}),
      base64String: firstImage,
      mimeType: `image/${productPhotoAiDefaults.outputFormat}`
    }

    toast.success('Wygenerowano zdjęcie AI.', { timeout: 2000 })
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się wygenerować zdjęcia.', { timeout: 2000 })
  } finally {
    uploadedFiles[row.id] = {
      ...(uploadedFiles[row.id] || {}),
      aiLoading: false
    }
  }
}

const generateAiForEditRow = async () => {
  try {
    if (!editBuffer.value?.file) return

    const base64Image = uploadedEdit.value?.base64String || ''

    if (!base64Image) {
      toast.error('Najpierw dodaj lub podmień zdjęcie bazowe.', { timeout: 2000 })
      return
    }

    uploadedEdit.value = {
      ...(uploadedEdit.value || {}),
      aiLoading: true
    }

    const body = {
      productPhotoBriefDTO: {
        productName: props.productName || '',
        base64Image,
        mimeType: uploadedEdit.value?.mimeType || 'image/png',
        userInstruction: buildMergedInstruction(editAiInstruction.value),
        quality: productPhotoAiDefaults.quality,
        size: productPhotoAiDefaults.size,
        outputFormat: productPhotoAiDefaults.outputFormat,
        count: 1
      }
    }

    const res = await Api.chatGpt.generateProductPhoto({
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      throw new Error('Błąd odpowiedzi serwera')
    }

    const json = await res.json()
    const d = json?.data ?? json

    const firstImage =
      d?.images?.[0]?.base64Image ??
      d?.Images?.[0]?.Base64Image ??
      ''

    if (!firstImage) {
      toast.error('AI nie zwróciło obrazu.', { timeout: 2000 })
      return
    }

    uploadedEdit.value = {
      ...(uploadedEdit.value || {}),
      base64String: firstImage,
      mimeType: `image/${productPhotoAiDefaults.outputFormat}`,
      aiLoading: false
    }

    changeFile.value = true
    toast.success('Wygenerowano zdjęcie AI.', { timeout: 2000 })
  } catch (e) {
    console.error(e)

    uploadedEdit.value = {
      ...(uploadedEdit.value || {}),
      aiLoading: false
    }

    toast.error('Nie udało się wygenerować zdjęcia.', { timeout: 2000 })
  }
}

watch(
  () => pendingFiles.value.map((row) => row.file?.media.seoFileName),
  (newVals, oldVals) => {
    newVals.forEach((val, idx) => {
      const row = pendingFiles.value[idx]
      if (!row?.file) return

      if (val !== oldVals?.[idx]) {
        row.file.media.mediaLangs.forEach((ml) => (ml.seoFileName = val || ''))
      }
    })
  },
  { deep: true }
)

watch(
  () => pendingFiles.value.map((row) => row.file?.media.altAttribute),
  (newVals, oldVals) => {
    newVals.forEach((val, idx) => {
      const row = pendingFiles.value[idx]
      if (!row?.file) return

      if (val !== oldVals?.[idx]) {
        row.file.media.mediaLangs.forEach((ml) => (ml.altAttribute = val || ''))
      }
    })
  },
  { deep: true }
)

watch(
  () => pendingFiles.value.map((row) => row.file?.media.titleAttribute),
  (newVals, oldVals) => {
    newVals.forEach((val, idx) => {
      const row = pendingFiles.value[idx]
      if (!row?.file) return

      if (val !== oldVals?.[idx]) {
        row.file.media.mediaLangs.forEach((ml) => (ml.titleAttribute = val || ''))
      }
    })
  },
  { deep: true }
)
</script>

<template>
  <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
    <div class="w-full bg-slate-800">
      <div class="flex items-center justify-between px-4 py-3">
        <ul class="flex gap-3 text-orange-500">
          <li>
            <el-button @click="handleLanguage(null)" type="primary" round>
              Domyślny
            </el-button>
          </li>
          <li v-for="lang in language.languages" :key="lang.id">
            <el-button @click="handleLanguage(lang.id)" color="#ea580c" round>
              {{ lang.isoCode }}
            </el-button>
          </li>
        </ul>

        <div class="flex items-center gap-3">
          <div
            class="rounded-md border border-dashed border-gray-400 text-xs text-gray-600 px-3 py-2 bg-white/80 hover:bg-white"
            @dragover.prevent="onDragOver"
            @drop="onBulkDrop"
            title="Przeciągnij zdjęcia tutaj"
            style="width: 180px; text-align:center;"
          >
            Przeciągnij zdjęcia
            <input
              ref="bulkInputRef"
              type="file"
              multiple
              class="hidden"
              @change="onBulkFilesSelected"
              accept="image/*"
            />
          </div>

          <el-button type="primary" @click="addFile">Dodaj</el-button>
          <el-button @click="openBulkPicker">Wybierz</el-button>
        </div>
      </div>
    </div>

    <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
      <thead class="text-center text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th class="px-6 py-3">Zdjęcie</th>
          <th class="px-6 py-3">Nazwa Seo</th>
          <th class="px-6 py-3">Alt tytuł</th>
          <th class="px-6 py-3">Atrybut tytuł</th>
          <th class="px-6 py-3">Kolejność</th>
          <th class="px-6 py-3">Akcje</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in pendingFiles"
          :key="row.id"
          class="bg-white text-center border-b dark:bg-gray-900 dark:border-gray-700"
        >
          <td class="w-5 h-2 picture">
            <DropZone
              :key="row.id + (uploadedFiles[row.id]?.path || row.file?.media.filePath || '') + (uploadedFiles[row.id]?.base64String || '')"
              :ref="(el:any) => setPendingDropzoneRef(el, row.id)"
              :fileInfo="row.file"
              :url="resolvePath(uploadedFiles[row.id]?.path || row.file?.media.filePath)"
              v-model="uploadedFiles[row.id]"
              :externalBase64="uploadedFiles[row.id]?.base64String"
              :showSaveButton="false"
              @base64Changed="(val:string) => onPendingBase64Changed(row.id, val)"
            />

            <div class="mt-2 px-2">
              <FormKit
                type="textarea"
                v-model="row.aiInstruction"
                rows="3"
                placeholder="Np. zmień kolor na czarny mat"
              />
            </div>
          </td>

          <td class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="row.file!.media.seoFileName"
            />
            <div v-for="(lng, idx) in language.languages" :key="lng.id">
              <FormKit
                v-if="currentLanguage === lng.id"
                type="text"
                v-model="row.file!.media.mediaLangs[idx].seoFileName"
              />
            </div>
          </td>

          <td class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="row.file!.media.altAttribute"
            />
            <div v-for="(lng, idx) in language.languages" :key="lng.id">
              <FormKit
                v-if="currentLanguage === lng.id"
                type="text"
                v-model="row.file!.media.mediaLangs[idx].altAttribute"
              />
            </div>
          </td>

          <td class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="row.file!.media.titleAttribute"
            />
            <div v-for="(lng, idx) in language.languages" :key="lng.id">
              <FormKit
                v-if="currentLanguage === lng.id"
                type="text"
                v-model="row.file!.media.mediaLangs[idx].titleAttribute"
              />
            </div>
          </td>

          <td class="area_input">
            <FormKit type="number" v-model="row.file!.media.displayOrder" />
          </td>

          <td>
            <el-button
              type="warning"
              :icon="MagicStick"
              :loading="uploadedFiles[row.id]?.aiLoading"
              @click="generateAiForPendingRow(row)"
              circle
            />
            <el-button
              type="success"
              :icon="Check"
              @click="handleAddFile(row)"
              circle
            />
            <el-button
              type="danger"
              :icon="Delete"
              @click="removePendingRow(row.id)"
              circle
            />
          </td>
        </tr>

        <tr
          v-for="file in files"
          :key="file.mediaId"
          class="bg-white text-center border-b dark:bg-gray-900 dark:border-gray-700"
        >
          <td v-if="editId !== file.mediaId">
            <img :src="resolvePath(file.filePath)" class="w-20" />
          </td>

          <td v-else class="picture">
            <DropZone
              :ref="setEditDropzoneRef"
              :fileInfo="editBuffer?.file || null"
              :url="resolvePath(editBuffer?.file?.media.filePath)"
              v-model="uploadedEdit"
              :externalBase64="uploadedEdit?.base64String"
              :showSaveButton="false"
              @changeFile="handleChangeFile"
              @base64Changed="onEditBase64Changed"
            />

            <div class="media_area_ai mt-2 px-2">
              <FormKit
                type="textarea"
                v-model="editAiInstruction"
                rows="3"
                placeholder="Np. zmień kolor na czarny mat"
                class="!w-[300px]"
              />
            </div>
          </td>

          <th
            v-if="editId !== file.mediaId"
            scope="row"
            class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap area_input"
          >
            {{ file.seoFileName }}
          </th>

          <th
            v-else
            scope="row"
            class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap area_input"
          >
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="editBuffer!.file!.media.seoFileName"
            />
            <div v-for="(lng, idx) in language.languages" :key="lng.id">
              <FormKit
                v-if="currentLanguage === lng.id"
                type="text"
                v-model="editBuffer!.file!.media.mediaLangs[idx].seoFileName"
              />
            </div>
          </th>

          <td v-if="editId !== file.mediaId" class="px-6 py-4">
            {{ file.altAttribute }}
          </td>

          <td v-else class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="editBuffer!.file!.media.altAttribute"
            />
            <div v-for="(lng, idx) in language.languages" :key="lng.id">
              <FormKit
                v-if="currentLanguage === lng.id"
                type="text"
                v-model="editBuffer!.file!.media.mediaLangs[idx].altAttribute"
              />
            </div>
          </td>

          <td v-if="editId !== file.mediaId" class="px-6 py-4">
            {{ file.titleAttribute }}
          </td>

          <td v-else class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="editBuffer!.file!.media.titleAttribute"
            />
            <div v-for="(lng, idx) in language.languages" :key="lng.id">
              <FormKit
                v-if="currentLanguage === lng.id"
                type="text"
                v-model="editBuffer!.file!.media.mediaLangs[idx].titleAttribute"
              />
            </div>
          </td>

          <td v-if="editId !== file.mediaId" class="px-6 py-4">
            {{ file.displayOrder }}
          </td>

          <td v-else class="area_input">
            <FormKit type="number" v-model="editBuffer!.file!.media.displayOrder" />
          </td>

          <td class="px-6 py-4">
            <a
              v-if="editId !== file.mediaId"
              @click="handleSelectToEdit(file.mediaId)"
              class="mr-3 font-medium text-blue-600 hover:underline"
            >
              Edytuj
            </a>

            <template v-else>
              <a
                @click="generateAiForEditRow"
                class="mr-3 font-medium text-orange-500 hover:underline"
              >
                AI
              </a>
              <a
                @click="handleSaveEdit"
                class="mr-3 font-medium text-blue-600 hover:underline"
              >
                Zapisz
              </a>
            </template>

            <a
              v-if="editId !== file.mediaId"
              href="#"
              class="ml-3 font-medium text-red-500 hover:underline"
              @click.prevent="handleSelectFile(file.mediaId)"
            >
              Usuń
            </a>

            <a
              v-else
              class="ml-3 font-medium text-red-500 hover:underline"
              @click="handleCancelFile"
            >
              Anuluj
            </a>

            <ConfirmModal
              v-if="removeModal"
              @confirmed="handleRemove()"
              @canceled="removeModal = false"
              text="Czy chcesz usunąć zdjęcie?"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
.picture .dropzone__picture {
  width: 150px;
  height: 150px;
}

.area_input .formkit-outer {
  display: contents;
}

.media_area_ai .formkit-outer {
  width: 200px;
}
</style>