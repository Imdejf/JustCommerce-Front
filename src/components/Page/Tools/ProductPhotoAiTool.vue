<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import {
  downloadBase64Image,
  fetchProductPhotoVariants,
  PRODUCT_PHOTO_AI_VARIANT_COUNT,
  readImageFile,
  toImageDataUrl,
  type LoadedImageFile,
  type ProductPhotoAiImage
} from '/@/utils/productPhotoAi'

const toast = useToast()

const loading = ref(false)
const selectedIndex = ref<number | null>(null)
const generatedImages = ref<ProductPhotoAiImage[]>([])

const sourceImage = ref<LoadedImageFile | null>(null)
const logoImage = ref<LoadedImageFile | null>(null)

const form = reactive({
  productName: '',
  userInstruction: 'Dodaj logo sklepu do zdjęcia produktu w estetyczny, profesjonalny sposób.',
  quality: 'high',
  size: '1024x1024',
  outputFormat: 'png'
})

const canGenerate = computed(() => Boolean(sourceImage.value?.base64))

const outputExtension = computed(() => {
  if (form.outputFormat === 'jpeg') return 'jpg'
  return form.outputFormat
})

const handleSourceFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    sourceImage.value = await readImageFile(file)
    generatedImages.value = []
    selectedIndex.value = null
  } catch (error: any) {
    toast.error(error?.message || 'Nie udało się wczytać zdjęcia produktu.')
  } finally {
    input.value = ''
  }
}

const handleLogoFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    logoImage.value = await readImageFile(file)
    generatedImages.value = []
    selectedIndex.value = null
  } catch (error: any) {
    toast.error(error?.message || 'Nie udało się wczytać logo.')
  } finally {
    input.value = ''
  }
}

const clearSourceImage = () => {
  sourceImage.value = null
  generatedImages.value = []
  selectedIndex.value = null
}

const clearLogoImage = () => {
  logoImage.value = null
  generatedImages.value = []
  selectedIndex.value = null
}

const selectVariant = (index: number) => {
  selectedIndex.value = index
}

const handleGenerate = async () => {
  if (!sourceImage.value?.base64) {
    toast.warning('Wgraj zdjęcie produktu.')
    return
  }

  loading.value = true
  generatedImages.value = []
  selectedIndex.value = null

  try {
    const images = await fetchProductPhotoVariants({
      productName: form.productName,
      base64Image: sourceImage.value.base64,
      mimeType: sourceImage.value.mimeType,
      base64LogoImage: logoImage.value?.base64,
      logoMimeType: logoImage.value?.mimeType,
      userInstruction: form.userInstruction,
      quality: form.quality,
      size: form.size,
      outputFormat: form.outputFormat
    })

    generatedImages.value = images.slice(0, PRODUCT_PHOTO_AI_VARIANT_COUNT)
    selectedIndex.value = 0
    toast.success(`Wygenerowano ${generatedImages.value.length} opcje.`)
  } catch (error: any) {
    console.error(error)
    toast.error(error?.message || 'Nie udało się wygenerować zdjęć przez AI.')
  } finally {
    loading.value = false
  }
}

const handleDownloadSelected = () => {
  if (selectedIndex.value === null) return

  const selected = generatedImages.value[selectedIndex.value]
  if (!selected?.base64Image) return

  const baseName = sourceImage.value?.fileName?.replace(/\.[^.]+$/, '') || 'produkt-ai'
  const fileName = `${baseName}-opcja-${selectedIndex.value + 1}.${outputExtension.value}`

  downloadBase64Image(selected.base64Image, selected.mimeType, fileName)
  toast.success('Pobrano zdjęcie na komputer.')
}

const handleDownloadAll = () => {
  generatedImages.value.forEach((image, index) => {
    const baseName = sourceImage.value?.fileName?.replace(/\.[^.]+$/, '') || 'produkt-ai'
    const fileName = `${baseName}-opcja-${index + 1}.${outputExtension.value}`
    downloadBase64Image(image.base64Image, image.mimeType, fileName)
  })

  toast.success(`Pobrano ${generatedImages.value.length} plików.`)
}
</script>

<template>
  <div class="p-3">
    <div class="bg-[#f1f4f9] p-3 border-t-[3px] border-[#64748b] rounded-t-xl mb-4">
      <h1 class="text-lg font-bold text-[#111827]">Narzędzie AI — zdjęcia produktowe</h1>
      <p class="text-sm text-[#64748b] mt-1">
        Wgraj zdjęcie produktu i opcjonalnie logo sklepu. System najpierw nałoży logo lokalnie,
        a następnie AI dopracuje 3 warianty. Pobierz plik i sam dodaj go do produktu.
      </p>
    </div>

    <div class="bg-white border border-[#d6dfe9] rounded-lg p-4 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="border border-[#d6dfe9] rounded-lg p-4 space-y-3">
          <div class="text-sm font-semibold text-[#111827]">Zdjęcie produktu</div>

          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="handleSourceFile" />

          <div
            v-if="sourceImage"
            class="bg-[#f8fafc] border border-[#e2e8f0] rounded-md min-h-[220px] flex items-center justify-center p-2"
          >
            <img
              :src="sourceImage.previewUrl"
              alt="Zdjęcie produktu"
              class="max-h-[280px] max-w-full object-contain"
            />
          </div>

          <el-button v-if="sourceImage" size="small" @click="clearSourceImage">
            Usuń zdjęcie
          </el-button>
        </div>

        <div class="border border-[#d6dfe9] rounded-lg p-4 space-y-3">
          <div class="text-sm font-semibold text-[#111827]">Logo sklepu (opcjonalnie)</div>
          <p class="text-xs text-[#64748b]">
            PNG, JPEG lub WebP. Najlepiej PNG z przezroczystym tłem. SVG nie jest obsługiwane.
          </p>

          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="handleLogoFile" />

          <div
            v-if="logoImage"
            class="bg-[#f8fafc] border border-[#e2e8f0] rounded-md min-h-[220px] flex items-center justify-center p-2"
          >
            <img
              :src="logoImage.previewUrl"
              alt="Logo sklepu"
              class="max-h-[180px] max-w-full object-contain"
            />
          </div>

          <el-button v-if="logoImage" size="small" @click="clearLogoImage">
            Usuń logo
          </el-button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormKit
          type="text"
          v-model="form.productName"
          label="Nazwa produktu (opcjonalnie)"
          placeholder="Np. Donica ceramiczna 30 cm"
        />

        <div class="grid grid-cols-3 gap-2">
          <FormKit
            type="select"
            v-model="form.quality"
            label="Jakość"
            :options="[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' }
            ]"
          />
          <FormKit
            type="select"
            v-model="form.size"
            label="Rozmiar"
            :options="[
              { label: '1024x1024', value: '1024x1024' },
              { label: '1536x1024', value: '1536x1024' },
              { label: '1024x1536', value: '1024x1536' }
            ]"
          />
          <FormKit
            type="select"
            v-model="form.outputFormat"
            label="Format"
            :options="[
              { label: 'PNG', value: 'png' },
              { label: 'JPEG', value: 'jpeg' },
              { label: 'WEBP', value: 'webp' }
            ]"
          />
        </div>
      </div>

      <FormKit
        type="textarea"
        v-model="form.userInstruction"
        label="Instrukcja dla AI"
        rows="4"
        placeholder="Np. dodaj logo w prawym dolnym rogu, zachowaj naturalny wygląd zdjęcia"
      />

      <el-button
        type="primary"
        :loading="loading"
        :disabled="!canGenerate"
        @click="handleGenerate"
      >
        Wygeneruj {{ PRODUCT_PHOTO_AI_VARIANT_COUNT }} opcje
      </el-button>

      <div v-if="generatedImages.length" class="space-y-3">
        <div class="text-sm font-semibold text-[#111827]">
          Wybierz wariant i pobierz na komputer
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            v-for="(image, index) in generatedImages"
            :key="index"
            type="button"
            class="border rounded-lg p-2 text-left transition"
            :class="selectedIndex === index
              ? 'border-[#4f6bed] ring-2 ring-[#4f6bed]/30 bg-[#f8faff]'
              : 'border-[#d6dfe9] hover:border-[#94a3b8]'"
            @click="selectVariant(index)"
          >
            <div class="text-xs font-semibold text-[#64748b] mb-2">
              Opcja {{ index + 1 }}
            </div>
            <img
              :src="toImageDataUrl(image.base64Image, image.mimeType)"
              :alt="`Wariant AI ${index + 1}`"
              class="w-full h-[180px] object-contain bg-[#f8fafc] rounded"
            />
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          <el-button
            type="success"
            :disabled="selectedIndex === null"
            @click="handleDownloadSelected"
          >
            Pobierz wybraną opcję
          </el-button>
          <el-button @click="handleDownloadAll">
            Pobierz wszystkie opcje
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>
