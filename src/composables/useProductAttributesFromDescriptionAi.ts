import { computed, ref, type Ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Api } from '/@/services/api'
import { useLanguageStore } from '/@/stores/language'
import type { ProductDTO, ProductAttributeDTO } from '/@/types/product/Product'
import type { CategoryDTO } from '/@/types/category/Category'

interface ProductAttributeAiReviewItem {
  attributeId: string
  attributeName: string
  value: string
  selected: boolean
}

const stripHtml = (value?: string) =>
  String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeAttributeItems = (rawItems: any[]): ProductAttributeAiReviewItem[] => {
  if (!Array.isArray(rawItems)) return []

  return rawItems
    .map((item) => ({
      attributeId: String(item?.attributeId ?? item?.AttributeId ?? '').trim(),
      attributeName: String(item?.attributeName ?? item?.AttributeName ?? '').trim(),
      value: String(item?.value ?? item?.Value ?? '').trim(),
      selected: true
    }))
    .filter((item) => item.attributeId && item.attributeName && item.value)
}

const extractAttributeResponseItems = (payload: any): any[] => {
  const candidates = [
    payload?.attributes,
    payload?.Attributes,
    payload?.data?.attributes,
    payload?.data?.Attributes,
    payload?.Data?.attributes,
    payload?.Data?.Attributes,
    payload?.data?.data?.attributes,
    payload?.data?.data?.Attributes,
    payload?.Data?.Data?.attributes,
    payload?.Data?.Data?.Attributes
  ]

  return candidates.find(Array.isArray) ?? []
}

const normalizeListResponse = (result: any): any[] => {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.items)) return result.items
  if (Array.isArray(result?.Items)) return result.Items
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result?.Data)) return result.Data
  if (Array.isArray(result?.data?.items)) return result.data.items
  if (Array.isArray(result?.data?.Items)) return result.data.Items
  if (Array.isArray(result?.Data?.Items)) return result.Data.Items
  if (Array.isArray(result?.Data?.items)) return result.Data.items

  return []
}

interface AvailableAttribute {
  id: string
  name: string
  groupId: string
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const parameterLabels = [
  'Model',
  'Kolor',
  'Wymiary zewnętrzne',
  'Wymiar pojemnika',
  'Wymiary',
  'Pojemność',
  'Ściany',
  'Waga',
  'Dno',
  'Materiał',
  'Uchwyty na ręce',
  'Uchwyty',
  'Ładowność',
  'Zakres Temp.',
  'Zakres temperatury'
]

const extractParameterValue = (text: string, labels: string[]) => {
  const allLabels = parameterLabels.map(escapeRegExp).join('|')

  for (const label of labels) {
    const regex = new RegExp(
      `${escapeRegExp(label)}\\s*:\\s*(.*?)(?=\\s+(?:${allLabels})\\s*:|$)`,
      'i'
    )
    const match = text.match(regex)
    const value = match?.[1]?.replace(/[✅➡️]/g, '').trim()

    if (value) {
      return value
    }
  }

  return ''
}

const findDimensionText = (text: string) => {
  const explicitDimension =
    extractParameterValue(text, ['Wymiary zewnętrzne', 'Wymiar pojemnika', 'Wymiary']) || text

  const dimensionRegex =
    /(\d+(?:[,.]\d+)?)\s*(mm|cm|m)?\s*[x×]\s*(\d+(?:[,.]\d+)?)\s*(mm|cm|m)?\s*[x×]\s*(\d+(?:[,.]\d+)?)\s*(mm|cm|m)?/i
  const match = explicitDimension.match(dimensionRegex) ?? text.match(dimensionRegex)

  if (!match) {
    return null
  }

  const values = [match[1], match[3], match[5]].map((value) => value.replace(',', '.'))
  const unit = match[6] || match[4] || match[2] || 'mm'

  return {
    values,
    unit,
    raw: `${values.join('x')} ${unit}`
  }
}

const valueWithUnit = (value: string, unit: string) => `${value} ${unit}`

const createFallbackAttributeItems = (
  availableAttributes: AvailableAttribute[],
  ctx: {
    productName: string
    shortDescription: string
    description: string
    specification: string
  }
): ProductAttributeAiReviewItem[] => {
  const text = [ctx.productName, ctx.shortDescription, ctx.description, ctx.specification]
    .filter(Boolean)
    .join(' ')
  const dimensions = findDimensionText(text)

  const valuesByKey = {
    model: extractParameterValue(text, ['Model']) || ctx.productName,
    kolor: extractParameterValue(text, ['Kolor']),
    pojemnosc: extractParameterValue(text, ['Pojemność']),
    sciany: extractParameterValue(text, ['Ściany']),
    waga: extractParameterValue(text, ['Waga']),
    dno: extractParameterValue(text, ['Dno']),
    material: extractParameterValue(text, ['Materiał']),
    uchwyty: extractParameterValue(text, ['Uchwyty na ręce', 'Uchwyty']),
    ladownosc: extractParameterValue(text, ['Ładowność']),
    temperatura: extractParameterValue(text, ['Zakres Temp.', 'Zakres temperatury'])
  }

  const resolveValue = (attributeName: string) => {
    const name = normalizeText(attributeName)

    if (dimensions) {
      if (name.includes('wymiar')) return dimensions.raw
      if (name.includes('dlugosc')) {
        return valueWithUnit(dimensions.values[0], dimensions.unit)
      }
      if (name.includes('szerokosc')) {
        return valueWithUnit(dimensions.values[1], dimensions.unit)
      }
      if (
        name.includes('wysokosc') ||
        name.includes('glebokosc')
      ) {
        return valueWithUnit(dimensions.values[2], dimensions.unit)
      }
    }

    if (name.includes('model')) return valuesByKey.model
    if (name.includes('kolor')) return valuesByKey.kolor
    if (name.includes('pojemn')) return valuesByKey.pojemnosc
    if (name.includes('scian') || name.includes('ścian')) return valuesByKey.sciany
    if (name.includes('waga')) return valuesByKey.waga
    if (name.includes('dno')) return valuesByKey.dno
    if (name.includes('material')) return valuesByKey.material
    if (name.includes('uchwyt')) return valuesByKey.uchwyty
    if (name.includes('ladown')) return valuesByKey.ladownosc
    if (name.includes('temperatur')) return valuesByKey.temperatura

    return ''
  }

  return availableAttributes
    .map((attribute) => ({
      attributeId: attribute.id,
      attributeName: attribute.name,
      value: resolveValue(attribute.name).trim(),
      selected: true
    }))
    .filter((item) => item.value)
}

const mergeAttributeItems = (
  aiItems: ProductAttributeAiReviewItem[],
  fallbackItems: ProductAttributeAiReviewItem[]
) => {
  const result = [...aiItems]
  const existingAttributeIds = new Set(aiItems.map((item) => item.attributeId))

  fallbackItems.forEach((item) => {
    if (!existingAttributeIds.has(item.attributeId)) {
      result.push(item)
      existingAttributeIds.add(item.attributeId)
    }
  })

  return result
}

export function useProductAttributesFromDescriptionAi(
  product: Ref<ProductDTO | null | undefined>,
  existingAttributes?: Ref<ProductAttributeDTO[]>
) {
  const toast = useToast()
  const language = useLanguageStore()
  const loading = ref(false)
  const applyLoading = ref(false)
  const reviewVisible = ref(false)
  const reviewItems = ref<ProductAttributeAiReviewItem[]>([])
  const availableAttributeSource = ref('')

  const productId = computed(() => product.value?.id ?? '')

  const productTextContext = computed(() => {
    const p = product.value
    return {
      productName: stripHtml(p?.name),
      shortDescription: stripHtml(p?.shortDescription),
      description: stripHtml(p?.description),
      specification: stripHtml(p?.specification)
    }
  })

  const hasProductDescription = computed(() => {
    const ctx = productTextContext.value
    return Boolean(ctx.shortDescription || ctx.description || ctx.specification)
  })

  const loadCategoryAttributeGroupIds = async () => {
    const categoryIds = product.value?.categoryIds ?? []
    if (!categoryIds.length) return []

    const result = await Api.categories.listByStoreId()
    const categories = normalizeListResponse(result) as CategoryDTO[]
    const groupIds = categories
      .filter((category) => categoryIds.includes(category.id))
      .flatMap((category) => category.attributeGroupIds ?? [])

    return [...new Set(groupIds)]
  }

  const loadStoreAttributes = async (): Promise<AvailableAttribute[]> => {
    const result = await Api.productAttributes.listByStoreId()
    const items = normalizeListResponse(result)

    return items
      .map((item: any) => ({
        id: String(item?.id ?? item?.Id ?? '').trim(),
        name: String(item?.name ?? item?.Name ?? '').trim(),
        groupId: String(
          item?.groupId ??
          item?.GroupId ??
          item?.attributeGroup?.id ??
          item?.AttributeGroup?.Id ??
          ''
        ).trim()
      }))
      .filter((item) => item.id && item.name)
  }

  const loadAttributesForAi = async () => {
    const storeAttributes = await loadStoreAttributes()
    const categoryAttributeGroupIds = await loadCategoryAttributeGroupIds()

    if (!categoryAttributeGroupIds.length) {
      availableAttributeSource.value = 'AI użyje wszystkich atrybutów sklepu, bo produkt nie ma kategorii z przypisanymi grupami atrybutów.'
      return storeAttributes
    }

    const categoryAttributes = storeAttributes.filter((attribute) =>
      categoryAttributeGroupIds.includes(attribute.groupId)
    )

    if (!categoryAttributes.length) {
      availableAttributeSource.value = 'AI użyje wszystkich atrybutów sklepu, bo grupy kategorii nie mają jeszcze atrybutów.'
      return storeAttributes
    }

    availableAttributeSource.value = `AI mapuje wartości tylko do atrybutów z grup przypisanych do kategorii produktu (${categoryAttributes.length}).`
    return categoryAttributes
  }

  const generateFromDescription = async () => {
    if (!productId.value) {
      toast.error('Brak identyfikatora produktu.')
      return
    }

    if (!hasProductDescription.value) {
      toast.error('Uzupełnij opis, opis skrócony lub specyfikację produktu — AI potrzebuje treści do analizy.')
      return
    }

    loading.value = true

    try {
      const availableAttributes = await loadAttributesForAi()
      if (!availableAttributes.length) {
        toast.error('Nie znaleziono atrybutów sklepu do analizy AI. Sprawdź, czy produkt ma wybrany sklep i czy w katalogu są zdefiniowane atrybuty.')
        return
      }

      const ctx = productTextContext.value
      const res = await Api.chatGpt.generateProductAttributesFromDescription({
        body: JSON.stringify({
          productAttributesFromDescriptionBriefDTO: {
            productName: ctx.productName,
            shortDescription: ctx.shortDescription,
            description: ctx.description,
            specification: ctx.specification,
            availableAttributes: availableAttributes.map((attribute) => ({
              id: attribute.id,
              name: attribute.name
            }))
          }
        })
      })

      if (!res.ok) throw new Error('Błąd odpowiedzi serwera')

      const json = await res.json()
      const aiAttributeItems = normalizeAttributeItems(extractAttributeResponseItems(json))
      const fallbackAttributeItems = createFallbackAttributeItems(availableAttributes, ctx)
      const attributeItems = mergeAttributeItems(aiAttributeItems, fallbackAttributeItems)

      if (!attributeItems.length) {
        toast.error('Nie znaleziono danych do uzupełnienia atrybutów. Sprawdź nazwy atrybutów w grupie i opis/specyfikację produktu.')
        return
      }

      reviewItems.value = attributeItems
      reviewVisible.value = true
    } catch (error) {
      console.error(error)
      toast.error('Nie udało się wygenerować atrybutów z opisu.')
    } finally {
      loading.value = false
    }
  }

  const applySelectedAttributes = async (payload: {
    faqItems?: unknown[]
    attributeItems: ProductAttributeAiReviewItem[]
  }) => {
    if (!productId.value) return

    applyLoading.value = true

    try {
      const existing = existingAttributes?.value ?? product.value?.attributes ?? []

      for (const attr of payload.attributeItems) {
        const found = existing.find((item) => String(item.id) === attr.attributeId)

        const requestPayload = {
          productId: productId.value,
          productAttributeValues: {
            attributeId: attr.attributeId,
            value: attr.value,
            productAttributeValueLangs: language.languages.map((lang) => ({
              languageId: lang.id,
              value: attr.value
            }))
          }
        }

        if (found?.attributeValueId) {
          await Api.products.updateAttributeValue({
            body: JSON.stringify({
              ...requestPayload,
              productAttributeValues: {
                ...requestPayload.productAttributeValues,
                productAttributeValueId: found.attributeValueId
              }
            })
          })

          found.value = attr.value
        } else {
          const result = await Api.products.addAttributeValue({
            body: JSON.stringify(requestPayload)
          })

          const created = (result?.data ?? result) as ProductAttributeDTO
          if (created && product.value) {
            if (existingAttributes) {
              existingAttributes.value.push(created)
            } else {
              if (!Array.isArray(product.value.attributes)) {
                product.value.attributes = []
              }
              product.value.attributes.push(created)
            }
          }
        }
      }

      reviewVisible.value = false
      toast.success(`Zaktualizowano ${payload.attributeItems.length} atrybutów.`)
      return true
    } catch (error) {
      console.error(error)
      toast.error('Nie udało się zapisać wybranych atrybutów.')
      return false
    } finally {
      applyLoading.value = false
    }
  }

  return {
    loading,
    applyLoading,
    reviewVisible,
    reviewItems,
    availableAttributeSource,
    productId,
    hasProductDescription,
    productTextContext,
    generateFromDescription,
    applySelectedAttributes,
    normalizeAttributeItems
  }
}
