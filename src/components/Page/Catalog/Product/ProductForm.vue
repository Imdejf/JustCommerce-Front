<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { ProductDTO, ProductAvailability } from '/@/types/product/Product'
import type { MediaFileDTO, FileDTO } from '/@/types/file/File'
import { useLanguageStore } from '/@/stores/language'
import { useStoreStore } from '/@/stores/store'
import DropZone from '/@/components/Form/File/DropZone'
import { Api } from '/@/services/api'
import jwt_decode from 'jwt-decode'
import Cookies from 'universal-cookie'
import { useRoute, useRouter } from 'vue-router'
import diacritics from 'diacritics'

const props = defineProps({
  product: { type: Object as () => ProductDTO, default: null },
  updated: { type: Boolean, default: false }
})

const cookies = new Cookies()
const store = useStoreStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const language = useLanguageStore()

const fileThumbnail = ref<FileDTO | null>(null)
const uploadedFileThumbnail = ref<any>(null)
const currentProduct = reactive(props.product)
const currentFile = ref<any>(null)
const files = ref(props.product.medias)
const brands = ref<{ id: number; name: string }[]>([])
const rules = ref<{ id: number; name: string }[]>([])
const test = ref<any>(null)
const productAvailableList = ref<{ id: any; name: string }[]>([])

// --- Panel AI ---
const aiCollapse = ref<string[]>(['ai'])
const ai = reactive({
  exampleDescription: '',
  specification: '',
  additionalInformation: '',
  isLoading: false
})
const canCallAI = () =>
  Boolean(currentProduct?.name && String(currentProduct.name).trim().length > 0)

async function callAI() {
  if (!canCallAI()) {
    toast.error('Podaj nazwę produktu, zanim wywołasz AI.', { timeout: 2000 })
    return
  }

  try {
    ai.isLoading = true

    const body = {
      productBriefDTO: {
        productName: currentProduct.name,
        exampleDescription: ai.exampleDescription || '',
        specification: ai.specification || '',
        additionalInformation: ai.additionalInformation || ''
      }
    }

    const res = await Api.chatGpt.generateProductData({ body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Błąd odpowiedzi serwera')

    const json = await res.json()
    // ApiResponse.Success(200, result) => { data: {...} }
    const d = (json?.data ?? json) as any

    // Pobierz wartości — najpierw camelCase, jeśli brak to PascalCase
    const alt =
      d?.altAttribute ??
      d?.AltAttribute ??
      ''
    const title =
      d?.titleAttribute ??
      d?.TitleAttribute ??
      ''
    const metaTitle =
      d?.metaTitle ??
      d?.MetaTitle ??
      ''
    const metaDesc =
      d?.metaDescription ??
      d?.MetaDescription ??
      ''
    const descriptionHtml =
      d?.description ??
      d?.Description ??
      ''

    // MAPOWANIE -> thumbnail + meta + opis
    if (alt) currentProduct.thumbnailImage.altAttribute = alt
    if (title) currentProduct.thumbnailImage.titleAttribute = title
    if (metaTitle) currentProduct.metaTitle = metaTitle
    if (metaDesc) currentProduct.metaDescription = metaDesc
    if (descriptionHtml) currentProduct.description = descriptionHtml

    // Twoje watchery rozpropagują wartości do języków tam, gdzie puste/niezmienione

    toast.success('AI: dane produktu zaktualizowane.', { timeout: 2000 })
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się wygenerować danych przez AI.', { timeout: 2500 })
  } finally {
    ai.isLoading = false
  }
}


// --- reszta jak u Ciebie ---
const translationsProductAvailable = {
  [ProductAvailability.Available]: 'Dostępny',
  [ProductAvailability.TwentyFourToFourtyEight]: 'Od 24 do 48h',
  [ProductAvailability.UpToFiveBusinessDays]: 'Do 5 dni roboczych',
  [ProductAvailability.ThreeToSevenDays]: 'Od 3 do 7 dni',
  [ProductAvailability.ThreeToTenDays]: 'Od 3 do 10 dni',
  [ProductAvailability.TwoWeeks]: 'Do 2 tygodni',
  [ProductAvailability.ThreeWeeks]: 'Do 3 tygodni',
  [ProductAvailability.ThreeToFiveWeeks]: 'Od 3 do 5 tygodni',
  [ProductAvailability.TemporarilyUnavailable]: 'Tymczasowo niedostępne',
  [ProductAvailability.ToOrder]: 'Na zamówienie',
  [ProductAvailability.SellerConfirmation]: 'Potwierdzenie sprzedawcy'
}
for (const id in translationsProductAvailable) {
  productAvailableList.value.push({ id, name: translationsProductAvailable[id] })
}

const handleRemoveFile = async (id: string) => {
  try {
    files.value = files.value.filter((file) => file.id !== id)
    toast.success('Usunięto zdjęcie', { timeout: 2000 })
  } catch {
    toast.error('Błąd serwerowy', { timeout: 2000 })
  }
}

const handleSave = async () => {
  const token = cookies.get('Authorization')
  const decoded: any = jwt_decode(token)
  currentProduct.storeId = store.selectedStore.id

  if (uploadedFileThumbnail.value) {
    currentProduct.thumbnailImage.filePath = uploadedFileThumbnail.value?.path
    currentProduct.thumbnailImage.mediaLangs.forEach((mediaLang: any) => {
      const matchingPath = uploadedFileThumbnail.value?.pathLang.find(
        (pl: any) => pl.languageId === mediaLang.languageId
      )
      if (matchingPath) mediaLang.filePath = matchingPath.path
    })
  }

  currentProduct.slug = diacritics.remove(currentProduct.slug)
  currentProduct.currentUserId = decoded.UserId
  currentProduct.deletedMediaIds = []

  try {
    const payload = { body: JSON.stringify(currentProduct) }
    if (!props.updated) {
      await Api.products.create(payload)
      toast.success('Dodano produkt', { timeout: 2000 })
    } else {
      await Api.products.update(payload)
      toast.success('Edytowano produkt', { timeout: 2000 })
    }
    router.go(-1)
  } catch {
    toast.error('Wystąpił błąd', { timeout: 2000 })
  }
}

const handleAddFile = (file: any) => { files.value.push(file.media) }

const handleEditFile = (file: any) => {
  const index = files.value?.findIndex((c: any) => c.mediaId === file.id)
  currentFile.value = {
    displayOrder: file.displayOrder,
    mediaId: file.id,
    filePath: file?.filePath || '',
    seoFileName: file?.seoFileName || '',
    altAttribute: file?.altAttribute || '',
    titleAttribute: file?.titleAttribute || '',
    mediaLangs: language.languages.map((lang: any) => {
      const selectedMediaLang = file?.mediaLangs.find((ml: any) => ml.languageId === lang.id)
      return {
        languageId: lang.id,
        seoFileName: selectedMediaLang?.seoFileName || '',
        altAttribute: selectedMediaLang?.altAttribute || '',
        titleAttribute: selectedMediaLang?.titleAttribute || '',
        filePath: selectedMediaLang?.filePath || ''
      }
    })
  }
  files.value[index] = currentFile.value
}

const slugGenerator = () => {
  if (!currentProduct.name) {
    toast.error('Błędna nazwa produktu', { timeout: 2000 })
    return
  }
  currentProduct.slug = currentProduct.name.trim().toLowerCase().replace(/\s+/g, '-')
}

const allBrands = async () => {
  const result = await Api.brands.listByStoreId()
  brands.value = result.items.map((x: any) => ({ id: x.id, name: x.name }))
}
const allRules = async () => {
  const result = await Api.rules.listByStoreId()
  rules.value = result.items.map((x: any) => ({ id: x.id, name: x.name }))
}

onMounted(() => {
  allBrands()
  allRules()
  fileThumbnail.value = {
    media: {
      seoFileName: currentProduct.thumbnailImage.seoFileName,
      altAttribute: currentProduct.thumbnailImage.altAttribute,
      titleAttribute: currentProduct.thumbnailImage.titleAttribute,
      mediaLangs: currentProduct.thumbnailImage.mediaLangs
    },
    blobFolder: 1,
    watermark: false,
    thumbnail: true
  }
})

// --- propagacje (jak w Twoim kodzie) ---
const PRODUCT_FIELDS = ['name','metaTitle','metaKeywords','metaDescription','shortDescription','description','specification'] as const
const THUMBNAIL_FIELDS = ['seoFileName','altAttribute','titleAttribute'] as const

watch(
  () => ({
    name: currentProduct.name,
    metaTitle: currentProduct.metaTitle,
    metaKeywords: currentProduct.metaKeywords,
    metaDescription: currentProduct.metaDescription,
    shortDescription: currentProduct.shortDescription,
    description: currentProduct.description,
    specification: currentProduct.specification
  }),
  (newVals, oldVals) => {
    currentProduct.productLangs.forEach((lang: Record<string, any>) => {
      PRODUCT_FIELDS.forEach((key) => {
        const n = newVals[key], o = oldVals?.[key]
        if (n !== undefined && (lang[key] == null || lang[key] === '' || lang[key] === o)) {
          lang[key] = n
        }
      })
    })
  },
  { deep: false, immediate: true }
)

watch(
  () => ({
    seoFileName: currentProduct.thumbnailImage.seoFileName,
    altAttribute: currentProduct.thumbnailImage.altAttribute,
    titleAttribute: currentProduct.thumbnailImage.titleAttribute
  }),
  (newVals, oldVals) => {
    currentProduct.thumbnailImage.mediaLangs.forEach((lang: Record<string, any>) => {
      THUMBNAIL_FIELDS.forEach((key) => {
        const n = newVals[key], o = oldVals?.[key]
        if (n !== undefined && (lang[key] == null || lang[key] === '' || lang[key] === o)) {
          lang[key] = n
        }
      })
    })
  },
  { deep: false, immediate: true }
)
</script>

<template>
  <ContentContainer :showLanguage="true">
    <!-- Panel AI -->
    <el-collapse v-model="aiCollapse" class="mb-4">
      <el-collapse-item name="ai">
        <template #title>
          <div class="flex items-center gap-2">
            <span>PanelAI</span>
            <span class="text-xs text-gray-400">(opcjonalne)</span>
          </div>
        </template>

        <div class="p-3 bg-white rounded-md border border-gray-200 space-y-3">
          <div class="text-sm text-gray-600">
            Uzupełnij dowolne pola. <strong>Nazwa produktu</strong> jest wymagana, by wywołać AI.
          </div>

          <FormKit
            type="textarea"
            v-model="ai.exampleDescription"
            label="Przykładowy opis (opcjonalnie)"
            rows="3"
            placeholder="Wklej przykładowy opis produktu (jeśli masz)"
          />
          <FormKit
            type="textarea"
            v-model="ai.specification"
            label="Specyfikacja techniczna (opcjonalnie)"
            rows="3"
            placeholder="Wklej specyfikację/parametry (jeśli masz)"
          />
          <FormKit
            type="textarea"
            v-model="ai.additionalInformation"
            label="Dodatkowe informacje (opcjonalnie)"
            rows="2"
            placeholder="Dodatkowe wymagania/uwagi, które AI ma uwzględnić"
          />

          <div class="flex items-center gap-3">
            <el-button
              type="primary"
              :disabled="!canCallAI() || ai.isLoading"
              :loading="ai.isLoading"
              @click="callAI"
            >
              Wygeneruj dane produktu (AI)
            </el-button>
            <span v-if="!canCallAI()" class="text-xs text-red-500">
              Podaj nazwę produktu powyżej, aby uruchomić AI.
            </span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- Reszta formularza identycznie jak u Ciebie -->
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <FormSection :title="'Zdjęcie produktu'">
        <DropZone
          ref="dropzone"
          :fileInfo="fileThumbnail"
          :url="currentProduct.thumbnailImage.filePath"
          v-model="uploadedFileThumbnail"
        />
      </FormSection>

      <div v-if="!language.selectedLanguage">
        <FormSection :title="'Zdjęcie SEO'">
          <FormKit type="text" v-model="currentProduct.thumbnailImage.seoFileName" label="Nazwa SEO" validation="required" validation-visibility="live" />
          <FormKit type="text" v-model="currentProduct.thumbnailImage.altAttribute" label="Alt atrybut" validation="required" validation-visibility="live" />
          <FormKit type="text" v-model="currentProduct.thumbnailImage.titleAttribute" label="Tytuł atrybutu" validation="required" validation-visibility="live" />
        </FormSection>

        <FormSection :title="'Produkt'">
          <FormKit type="text" v-model="currentProduct.name" label="Nazwa" validation="required" validation-visibility="live" />
          <FormKit type="text" v-model="currentProduct.slug" label="Slug" validation="required" validation-visibility="live" />
          <div class="mt-7">
            <el-button @click="slugGenerator" color="#ea580c" round>Generuj slug</el-button>
          </div>
        </FormSection>

        <FormSection :title="'Transport'">
          <DropDown label="Reguła transportowa" v-model="currentProduct.ruleId" :value="currentProduct.ruleId" :options="rules" />
        </FormSection>

        <FormSection :title="'Marka'">
          <DropDown label="Producent" v-model="currentProduct.brandId" :value="currentProduct.brandId" :options="brands" />
        </FormSection>

        <FormSection :title="'Zdjęcia'" class="formsection_width_full">
          <MediaArea
            :filesValue="files"
            :editFile="currentFile"
            @handleAdd="handleAddFile"
            @handleEdit="handleEditFile"
            @handleRemove="handleRemoveFile"
            :folder="1"
            :watermark="true"
            :baseSeo="currentProduct.thumbnailImage.seoFileName"
            :baseAlt="currentProduct.thumbnailImage.altAttribute"
            :baseTitle="currentProduct.thumbnailImage.titleAttribute"
          />
        </FormSection>

        <FormSection :title="'SEO'">
          <FormKit type="text" v-model="currentProduct.metaTitle" label="Meta tytuł" validation="required" validation-visibility="live" />
          <FormKit type="text" v-model="currentProduct.metaKeywords" label="Słowa kluczowe" validation="required" validation-visibility="live" />
        </FormSection>

        <FormSection>
          <FormKit type="textarea" label="Meta opis" v-model="currentProduct.metaDescription" rows="10" placeholder="Podaj opis meta" validation="required" validation-visibility="live" />
        </FormSection>

        <FormSection :title="'Opis skrócony'">
          <HtmlEditor v-model="currentProduct.shortDescription" />
        </FormSection>

        <FormSection :title="'Opis'">
          <HtmlEditor v-model="currentProduct.description" />
        </FormSection>

        <FormSection :title="'Specyfikacja'">
          <HtmlEditor v-model="currentProduct.specification" />
        </FormSection>

        <FormSection :title="'Kod'">
          <FormKit type="text" v-model="currentProduct.sku" label="SKU" />
          <FormKit type="text" v-model="currentProduct.gtin" label="GTIN" />
          <FormKit type="text" v-model="currentProduct.identificationCode" label="Kod identyfikacyjny" />
        </FormSection>

        <FormSection :title="'Cena'">
          <FormKit type="number" v-model="currentProduct.price" label="Cena (netto)" step="0.01" validation="required" validation-visibility="live" />
          <FormKit label="Stara cena" type="number" step="0.01" v-model="currentProduct.oldPrice" />
          <FormKit label="Cena producenta" type="number" step="0.01" v-model="currentProduct.producerPrice" />
        </FormSection>

        <FormSection>
          <FormKit type="number" v-model="currentProduct.specialPrice" label="Cena specjalna (netto)" />
          <div class="formkit-outer" data-family="text" data-type="number" data-empty="true">
            <div class="formkit-wrapper">
              <label class="formkit-label">Rozpoczęcie - zakończenie promocji</label>
              <div class="formkit-inner">
                <el-date-picker v-model="test" type="datetimerange" start-placeholder="Start Date" end-placeholder="End Date" :default-time="defaultTime1" />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection :title="'Dostępność'">
          <DropDown label="Czas realiazacji" v-model="currentProduct.productAvailability" :value="currentProduct.productAvailability" :options="productAvailableList" />
        </FormSection>

        <FormSection>
          <FormKit type="checkbox" label="Widoczny" v-model="product.isPublished" :value="false" />
        </FormSection>
        <FormSection>
          <FormKit type="checkbox" label="Bestseller" v-model="currentProduct.isBestseller" :value="false" />
        </FormSection>
        <FormSection>
          <FormKit type="checkbox" label="Nowość" v-model="currentProduct.isNew" :value="false" />
        </FormSection>
        <FormSection>
          <FormKit type="checkbox" label="Strona główna" v-model="currentProduct.isHomePage" :value="false" />
        </FormSection>
        <FormSection>
          <FormKit type="checkbox" label="GMC" v-model="currentProduct.gmc" :value="false" />
        </FormSection>
      </div>

      <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.id">
        <div v-if="language.selectedLanguage?.id === formLanguage.id">
          <FormSection :title="'Zdjęcie SEO'">
            <FormKit type="text" v-model="currentProduct.thumbnailImage.mediaLangs[index].seoFileName" label="Nazwa SEO" validation="required" validation-visibility="live" />
            <FormKit type="text" v-model="currentProduct.thumbnailImage.mediaLangs[index].altAttribute" label="Alt atrybut" validation="required" validation-visibility="live" />
            <FormKit type="text" v-model="currentProduct.thumbnailImage.mediaLangs[index].titleAttribute" label="Tytuł atrybutu" validation="required" validation-visibility="live" />
          </FormSection>

          <FormSection :title="'Produkt'">
            <FormKit type="text" v-model="currentProduct.productLangs[index].name" label="Nazwa" validation="required" validation-visibility="live" />
          </FormSection>

          <FormSection :title="'SEO'">
            <FormKit type="text" v-model="currentProduct.productLangs[index].metaTitle" label="Meta tytuł" validation="required" validation-visibility="live" />
            <FormKit type="text" v-model="currentProduct.productLangs[index].metaKeywords" label="Słowa kluczowe" validation="required" validation-visibility="live" />
          </FormSection>

          <FormSection>
            <FormKit type="textarea" label="Meta opis" v-model="currentProduct.productLangs[index].metaDescription" rows="10" placeholder="Podaj opis meta" validation="required" validation-visibility="live" />
          </FormSection>

          <FormSection :title="'Opis skrócony'">
            <HtmlEditor v-model="currentProduct.productLangs[index].shortDescription" />
          </FormSection>

          <FormSection :title="'Opis'">
            <HtmlEditor v-model="currentProduct.productLangs[index].description" />
          </FormSection>

          <FormSection :title="'Specyfikacja'">
            <HtmlEditor v-model="currentProduct.productLangs[index].specification" />
          </FormSection>
        </div>
      </div>

      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>

<style>
.formkit-inner .el-date-editor { padding: 20px !important; }
.formkit-inner .el-date-editor .el-range-input { font-size: 12px; }
</style>
