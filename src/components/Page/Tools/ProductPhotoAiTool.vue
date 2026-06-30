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
const processingLabel = ref('')

const sourceImages = ref<LoadedImageFile[]>([])
const logoImage = ref<LoadedImageFile | null>(null)
const referenceImage = ref<LoadedImageFile | null>(null)
const generatedGroups = ref<Array<{
  source: LoadedImageFile
  images: ProductPhotoAiImage[]
  selectedIndex: number
  error?: string
}>>([])

const form = reactive({
  productName: '',
  userInstruction: 'Zrób profesjonalne zdjęcie produktowe ecommerce na czystym białym tle. Zachowaj wszystkie detale, proporcje i konstrukcję produktu z oryginalnego zdjęcia.',
  color: '',
  quality: 'high',
  outputFormat: 'png'
})

const promptTemplates = [
  {
    label: 'Zmień kolor produktu na [COLOR]',
    value: 'Zmień kolor produktu na [COLOR]. Zachowaj biały kolor tła, kształt, proporcje, fakturę i wszystkie detale produktu.'
  },
  {
    label: 'Delikatne lustrzane odbicie w podłodze',
    value: 'Zrób zdjęcie produktowe na czystym białym tle z delikatnym lustrzanym odbiciem w podłodze. Odbicie ma być subtelne i realistyczne, a wszystkie detale produktu muszą zostać zachowane.'
  },
  {
    label: 'Dodaj logo sklepu na produkcie',
    value: 'Dodaj logo sklepu na produkcie w estetyczny, profesjonalny sposób. Logo ma być czytelne, proporcjonalne i nie może zasłaniać ważnych detali produktu. Tło musi zostać białe.'
  },
  {
    label: 'Zrób jak zdjęcie referencyjne',
    value: 'Zrób z tego produktu zdjęcie w stylu zdjęcia referencyjnego: podobne światło, kompozycja i sposób prezentacji, ale zachowaj białe tło. Zachowaj produkt z pierwszego zdjęcia i wszystkie jego detale.'
  },
  {
    label: 'Nowoczesny packshot premium',
    value: 'Przygotuj nowoczesny packshot premium na czystym białym tle, z naturalnym cieniem, wysoką ostrością i realistycznym wyglądem ecommerce. Nie zmieniaj żadnych detali produktu.'
  }
]

const canGenerate = computed(() => sourceImages.value.length > 0)

const outputExtension = computed(() => {
  if (form.outputFormat === 'jpeg') return 'jpg'
  return form.outputFormat
})

const applyPromptTemplate = (template: string) => {
  form.userInstruction = template.replace('[COLOR]', form.color || '[COLOR]')
}

const handleSourceFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? []).slice(0, 5)
  if (!files.length) return

  try {
    const loaded = await Promise.all(files.map(readImageFile))
    sourceImages.value = [...sourceImages.value, ...loaded].slice(0, 5)
    generatedGroups.value = []
  } catch (error: any) {
    toast.error(error?.message || 'Nie udało się wczytać jednego ze zdjęć produktu.')
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
    generatedGroups.value = []
  } catch (error: any) {
    toast.error(error?.message || 'Nie udało się wczytać logo.')
  } finally {
    input.value = ''
  }
}

const handleReferenceFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    referenceImage.value = await readImageFile(file)
    generatedGroups.value = []
  } catch (error: any) {
    toast.error(error?.message || 'Nie udało się wczytać zdjęcia referencyjnego.')
  } finally {
    input.value = ''
  }
}

const removeSourceImage = (index: number) => {
  sourceImages.value = sourceImages.value.filter((_, i) => i !== index)
  generatedGroups.value = []
}

const clearSourceImages = () => {
  sourceImages.value = []
  generatedGroups.value = []
}

const clearLogoImage = () => {
  logoImage.value = null
  generatedGroups.value = []
}

const clearReferenceImage = () => {
  referenceImage.value = null
  generatedGroups.value = []
}

const selectVariant = (groupIndex: number, imageIndex: number) => {
  const group = generatedGroups.value[groupIndex]
  if (!group) return
  group.selectedIndex = imageIndex
}

const handleGenerate = async () => {
  if (!sourceImages.value.length) {
    toast.warning('Wgraj co najmniej jedno zdjęcie produktu.')
    return
  }

  loading.value = true
  generatedGroups.value = []

  try {
    const groups: typeof generatedGroups.value = []

    for (const [index, source] of sourceImages.value.entries()) {
      processingLabel.value = `${index + 1}/${sourceImages.value.length}: ${source.fileName}`

      try {
        const images = await fetchProductPhotoVariants({
          productName: form.productName,
          base64Image: source.base64,
          mimeType: source.mimeType,
          base64LogoImage: logoImage.value?.base64,
          logoMimeType: logoImage.value?.mimeType,
          base64ReferenceImage: referenceImage.value?.base64,
          referenceMimeType: referenceImage.value?.mimeType,
          userInstruction: form.userInstruction,
          quality: form.quality,
          outputFormat: form.outputFormat
        })

        groups.push({
          source,
          images: images.slice(0, PRODUCT_PHOTO_AI_VARIANT_COUNT),
          selectedIndex: 0
        })
      } catch (error: any) {
        console.error(error)
        groups.push({
          source,
          images: [],
          selectedIndex: 0,
          error: error?.message || 'Nie udało się wygenerować wariantów.'
        })
      }

      generatedGroups.value = [...groups]
    }

    const generatedCount = groups.reduce((sum, group) => sum + group.images.length, 0)
    toast.success(`Wygenerowano ${generatedCount} zdjęć dla ${groups.length} plików.`)
  } catch (error: any) {
    console.error(error)
    toast.error(error?.message || 'Nie udało się wygenerować zdjęć przez AI.')
  } finally {
    loading.value = false
    processingLabel.value = ''
  }
}

const buildFileName = (source: LoadedImageFile, index: number) => {
  const baseName = source.fileName?.replace(/\.[^.]+$/, '') || 'produkt-ai'
  return `${baseName}-ai-opcja-${index + 1}.${outputExtension.value}`
}

const handleDownloadSelected = (groupIndex: number) => {
  const group = generatedGroups.value[groupIndex]
  if (!group) return

  const selected = group.images[group.selectedIndex]
  if (!selected?.base64Image) return

  downloadBase64Image(selected.base64Image, selected.mimeType, buildFileName(group.source, group.selectedIndex))
  toast.success('Pobrano zdjęcie na komputer.')
}

const handleDownloadAll = () => {
  let count = 0
  generatedGroups.value.forEach((group) => {
    group.images.forEach((image, index) => {
      downloadBase64Image(image.base64Image, image.mimeType, buildFileName(group.source, index))
      count++
    })
  })

  toast.success(`Pobrano ${count} plików.`)
}
</script>

<template>
  <div class="p-3">
    <div class="bg-[#f1f4f9] p-3 border-t-[3px] border-[#64748b] rounded-t-xl mb-4">
      <h1 class="text-lg font-bold text-[#111827]">Narzędzie AI — zdjęcia produktowe</h1>
      <p class="text-sm text-[#64748b] mt-1">
        Wgraj paczkę do 5 zdjęć produktu. AI wygeneruje 3 warianty dla każdego zdjęcia,
        z opcjonalnym logo sklepu i zdjęciem referencyjnym stylu.
      </p>
    </div>

    <div class="bg-white border border-[#d6dfe9] rounded-lg p-4 space-y-6">
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="border border-[#d6dfe9] rounded-lg p-4 space-y-3">
          <div class="text-sm font-semibold text-[#111827]">Zdjęcia produktów</div>
          <p class="text-xs text-[#64748b]">Możesz wgrać maksymalnie 5 zdjęć naraz.</p>

          <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" @change="handleSourceFiles" />

          <div
            v-if="sourceImages.length"
            class="grid grid-cols-2 gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-md min-h-[220px] p-2"
          >
            <div
              v-for="(image, index) in sourceImages"
              :key="image.fileName + index"
              class="relative bg-white border border-[#e2e8f0] rounded p-2"
            >
              <img :src="image.previewUrl" alt="Zdjęcie produktu" class="h-[120px] w-full object-contain" />
              <button
                type="button"
                class="absolute top-1 right-1 rounded bg-white/90 px-2 text-xs text-red-600 border"
                @click="removeSourceImage(index)"
              >
                x
              </button>
              <div class="text-[11px] text-[#64748b] truncate mt-1">{{ image.fileName }}</div>
            </div>
          </div>

          <el-button v-if="sourceImages.length" size="small" @click="clearSourceImages">
            Usuń wszystkie zdjęcia
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

        <div class="border border-[#d6dfe9] rounded-lg p-4 space-y-3">
          <div class="text-sm font-semibold text-[#111827]">Zdjęcie referencyjne stylu (opcjonalnie)</div>
          <p class="text-xs text-[#64748b]">
            Użyj, gdy chcesz: “zrób z danego produktu coś jak na drugim zdjęciu”.
          </p>

          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="handleReferenceFile" />

          <div
            v-if="referenceImage"
            class="bg-[#f8fafc] border border-[#e2e8f0] rounded-md min-h-[220px] flex items-center justify-center p-2"
          >
            <img
              :src="referenceImage.previewUrl"
              alt="Zdjęcie referencyjne"
              class="max-h-[180px] max-w-full object-contain"
            />
          </div>

          <el-button v-if="referenceImage" size="small" @click="clearReferenceImage">
            Usuń referencję
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

        <div class="grid grid-cols-2 gap-2">
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

      <div class="border border-[#d6dfe9] rounded-lg p-3">
        <div class="text-sm font-semibold text-[#111827] mb-2">Gotowe prompty</div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          <button
            v-for="prompt in promptTemplates"
            :key="prompt.label"
            type="button"
            class="text-left rounded border border-[#d6dfe9] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#334155] hover:border-[#16a34a] hover:bg-[#f0fdf4]"
            @click="applyPromptTemplate(prompt.value)"
          >
            {{ prompt.label }}
          </button>
        </div>
        <FormKit
          type="text"
          v-model="form.color"
          label="Kolor do promptu [COLOR]"
          placeholder="Np. czarny mat, zielony RAL 6005, czerwony"
          outer-class="mt-3"
        />
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
        Wygeneruj {{ PRODUCT_PHOTO_AI_VARIANT_COUNT }} opcje dla każdego zdjęcia
      </el-button>
      <div v-if="loading && processingLabel" class="text-sm text-[#64748b]">
        Przetwarzam: {{ processingLabel }}
      </div>

      <div v-if="generatedGroups.length" class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-[#111827]">
            Wybierz najlepszy wariant dla każdego zdjęcia
          </div>
          <el-button @click="handleDownloadAll">
            Pobierz wszystkie wygenerowane zdjęcia
          </el-button>
        </div>

        <div
          v-for="(group, groupIndex) in generatedGroups"
          :key="group.source.fileName + groupIndex"
          class="border border-[#d6dfe9] rounded-xl p-3 space-y-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-sm font-bold text-[#111827]">{{ group.source.fileName }}</div>
              <div class="text-xs text-[#64748b]">3 warianty AI dla tego zdjęcia</div>
            </div>
            <el-button
              type="success"
              :disabled="!group.images.length"
              @click="handleDownloadSelected(groupIndex)"
            >
              Pobierz wybrany wariant
            </el-button>
          </div>

          <div v-if="group.error" class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {{ group.error }}
          </div>

          <div
            v-if="group.images.length"
            class="grid grid-cols-1 lg:grid-cols-2 gap-3 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-3"
          >
            <div>
              <div class="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748b]">
                Oryginał do porównania detali
              </div>
              <div class="flex min-h-[260px] items-center justify-center rounded bg-white p-2">
                <img
                  :src="group.source.previewUrl"
                  alt="Oryginalne zdjęcie produktu"
                  class="max-h-[320px] max-w-full object-contain"
                />
              </div>
            </div>
            <div>
              <div class="mb-2 text-xs font-bold uppercase tracking-wide text-[#16a34a]">
                Wybrany wariant AI
              </div>
              <div class="flex min-h-[260px] items-center justify-center rounded bg-white p-2">
                <img
                  :src="toImageDataUrl(group.images[group.selectedIndex]?.base64Image, group.images[group.selectedIndex]?.mimeType)"
                  alt="Wybrany wariant AI"
                  class="max-h-[320px] max-w-full object-contain"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              v-for="(image, index) in group.images"
              :key="index"
              type="button"
              class="border rounded-lg p-2 text-left transition"
              :class="group.selectedIndex === index
                ? 'border-[#16a34a] ring-2 ring-[#16a34a]/30 bg-[#f0fdf4]'
                : 'border-[#d6dfe9] hover:border-[#94a3b8]'"
              @click="selectVariant(groupIndex, index)"
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
        </div>
      </div>
    </div>
  </div>
</template>
