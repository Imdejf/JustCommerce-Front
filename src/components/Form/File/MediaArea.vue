<script lang="ts" setup>
import { Plus, Edit } from '@element-plus/icons-vue'
import { Api } from '/@/services/api'
import { computed, ref } from 'vue'
import type { MediaFileDTO } from '/@/types/file/File'
import { useStoreStore } from '/@/stores/store'
import { useLanguageStore } from '/@/stores/language'
import DropZone from '/@/components/Form/File/DropZone'
import { Check, Delete } from '@element-plus/icons-vue'
import { v4 as uuidv4 } from 'uuid'

interface FileModel {
  file: MediaFileDTO | null
  orderValue: number
}

const props = defineProps({
  filesValue: {
    type: Array as () => MediaFileDTO[],
    default: () => []
  },
  folder: {
    type: Number,
    required: true
  },
  watermark: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['handleRemove', 'handleEdit', 'handleAdd'])

const dropzone = ref(null)
const updatedropzone = ref(null)
const store = useStoreStore()
const language = useLanguageStore()
const currentLanguage = ref(null)
const editId = ref(null)
const removeModal = ref(false)
const selectedFile = ref('')
const changeFile = ref(false)
const currentFile = ref<FileModel>({ file: null, orderValue: 0 })

const files = computed(() => {
  return props.filesValue
})

const uploadedFile = ref(null)

const addFile = () => {
  const guid = uuidv4()
  currentFile.value.file = {
    id: guid,
    storeId: store.selectedStore?.id,
    blobFolder: props.folder,
    watermark: props.watermark,
    thumbnail: false,
    media: {
      id: guid,
      filePath: '',
      seoFileName: '',
      altAttribute: '',
      titleAttribute: '',
      displayOrder: 0,
      mediaLangs: language.languages.map((lang) => ({
        languageId: lang.id,
        seoFileName: '',
        altAttribute: '',
        titleAttribute: ''
      }))
    }
  }
}

const handleLanguage = (id: string) => {
  currentLanguage.value = id
}

const handleRemove = () => {
  removeModal.value = false
  emit('handleRemove', selectedFile.value)
}

const handleSelectToEdit = (id: string) => {
  editId.value = id

  const selectFile = files.value.find((c) => c.mediaId === id)

  currentFile.value.file = {
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
        const selectedMediaLang = selectFile?.mediaLangs.find(
          (mediaLang) => mediaLang.languageId === lang.id
        )
        return {
          languageId: lang.id,
          seoFileName: selectedMediaLang?.seoFileName || '',
          altAttribute: selectedMediaLang?.altAttribute || '',
          titleAttribute: selectedMediaLang?.titleAttribute || '',
          filePath: selectedMediaLang?.filePath || ''
        }
      })
    }
  }
}

const handleSelectFile = (id: string) => {
  removeModal.value = true
  selectedFile.value = id
}

const handleAddFile = async () => {
  await dropzone.value.sendFileToServer()
  const file = {
    media: {
      id: currentFile.value.file?.id,
      filePath: uploadedFile.value.path,
      seoFileName: currentFile.value.file?.media.seoFileName,
      altAttribute: currentFile.value.file?.media.altAttribute,
      titleAttribute: currentFile.value.file?.media.titleAttribute,
      displayOrder: currentFile.value.file?.media.displayOrder,
      mediaLangs: currentFile.value.file?.media.mediaLangs.map((lang) => ({
        languageId: lang.languageId,
        seoFileName: lang.seoFileName,
        altAttribute: lang.altAttribute,
        titleAttribute: lang.titleAttribute,
        filePath: uploadedFile.value.pathLang.find((item) => item.languageId === lang.languageId)
          ?.path
      }))
    }
  }

  changeFile.value = false
  emit('handleAdd', file)
  currentFile.value.file = null
  currentFile.value.orderValue = 0
}

const handleSaveEdit = async () => {
  if (changeFile.value) {
    await updatedropzone.value[0].sendFileToServer()
  }

  console.log('xxxx')
  console.log(currentFile.value.file?.media.mediaLangs)
  const file = {
    media: {
      id: currentFile.value.file?.media.id,
      filePath: changeFile.value ? uploadedFile.value.path : currentFile.value.file?.media.filePath,
      seoFileName: currentFile.value.file?.media.seoFileName,
      altAttribute: currentFile.value.file?.media.altAttribute,
      titleAttribute: currentFile.value.file?.media.titleAttribute,
      displayOrder: currentFile.value.file?.media.displayOrder,
      mediaLangs: currentFile.value.file?.media.mediaLangs.map((lang) => ({
        languageId: lang.languageId,
        seoFileName: lang.seoFileName,
        altAttribute: lang.altAttribute,
        titleAttribute: lang.titleAttribute,
        filePath: changeFile.value
          ? uploadedFile.value.pathLang.find((item) => item.languageId === lang.languageId)?.path
          : currentFile.value.file?.media.mediaLangs.find(
              (item) => item.languageId === lang.languageId
            )?.filePath
      }))
    }
  }

  changeFile.value = false
  emit('handleEdit', file.media)
  changeFile.value = false
  currentFile.value.file = null
  editId.value = null
}

const handleChangeFile = (value: Boolean) => {
  changeFile.value = value
}

const handleCancelFile = () => {
  changeFile.value = false
  currentFile.value.file = null
  editId.value = null
}

const handleRemoveFile = () => {
  currentFile.value.file = null
  currentFile.value.orderValue = 0
}
</script>

<template>
  <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
    <div class="w-full bg-slate-800">
      <ul class="flex gap-5 justify-center bg-slate-800 text-orange-500 p-3">
        <li>
          <el-button @click="handleLanguage(null)" type="primary" round>Domyślny</el-button>
        </li>

        <li v-for="lang in language.languages" :key="lang.id">
          <el-button @click="handleLanguage(lang.id)" color="#ea580c" round>{{
            lang.isoCode
          }}</el-button>
        </li>
      </ul>
    </div>
    <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
      <thead
        class="text-center text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <th scope="col" class="px-6 py-3">Zdjęcie</th>
          <th scope="col" class="px-6 py-3">Nazwa Seo</th>
          <th scope="col" class="px-6 py-3">Alt tytuł</th>
          <th scope="col" class="px-6 py-3">Atrybut tytuł</th>
          <th scope="col" class="px-6 py-3">Kolejność</th>
          <th scope="col px-6 py-3">
            <el-button type="primary" @click="addFile">Dodaj</el-button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-if="currentFile.file !== null && editId === null"
          class="bg-white text-center border-b dark:bg-gray-900 dark:border-gray-700"
        >
          <td class="w-5 h-2 picture">
            <DropZone
              ref="dropzone"
              :fileInfo="currentFile.file"
              v-model="uploadedFile"
              :showSaveButton="false"
            ></DropZone>
          </td>
          <td class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="currentFile.file.media.seoFileName"
            />
            <div v-for="(language, index) in language.languages" :key="language.id">
              <FormKit
                v-if="currentLanguage === language.id"
                type="text"
                v-model="currentFile.file.media.mediaLangs[index].seoFileName"
              />
            </div>
          </td>
          <td class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="currentFile.file.media.titleAttribute"
            />
            <div v-for="(language, index) in language.languages" :key="language.id">
              <FormKit
                v-if="currentLanguage === language.id"
                type="text"
                v-model="currentFile.file.media.mediaLangs[index].titleAttribute"
              />
            </div>
          </td>
          <td class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="currentFile.file.media.altAttribute"
            />
            <div v-for="(language, index) in language.languages" :key="language.id">
              <FormKit
                v-if="currentLanguage === language.id"
                type="text"
                v-model="currentFile.file.media.mediaLangs[index].altAttribute"
              />
            </div>
          </td>
          <td class="area_input">
            <FormKit type="number" v-model="currentFile.orderNumber" />
          </td>
          <td>
            <el-button type="success" :icon="Check" @click="handleAddFile" circle />
            <el-button type="danger" :icon="Delete" @click="handleRemoveFile" circle />
          </td>
        </tr>
        <tr
          v-for="file in files"
          :key="file.mediaId"
          class="bg-white text-center border-b dark:bg-gray-900 dark:border-gray-700"
        >
          <td v-if="editId !== file.mediaId">
            <img :src="file.filePath" class="w-20" />
          </td>
          <td v-if="editId === file.mediaId" class="picture">
            <DropZone
              ref="updatedropzone"
              :fileInfo="currentFile.file"
              :url="currentFile.file?.media.filePath"
              v-model="uploadedFile"
              :showSaveButton="false"
              @changeFile="handleChangeFile"
            ></DropZone>
          </td>

          <th
            v-if="editId !== file.mediaId"
            scope="row"
            class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap area_input"
          >
            {{ file.seoFileName }}
          </th>
          <th
            v-if="editId === file.mediaId"
            scope="row"
            class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap area_input"
          >
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="currentFile.file.media.seoFileName"
            />
            <div v-for="(language, index) in language.languages" :key="language.id">
              <FormKit
                v-if="currentLanguage === language.id"
                type="text"
                v-model="currentFile.file.media.mediaLangs[index].seoFileName"
              />
            </div>
          </th>
          <td v-if="editId !== file.mediaId" class="px-6 py-4">{{ file.altAttribute }}</td>
          <td v-if="editId === file.mediaId" class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="currentFile.file.media.altAttribute"
            />
            <div v-for="(language, index) in language.languages" :key="language.id">
              <FormKit
                v-if="currentLanguage === language.id"
                type="text"
                v-model="currentFile.file.media.mediaLangs[index].altAttribute"
              />
            </div>
          </td>
          <td v-if="editId !== file.mediaId" class="px-6 py-4">{{ file.titleAttribute }}</td>
          <td v-if="editId === file.mediaId" class="area_input">
            <FormKit
              v-if="currentLanguage === null"
              type="text"
              v-model="currentFile.file.media.titleAttribute"
            />
            <div v-for="(language, index) in language.languages" :key="language.id">
              <FormKit
                v-if="currentLanguage === language.id"
                type="text"
                v-model="currentFile.file.media.mediaLangs[index].titleAttribute"
              />
            </div>
          </td>

          <td v-if="editId !== file.mediaId" class="px-6 py-4">{{ file.displayOrder }}</td>
          <td v-if="editId === file.mediaId" class="area_input">
            <FormKit type="number" v-model="currentFile.file.media.displayOrder" />
          </td>
          <td class="px-6 py-4">
            <a
              @click="handleSelectToEdit(file.mediaId)"
              v-if="editId !== file.mediaId"
              class="mr-3 font-medium text-blue-600 dark:text-blue-500 hover:underline"
              >Edytuj</a
            >
            <a
              v-if="editId === file.mediaId"
              @click="handleSaveEdit"
              class="mr-3 font-medium text-blue-600 dark:text-blue-500 hover:underline"
              >Zapisz</a
            >
            <a
              href="#"
              v-if="editId !== file.mediaId"
              class="ml-3 font-medium text-red-500 dark:text-blue-500 hover:underline"
              @click="handleSelectFile(file.mediaId)"
              >Usuń</a
            >
            <a
              v-if="editId === file.mediaId"
              class="ml-3 font-medium text-red-500 dark:text-blue-500 hover:underline"
              @click="handleCancelFile"
              >Anuluj</a
            >
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
</style>
