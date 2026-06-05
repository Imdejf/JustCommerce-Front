import { computed, ref, type Ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Api } from '/@/services/api'
import { useLanguageStore } from '/@/stores/language'
import type { ProductDTO, ProductAttributeDTO } from '/@/types/product/Product'
import type { CompetitorImportAttributeItem } from '/@/components/Form/Modal/ProductCompetitorImportReviewModal.vue'

const stripHtml = (value?: string) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeAttributeItems = (rawItems: any[]): CompetitorImportAttributeItem[] => {
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

export function useProductAttributesFromDescriptionAi(
  product: Ref<ProductDTO | null | undefined>,
  existingAttributes?: Ref<ProductAttributeDTO[]>
) {
  const toast = useToast()
  const language = useLanguageStore()
  const loading = ref(false)
  const applyLoading = ref(false)
  const reviewVisible = ref(false)
  const reviewItems = ref<CompetitorImportAttributeItem[]>([])

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

  const loadStoreAttributes = async () => {
    const result = await Api.productAttributes.listByStoreId()
    const items = result?.items ?? []

    return items
      .filter((item: any) => item?.id && item?.name)
      .map((item: any) => ({
        id: String(item.id),
        name: String(item.name)
      }))
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
      const availableAttributes = await loadStoreAttributes()
      if (!availableAttributes.length) {
        toast.error('Brak zdefiniowanych atrybutów w sklepie. Dodaj je w katalogu atrybutów.')
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
            availableAttributes
          }
        })
      })

      if (!res.ok) throw new Error('Błąd odpowiedzi serwera')

      const json = await res.json()
      const data = json?.data ?? json
      const attributeItems = normalizeAttributeItems(data?.attributes ?? data?.Attributes)

      if (!attributeItems.length) {
        toast.error('AI nie znalazło w opisie danych do uzupełnienia atrybutów.')
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
    faqItems: unknown[]
    attributeItems: CompetitorImportAttributeItem[]
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
    productId,
    hasProductDescription,
    productTextContext,
    generateFromDescription,
    applySelectedAttributes,
    normalizeAttributeItems
  }
}
