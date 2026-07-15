<script lang="ts" setup>
import { MediaDTO } from '/@/types/product/ProductVariation'
import { FileDTO } from '/@/types/file/File'
import type { ProductDTO } from '/@/types/product/Product'
import { onMounted, ref, watch } from 'vue'
import { useLanguageStore } from '/@/stores/language'
import DropZone from '../../../../../Form/File/DropZone.vue'
import { buildVariantThumbnailSeo, syncMediaLangsFromDefault } from '/@/composables/useProductVariationNaming'

const emits = defineEmits(['close', 'save'])

const props = defineProps({
  thumbnailImage: {
    type: Object as () => MediaDTO | null,
    default: () => null
  },
  parentProduct: {
    type: Object as () => ProductDTO,
    default: () => null
  },
  variantName: {
    type: String,
    default: ''
  },
  embedded: {
    type: Boolean,
    default: false
  }
})

const file = ref<FileDTO | null>(null)
const currentThumbnailImage = ref<FileDTO | null>(null)
const language = useLanguageStore()

const applySeoDefaults = () => {
  if (!props.parentProduct || !currentThumbnailImage.value) {
    return
  }

  const seoDefaults = buildVariantThumbnailSeo(
    props.parentProduct,
    props.variantName || props.parentProduct.name,
    props.parentProduct.thumbnailImage,
    {
      productId: null,
      mediaId: null,
      seoFileName: currentThumbnailImage.value.media.seoFileName,
      altAttribute: currentThumbnailImage.value.media.altAttribute,
      titleAttribute: currentThumbnailImage.value.media.titleAttribute,
      filePath: currentThumbnailImage.value.media.filePath ?? '',
      displayOrder: 0,
      mediaLangs: currentThumbnailImage.value.media.mediaLangs
    }
  )

  if (!currentThumbnailImage.value.media.altAttribute) {
    currentThumbnailImage.value.media.altAttribute = seoDefaults.altAttribute
  }
  if (!currentThumbnailImage.value.media.titleAttribute) {
    currentThumbnailImage.value.media.titleAttribute = seoDefaults.titleAttribute
  }
  if (!currentThumbnailImage.value.media.seoFileName) {
    currentThumbnailImage.value.media.seoFileName = seoDefaults.seoFileName
  }

  currentThumbnailImage.value.media.mediaLangs.forEach((mediaLang, index) => {
    const defaultLang = seoDefaults.mediaLangs[index]
    if (!defaultLang) {
      return
    }

    if (!mediaLang.altAttribute) {
      mediaLang.altAttribute = defaultLang.altAttribute
    }
    if (!mediaLang.titleAttribute) {
      mediaLang.titleAttribute = defaultLang.titleAttribute
    }
    if (!mediaLang.seoFileName) {
      mediaLang.seoFileName = defaultLang.seoFileName
    }
  })
}

const createThumbnailState = () => {
  if (props.thumbnailImage) {
    return {
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
    } as FileDTO
  }

  return {
    blobFolder: 1,
    watermark: true,
    thumbnail: true,
    media: {
      seoFileName: '',
      titleAttribute: '',
      altAttribute: '',
      filePath: '',
      mediaLangs: language.languages.map((lang) => ({
        languageId: lang.id,
        seoFileName: '',
        altAttribute: '',
        titleAttribute: ''
      }))
    }
  } as FileDTO
}

const emitSave = async () => {
  if (!currentThumbnailImage.value) {
    return
  }

  if (file.value?.path) {
    currentThumbnailImage.value.media.filePath = file.value.path

    currentThumbnailImage.value.media.mediaLangs.forEach((mediaLang) => {
      const matchingPath = file.value?.pathLang?.find(
        (pathLang) => pathLang.languageId === mediaLang.languageId
      )
      if (matchingPath) {
        mediaLang.filePath = matchingPath.path
      }
    })
  }

  applySeoDefaults()

  const newFile: MediaDTO = {
    seoFileName: currentThumbnailImage.value.media.seoFileName,
    displayOrder: 0,
    titleAttribute: currentThumbnailImage.value.media.titleAttribute,
    altAttribute: currentThumbnailImage.value.media.altAttribute,
    filePath: currentThumbnailImage.value.media.filePath,
    mediaLangs: currentThumbnailImage.value.media.mediaLangs.map((lang) => ({
      mediaId: currentThumbnailImage.value?.media.mediaId ?? null,
      languageId: lang.languageId,
      filePath: lang.filePath ?? '',
      seoFileName: lang.seoFileName ?? '',
      altAttribute: lang.altAttribute ?? '',
      titleAttribute: lang.titleAttribute ?? ''
    }))
  }

  syncMediaLangsFromDefault(newFile)
  emits('save', newFile)
}

const handleSave = async () => {
  await emitSave()
}

const handleBack = () => {
  emits('close', false)
}

const syncFileModel = () => {
  if (!currentThumbnailImage.value) {
    return
  }

  file.value = {
    media: {
      seoFileName: currentThumbnailImage.value.media.seoFileName,
      altAttribute: currentThumbnailImage.value.media.altAttribute,
      titleAttribute: currentThumbnailImage.value.media.titleAttribute,
      mediaLangs: currentThumbnailImage.value.media.mediaLangs
    },
    blobFolder: 1,
    watermark: false,
    thumbnail: true
  }
}

currentThumbnailImage.value = createThumbnailState()
applySeoDefaults()

onMounted(() => {
  syncFileModel()
})

watch(
  () => props.thumbnailImage,
  () => {
    currentThumbnailImage.value = createThumbnailState()
    applySeoDefaults()
    syncFileModel()
  },
  { deep: true }
)

watch(
  () => props.variantName,
  () => {
    applySeoDefaults()
    if (props.embedded) {
      void emitSave()
    }
  }
)

watch(
  () => file.value?.path,
  (path) => {
    if (path && props.embedded) {
      void emitSave()
    }
  }
)
</script>

<template>
  <ContentContainer v-if="!embedded" :showLanguage="true" :showBack="false">
    <div
      v-if="variantName"
      class="mb-4 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900"
    >
      Alt i tytuł zostaną uzupełnione na podstawie produktu głównego oraz wariantu:
      <strong>{{ variantName }}</strong>
    </div>

    <FormSection :title="'Miniatura wariantu'">
      <DropZone
        ref="dropzone"
        :fileInfo="file"
        :url="currentThumbnailImage?.media?.filePath"
        v-model="file"
      />
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
          />
          <FormKit
            type="text"
            v-model="currentThumbnailImage.media.titleAttribute"
            label="Tytuł atrybutu"
            validation="required"
            validation-visibility="live"
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
            />
            <FormKit
              type="text"
              v-model="currentThumbnailImage.media.mediaLangs[index].altAttribute"
              label="Alt atrybut"
              validation="required"
              validation-visibility="live"
            />
            <FormKit
              type="text"
              v-model="currentThumbnailImage.media.mediaLangs[index].titleAttribute"
              label="Tytuł atrybutu"
              validation="required"
              validation-visibility="live"
            />
          </FormSection>
        </div>
      </div>
      <div class="my-3 flex w-full justify-between">
        <FormKit type="button" @click="handleBack" label="Wróć" />
        <FormKit type="submit" label="Zapisz" />
      </div>
    </FormKit>
  </ContentContainer>

  <div v-else class="variant-thumbnail-embedded w-full">
    <div class="mb-4 text-base font-semibold text-slate-800">Miniatura i SEO zdjęcia</div>
    <div
      v-if="variantName"
      class="mb-5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-base text-orange-900"
    >
      SEO zostanie uzupełnione na podstawie:
      <strong>{{ variantName }}</strong>
    </div>

    <div class="grid w-full gap-6 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
      <DropZone
        ref="dropzoneEmbedded"
        :fileInfo="file"
        :url="currentThumbnailImage?.media?.filePath"
        v-model="file"
        class="w-full min-h-[220px]"
      />

      <div class="min-w-0">
        <div v-if="!language.selectedLanguage" class="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <FormKit
            type="text"
            v-model="currentThumbnailImage!.media.seoFileName"
            label="Nazwa SEO"
            outer-class="variant-field-lg"
            @blur="emitSave"
          />
          <FormKit
            type="text"
            v-model="currentThumbnailImage!.media.altAttribute"
            label="Alt atrybut"
            outer-class="variant-field-lg"
            @blur="emitSave"
          />
          <FormKit
            type="text"
            v-model="currentThumbnailImage!.media.titleAttribute"
            label="Tytuł atrybutu"
            outer-class="variant-field-lg"
            @blur="emitSave"
          />
        </div>

        <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.id">
          <div
            v-if="language.selectedLanguage?.id === formLanguage.id"
            class="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <FormKit
              type="text"
              v-model="currentThumbnailImage!.media.mediaLangs[index].seoFileName"
              label="Nazwa SEO"
              outer-class="variant-field-lg"
              @blur="emitSave"
            />
            <FormKit
              type="text"
              v-model="currentThumbnailImage!.media.mediaLangs[index].altAttribute"
              label="Alt atrybut"
              outer-class="variant-field-lg"
              @blur="emitSave"
            />
            <FormKit
              type="text"
              v-model="currentThumbnailImage!.media.mediaLangs[index].titleAttribute"
              label="Tytuł atrybutu"
              outer-class="variant-field-lg"
              @blur="emitSave"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.variant-thumbnail-embedded :deep(.formkit-outer) {
  width: 100% !important;
  max-width: none !important;
  margin-bottom: 0;
}

.variant-thumbnail-embedded :deep(.formkit-input) {
  font-size: 16px;
  min-height: 48px;
  padding: 12px 16px;
}

.variant-thumbnail-embedded :deep(.formkit-label) {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}
</style>
