<script lang="ts">
import { defineProps, defineComponent, ref } from 'vue'
import { DropZone } from 'dropzone-vue'
import type { FileDTO } from '../../../types/file/File.ts'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'

export default defineComponent({
  props: {
    fileInfo: {
      type: Object as () => FileDTO,
      default: null
    },
    url: {
      type: String,
      default: ''
    }
  },
  components: {
    DropZone
  },
  name: 'App',
  setup(props, { emit }) {
    const toast = useToast()
    const cookies = new Cookies()
    const dropzone = ref(null)
    const base64String = ref('')

    const sendFileToServer = async () => {
      if (!base64String.value) {
        toast.error('Dodaj plik', {
          timeout: 2000
        })
        return
      }
      if (props.fileInfo === null) {
        toast.error('Błędna nazwa pliku', {
          timeout: 2000
        })
        return
      }

      if (!props.fileInfo || !props.fileInfo.Media.SeoFileName) {
        toast.error('Błędna nazwa pliku', {
          timeout: 2000
        })
        return
      }

      const mediaLangs = props.fileInfo.Media.MediaLangs
      for (const mediaLang of mediaLangs) {
        if (!mediaLang.seoFileName) {
          toast.error('Błędna nazwa pliku', {
            timeout: 2000
          })
          return
        }
      }

      const fileToSave = props.fileInfo

      fileToSave.StoreId = cookies.get('dsStore')
      fileToSave.Base64File = {
        base64String: base64String.value
      }
      const defaultString = import.meta.env.VITE_API_URL

      const response = await fetch(defaultString + 'administration/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileToSave)
      })
      const data = await response.json()

      toast.success('Dodano zdjęcie', {
        timeout: 2000
      })

      emit('update:modelValue', data.data)
    }

    const onFileAdd = (file) => {
      fileToBase64(file.file)
        .then((base64Data) => {
          base64String.value = base64Data
        })
        .catch((error) => {
          console.error('Błąd przetwarzania pliku:', error)
        })
    }

    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64Data = reader.result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = (error) => {
          reject(error)
        }
        reader.readAsDataURL(file)
      })
    }
    return { dropzone, base64String, onFileAdd, fileToBase64, sendFileToServer }
  }
})
</script>

<template>
  <div class="w-[250px] h-[250px]">
    <DropZone
      ref="dropzone"
      @addedFile="onFileAdd"
      class="h-full"
      :maxFiles="Number(1)"
      :uploadOnDrop="false"
      :multipleUpload="false"
      :parallelUpload="3"
      :maxFileSize="600000000"
      :acceptedFiles="['image', 'webp', 'png', 'jpg']"
    >
      <template #message>
        <span v-if="!url">Upuść plik</span>
        <img class="h-full mx-auto" :src="url" />
      </template>
    </DropZone>
    <div class="flex justify-center mt-2">
      <el-button @click="sendFileToServer" type="primary" round>Zapisz obraz</el-button>
    </div>
  </div>
</template>

<style>
.dropzone__item-thumbnail {
  height: 100%;
  width: 100%;
}

.dropzone__item-thumbnail img {
  height: 100% !important;
}

.dropzone__progress {
  display: none;
}

.dropzone__message {
  background: white;
}

.dropzone {
  padding: 0;
  height: 80%;
  border: 1px solid gray;
}

.dropzone__item {
  margin: 0;
  display: contents;
}
</style>

<!-- https://github.com/darknessnerd/drop-zone -->
