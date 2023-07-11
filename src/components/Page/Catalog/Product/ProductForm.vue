<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { ProductDTO } from '/@/types/product/Product'
import type { EditMediaDTO } from '/@/types/file/File'
import { useLanguageStore } from '/@/stores/language'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: null
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const toast = useToast()
const language = useLanguageStore()
const currentFile = ref<EditMediaDTO | null>(null)
const files = ref(props.product.medias)

const handleRemoveFile = async (id: string) => {
  try {
    files.value = files.value.filter((file) => file.id !== id)
    toast.success('Usunięto zdjęcie', {
      timeout: 2000
    })
  } catch (error) {
    toast.error('Błąd serwerowy', {
      timeout: 2000
    })
  }
}

const handleAddFile = (file: Object) => {
  files.value.push(file.media)
}

const handleEditFile = (file: Object) => {
  console.log(file)
  const index = files.value?.findIndex((c) => c.id === file.id)
  currentFile.value = {
    displayOrder: file.displayOrder,
    id: file.id,
    filePath: file?.filePath || '',
    seoFileName: file?.seoFileName || '',
    altAttribute: file?.altAttribute || '',
    titleAttribute: file?.titleAttribute || '',
    mediaLangs: language.languages.map((lang) => {
      const selectedMediaLang = file?.mediaLangs.find(
        (mediaLang) => mediaLang.languageId === lang.id
      )
      return {
        languageId: lang.id,
        seoFileName: selectedMediaLang?.seoFileName || '',
        altAttribute: selectedMediaLang?.altAttribute || '',
        titleAttribute: selectedMediaLang?.titleAttribute || ''
      }
    })
  }
  files.value.splice(0, 1, currentFile.value)
}
</script>

<template>
  <ContentContainer :showLanguage="true">
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <MediaArea
        :filesValue="files"
        :editFile="currentFile"
        @handleAdd="handleAddFile"
        @handleEdit="handleEditFile"
        @handleRemove="handleRemoveFile"
        :folder="1"
        :watermark="true"
      />
    </FormKit>
  </ContentContainer>
</template>
