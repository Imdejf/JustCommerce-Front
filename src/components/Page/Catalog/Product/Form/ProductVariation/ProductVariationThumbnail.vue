<script lang="ts" setup>
import { MediaDTO } from '/@/types/product/ProductVariation'
import { FileDTO } from '/@/types/file/File'
import { ref, watch } from 'vue'
import { useLanguageStore } from '/@/stores/language'
import DropZone from '../../../../../Form/File/DropZone.vue'

const emits = defineEmits(['close', 'save'])

const props = defineProps({
  thumbnailImage: {
    type: Object as () => Object,
    default: () => null
  }
})

const uploadedFile = ref(null)
const file = ref<FileDTO | null>(null)
const currentThumbnailImage = ref<FileDTO | null>(null)
const language = useLanguageStore()

const handleSave = async (values) => {
  if (file.value) {
    currentThumbnailImage.value.media.filePath = file.value?.path
    currentThumbnailImage.value.media.mediaLangs.forEach((mediaLang) => {
      const matchingPath = file.value?.pathLang.find(
        (pathLang) => pathLang.languageId === mediaLang.languageId
      )
      if (matchingPath) {
        mediaLang.filePath = matchingPath.path
      }
    })
  }

  const newFile: MediaDTO = {
    seoFileName: currentThumbnailImage.value.media.seoFileName,
    displayOrder: 0,
    titleAttribute: currentThumbnailImage.value.media.titleAttribute,
    altAttribute: currentThumbnailImage.value.media.altAttribute,
    filePath: currentThumbnailImage.value.media.filePath,
    productMediaLangs: currentThumbnailImage.value.media.mediaLangs.map((lang) => {
      return {
        mediaId: currentThumbnailImage.value.media.mediaId,
        languageId: lang.languageId,
        filePath: lang.filePath ?? '',
        seoFileName: lang.seoFileName ?? '',
        altAttribute: lang.altAttribute ?? '',
        titleAttribute: lang.titleAttribute ?? ''
      }
    })
  }

  emits('save', newFile)
}

const handleBack = () => {
  emits('close', false)
}

if (props.thumbnailImage !== null) {
  const newThumbnailImage: FileDTO = {
    blobFolder: 1,
    watermark: true,
    thumbnail: true,
    media: {
      seoFileName: props.thumbnailImage.seoFileName,
      titleAttribute: props.thumbnailImage.titleAttribute,
      altAttribute: props.thumbnailImage.altAttribute,
      filePath: props.thumbnailImage.filePath,
      mediaLangs: props.thumbnailImage.mediaLangs.map((lang) => ({
        mediaId: lang.mediaId,
        languageId: lang.languageId,
        filePath: lang.filePath,
        seoFileName: lang.seoFileName,
        altAttribute: lang.altAttribute,
        titleAttribute: lang.titleAttribute
      }))
    }
  }
  currentThumbnailImage.value = newThumbnailImage
} else {
  const newThumbnailImage: FileDTO = {
    blobFolder: 1,
    watermark: true,
    thumbnail: true,
    media: {
      seoFileName: '',
      titleAttribute: '',
      altAttribute: '',
      mediaLangs: language.languages.map((lang) => ({
        languageId: lang.id,
        seoFileName: '',
        altAttribute: '',
        titleAttribute: ''
      }))
    }
  }

  currentThumbnailImage.value = newThumbnailImage
}

watch(
  currentThumbnailImage.value,
  (newThumbnailImage, oldThumbnailImage) => {
    file.value = {
      media: {
        seoFileName: newThumbnailImage.media.seoFileName,
        altAttribute: newThumbnailImage.media.altAttribute,
        titleAttribute: newThumbnailImage.media.titleAttribute,
        mediaLangs: newThumbnailImage.media.mediaLangs
      },
      blobFolder: 1,
      watermark: true,
      thumbnail: true
    }
  },
  { deep: true }
)
</script>

<template>
  <ContentContainer :showLanguage="true" :showBack="false">
    <FormSection :title="'Zdjęcie kategorii'">
      <DropZone
        ref="dropzone"
        :fileInfo="file"
        :url="currentThumbnailImage?.media?.filePath"
        v-model="file"
      ></DropZone>
    </FormSection>
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <div v-if="!language.selectedLanguage">
        <FormSection :title="'Zdjęcie SEO'">
          <FormKit
            type="text"
            v-model="currentThumbnailImage.media.seoFileName"
            label="Nazwa SEO"
            validation="required"
            validation-visibility="live"
            help="Nazwa pod jaką plik ma zostać zapisany"
          />
          <FormKit
            type="text"
            v-model="currentThumbnailImage.media.altAttribute"
            label="Alt atrybut"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentThumbnailImage.media.titleAttribute"
            label="Tytuł atrybutu"
            validation="required"
            validation-visibility="live"
            help=""
          />
        </FormSection>
      </div>
      <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.id">
        <div v-if="language.selectedLanguage?.id === formLanguage.id">
          <FormSection :title="'Zdjęcie SEO'">
            <FormKit
              type="text"
              v-model="currentThumbnailImage.media.mediaLangs[index].seoFileName"
              label="Nazwa SEO"
              validation="required"
              validation-visibility="live"
              help="Nazwa pod jaką plik ma zostać zapisany"
            />
            <FormKit
              type="text"
              v-model="currentThumbnailImage.media.mediaLangs[index].altAttribute"
              label="Alt atrybut"
              validation="required"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentThumbnailImage.media.mediaLangs[index].titleAttribute"
              label="Tytuł atrybutu"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
        </div>
      </div>
      <div class="flex justify-between w-full my-3">
        <FormKit
          type="button"
          @click="handleBack"
          label="Wróć"
          :sections-schema="{
            input: {
              $el: 'div',
              attrs: {
                style: { background: 'red' }
              }
            }
          }"
        />

        <FormKit type="submit" label="Zapisz" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
