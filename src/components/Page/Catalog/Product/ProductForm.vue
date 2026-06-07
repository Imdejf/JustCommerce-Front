<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ProductDescriptionAiModal from '/@/components/Form/Modal/ProductDescriptionAiModal.vue'
import ProductDescriptionRewriteModal from '/@/components/Form/Modal/ProductDescriptionRewriteModal.vue'
import ProductCompetitorImportModal from '/@/components/Form/Modal/ProductCompetitorImportModal.vue'
import ProductCompetitorImportReviewModal, {
  type CompetitorImportAttributeItem,
  type CompetitorImportFaqItem
} from '/@/components/Form/Modal/ProductCompetitorImportReviewModal.vue'
import {
  collectProductImages,
  pickImageForSection,
  resolveRowLayoutFromSlot,
  type DescriptionLayoutPattern
} from '/@/utils/descriptionRowUtils'
import {
  getDescriptionTemplate,
  MANUAL_TEMPLATE_ID,
  type DescriptionTemplateSlot
} from '/@/utils/descriptionTemplates'
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

const currentProduct = reactive({
  cashOnDelivery: true,
  ...props.product
})

if (currentProduct.cashOnDelivery === undefined || currentProduct.cashOnDelivery === null) {
  currentProduct.cashOnDelivery = true
}
const fileThumbnail = ref<FileDTO | null>(null)
const uploadedFileThumbnail = ref<any>(null)
const currentFile = ref<any>(null)
const files = ref(props.product?.medias || [])
const brands = ref<{ id: number; name: string }[]>([])
const rules = ref<{ id: number; name: string }[]>([])
const test = ref<any>(null)
const productAvailableList = ref<{ id: any; name: string }[]>([])
const deletedMediaIds = ref<string[]>([])

const dropzone = ref<any>(null)

const generatedThumbnailBase64 = ref('')

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

const descriptionAiModalVisible = ref(false)
const descriptionAiLoading = ref(false)
const descriptionRewriteModalVisible = ref(false)
const descriptionRewriteLoading = ref(false)
const competitorImportModalVisible = ref(false)
const competitorImportReviewVisible = ref(false)
const importCompetitorSeoLoading = ref(false)
const importCompetitorExtrasLoading = ref(false)
const competitorReviewFaq = ref<CompetitorImportFaqItem[]>([])
const competitorReviewAttributes = ref<CompetitorImportAttributeItem[]>([])
const COMPETITOR_IMPORT_PENDING_KEY = 'productCompetitorImportPending'

const availableDescriptionImages = computed(() => {
  const collected = collectProductImages(
    currentProduct.thumbnailImage,
    files.value,
    uploadedFileThumbnail.value?.base64String || generatedThumbnailBase64.value || null
  )

  return {
    ...collected,
    totalCount: collected.refs.length + collected.base64Items.length
  }
})

const canCallAI = () =>
  Boolean(currentProduct?.name && String(currentProduct.name).trim().length > 0)

const onThumbnailBase64Changed = (val: string) => {
  uploadedFileThumbnail.value = {
    ...(uploadedFileThumbnail.value || {}),
    base64String: val
  }
}

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

const openDescriptionVisionModal = () => {
  descriptionAiModalVisible.value = true
}

const storefrontBaseUrl = String(import.meta.env.VITE_STOREFRONT_URL || '').replace(/\/$/, '')

const defaultProductPageUrl = computed(() => {
  const slug = String(currentProduct.slug || '').trim()
  if (!storefrontBaseUrl || !slug) return ''
  return `${storefrontBaseUrl}/${slug}`
})

const getSourceDescriptionRows = () => {
  if (descriptionRows.value.length) {
    return descriptionRows.value
  }

  return normalizeDescriptionToRows(currentProduct.description)
}

const mapSourceSectionsForApi = (rows: any[]) =>
  rows.map((row) => ({
    layout: row.type || 'text-only',
    text: row.text || ''
  }))

const buildRowsFromRewriteSections = (sections: any[], sourceRows: any[]) =>
  sections
    .map((section: any, index: number) => {
      const html =
        section?.description ??
        section?.Description ??
        ''

      if (!html || !String(html).trim()) return null

      const source = sourceRows[index]

      if (!source) {
        return createDescriptionRow('text-only', html)
      }

      return {
        id: crypto.randomUUID(),
        type: source.type || 'text-only',
        imageUrl: source.imageUrl || null,
        imageAlt: source.imageAlt || '',
        imageTitle: source.imageTitle || '',
        text: html
      }
    })
    .filter(Boolean)

const openDescriptionRewriteModal = () => {
  if (!canCallAI()) {
    toast.error('Podaj nazwę produktu, zanim użyjesz AI.', { timeout: 2000 })
    return
  }

  descriptionRewriteModalVisible.value = true
}

const handleDescriptionRewriteGenerate = async (config: { productPageUrl: string }) => {
  const sourceRows = getSourceDescriptionRows()

  if (!sourceRows.length && !config.productPageUrl?.trim()) {
    toast.error(
      'Dodaj sekcje opisu w formularzu lub podaj URL produktu na stronie sklepu.',
      { timeout: 3000 }
    )
    return
  }

  try {
    descriptionRewriteLoading.value = true

    const body = {
      productDescriptionRewriteBriefDTO: {
        productName: currentProduct.name,
        shortDescription: currentProduct.shortDescription || '',
        specification: currentProduct.specification || ai.specification || '',
        productPageUrl: config.productPageUrl || '',
        sourceSections: mapSourceSectionsForApi(sourceRows)
      }
    }

    const res = await Api.chatGpt.generateProductDescriptionRewrite({
      body: JSON.stringify(body)
    })

    if (!res.ok) throw new Error('Błąd odpowiedzi serwera')

    const json = await res.json()
    const d = (json?.data ?? json) as any
    const sections = d?.sections ?? d?.Sections ?? []

    if (!sections.length) {
      toast.error('AI nie zwróciło przepisanych sekcji.', { timeout: 2500 })
      return
    }

    const newRows = buildRowsFromRewriteSections(sections, sourceRows)

    if (!newRows.length) {
      toast.error('Nie udało się zbudować sekcji z odpowiedzi AI.', { timeout: 2500 })
      return
    }

    const shouldReplace = window.confirm(
      'AI przepisało sekcje opisu (unikalna treść). OK = nadpisz sekcje, Anuluj = dodaj na końcu.'
    )

    if (shouldReplace) {
      descriptionRows.value = newRows
    } else {
      descriptionRows.value.push(...newRows)
    }

    descriptionRewriteModalVisible.value = false
    toast.success(`Wygenerowano ${newRows.length} unikalnych sekcji opisu.`, { timeout: 2500 })
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się wygenerować unikalnych sekcji opisu.', { timeout: 2500 })
  } finally {
    descriptionRewriteLoading.value = false
  }
}

const applyCompetitorSeoToProduct = (data: any) => {
  const productName = data?.productName ?? data?.ProductName ?? ''
  const slug = data?.slug ?? data?.Slug ?? ''
  const seoFileName = data?.seoFileName ?? data?.SeoFileName ?? ''
  const alt = data?.altAttribute ?? data?.AltAttribute ?? ''
  const title = data?.titleAttribute ?? data?.TitleAttribute ?? ''
  const metaTitle = data?.metaTitle ?? data?.MetaTitle ?? ''
  const metaDesc = data?.metaDescription ?? data?.MetaDescription ?? ''
  const metaKeywords = data?.metaKeywords ?? data?.MetaKeywords ?? ''
  const specification = data?.specification ?? data?.Specification ?? ''

  if (productName) currentProduct.name = productName
  if (slug) currentProduct.slug = slug
  if (seoFileName) currentProduct.thumbnailImage.seoFileName = seoFileName
  if (alt) currentProduct.thumbnailImage.altAttribute = alt
  if (title) currentProduct.thumbnailImage.titleAttribute = title
  if (metaTitle) currentProduct.metaTitle = metaTitle
  if (metaDesc) currentProduct.metaDescription = metaDesc
  if (metaKeywords) currentProduct.metaKeywords = metaKeywords

  if (specification) {
    currentProduct.specification = specification
    ai.specification = specification
  }
}

const normalizeCompetitorFaqItems = (items: any[]): CompetitorImportFaqItem[] => {
  if (!Array.isArray(items)) return []

  return items
    .map((item, index) => ({
      question: String(item?.question ?? item?.Question ?? '').trim(),
      answer: String(item?.answer ?? item?.Answer ?? '').trim(),
      displayOrder: Number(item?.displayOrder ?? item?.DisplayOrder ?? index + 1),
      selected: true
    }))
    .filter((item) => item.question && item.answer)
}

const normalizeCompetitorAttributeItems = (items: any[]): CompetitorImportAttributeItem[] => {
  if (!Array.isArray(items)) return []

  return items
    .map((item) => ({
      attributeId: String(item?.attributeId ?? item?.AttributeId ?? '').trim(),
      attributeName: String(item?.attributeName ?? item?.AttributeName ?? '').trim(),
      value: String(item?.value ?? item?.Value ?? '').trim(),
      selected: true
    }))
    .filter((item) => item.attributeId && item.attributeName && item.value)
}

const loadStoreAttributesForImport = async () => {
  try {
    const result = await Api.productAttributes.listByStoreId()
    const items = result?.items ?? []

    return items.map((item: any) => ({
      id: item.id ?? item.Id,
      name: item.name ?? item.Name ?? ''
    }))
  } catch (err) {
    console.error(err)
    return []
  }
}

const storePendingCompetitorExtras = (
  faqItems: CompetitorImportFaqItem[],
  attributeItems: CompetitorImportAttributeItem[]
) => {
  if (!faqItems.length && !attributeItems.length) return

  try {
    sessionStorage.setItem(
      COMPETITOR_IMPORT_PENDING_KEY,
      JSON.stringify({
        slug: currentProduct.slug,
        faqItems,
        attributeItems
      })
    )
  } catch {
    // ignore
  }
}

const applyPendingCompetitorExtrasIfAny = async () => {
  if (!currentProduct.id) return

  try {
    const raw = sessionStorage.getItem(COMPETITOR_IMPORT_PENDING_KEY)
    if (!raw) return

    const pending = JSON.parse(raw)
    const pendingSlug = String(pending?.slug ?? '').trim()
    const currentSlug = String(currentProduct.slug ?? '').trim()

    if (!pendingSlug || !currentSlug || pendingSlug !== currentSlug) return

    const faqItems = Array.isArray(pending?.faqItems) ? pending.faqItems : []
    const attributeItems = Array.isArray(pending?.attributeItems) ? pending.attributeItems : []

    if (!faqItems.length && !attributeItems.length) return

    competitorReviewFaq.value = faqItems.map((item: CompetitorImportFaqItem) => ({
      ...item,
      selected: item.selected ?? true
    }))
    competitorReviewAttributes.value = attributeItems.map((item: CompetitorImportAttributeItem) => ({
      ...item,
      selected: item.selected ?? true
    }))
    competitorImportReviewVisible.value = true
    sessionStorage.removeItem(COMPETITOR_IMPORT_PENDING_KEY)
  } catch {
    // ignore
  }
}

const applySelectedCompetitorFaq = async (productId: string, faqItems: CompetitorImportFaqItem[]) => {
  for (const faq of faqItems) {
    await Api.productFaq.create({
      body: JSON.stringify({
        productId,
        question: faq.question,
        answer: faq.answer,
        displayOrder: Number(faq.displayOrder ?? 0),
        isPublished: true
      })
    })
  }
}

const applySelectedCompetitorAttributes = async (
  productId: string,
  attributeItems: CompetitorImportAttributeItem[]
) => {
  const existingAttributes = Array.isArray(currentProduct.attributes) ? currentProduct.attributes : []

  for (const attr of attributeItems) {
    const existing = existingAttributes.find((item: any) => String(item.id) === attr.attributeId)

    const payload = {
      productId,
      productAttributeValues: {
        attributeId: attr.attributeId,
        value: attr.value,
        productAttributeValueLangs: language.languages.map((lang) => ({
          languageId: lang.id,
          value: attr.value
        }))
      }
    }

    if (existing?.attributeValueId) {
      await Api.products.updateAttributeValue({
        body: JSON.stringify({
          ...payload,
          productAttributeValues: {
            ...payload.productAttributeValues,
            productAttributeValueId: existing.attributeValueId
          }
        })
      })

      existing.value = attr.value
    } else {
      const result = await Api.products.addAttributeValue({
        body: JSON.stringify(payload)
      })

      const created = result?.data ?? result
      if (created) {
        if (!Array.isArray(currentProduct.attributes)) {
          currentProduct.attributes = []
        }
        currentProduct.attributes.push(created)
      }
    }
  }
}

const handleApplyCompetitorReview = async (payload: {
  faqItems: CompetitorImportFaqItem[]
  attributeItems: CompetitorImportAttributeItem[]
}) => {
  const productId = currentProduct.id

  if (!productId) {
    storePendingCompetitorExtras(payload.faqItems, payload.attributeItems)
    competitorImportReviewVisible.value = false
    toast.info('Zapisz produkt i otwórz edycję — FAQ i atrybuty będą gotowe do dodania.', {
      timeout: 3500
    })
    return
  }

  try {
    importCompetitorExtrasLoading.value = true

    if (payload.faqItems.length > 0) {
      await applySelectedCompetitorFaq(productId, payload.faqItems)
    }

    if (payload.attributeItems.length > 0) {
      await applySelectedCompetitorAttributes(productId, payload.attributeItems)
    }

    competitorImportReviewVisible.value = false
    toast.success(
      `Dodano: FAQ (${payload.faqItems.length}), atrybuty (${payload.attributeItems.length}).`,
      { timeout: 2500 }
    )
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się dodać wybranych FAQ lub atrybutów.', { timeout: 2500 })
  } finally {
    importCompetitorExtrasLoading.value = false
  }
}

const handleImportCompetitorSeo = async (competitorUrl: string) => {
  if (!competitorUrl?.trim()) {
    toast.error('Podaj link do strony konkurencji.', { timeout: 2000 })
    return
  }

  try {
    importCompetitorSeoLoading.value = true

    const availableAttributes = await loadStoreAttributesForImport()

    const res = await Api.chatGpt.generateProductSeoFromCompetitor({
      body: JSON.stringify({
        productSeoFromCompetitorBriefDTO: {
          competitorUrl: competitorUrl.trim(),
          availableAttributes: availableAttributes.map((item) => ({
            id: item.id,
            name: item.name
          }))
        }
      })
    })

    if (!res.ok) throw new Error('Błąd odpowiedzi serwera')

    const json = await res.json()
    const data = json?.data ?? json

    if (!data?.productName && !data?.ProductName) {
      toast.error('AI nie zwróciło nazwy produktu ze strony.', { timeout: 2500 })
      return
    }

    applyCompetitorSeoToProduct(data)

    competitorReviewFaq.value = normalizeCompetitorFaqItems(data?.faqItems ?? data?.FaqItems)
    competitorReviewAttributes.value = normalizeCompetitorAttributeItems(
      data?.attributes ?? data?.Attributes
    )

    competitorImportModalVisible.value = false
    competitorImportReviewVisible.value = true

    toast.success('Zaimportowano dane SEO. Wybierz FAQ i atrybuty do dodania.', { timeout: 2500 })
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się zaimportować danych ze strony konkurencji.', { timeout: 2500 })
  } finally {
    importCompetitorSeoLoading.value = false
  }
}

const buildRowsFromVisionSections = (
  sections: any[],
  templateSlots: DescriptionTemplateSlot[] | null,
  layoutPattern: DescriptionLayoutPattern
) => {
  const { refs } = availableDescriptionImages.value
  const hasImages = refs.length > 0

  return sections
    .map((section: any, index: number) => {
      const html =
        section?.description ??
        section?.Description ??
        ''

      if (!html || !String(html).trim()) return null

      const slot = templateSlots?.[index]
      const layout = resolveRowLayoutFromSlot(
        slot?.layout,
        index,
        layoutPattern,
        hasImages
      )
      const row = createDescriptionRow(layout, html)

      const needsImage =
        layout === 'image-left-text-right' ||
        layout === 'text-left-image-right' ||
        layout === 'image-only'

      if (needsImage) {
        const suggested =
          section?.suggestedImageIndex ??
          section?.SuggestedImageIndex ??
          null

        const image = pickImageForSection(refs, index, suggested)
        if (image) {
          row.imageUrl = image.url
          row.imageAlt = image.alt || slot?.headingHint || ''
          row.imageTitle = image.title || slot?.headingHint || ''
        } else if (layout === 'image-only') {
          return null
        } else {
          row.type = 'text-only'
        }
      }

      return row
    })
    .filter(Boolean)
}

const handleDescriptionVisionGenerate = async (config: {
  templateId: string
  sectionsCount: number
  layoutPattern: DescriptionLayoutPattern
  customPrompt: string
  competitorUrl: string
  exampleDescription: string
  specification: string
}) => {
  if (!canCallAI()) {
    toast.error('Podaj nazwę produktu, zanim użyjesz AI.', { timeout: 2000 })
    return
  }

  const { urls, base64Items } = availableDescriptionImages.value

  if (
    !urls.length &&
    !base64Items.length &&
    !config.exampleDescription?.trim() &&
    !config.competitorUrl?.trim() &&
    !config.specification?.trim() &&
    !currentProduct.specification?.trim()
  ) {
    toast.error(
      'Dodaj zdjęcia produktu lub uzupełnij opis / link konkurencji / specyfikację.',
      { timeout: 3000 }
    )
    return
  }

  try {
    descriptionAiLoading.value = true

    const template = getDescriptionTemplate(config.templateId)
    const templateSlots =
      config.templateId === MANUAL_TEMPLATE_ID ? null : template.slots

    const body = {
      productDescriptionVisionBriefDTO: {
        productName: currentProduct.name,
        exampleDescription:
          config.exampleDescription ||
          ai.exampleDescription ||
          currentProduct.shortDescription ||
          '',
        specification:
          config.specification ||
          ai.specification ||
          currentProduct.specification ||
          '',
        competitorUrl: config.competitorUrl || '',
        customPrompt: config.customPrompt || '',
        sectionsCount: templateSlots?.length ?? config.sectionsCount,
        templateSlots: templateSlots?.map((slot) => ({
          layout: slot.layout,
          label: slot.label,
          purpose: slot.purpose,
          headingHint: slot.headingHint || null
        })),
        imageUrls: urls,
        imageBase64Items: base64Items
      }
    }

    const res = await Api.chatGpt.generateProductDescriptionVision({
      body: JSON.stringify(body)
    })

    if (!res.ok) throw new Error('Błąd odpowiedzi serwera')

    const json = await res.json()
    const d = (json?.data ?? json) as any
    const sections = d?.sections ?? d?.Sections ?? []

    if (!sections.length) {
      toast.error('AI nie zwróciło sekcji opisu.', { timeout: 2500 })
      return
    }

    const newRows = buildRowsFromVisionSections(
      sections,
      templateSlots,
      config.layoutPattern
    )

    if (!newRows.length) {
      toast.error('Nie udało się zbudować sekcji z odpowiedzi AI.', { timeout: 2500 })
      return
    }

    const shouldReplace = window.confirm(
      'AI wygenerowało opis ze zdjęć. OK = nadpisz sekcje, Anuluj = dodaj na końcu.'
    )

    if (shouldReplace) {
      descriptionRows.value = newRows
    } else {
      descriptionRows.value.push(...newRows)
    }

    descriptionAiModalVisible.value = false
    toast.success(`Wygenerowano ${newRows.length} sekcji opisu.`, { timeout: 2000 })
  } catch (err) {
    console.error(err)
    toast.error('Nie udało się wygenerować opisu ze zdjęć.', { timeout: 2500 })
  } finally {
    descriptionAiLoading.value = false
  }
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
      const matchingPath = uploadedFileThumbnail.value?.pathLang?.find(
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
      const result = await Api.products.create(payload)
      const productId = result?.data ?? result

      toast.success('Dodano produkt', { timeout: 2000 })

      if (productId) {
        router.push(`/catalog/product/detail/${productId}`)
      } else {
        router.push('/catalog/product')
      }
    } else {
      await Api.products.update(payload)
      toast.success('Edytowano produkt', { timeout: 2000 })
      router.push(`/catalog/product/detail/${currentProduct.id}`)
    }
  } catch (e) {
    console.error(e)
    toast.error('Wystąpił błąd', { timeout: 2000 })
  }
}

onMounted(async () => {
  allBrands()
  allRules()
  await applyPendingCompetitorExtrasIfAny()

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
    <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="font-semibold text-amber-900">Szybki start – import z konkurencji</p>
        <p class="text-sm text-amber-800">
          Uzupełnij nazwę, slug, SEO i specyfikację ze strony konkurenta. Opis produktu generujesz osobno.
        </p>
      </div>
      <el-button type="warning" @click="competitorImportModalVisible = true">
        Importuj ze strony konkurencji
      </el-button>
    </div>

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
      <div class="space-y-4 flex gap-10">
        <DropZone
          ref="dropzone"
          :fileInfo="fileThumbnail"
          :url="currentProduct.thumbnailImage.filePath"
          :externalBase64="generatedThumbnailBase64"
          v-model="uploadedFileThumbnail"
          @base64Changed="onThumbnailBase64Changed"
        />
      </div>
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
          <div class="mt-4 flex flex-wrap gap-2">
            <el-button @click="slugGenerator" color="#ea580c" round>Generuj slug</el-button>
            <el-button type="warning" round @click="competitorImportModalVisible = true">
              Importuj z konkurencji (AI)
            </el-button>
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

        <FormSection :title="'Opis produktu'">
          <ProductDescriptionBuilder
            v-model="descriptionRows"
            :product-images="files"
            @improve-ai="improveSectionWithAI"
            @add-ai-below="addSectionWithAI"
            @generate-vision-ai="openDescriptionVisionModal"
            @generate-rewrite-ai="openDescriptionRewriteModal"
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

        <FormSection :title="'Płatność i dostawa'">
          <FormKit
            type="checkbox"
            label="Pobranie (za pobraniem)"
            v-model="currentProduct.cashOnDelivery"
            :value="true"
            help="Odznacz, aby wyłączyć płatność za pobraniem dla tego produktu."
          />
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
<ProductCompetitorImportModal
  v-if="competitorImportModalVisible"
  :loading="importCompetitorSeoLoading"
  @close="competitorImportModalVisible = false"
  @import="handleImportCompetitorSeo"
/>

<ProductCompetitorImportReviewModal
  v-if="competitorImportReviewVisible"
  :loading="importCompetitorExtrasLoading"
  :product-name="currentProduct.name"
  :requires-product-save="!currentProduct.id"
  :faq-items="competitorReviewFaq"
  :attribute-items="competitorReviewAttributes"
  @close="competitorImportReviewVisible = false"
  @apply="handleApplyCompetitorReview"
/>

<ProductDescriptionAiModal
  v-if="descriptionAiModalVisible"
  :loading="descriptionAiLoading"
  :image-count="availableDescriptionImages.totalCount"
  @close="descriptionAiModalVisible = false"
  @generate="handleDescriptionVisionGenerate"
/>

<ProductDescriptionRewriteModal
  v-if="descriptionRewriteModalVisible"
  :loading="descriptionRewriteLoading"
  :sections-count="getSourceDescriptionRows().length"
  :default-product-page-url="defaultProductPageUrl"
  @close="descriptionRewriteModalVisible = false"
  @generate="handleDescriptionRewriteGenerate"
/>

<el-dialog
  v-model="aiSectionModal.visible"
  :title="aiSectionModal.mode === 'improve' ? 'Popraw sekcję przez AI' : 'Dodaj sekcję przez AI'"
  width="600px"
>
    <FormSection>
      <FormKit
        type="text"
        v-model="aiSectionModal.purpose"
        label="Cel sekcji"
        placeholder="np. Najważniejsze zalety produktu"
        class="!w-[600px]"
      />

      <FormKit
        type="textarea"
        v-model="aiSectionModal.instruction"
        label="Instrukcja dla AI"
        rows="5"
        placeholder="np. popraw SEO, skróć tekst, dodaj więcej korzyści"
      />
    </FormSection>

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
