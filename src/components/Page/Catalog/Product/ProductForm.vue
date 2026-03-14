<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { ProductDTO, ProductAvailability } from '/@/types/product/Product'
import type { FileDTO } from '/@/types/file/File'
import { useLanguageStore } from '/@/stores/language'
import { useStoreStore } from '/@/stores/store'
import DropZone from '/@/components/Form/File/DropZone'
import { Api } from '/@/services/api'
import jwt_decode from 'jwt-decode'
import Cookies from 'universal-cookie'
import { useRouter } from 'vue-router'
import diacritics from 'diacritics'

const props = defineProps({
  product: { type: Object as () => ProductDTO, default: null },
  updated: { type: Boolean, default: false }
})

const cookies = new Cookies()
const store = useStoreStore()
const toast = useToast()
const router = useRouter()
const language = useLanguageStore()

const currentProduct = reactive({ ...props.product })
const fileThumbnail = ref<FileDTO | null>(null)
const uploadedFileThumbnail = ref<any>(null)
const currentFile = ref<any>(null)
const files = ref(props.product?.medias || [])
const brands = ref<{ id: number; name: string }[]>([])
const rules = ref<{ id: number; name: string }[]>([])
const test = ref<any>(null)
const productAvailableList = ref<{ id: any; name: string }[]>([])
const deletedMediaIds = ref<string[]>([])

const aiCollapse = ref<string[]>(['ai'])
const ai = reactive({
  exampleDescription: '',
  specification: '',
  additionalInformation: '',
  sectionsCount: 1,
  generatedLayout: 'text-only',
  isLoading: false
})

const aiSectionModal = reactive({
  visible: false,
  mode: 'improve' as 'improve' | 'add',
  index: -1,
  purpose: '',
  instruction: ''
})

const canCallAI = () =>
  Boolean(currentProduct?.name && String(currentProduct.name).trim().length > 0)

const createDescriptionRow = (type: string, html = '') => ({
  id: crypto.randomUUID(),
  type,
  imageUrl: null,
  imageAlt: '',
  imageTitle: '',
  text: html
})

const parseDescriptionHtmlToRows = (html: string) => {
  if (!html || !html.trim()) return []

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const sections = Array.from(doc.body.querySelectorAll('section.desc-row'))

  if (!sections.length) {
    return [createDescriptionRow('text-only', html)]
  }

  return sections.map((section) => {
    let type = 'text-only'

    if (section.classList.contains('desc-row-2cols')) {
      const firstChild = Array.from(section.children)[0] as HTMLElement | undefined

      if (firstChild?.classList.contains('desc-image')) {
        type = 'image-left-text-right'
      } else {
        type = 'text-left-image-right'
      }
    } else if (section.classList.contains('desc-row-image-only')) {
      type = 'image-only'
    } else {
      type = 'text-only'
    }

    const textElement = section.querySelector('.desc-text')
    const imageElement = section.querySelector('.desc-image img') as HTMLImageElement | null

    return {
      id: crypto.randomUUID(),
      type,
      imageUrl: imageElement?.getAttribute('src') || null,
      imageAlt: imageElement?.getAttribute('alt') || '',
      imageTitle: imageElement?.getAttribute('title') || '',
      text: textElement?.innerHTML?.trim() || ''
    }
  })
}

const normalizeDescriptionToRows = (value: any) => {
  if (Array.isArray(value)) {
    return JSON.parse(JSON.stringify(value))
  }

  if (typeof value === 'string' && value.trim()) {
    return parseDescriptionHtmlToRows(value)
  }

  return []
}

const descriptionRows = ref<any[]>(
  normalizeDescriptionToRows(props.product?.description)
)

const escapeHtml = (value: string) => {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const generateDescriptionHtml = (rows: any[]) => {
  return (rows || [])
    .map((row) => {
      const imageHtml = row.imageUrl
        ? `
<div class="desc-col desc-image">
  <img
    src="${row.imageUrl}"
    alt="${escapeHtml(row.imageAlt || '')}"
    title="${escapeHtml(row.imageTitle || '')}"
    loading="lazy"
  />
</div>`
        : ''

      const textHtml = row.text
        ? `
<div class="desc-col desc-text">
  ${row.text}
</div>`
        : ''

      switch (row.type) {
        case 'image-left-text-right':
          return `<section class="desc-row desc-row-2cols">${imageHtml}${textHtml}</section>`

        case 'text-left-image-right':
          return `<section class="desc-row desc-row-2cols">${textHtml}${imageHtml}</section>`

        case 'image-only':
          return `<section class="desc-row desc-row-image-only">${imageHtml}</section>`

        case 'text-only':
        default:
          return `<section class="desc-row desc-row-text-only">${textHtml}</section>`
      }
    })
    .join('')
}

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
        additionalInformation: ai.additionalInformation || '',
        sectionsCount: ai.sectionsCount
      }
    }

    const res = await Api.chatGpt.generateProductData({ body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Błąd odpowiedzi serwera')

    const json = await res.json()
    const d = (json?.data ?? json) as any

    const alt = d?.altAttribute ?? d?.AltAttribute ?? ''
    const title = d?.titleAttribute ?? d?.TitleAttribute ?? ''
    const metaTitle = d?.metaTitle ?? d?.MetaTitle ?? ''
    const metaDesc = d?.metaDescription ?? d?.MetaDescription ?? ''

    const sections = d?.sections ?? d?.Sections ?? []
    const fallbackDescriptionHtml = d?.description ?? d?.Description ?? ''

    if (alt) currentProduct.thumbnailImage.altAttribute = alt
    if (title) currentProduct.thumbnailImage.titleAttribute = title
    if (metaTitle) currentProduct.metaTitle = metaTitle
    if (metaDesc) currentProduct.metaDescription = metaDesc

    let newRows: any[] = []

    if (Array.isArray(sections) && sections.length > 0) {
      newRows = sections
        .map((section: any) => {
          const html =
            section?.description ??
            section?.Description ??
            section?.html ??
            section?.Html ??
            ''

          if (!html || !String(html).trim()) return null

          return createDescriptionRow(ai.generatedLayout, html)
        })
        .filter(Boolean)
    } else if (fallbackDescriptionHtml && String(fallbackDescriptionHtml).trim()) {
      newRows = [createDescriptionRow(ai.generatedLayout, fallbackDescriptionHtml)]
    }

    if (newRows.length > 0) {
      const shouldReplace = window.confirm(
        'AI wygenerowało opis. OK = nadpisz obecne sekcje, Anuluj = dodaj sekcje na końcu.'
      )

      if (shouldReplace) {
        descriptionRows.value = newRows
      } else {
        descriptionRows.value.push(...newRows)
      }
    }

    toast.success('AI: dane produktu zaktualizowane.', { timeout: 2000 })
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się wygenerować danych przez AI.', { timeout: 2500 })
  } finally {
    ai.isLoading = false
  }
}

const callSectionAI = async ({
  currentSectionHtml = '',
  sectionPurpose = '',
  userInstruction = ''
}: {
  currentSectionHtml?: string
  sectionPurpose?: string
  userInstruction?: string
}) => {
  const body = {
    productSectionBriefDTO: {
      productName: currentProduct.name,
      exampleDescription: ai.exampleDescription || '',
      specification: ai.specification || '',
      additionalInformation: ai.additionalInformation || '',
      currentSectionHtml,
      sectionPurpose,
      userInstruction
    }
  }

  const res = await Api.chatGpt.generateProductSection({ body: JSON.stringify(body) })
  if (!res.ok) throw new Error('Błąd odpowiedzi serwera')

  const json = await res.json()
  return (json?.data ?? json) as any
}

const openImproveSectionModal = (index: number) => {
  const row = descriptionRows.value[index]
  if (!row) return

  aiSectionModal.visible = true
  aiSectionModal.mode = 'improve'
  aiSectionModal.index = index
  aiSectionModal.purpose = 'Popraw istniejącą sekcję opisu produktu'
  aiSectionModal.instruction = 'Popraw SEO, naturalność i język korzyści.'
}

const openAddSectionModal = (insertAfterIndex?: number) => {
  aiSectionModal.visible = true
  aiSectionModal.mode = 'add'
  aiSectionModal.index =
    typeof insertAfterIndex === 'number' ? insertAfterIndex : -1
  aiSectionModal.purpose = 'Najważniejsze zalety produktu'
  aiSectionModal.instruction = 'Napisz sekcję naturalnie, sprzedażowo i pod SEO.'
}

const submitSectionAIModal = async () => {
  if (!canCallAI()) {
    toast.error('Podaj nazwę produktu, zanim użyjesz AI.', { timeout: 2000 })
    return
  }

  try {
    ai.isLoading = true

    if (aiSectionModal.mode === 'improve') {
      const row = descriptionRows.value[aiSectionModal.index]
      if (!row) return

      const d = await callSectionAI({
        currentSectionHtml: row.text || '',
        sectionPurpose: aiSectionModal.purpose || 'Popraw istniejącą sekcję',
        userInstruction: aiSectionModal.instruction || 'Popraw sekcję'
      })

      const newHtml =
        d?.description ??
        d?.Description ??
        ''

      if (!newHtml || !String(newHtml).trim()) {
        toast.error('AI nie zwróciło poprawionej sekcji.', { timeout: 2000 })
        return
      }

      descriptionRows.value[aiSectionModal.index] = {
        ...descriptionRows.value[aiSectionModal.index],
        text: newHtml
      }

      toast.success('Sekcja została poprawiona przez AI.', { timeout: 2000 })
    }

    if (aiSectionModal.mode === 'add') {
      const d = await callSectionAI({
        currentSectionHtml: '',
        sectionPurpose: aiSectionModal.purpose || 'Nowa sekcja opisu produktu',
        userInstruction: aiSectionModal.instruction || 'Wygeneruj nową sekcję'
      })

      const newHtml =
        d?.description ??
        d?.Description ??
        ''

      if (!newHtml || !String(newHtml).trim()) {
        toast.error('AI nie zwróciło nowej sekcji.', { timeout: 2000 })
        return
      }

      const newRow = createDescriptionRow(ai.generatedLayout, newHtml)

      if (aiSectionModal.index >= 0) {
        descriptionRows.value.splice(aiSectionModal.index + 1, 0, newRow)
      } else {
        descriptionRows.value.push(newRow)
      }

      toast.success('Dodano nową sekcję przez AI.', { timeout: 2000 })
    }

    aiSectionModal.visible = false
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się wykonać operacji AI.', { timeout: 2500 })
  } finally {
    ai.isLoading = false
  }
}

const improveSectionWithAI = (index: number) => {
  openImproveSectionModal(index)
}

const addSectionWithAI = (insertAfterIndex?: number) => {
  openAddSectionModal(insertAfterIndex)
}

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
  productAvailableList.value.push({
    id,
    name: translationsProductAvailable[id as keyof typeof translationsProductAvailable]
  })
}

const handleRemoveFile = async (id: string) => {
  try {
    const removedFile = files.value.find((file: any) => file.mediaId === id)

    files.value = files.value.filter((file: any) => file.mediaId !== id)

    if (!deletedMediaIds.value.includes(id)) {
      deletedMediaIds.value.push(id)
    }

    if (removedFile?.filePath) {
      descriptionRows.value = descriptionRows.value.map((row: any) => {
        if (row.imageUrl === removedFile.filePath) {
          return {
            ...row,
            imageUrl: null,
            imageAlt: '',
            imageTitle: ''
          }
        }

        return row
      })
    }

    toast.success('Usunięto zdjęcie', { timeout: 2000 })
  } catch (e) {
    console.error(e)
    toast.error('Błąd podczas usuwania zdjęcia', { timeout: 2000 })
  }
}

const handleAddFile = (file: any) => {
  files.value.push(file.media)
}

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

  if (index !== -1) {
    files.value[index] = currentFile.value
  }
}

const slugGenerator = () => {
  if (!currentProduct.name) {
    toast.error('Błędna nazwa produktu', { timeout: 2000 })
    return
  }

  currentProduct.slug = diacritics.remove(
    currentProduct.name.trim().toLowerCase().replace(/\s+/g, '-')
  )
}

const allBrands = async () => {
  const result = await Api.brands.listByStoreId()
  brands.value = result.items.map((x: any) => ({ id: x.id, name: x.name }))
}

const allRules = async () => {
  const result = await Api.rules.listByStoreId()
  rules.value = result.items.map((x: any) => ({ id: x.id, name: x.name }))
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

      if (matchingPath) {
        mediaLang.filePath = matchingPath.path
      }
    })
  }

  currentProduct.slug = diacritics.remove(currentProduct.slug)
  currentProduct.currentUserId = decoded.UserId
  currentProduct.deletedMediaIds = deletedMediaIds.value
  currentProduct.description = generateDescriptionHtml(descriptionRows.value)

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
  } catch (e) {
    console.error(e)
    toast.error('Wystąpił błąd', { timeout: 2000 })
  }
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

const PRODUCT_FIELDS = [
  'name',
  'metaTitle',
  'metaKeywords',
  'metaDescription',
  'shortDescription',
  'description',
  'specification'
] as const

const THUMBNAIL_FIELDS = ['seoFileName', 'altAttribute', 'titleAttribute'] as const

watch(
  descriptionRows,
  (rows) => {
    currentProduct.description = generateDescriptionHtml(rows)
  },
  { deep: true }
)

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
        const n = newVals[key]
        const o = oldVals?.[key]

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
        const n = newVals[key]
        const o = oldVals?.[key]

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
            type="number"
            v-model="ai.sectionsCount"
            label="Liczba sekcji opisu"
            min="1"
            max="10"
          />
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

        <FormSection :title="'Specyfikacja'">
          <HtmlEditor v-model="currentProduct.specification" />
        </FormSection>

        <FormSection :title="'Test'">
          <ProductDescriptionBuilder
            v-model="descriptionRows"
            :product-images="files"
            @improve-ai="improveSectionWithAI"
            @add-ai-below="addSectionWithAI"
          />
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
          <FormKit type="checkbox" label="Widoczny" v-model="currentProduct.isPublished" :value="false" />
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
<el-dialog
  v-model="aiSectionModal.visible"
  :title="aiSectionModal.mode === 'improve' ? 'Popraw sekcję przez AI' : 'Dodaj sekcję przez AI'"
  width="600px"
>
  <div class="space-y-4">
    <FormKit
      type="text"
      v-model="aiSectionModal.purpose"
      label="Cel sekcji"
      placeholder="np. Najważniejsze zalety produktu"
    />

    <FormKit
      type="textarea"
      v-model="aiSectionModal.instruction"
      label="Instrukcja dla AI"
      rows="5"
      placeholder="np. popraw SEO, skróć tekst, dodaj więcej korzyści"
    />
  </div>

  <template #footer>
    <el-button @click="aiSectionModal.visible = false">
      Anuluj
    </el-button>

    <el-button
      type="primary"
      :loading="ai.isLoading"
      @click="submitSectionAIModal"
    >
      Generuj
    </el-button>
  </template>
</el-dialog>
</template>

<style>
.formkit-inner .el-date-editor { padding: 20px !important; }
.formkit-inner .el-date-editor .el-range-input { font-size: 12px; }
</style>
