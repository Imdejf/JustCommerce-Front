<script lang="ts">
import { defineProps, defineComponent, ref, watch, computed } from 'vue'
import { DropZone } from 'dropzone-vue'
import type { FileDTO } from '/@/types/file/File'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'

export default defineComponent({
  name: 'App',
  components: { DropZone },
  props: {
    fileInfo: { type: Object as () => FileDTO, default: null },
    url: { type: String, default: '' },
    showSaveButton: { type: Boolean, default: true },
    externalBase64: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'changeFile', 'base64Changed'],
  setup(props, { emit, expose }) {
    const toast = useToast()
    const cookies = new Cookies()
    const dropzone = ref(null)
    const base64String = ref('')

    const previewUrl = computed(() => {
      if (base64String.value) {
        return `data:image/png;base64,${base64String.value}`
      }

      return props.url || ''
    })

    watch(
      () => props.externalBase64,
      (val) => {
        if (val && val.trim()) {
          base64String.value = val
          emit('changeFile', true)
          emit('base64Changed', val)
        }
      },
      { immediate: true }
    )

    const sendFileToServer = async () => {
      if (!base64String.value) {
        toast.error('Dodaj plik', { timeout: 2000 })
        return
      }

      if (!props.fileInfo || !props.fileInfo.media?.seoFileName) {
        toast.error('Błędna nazwa pliku', { timeout: 2000 })
        return
      }

      for (const mediaLang of props.fileInfo.media.mediaLangs || []) {
        if (!mediaLang.seoFileName) {
          toast.error('Błędna nazwa pliku', { timeout: 2000 })
          return
        }
      }

      const fileToSave: any = { ...props.fileInfo }
      fileToSave.storeId = cookies.get('dsStore')
      fileToSave.base64File = { base64String: base64String.value }

      const defaultString = import.meta.env.VITE_API_URL

      try {
        const response = await fetch(defaultString + 'administration/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fileToSave)
        })

        const data = await response.json()
        emit('update:modelValue', data.data)
        toast.success('Dodano zdjęcie', { timeout: 2000 })
      } catch (error) {
        toast.error('Błąd dodawania zdjęcia', { timeout: 2000 })
        console.log(error)
      }
    }

    const onFileAdd = (file: any) => {
      fileToBase64(file.file)
        .then((b64) => {
          base64String.value = b64
          emit('changeFile', true)
          emit('base64Changed', b64)
        })
        .catch((err) => {
          console.error('Błąd przetwarzania pliku:', err)
          toast.error('Błąd przetwarzania pliku', { timeout: 2000 })
        })
    }

    const fileToBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = String(reader.result || '')
          const base64 = result.includes(',') ? result.split(',')[1] : result
          resolve(base64)
        }
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
      })

    expose({
      sendFileToServer
    })

    return {
      dropzone,
      base64String,
      previewUrl,
      onFileAdd,
      fileToBase64,
      sendFileToServer
    }
  }
})
</script>

<template>
  <div class="w-[250px] h-[250px] dropzone__picture">
    <DropZone
      ref="dropzone"
      @addedFile="onFileAdd"
      class="h-full"
      :maxFiles="1"
      :uploadOnDrop="false"
      :multipleUpload="false"
      :parallelUpload="3"
      :maxFileSize="600000000"
    >
      <template #message>
        <div v-if="!previewUrl" class="">Upuść plik</div>
        <img
          v-else
          class="absolute w-full h-full mx-auto object-contain"
          :src="previewUrl"
        />
      </template>
    </DropZone>

    <div v-if="showSaveButton" class="flex justify-center mt-2">
      <el-button @click="sendFileToServer" type="primary" round>
        Zapisz obraz
      </el-button>
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